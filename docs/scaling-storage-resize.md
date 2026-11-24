# Resize storage

The Operator stores the database data, and optionally `mongos` logs and search indexes, on PersistentVolumeClaims (PVCs). When a volume runs out of space, you can make it bigger without downtime.

Resizing works the same way for every volume: the storage size in the Custom Resource goes up, and the Operator grows the PVCs to match. The size can go up in two ways:

* [You change it](#resize-storage-yourself) in the Custom Resource.
* [The Operator changes it](#resize-storage-automatically) when a volume fills up to a threshold that you set.

Both ways use the [volume expansion :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#expanding-persistent-volumes-claims) capability of Kubernetes. If your storage doesn't support it, [recreate the volumes](#resize-storage-without-volume-expansion) instead. You can also hand resizing to an [external autoscaler](#use-an-external-autoscaler).

## Before you start

Check that the StorageClass of your volumes supports expansion:

```bash
kubectl describe sc <storage-class-name> | grep AllowVolumeExpansion
```

??? example "Expected output"

    ```{.text .no-copy}
    AllowVolumeExpansion: true
    ```

## Volumes and their size

Find your volume in the table to see where its size is set and since which Operator version each way of resizing works.

| Volume | PVC name | Where you set the size | Resize yourself | Resize automatically |
|---|---|---|---|---|
| Database data of replica sets and the config server replica set | `mongod-data-<statefulset-name>-<N>` | `replsets.volumeSpec`, `sharding.configsvrReplSet.volumeSpec`, `replsets.nonvoting.volumeSpec`, `replsets.hidden.volumeSpec` | 1.16.0 | 1.22.0 |
| `mongos` logs | `mongos-logs-<cluster-name>-mongos-<N>` | `sharding.mongos.logs.persistentVolumeClaim` | 1.23.1 | 1.24.0 |
| Search indexes | `mongot-data-<cluster-name>-<replset-name>-search-0` | `search.storage`, or `replsets.search.storage` for one replica set or shard | 1.24.0 | 1.24.0 |

### Database data volumes

Each replica set and member type has its own size. All volumes of a replica set have the same size, so when the size changes, all of them grow.

### `mongos` log volumes

These volumes exist only if you configure them in the `sharding.mongos.logs.persistentVolumeClaim` subsection. Otherwise the logs are on an `emptyDir` volume and there is nothing to resize. To set up the volumes, see [Persistent logging for `mongos` Pods](persistent-logging.md#for-mongos-pods). One size applies to all `mongos` Pods, so when it changes, the log volumes of all `mongos` Pods grow. The database data volumes keep their size.

### Search volumes

When [search](search-overview.md) is enabled, each replica set or shard has one search volume. You can set its size in two places:

* `search.storage` sets the default size for all replica sets and shards.
* `replsets.<replset-name>.search.storage` sets the size for one replica set or shard. It replaces the default for this replica set.

In this example, `rs0` uses the default size of 10Gi and `rs1` has its own size of 20Gi. Both volumes can grow automatically up to 50Gi:

```yaml
spec:
  storageScaling:
    enableVolumeScaling: true
    autoscaling:
      enabled: true
      triggerThresholdPercent: 80
      growthStep: 2Gi
      maxSize: 50Gi
  search:
    enabled: true
    image: percona/percona-search-mongodb:{{mongot}}
    storage:
      persistentVolumeClaim:
        resources:
          requests:
            storage: 10Gi
  replsets:
  - name: rs0
  - name: rs1
    search:
      storage:
        persistentVolumeClaim:
          resources:
            requests:
              storage: 20Gi
```

When the Operator [resizes a search volume automatically](#resize-storage-automatically), it saves the new size as the replica set's own size. If `rs0` grows to 12Gi, the Operator adds `replsets.rs0.search.storage` with 12Gi. From then on, a change to the default no longer applies to `rs0`.

You can't shrink search volumes.

## Resize storage yourself

1. In the `deploy/cr.yaml` file, turn on volume expansion and set the new size for your volume. Volume expansion is turned off by default. See [Volumes and their size](#volumes-and-their-size) for the option names.

    === "Replica set"

        ```yaml
        spec:
          storageScaling:
            enableVolumeScaling: true
          replsets:
          - name: rs0
            volumeSpec:
              persistentVolumeClaim:
                resources:
                  requests:
                    storage: <new-size>
        ```

    === "Config server"

        ```yaml
        spec:
          storageScaling:
            enableVolumeScaling: true
          sharding:
            configsvrReplSet:
              volumeSpec:
                persistentVolumeClaim:
                  resources:
                    requests:
                      storage: <new-size>
        ```

    === "`mongos` logs"

        ```yaml
        spec:
          storageScaling:
            enableVolumeScaling: true
          sharding:
            mongos:
              logs:
                persistentVolumeClaim:
                  resources:
                    requests:
                      storage: <new-size>
        ```

    === "Search"

        To change the default size for all replica sets and shards:

        ```yaml
        spec:
          storageScaling:
            enableVolumeScaling: true
          search:
            storage:
              persistentVolumeClaim:
                resources:
                  requests:
                    storage: <new-size>
        ```

        To change the size of one replica set or shard that has its own size:

        ```yaml
        spec:
          storageScaling:
            enableVolumeScaling: true
          replsets:
          - name: rs0
            search:
              storage:
                persistentVolumeClaim:
                  resources:
                    requests:
                      storage: <new-size>
        ```

2. Apply the Custom Resource:

    ```bash
    kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

The Operator grows the PVCs in place and keeps the data on them. While the resize runs, the Custom Resource has the `pvc-resize-in-progress` annotation with the start time. The Operator removes it when the resize finishes.

### Check the result

List the PVCs and their size:

```bash
kubectl get pvc -n <namespace>
```

To list the volumes of one type, add `-l app.kubernetes.io/component=mongos` or `-l app.kubernetes.io/component=search`.

### If you set a smaller size

The Operator restores the current size in the Custom Resource and reports the `requested storage (<new size>) is less than actual storage (<current size>)` error. For search volumes, it saves the current size as the replica set's own size in `replsets.<replset-name>.search.storage`.

## Resize storage automatically

The Operator checks the usage of every volume in [Volumes and their size](#volumes-and-their-size). When a volume is fuller than the threshold you set, the Operator raises the size in the Custom Resource by a set step and grows the volume, until the size reaches the limit you set.

### Turn on automatic resizing

1. In the `deploy/cr.yaml` file, turn on volume expansion and automatic resizing, and make sure each volume has a size. This example covers all three volume types. Keep the parts for the volumes you have:

    ```yaml
    spec:
      storageScaling:
        enableVolumeScaling: true
        autoscaling:
          enabled: true
          triggerThresholdPercent: 80
          growthStep: 2Gi
          maxSize: 10Gi
      replsets:
      - name: rs0
        volumeSpec:
          persistentVolumeClaim:
            resources:
              requests:
                storage: 3Gi
      sharding:
        mongos:
          logs:
            persistentVolumeClaim:
              resources:
                requests:
                  storage: 1Gi
      search:
        storage:
          persistentVolumeClaim:
            resources:
              requests:
                storage: 5Gi
    ```

    | Option | What it does |
    |---|---|
    | `storageScaling.enableVolumeScaling` | Turns on volume expansion. Must be `true` |
    | `storageScaling.autoscaling.enabled` | Turns on automatic resizing |
    | `storageScaling.autoscaling.triggerThresholdPercent` | Usage in percent that starts a resize, from 50 to 95 |
    | `storageScaling.autoscaling.growthStep` | How much to add in one resize. Default `2Gi` |
    | `storageScaling.autoscaling.maxSize` | The largest size the Operator resizes a volume to |

2. Apply the Custom Resource:

    ```bash
    kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

The settings apply to all volume types, but the Operator checks each volume on its own. A volume that crosses the threshold grows together with the volumes that share its size option, as shown in the next table. Volumes of other types keep their size. Choose the settings with every volume in mind. For example, a `growthStep` of `2Gi` grows a 1Gi `mongos` log volume to 3Gi in one step, and `maxSize` caps the log and search volumes too.

If you use search, set `triggerThresholdPercent` below 90. Search becomes read-only at about 90% disk usage, so with a higher threshold it can stop accepting index updates before the Operator grows the volume.

### How the Operator resizes each volume type

| Volume | Where the Operator measures the usage | Where it saves the new size | Which volumes grow |
|---|---|---|---|
| Database data | `mongod` container, `/data/db` | The `volumeSpec` of the replica set or member type | All volumes of the replica set |
| `mongos` logs | `mongos` container, `/data/db/logs` | `sharding.mongos.logs.persistentVolumeClaim` | The log volumes of all `mongos` Pods |
| Search indexes | `mongot` container, `/data/mongot` | `replsets.<replset-name>.search.storage`. See [Search volumes](#search-volumes) | The search volume of that replica set or shard |

### Check the resize status

The Operator reports each volume in `.status.storageAutoscaling` of the Custom Resource, under the PVC name:

```bash
kubectl get psmdb <cluster-name> -n <namespace> -o yaml
```

??? example "Sample output"

    ```{.text .no-copy}
    storageAutoscaling:
      mongod-data-my-cluster-name-rs0-0:
        currentSize: 5123744Ki
        lastResizeTime: "2026-01-23T15:08:59Z"
        resizeCount: 2
    ```

| Field | Meaning |
|---|---|
| `currentSize` | The filesystem size of the volume, as `df` reports it in the container |
| `lastResizeTime` | When the Operator last saw the volume grow |
| `resizeCount` | How many times the volume grew |
| `lastError` | The error of the latest failed check or resize. The Operator clears it on the next successful check, so the field can appear and disappear while the problem lasts |

Because all volumes of a replica set grow together, `lastResizeTime` and `resizeCount` change for every volume of the replica set, not only for the one that crossed the threshold.

??? example "Sample output with an error"

    In this example, an admission policy in the Kubernetes cluster rejected the Operator's request to increase the storage size:

    ```{.text .no-copy}
    storageAutoscaling:
      mongod-data-my-cluster-name-rs0-0:
        currentSize: 3021608Ki
        lastError: 'patch CR with new storage size: perconaservermongodbs.psmdb.percona.com
          "my-cluster-name" is forbidden: ValidatingAdmissionPolicy ''block-storage-resize''
          with binding ''block-storage-resize'' denied request: storage resize
          blocked by policy'
    ```

    The Operator also logs the same error with the `failed to check/resize PVC` message.

When a volume reaches `maxSize`, the Operator stops resizing it and logs `PVC already at maxSize`. This isn't an error, so `lastError` stays empty. Free up space or raise the limit. For other problems, see [Troubleshooting storage](debug-storage.md).

### After the upgrade to 1.24.0

!!! important

    Automatic resizing of `mongos` log and search PVCs is available starting with version 1.24.0. For clusters that already have automatic resizing enabled, it starts as follows:

    * `mongos` log PVCs: when you upgrade the Operator to version 1.24.0 and set `crVersion` to `1.24.0`.
    * Search PVCs: right after you upgrade the Operator to version 1.24.0, even if `crVersion` still has an older value.

    If a PVC is already above the threshold, the Operator starts to resize it as soon as automatic resizing starts for it. To keep the volumes at their current size, review the `storageScaling.autoscaling` settings before you upgrade the Operator.

## Resize storage without volume expansion

Use this way if your storage doesn't support volume expansion or your Operator is older than 1.16.0. You recreate the volumes one Pod at a time, and each new member copies the data from the others. This way you can also reduce the size of database data volumes.

1. Set the new size in the Custom Resource and apply it:

    ```yaml
    spec:
      replsets:
      - name: rs0
        volumeSpec:
          persistentVolumeClaim:
            resources:
              requests:
                storage: <new-size>
    ```

    ```bash
    kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

2. Delete the StatefulSet but keep its Pods running. The Operator recreates the StatefulSet with the new size:

    ```bash
    kubectl delete sts <statefulset-name> --cascade=orphan -n <namespace>
    kubectl get sts <statefulset-name> -n <namespace>
    ```

3. Optionally, add members to keep the cluster's capacity while you replace volumes. For example, set `replsets.size` to 5 and apply the Custom Resource. The new Pods get volumes of the new size.

4. Replace the old volumes one Pod at a time. Delete the PVC and the Pod, then wait until the new member finishes the data sync before you move to the next Pod:

    ```bash
    kubectl delete pvc <pvc-name> -n <namespace>
    kubectl delete pod <pod-name> -n <namespace>
    ```

    The Operator creates the Pod with a new PVC of the new size.

## Use an external autoscaler

To resize volumes with your own autoscaler, set `storageScaling.enableExternalAutoscaling` to `true`. The Operator then stops its own automatic resizing. Don't use both at the same time.

## See also

* [Scaling and storage](scaling-about.md) for an overview of the ways to scale a cluster
* [Troubleshooting storage](debug-storage.md) if a volume doesn't grow
* [Configure VolumeAttributesClass](volume-attributes-class.md) to change IOPS or throughput of the volumes
* [Manage local storage](storage.md)
