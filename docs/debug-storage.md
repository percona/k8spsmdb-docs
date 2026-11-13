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
- `storageScaling.enableVolumeScaling` and `storageScaling.autoscaling.enabled` are `true`.
- The PVC didn't reach `autoscaling.maxSize`. The same limit applies to data volumes and to `mongos` log volumes.
- The `lastError` field in `.status.storageAutoscaling` for the `mongos-logs-<cluster-name>-mongos-<N>` PVC. See [Automatic storage resizing](scaling-storage-resize.md#automatic-storage-resizing).

## PVC resize is one-way

PVC resizing in Kubernetes is one-way. You cannot shrink a PVC to roll back to the old size without recreating it. Recreating PVCs can cause data loss, so make sure you have a backup strategy in place. See [Backup and restore](backups.md).

## See also

* [Scaling and storage](scaling-about.md)
