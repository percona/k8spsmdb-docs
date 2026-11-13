# Resize storage

Kubernetes manages storage with the following components:

* a PersistentVolume (PV) - a segment of
storage supplied by the Kubernetes administrator,
* a PersistentVolumeClaim
(PVC) - a request for storage from a user.

Starting with Kubernetes v1.11, you can increase the size of an existing PVC object (considered stable since Kubernetes v1.24).
Note that you **cannot** shrink the size of an **existing** PVC object. However, the Operator can [shrink storage](#shrink-storage) by replacing the volumes one member at a time. This feature is available starting with the Operator version 1.24.0.

Use storage scaling to keep up with changing data size while keeping the cluster online. The Operator supports the following scaling options:

* automatic scaling - Starting with version 1.22.0, the Operator monitors storage usage for replica sets and config server Pods and scales the storage automatically. Automatic scaling does not cover PVCs for mongos logs. To learn more, see [Resize mongos log storage](#resize-mongos-log-storage).
* storage resizing with Volume Expansion capability - Starting with version 1.16.0, instruct the Operator to scale the storage by updating the Custom Resource manifest
* manual scaling - scale the storage manually.
* storage shrinking - Reduce the storage size by replacing the volumes. See [Shrink storage](#shrink-storage).

You can also use an external autoscaler with the Operator. Enabling an external autoscaler disables the Operator's internal logic for automatic storage resizing. Choose one method based on your environment and requirements; using both simultaneously is not supported.

For either option, the volume type must support PVC expansion.
To check if your storage supports the expansion capability, run the following command:

```bash
kubectl describe sc <storage class name> | grep AllowVolumeExpansion
```

??? example "Expected output"

    ``` {.text .no-copy}
    AllowVolumeExpansion: true
    ```

Find exact details about
PVCs and the supported volume types in [Kubernetes
documentation  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#expanding-persistent-volumes-claims).

## Automatic storage resizing

!!! note "Version added: [1.22.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.22.0.md)"

The Operator can automatically resize Persistent Volume Claims (PVCs) for **replica sets and config server Pods** based on your configured thresholds. The Operator monitors storage usage of all PVCs and when it exceeds the defined threshold, triggers resizing until the storage size reaches the maximum limit. 

This feature gives you:

* fewer outages from full disks because storage grows with demand
* less guesswork on capacity planning and fewer last-minute fixes
* lower operational effort for developers and platform engineers
* cost control by expanding only when needed
* a more predictable environment so teams can focus on delivery

**mongos log PVCs are not supported by automatic storage resizing.** You can [resize them manually](#resize-mongos-log-storage).

To enable automatic storage resizing, edit the `deploy/cr.yaml` Custom Resource manifest as follows:
{.power-number}

1. Make sure each MongoDB container has a storage size set.

    Example for a replica set container:

    ```yaml
    replsets:
    - name: rs0
      volumeSpec:
        persistentVolumeClaim:
          resources:
            requests:
              storage: 3Gi
    ```

2. Configure autoscaling thresholds in the `storageScaling` subsection:

    * `enableVolumeScaling` - set to `true`
    * `autoscaling.enabled` - set to `true`
    * `autoscaling.triggerThresholdPercent` - specify the usage percentage. When the usage exceeds this threshold, this triggers autoscaling
    * `autoscaling.growthStep` - specify how much to increase the storage on
    * `autoscaling.maxSize` - specify the upper limit for storage growth. When this limit is reached, scaling is no longer possible.

    Example configuration:

    ```yaml
    spec:
      storageScaling:
        enableVolumeScaling: true
        autoscaling:
          enabled: true
          triggerThresholdPercent: 80
          growthStep: 2Gi
          maxSize: "10Gi"
    ```

3. Apply the configuration:

    ```bash
    kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

When the Operator changes the storage size, it updates the Custom Resource status as follows:

* adds the `pvc-resize-in-progress` annotation. The annotation contains the timestamp of the resize start and indicates that the resize operation is running. After the resize finishes, the Operator deletes this annotation.
* records the new size in the `currentSize` field
* updates the `resizeCount` field.

Run the `kubectl get psmdb -o yaml -n <namespace>` to check the current cluster state.

??? example "Sample output"

    ```{.text .no-copy}
    storageAutoscaling:
      mongod-data-my-cluster-name-rs0-0:
        currentSize: 5123744Ki
        lastResizeTime: "2026-01-23T15:08:59Z"
        resizeCount: 2
    ```

The `storageAutoscaling` section appears under `.status` in the Custom Resource. It has an entry for each PVC, with the following fields:

* `currentSize` - the filesystem size of the volume, as reported by the `df` command in the database container
* `lastResizeTime` - the time when the Operator last detected that the volume grew
* `resizeCount` - how many times the volume grew
* `lastError` - the error from the latest failed attempt to check or resize the volume. The Operator clears this field on the next successful usage check, so while the problem persists, the field can appear and disappear between reconciliation loops.

The Operator resizes storage for the whole replica set, so `lastResizeTime` and `resizeCount` change for every PVC in that replica set, not only for the PVC that exceeded the threshold.

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

When the storage size reaches the limit, no further resizing is done and the Operator logs the `PVC already at maxSize` message. Reaching the limit is not an error, so the Operator doesn't set the `lastError` field. You can either clean up the data or set a new limit based on your organization's policies and requirements. For help with common issues, see [Troubleshooting storage ](debug-storage.md).

## Storage resizing with Volume Expansion capability

!!! note "Version added: [1.16.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.16.0.md)"

To enable storage resizing via volume expansion, do the following:
{.power-number}

1. Set the [storageScaling.enableVolumeScaling](operator.md#storagescalingenablevolumescaling) Custom Resource option to `true` (it is turned off by default).
2. Specify new storage size for the  `replsets.<NAME>.volumeSpec.persistentVolumeClaim.resources.requests.storage`
and/or `configsvrReplSet.volumeSpec.persistentVolumeClaim.resources.requests.storage`
options in the Custom Resource. 

    This is the example configuration of defining a new storage size in the `deploy/cr.yaml` file:

    ```yaml
    spec:
      ...
      storageScaling:
        enableVolumeScaling: true
      ...
      replsets:
        ...
        volumeSpec:
          persistentVolumeClaim:
            resources:
              requests:
                storage: <NEW STORAGE SIZE>
      ...
      configsvrReplSets:
        volumeSpec:
          persistentVolumeClaim:
            resources:
              requests:
                storage: <NEW STORAGE SIZE>
    ```

3. Apply changes as usual:

    ```bash
    kubectl apply -f cr.yaml
    ```

The storage size change takes some time. When it starts, the Operator does the following:

* automatically adds the `pvc-resize-in-progress` annotation to the `PerconaServerMongoDB` Custom Resource. The annotation contains the timestamp of the resize start and indicates that the resize operation is running.
* records the new size in the `.status.storageAutoscaling.<PVC_NAME>.currentSize` field.
* updates the `.status.storageAutoscaling.<PVC_NAME>.resizeCount` field.

After the resize finishes, the Operator deletes this annotation.

### Resize mongos log storage

!!! note "Version added: [1.23.1](RN/Kubernetes-Operator-for-PSMONGODB-RN1.23.1.md)"

In a sharded cluster, you can also resize the PVCs that store `mongos` logs. Unlike replica set and config server PVCs, these PVCs are optional: they exist only if you configured the `sharding.mongos.logs.persistentVolumeClaim` subsection. See [Persistent logging](persistent-logging.md#for-mongos-pods) to learn how to configure them.

To resize the `mongos` log PVCs, do the following:
{.power-number}

1. Make sure the [storageScaling.enableVolumeScaling](operator.md#storagescalingenablevolumescaling) Custom Resource option is set to `true`.
2. Specify the new storage size for the `sharding.mongos.logs.persistentVolumeClaim.resources.requests.storage` option in the Custom Resource:

    ```yaml
    spec:
      ...
      storageScaling:
        enableVolumeScaling: true
      ...
      sharding:
        mongos:
          logs:
            persistentVolumeClaim:
              resources:
                requests:
                  storage: <NEW STORAGE SIZE>
    ```

3. Apply the changes:

    ```bash
    kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

The Operator resizes the existing `mongos` log PVCs in place. The logs stored on them are preserved. To check the new size, run:

```bash
kubectl get pvc -l app.kubernetes.io/component=mongos -n <namespace>
```

## Shrink storage

!!! note "Version added: [1.24.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.24.0.md)"

You can shrink storage with the Operator to reduce the storage costs after your data has shrunk. For example, after you archived or dropped large collections.

Since Kubernetes can only increase the storage and cannot reduce the size of an existing PVC, the Operator replaces the volumes instead: it deletes the PVC and the Pod of one member, lets Kubernetes create a smaller PVC for the new Pod, and waits until it receives the data from other members through an initial sync. Then it moves to the next member.

Shrinking is turned off by default. To enable it, set the  `storageScaling.enableVolumeShrink` option to `true`.

### How the Operator shrinks volumes

The Operator shrinks each StatefulSet whose size you lowered. For example, for the `rs0` replica set, the Operator:

1. Runs preflight checks. If a check fails, the Operator either waits or rejects the shrink. See [Before you shrink storage](#before-you-shrink-storage).
2. Replaces the volumes of the secondary members one by one, starting with the highest Pod index. For each member, it deletes the PVC and the Pod and waits until the new Pod is ready and rejoins the replica set as a secondary.
3. Steps down the primary and replaces its volume last.

Non-voting and hidden members and `mongos` log volumes skip the step-down, because they never become primary. For a shard or the config server replica set of a sharded cluster, the Operator stops the balancer for the time of the shrink.

The step-down triggers a primary election and briefly interrupts connections to the primary. Write availability during the rest of the shrink depends on the replica set topology: a two-voter replica set loses its voting majority while either member is unavailable, and a primary-secondary-arbiter replica set cannot acknowledge majority writes while a data-bearing member resyncs. For an online shrink, use at least three healthy data-bearing voting members and ensure the remaining members can satisfy your configured write concern.

While the shrink runs, the cluster status is `initializing`. The Operator doesn't run [Smart Update](update.md#update-strategies) and doesn't resize volumes automatically until the shrink finishes.

### Before you shrink storage

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

[Automatic storage resizing](#automatic-storage-resizing) grows the volumes by writing the new size into the Custom Resource. Keep this in mind when you turn on both automatic resizing and shrinking:

* If a tool such as Argo CD or Flux resets the Custom Resource to the size from your Git repository, the reset size is smaller than the size that automatic resizing set. With shrinking turned on, the Operator then shrinks the volumes back and every member runs an initial sync. Update the size in Git after automatic resizing, or exclude the storage size from synchronization.
* Automatic resizing is paused while a shrink runs. After the shrink, it grows the volume again as soon as the usage exceeds `autoscaling.triggerThresholdPercent`. Both thresholds default to 80%, so a volume that you shrink close to the limit can grow back shortly after. Shrink to a size that leaves more headroom than the autoscaling threshold.

### Troubleshoot shrinking

If the shrink doesn't start, the Operator rejects it, or the size in the Custom Resource changes back, see [Storage shrinking](debug-storage.md#storage-shrinking) in Troubleshoot storage for the symptom, cause and fix of each case.

## Manual scaling without Volume Expansion capability

Manual scaling is the way to go if:

* your version of the Operator is older than 1.16.0,
* your volumes have a type that does not support Volume Expansion, or 
* you do not rely on automated scaling.

You will need to delete Pods and their persistent volumes one by one to resync 
the data to the new volumes. This way you can also shrink the storage. Starting with version 1.24.0, the Operator can do it for you: see [Shrink storage](#shrink-storage).

Here's how to resize the storage:
{.power-number}

1. Update the Custom Resource with the new storage size by editing and applying
    the `deploy/cr.yaml` file:

    ``` {.text .no-copy}
    spec:
      ...
      replsets:
        ...
        volumeSpec:
          persistentVolumeClaim:
            resources:
              requests:
                storage: <NEW STORAGE SIZE>
    ```

2. Apply the Custom Resource for the changes to come into effect:

    ```bash
    kubectl apply -f deploy/cr.yaml
    ```

3. Delete the StatefulSet with the `orphan` option

    ```bash
    kubectl delete sts <statefulset-name> --cascade=orphan
    ```

    The Pods will not go down and the Operator is going to recreate
    the StatefulSet:

    ```bash
    kubectl get sts <statefulset-name>
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        my-cluster-name-rs0       3/3     39s
        ```

4. Scale up the cluster (Optional)

    Changing the storage size would require us to terminate the Pods, which 
    decreases the computational power of the cluster and might cause performance 
    issues. To improve performance during the operation we are going to 
    change the size of the cluster from 3 to 5 nodes:

    ```yaml
    spec:
      ...
      replsets:
        ...
        size: 5
    ```
    
    Apply the change:
    
    ```bash
    kubectl apply -f deploy/cr.yaml
    ```

    New Pods will already have the new storage size:
    
    ```bash
    kubectl get pvc
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        NAME                                STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
        mongod-data-my-cluster-name-cfg-0   Bound    pvc-a2b37f4d-6f11-443c-8670-de82ce9fc335   10Gi       RWO            standard       110m
        mongod-data-my-cluster-name-cfg-1   Bound    pvc-ded949e5-0f93-4f57-ab2c-7c5fd9528fa0   10Gi       RWO            standard       109m
        mongod-data-my-cluster-name-cfg-2   Bound    pvc-f3a441dd-94b6-4dc0-b96c-58b7851dfaa0   10Gi       RWO            standard       108m
        mongod-data-my-cluster-name-rs0-0   Bound    pvc-b183c40b-c165-445a-aacd-9a34b8fff227   19Gi       RWO            standard       49m
        mongod-data-my-cluster-name-rs0-1   Bound    pvc-f186426b-cbbe-4c31-860e-97a4dfca3de0   19Gi       RWO            standard       47m
        mongod-data-my-cluster-name-rs0-2   Bound    pvc-6beb6ccd-8b3a-4580-b3ef-a2345a2c21d6   19Gi       RWO            standard       45m 
        ```

5. Delete PVCs and Pods with the old storage size one by one. Wait for data to sync 
    before you proceed to the next node.

    ```bash
    kubectl delete pvc <PVC NAME>
    kubectl delete pod <POD NAME>
    ```

    The new PVC is going to be created along with the Pod.

The storage size change takes some time. When it starts, the Operator automatically adds the `pvc-resize-in-progress` annotation to the `PerconaServerMongoDB` Custom Resource. The annotation contains the timestamp of the resize start and indicates that the resize operation is running. After the resize finishes, the Operator deletes this annotation.

## Storage resizing with an external autoscaler

You can configure the Operator to use an external storage autoscaler instead of its own resizing logic. This ability may be useful for organizations needing centralized, advanced, or cross-application scaling policies.

To use an external autoscaler, set the `spec.storageScaling.enableExternalAutoscaling` option to `true` in the Custom Resource manifest.

## See also

* [Scaling and storage](scaling-about.md)
* [Manage local storage](storage.md)
* [Configure VolumeAttributesClass](volume-attributes-class.md)
* [Troubleshoot storage resizing](debug-storage.md)
