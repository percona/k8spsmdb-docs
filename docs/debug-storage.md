# Troubleshooting storage 

## Storage resizing

Use this guidance if [storage resizing](scaling-storage-resize.md) does not behave as expected.

## Storage does not scale when you expect it

- Check namespace quotas; they can block PVC expansion even if the storage class has capacity.
- Check quotas or limits set by your cloud provider.
- Look for storage or CSI-level errors (missing storage, driver issues). Fix the issue and let the Operator reconcile.

## Max size is not respected

The Operator always grows storage by the full `growthStep` value. If the current size plus `growthStep` exceeds the `maxSize` value, the Operator caps the resize at `maxSize` instead. To avoid large jumps or unexpected caps, either set the `growthStep` value to the increment you want the storage to resize or raise the `maxSize` limit.

## Scaling doesn't happen despite it hasn't reached the maximum.

If storage is not scaling, check if any PVC has reached the max size. Thresholds and limits apply to all PVCs, so when one hits the limit, scaling stops for all. Adjust PVC sizes if needed.


## mongos log PVC does not grow automatically

Starting with version 1.24.0, the Operator grows the PVCs that store `mongos` logs together with the other PVCs. If a `mongos` log PVC stays at the same size, check the following:

- The `sharding.mongos.logs.persistentVolumeClaim` subsection is set. Without it, `mongos` logs are stored on an `emptyDir` volume and there is no PVC to grow. See [Persistent logging](persistent-logging.md#for-mongos-pods).
- The Operator version and the cluster's `crVersion` are both at least `1.24.0`.
- `storageScaling.enableVolumeScaling` and `storageScaling.autoscaling.enabled` are `true`.
- The PVC didn't reach `autoscaling.maxSize`. The same limit applies to data volumes and to `mongos` log volumes.
- The `lastError` field in `.status.storageAutoscaling` for the `mongos-logs-<cluster-name>-mongos-<N>` PVC. See [Check the resize status](scaling-storage-resize.md#check-the-resize-status).

## Search PVC does not grow automatically

Starting with version 1.24.0, the Operator also grows the PVCs that store the search index data. If a search PVC stays at the same size, check the following:

- `search.enabled` is `true` and the search storage uses a PVC.
- `storageScaling.enableVolumeScaling` and `storageScaling.autoscaling.enabled` are `true`.
- The PVC didn't reach `autoscaling.maxSize`. The same limit applies to all PVCs.
- The `mongot` container is running. The Operator measures the usage only in a running container.
- The `lastError` field in `.status.storageAutoscaling` for the `mongot-data-<cluster-name>-<replset-name>-search-0` PVC. See [Resize storage automatically](scaling-storage-resize.md#resize-storage-automatically).

If you changed the default `search.storage` size and a search PVC didn't follow, check whether its replica set has its own `replsets.<replset-name>.search.storage` value. The Operator adds it during automatic resizing, and it replaces the default size for this replica set. See [Search volumes](scaling-storage-resize.md#search-volumes).

## PVC resize is one-way

PVC resizing in Kubernetes is one-way. You cannot shrink a PVC to roll back to the old size without recreating it. Starting with version 1.24.0, the Operator can recreate the PVCs for you, one member at a time. See [Shrink storage](scaling-storage-resize.md#shrink-storage). Make sure you have a backup before you shrink. See [Backup and restore](backups.md).


## Storage shrinking

Use this guidance if [shrinking storage](scaling-storage-resize.md#shrink-storage) doesn't behave as expected.

### The size in the Custom Resource changes back

**Symptom:** after you lower the storage size, the cluster state is `error` with the message `requested storage (<new size>) is less than actual storage (<current size>)`, and the size in the Custom Resource changes back to the current size.

**Cause:** `storageScaling.enableVolumeShrink` is `false`, so the Operator doesn't shrink the volumes. It restores the previous size in the Custom Resource instead.

**Fix:** to shrink the volumes, set `storageScaling.enableVolumeShrink` to `true` and set the smaller size again, as described in [Shrink the storage](scaling-storage-resize.md#shrink-the-storage). If you don't want to shrink, no action is needed: the cluster returns to `ready` on the next reconciliation. The `error` entry stays in `status.conditions` with its original timestamp, so check `status.state` for the current state.

### The Operator rejects the shrink because of disk usage

**Symptom:** the Operator log reports `PVC shrink rejected: pod <pod> disk usage exceeds 80% of target size <size>`, and the PVCs keep their size.

**Cause:** the data on that Pod doesn't fit into the new size with the required headroom.

**Fix:** set a larger target size, free up space, or raise [`storageScaling.shrinkOpts.maxDiskUsagePercent`](operator.md#storagescalingshrinkoptsmaxdiskusagepercent).

### The Operator rejects the shrink of a single-member replica set

**Symptom:** the Operator log reports `PVC shrink rejected for <statefulset>: single-member replica set has no sync source`.

**Cause:** the replica set has one member, so the new volume has nowhere to copy the data from.

**Fix:** [scale the replica set](scaling.md) to at least two members, three recommended, shrink the storage, then scale it back if needed.

### The shrink doesn't start

**Symptom:** the shrink doesn't start, and the Operator log reports `PVC shrink waiting for ...`, for example for a backup, a restore or a member in an unhealthy state.

**Cause:** a preflight check isn't met yet. The Operator retries on every reconciliation.

**Fix:** wait for the backup or restore to finish, or fix the unhealthy member. See [Before you shrink storage](scaling-storage-resize.md#before-you-shrink-storage) for the full list of conditions.

### The volumes keep shrinking and growing

**Symptom:** the cluster goes to `initializing` again and again, `status.pvcShrink` reappears, and the PVCs alternate between a larger and a smaller size.

**Cause:** a GitOps tool such as Argo CD resets the storage size in the Custom Resource to the size in Git. Automatic resizing grows the volumes, the reset lowers the size again, and with shrinking turned on the Operator shrinks the volumes back.

**Fix:**

1. Set `storageScaling.enableVolumeShrink` to `false` to stop new shrinks. A shrink that already started runs to the end.
2. Configure Argo CD to ignore the storage size, as described in [Use automatic resizing with Argo CD](scaling-storage-resize.md#use-automatic-resizing-with-argo-cd).
3. Set the size in the Custom Resource to the current size of the PVCs, then turn shrinking on again if you need it.

## See also

* [Scaling and storage](scaling-about.md)
* [Storage problems that keep Pods in the `Pending` state](debug-scheduling.md#storage-problems)
