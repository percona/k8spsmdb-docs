> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Troubleshooting storage

## Storage resizing

Use this guidance if [storage resizing](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling-storage-resize.html) does not behave as expected.

## Storage does not scale when you expect it

- Check namespace quotas; they can block PVC expansion even if the storage class has capacity.
- Check quotas or limits set by your cloud provider.
- Look for storage or CSI-level errors (missing storage, driver issues). Fix the issue and let the Operator reconcile.

## Max size is not respected

The Operator always grows storage by the full `growthStep` value. If the current size plus `growthStep` exceeds the `maxSize` value, the Operator caps the resize at `maxSize` instead. To avoid large jumps or unexpected caps, either set the `growthStep` value to the increment you want the storage to resize or raise the `maxSize` limit.

## Scaling doesn’t happen despite it hasn’t reached the maximum.

If storage is not scaling, check if any PVC has reached the max size. Thresholds and limits apply to all PVCs, so when one hits the limit, scaling stops for all. Adjust PVC sizes if needed.

## mongos log PVC does not grow automatically

Starting with version 1.24.0, the Operator grows the PVCs that store `mongos` logs together with the other PVCs. If a `mongos` log PVC stays at the same size, check the following:

- The `sharding.mongos.logs.persistentVolumeClaim` subsection is set. Without it, `mongos` logs are stored on an `emptyDir` volume and there is no PVC to grow. See [Persistent logging](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/persistent-logging.html#for-mongos-pods).
- The Operator version and the cluster’s `crVersion` are both at least `1.24.0`.
- `storageScaling.enableVolumeScaling` and `storageScaling.autoscaling.enabled` are `true`.
- The PVC didn’t reach `autoscaling.maxSize`. The same limit applies to data volumes and to `mongos` log volumes.
- The `lastError` field in `.status.storageAutoscaling` for the `mongos-logs-<cluster-name>-mongos-<N>` PVC. See [Check the resize status](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling-storage-resize.html#check-the-resize-status).

## Search PVC does not grow automatically

Starting with version 1.24.0, the Operator also grows the PVCs that store the search index data. If a search PVC stays at the same size, check the following:

- `search.enabled` is `true` and the search storage uses a PVC.
- `storageScaling.enableVolumeScaling` and `storageScaling.autoscaling.enabled` are `true`.
- The PVC didn’t reach `autoscaling.maxSize`. The same limit applies to all PVCs.
- The `mongot` container is running. The Operator measures the usage only in a running container.
- The `lastError` field in `.status.storageAutoscaling` for the `mongot-data-<cluster-name>-<replset-name>-search-0` PVC. See [Resize storage automatically](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling-storage-resize.html#resize-storage-automatically).

If you changed the default `search.storage` size and a search PVC didn’t follow, check whether its replica set has its own `replsets.<replset-name>.search.storage` value. The Operator adds it during automatic resizing, and it replaces the default size for this replica set. See [Search volumes](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling-storage-resize.html#search-volumes).

## PVC resize is one-way

PVC resizing in Kubernetes is one-way. You cannot shrink a PVC to roll back to the old size without recreating it. Recreating PVCs can cause data loss, so make sure you have a backup strategy in place. See [Backup and restore](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups.html).

## See also

- [Scaling and storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling-about.html)
- [Storage problems that keep Pods in the `Pending` state](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug-scheduling.html#storage-problems)
