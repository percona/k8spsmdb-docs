# Resize storage

The Operator stores the database data, and optionally `mongos` logs and search indexes, on PersistentVolumeClaims (PVCs). When a volume runs out of space, you can make it bigger without downtime.

Resizing works the same way for every volume: the storage size in the Custom Resource goes up, and the Operator grows the PVCs to match. The size can go up in two ways:

* [You change it](#resize-storage-yourself) in the Custom Resource.
* [The Operator changes it](#resize-storage-automatically) when a volume fills up to a threshold that you set.

Both ways use the [volume expansion :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#expanding-persistent-volumes-claims) capability of Kubernetes. If your storage doesn't support it, [recreate the volumes](#resize-storage-without-volume-expansion) instead. You can also hand resizing to an [external autoscaler](#use-an-external-autoscaler).

Kubernetes can't make a PVC smaller. Starting with version 1.24.0, the Operator can [shrink storage](#shrink-storage) by replacing the volumes one member at a time.

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

Find your volume in the table to see where its size is set and since which Operator version each way of resizing works. To shrink volumes, see [Shrink storage](#shrink-storage).

| Volume | PVC name | Where you set the size | Resize yourself | Resize automatically | Shrink |
|---|---|---|---|---|---|
| Database data of replica sets and the config server replica set | `mongod-data-<statefulset-name>-<N>` | `replsets.volumeSpec`, `sharding.configsvrReplSet.volumeSpec`, `replsets.nonvoting.volumeSpec`, `replsets.hidden.volumeSpec` | 1.16.0 | 1.22.0 | 1.24.0 |
| `mongos` logs | `mongos-logs-<cluster-name>-mongos-<N>` | `sharding.mongos.logs.persistentVolumeClaim` | 1.23.1 | 1.24.0 | 1.24.0 |
| Search indexes | `mongot-data-<cluster-name>-<replset-name>-search-0` | `search.storage`, or `replsets.search.storage` for one replica set or shard | 1.24.0 | 1.24.0 | Not supported |

### Database data volumes

Each replica set and member type has its own size. Within a replica set, volumes that share the same member-type size option grow together; ordinary, non-voting, and hidden members can have different sizes.

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

If shrinking is turned off, the Operator restores the current size in the Custom Resource and reports the `requested storage (<new size>) is less than actual storage (<current size>)` error. For search volumes, it saves the current size as the replica set's own size in `replsets.<replset-name>.search.storage`.

To make database data or `mongos` log volumes smaller, see [Shrink storage](#shrink-storage).

<a name="automatic-storage-resizing"></a>

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

### Use automatic resizing with Argo CD

Automatic resizing saves the new size in the Custom Resource. If you manage the Custom Resource with Argo CD or a similar GitOps tool, the tool treats the new size as a difference from your Git repository and syncs the Custom Resource back to the size in Git. The PVCs keep their larger size, but:

* The Operator reports the `requested storage (...) is less than actual storage (...)` error, and members that you add later can get PVCs of the smaller size from Git.
* If [shrinking](#shrink-storage) is turned on, the Operator shrinks the volumes back to the size in Git. Automatic resizing then grows them again. Every shrink replaces the volume of each member, and each member copies all its data again.

To avoid this, configure Argo CD to ignore the storage size in the Custom Resource. Add the following to the `Application` that manages the cluster:

```yaml
spec:
  ignoreDifferences:
  - group: psmdb.percona.com
    kind: PerconaServerMongoDB
    jqPathExpressions:
    - .spec.replsets[].volumeSpec.persistentVolumeClaim.resources.requests.storage
    - .spec.replsets[].nonvoting.volumeSpec.persistentVolumeClaim.resources.requests.storage
    - .spec.replsets[].hidden.volumeSpec.persistentVolumeClaim.resources.requests.storage
    - .spec.replsets[].search.storage.persistentVolumeClaim.resources.requests.storage
    - .spec.sharding.configsvrReplSet.volumeSpec.persistentVolumeClaim.resources.requests.storage
    - .spec.sharding.mongos.logs.persistentVolumeClaim.resources.requests.storage
  syncPolicy:
    syncOptions:
    - RespectIgnoreDifferences=true
```

The paths cover every size that automatic resizing changes. `RespectIgnoreDifferences=true` makes Argo CD keep the live size when it syncs other changes. Without it, Argo CD only hides the difference and still applies the size from Git on the next sync.

With this configuration, a size change in Git no longer reaches the cluster. To change the size yourself, edit the Custom Resource in the Kubernetes cluster, for example with `kubectl patch`. If you prefer to keep Git as the only source of the size, skip the configuration and update the size in Git each time automatic resizing grows a volume. Don't turn on shrinking with this approach: until you update Git, every sync shrinks the volumes back.

### After the upgrade to 1.24.0

!!! important

    Automatic resizing of `mongos` log and search PVCs is available starting with version 1.24.0. For clusters that already have automatic resizing enabled, it starts as follows:

    * `mongos` log PVCs: when you upgrade the Operator to version 1.24.0 and set `crVersion` to `1.24.0`.
    * Search PVCs: right after you upgrade the Operator to version 1.24.0, even if `crVersion` still has an older value.

    If a PVC is already above the threshold, the Operator starts to resize it as soon as automatic resizing starts for it. To keep the volumes at their current size, review the `storageScaling.autoscaling` settings before you upgrade the Operator.

## Shrink storage

!!! note "Version added: [1.24.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.24.0.md)"

You can shrink storage with the Operator to reduce the storage costs after your data has shrunk. For example, after you archived or dropped large collections.

Since Kubernetes can only increase the storage and cannot reduce the size of an existing PVC, the Operator replaces the volumes instead: it deletes the PVC and the Pod of one member, lets Kubernetes create a smaller PVC for the new Pod, and waits until it receives the data from other members through an initial sync. Then it moves to the next member.

Shrinking is turned off by default. To enable it, set the `storageScaling.enableVolumeShrink` option to `true`.

You can shrink database data volumes and `mongos` log volumes. You can't shrink search volumes. If you set a smaller size for a search volume, the Operator keeps the current size and reports the `volume shrinking is not supported for search` error.

!!! warning "Argo CD and automatic resizing"

    If you manage the cluster with Argo CD and use [automatic resizing](#resize-storage-automatically), configure Argo CD to ignore the storage size before you turn on shrinking. Otherwise, Argo CD resets the size that automatic resizing set, the Operator shrinks the volumes back, and the cluster keeps growing and shrinking its volumes. See [Use automatic resizing with Argo CD](#use-automatic-resizing-with-argo-cd).

### How the Operator shrinks volumes

The Operator shrinks each StatefulSet whose size you lowered. For example, for the `rs0` replica set, the Operator:

1. Runs preflight checks. If a check fails, the Operator either waits or rejects the shrink. See [Before you shrink storage](#before-you-shrink-storage).
2. Replaces the volumes of the secondary members one by one, starting with the highest Pod index. For each member, it deletes the PVC and the Pod and waits until the new Pod is ready and rejoins the replica set as a secondary.
3. Steps down the primary and replaces its volume last.

Non-voting and hidden members and `mongos` log volumes skip the step-down, because they never become primary. For a shard or the config server replica set of a sharded cluster, the Operator stops the balancer for the time of the shrink.

The step-down triggers a primary election and briefly interrupts connections to the primary. Write availability during the rest of the shrink depends on the replica set topology: a two-voter replica set loses its voting majority while either member is unavailable, and a primary-secondary-arbiter replica set cannot acknowledge majority writes while a data-bearing member resyncs. For an online shrink, use at least three healthy data-bearing voting members and ensure the remaining members can satisfy your configured write concern.

While the shrink runs, the cluster status is `initializing`. The Operator doesn't run [Smart Update](update.md#update-strategies) and doesn't resize volumes automatically until the shrink finishes.

### Before you shrink storage

* The size in the Custom Resource matches the actual size of the PVCs. As soon as you turn on shrinking, the Operator shrinks every PVC that is larger than the size in the Custom Resource. The sizes can differ if a GitOps tool reset the size after [automatic resizing](#resize-storage-automatically). Compare them:

    ```bash
    kubectl get psmdb <cluster-name> -n <namespace> -o jsonpath='{range .spec.replsets[*]}{.name}{": "}{.volumeSpec.persistentVolumeClaim.resources.requests.storage}{"\n"}{end}'
    kubectl get pvc -n <namespace> -l app.kubernetes.io/instance=<cluster-name>
    ```

    If a PVC is larger, set its size in the Custom Resource, and in Git if you use GitOps, before you turn on shrinking.

* The cluster is `ready`, and every replica set member is `PRIMARY`, `SECONDARY` or `ARBITER`.
* The replica set has at least two members, three recommended. A single member has no sync source for the initial sync, so the Operator rejects the shrink.
* You have a recent [backup](backups.md). While a member resyncs, the replica set has one data-bearing member less. In a three-member replica set, losing one more member during that time leaves it without a primary.
* No backup or restore is running. The Operator waits until they finish.
* The data on every Pod fits into the new size with headroom. By default, the used space must not exceed 80% of the new size. You can change this threshold with the [`storageScaling.shrinkOpts.maxDiskUsagePercent`](operator.md#storagescalingshrinkoptsmaxdiskusagepercent) option in the Custom Resource.
* You planned for the time and load. Each member copies all of its data again through an initial sync, so a shrink takes longer and puts more load on the cluster than an expansion. Run it outside peak hours.
* You checked the `reclaimPolicy` of the storage class. The Operator deletes the old PVCs. With `Delete`, Kubernetes also deletes the old volumes. With `Retain`, the old, larger PersistentVolumes stay until you delete them, and your storage provider keeps charging for them.
* You set the size you want. You can't stop a shrink once it starts. The Operator keeps the target size from `status.pvcShrink` until all members have the new volume, even if you change the size or turn off `enableVolumeShrink`.

### Shrink the storage {.power-number}

1. Edit the `deploy/cr.yaml` manifest. Configure the `storageScaling` subsection:
    
    * Set the `storageScaling.enableVolumeShrink` option to `true`
    * Optionally, set the disk usage threshold in the `storageScaling.shrinkOpts.maxDiskUsagePercent`:
    * Set the smaller size for the component you want to shrink, for example a replica set:

    ```yaml
    spec:
      storageScaling:
        enableVolumeShrink: true
        shrinkOpts:
          maxDiskUsagePercent: 80
      replsets:
      - name: rs0
        volumeSpec:
          persistentVolumeClaim:
            resources:
              requests:
                storage: <NEW SMALLER SIZE>
    ```

    The same works for `sharding.configsvrReplSet.volumeSpec`, `replsets.nonvoting.volumeSpec`, `replsets.hidden.volumeSpec` and `sharding.mongos.logs.persistentVolumeClaim`. For `mongos`, the new log volumes start empty: the logs on the old volumes are lost.

2. Apply the configuration:

    ```bash
    kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

### Monitor the shrink

The Operator records the progress in `status.pvcShrink` of the Custom Resource, with an entry for each StatefulSet it shrinks:

```bash
kubectl get psmdb <cluster-name> -n <namespace> -o jsonpath='{.status.pvcShrink}'
```

* `targetSize` - the new size
* `startedAt` - when the shrink started
* `phase` - the current step: `secondaries`, `stepdown` or `primary`
* `processedPods` - the Pods that already have the smaller volume
* `primaryPod` - the member the Operator handles last

The entry disappears when the shrink for that StatefulSet finishes.

### Verify the shrink

```bash
kubectl get psmdb -n <namespace>
kubectl get psmdb <cluster-name> -n <namespace> -o jsonpath='{.status.pvcShrink}'
kubectl get pvc -n <namespace>
```

The cluster returns to `ready`, `status.pvcShrink` is empty, and the PVCs of the component show the new capacity.

### How shrinking works with volume expansion and automatic resizing

The Operator compares the size in the Custom Resource with the current size of the PVCs:

* A larger size is an expansion. The Operator resizes the PVCs in place if `enableVolumeScaling` is `true`.
* A smaller size is a shrink. The Operator replaces the volumes if `enableVolumeShrink` is `true`. If shrinking is turned off, the Operator keeps the current size. With `enableVolumeScaling: true`, it also reports the `requested storage (...) is less than actual storage (...)` error.
* If `enableExternalAutoscaling` is `true`, the Operator neither expands nor shrinks volumes.

[Automatic resizing](#resize-storage-automatically) grows the volumes by writing the new size into the Custom Resource. Keep this in mind when you turn on both automatic resizing and shrinking:

* If a GitOps tool such as Argo CD resets the size to the one in Git, the Operator shrinks the volumes back. See [Use automatic resizing with Argo CD](#use-automatic-resizing-with-argo-cd).
* Automatic resizing is paused while a shrink runs. After the shrink, it grows the volume again as soon as the usage exceeds `autoscaling.triggerThresholdPercent`. Both thresholds default to 80%, so a volume that you shrink close to the limit can grow back shortly after. Shrink to a size that leaves more headroom than the autoscaling threshold.

### Troubleshoot shrinking

If the shrink doesn't start, the Operator rejects it, or the size in the Custom Resource changes back, see [Storage shrinking](debug-storage.md#storage-shrinking) in Troubleshoot storage for the symptom, cause and fix of each case.

## Resize storage without volume expansion

Use this procedure only for replicated database data volumes if your storage doesn't support volume expansion or your Operator is older than 1.16.0. You recreate the volumes one Pod at a time, and each new member copies the data from the others. This way you can also reduce the size of database data volumes. Starting with version 1.24.0, the Operator can do it for you: see [Shrink storage](#shrink-storage). Do not apply these steps to search or `mongos` log PVCs: search requires an index rebuild, and deleting a log PVC loses its stored logs.

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
