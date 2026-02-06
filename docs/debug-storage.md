# Troubleshooting storage 

## Storage resizing

Use this guidance if [storage resizing](scaling.md#scale-storage) does not behave as expected.

## Storage does not scale when you expect it

- Check namespace quotas; they can block PVC expansion even if the storage class has capacity.
- Check quotas or limits set by your cloud provider.
- Look for storage or CSI-level errors (missing storage, driver issues). Fix the issue and let the Operator reconcile.

## Max size is not respected

The Operator increases storage by the full `growthStep` value each time. If the current size plus `growthStep` exceeds the `maxSize` value, the final PVC size may end up larger than intended. Lower the `growthStep` value or adjust the `maxSize` so that it aligns with the step increments.


## Scaling doesn't happen despite it hasn't reached the maximum.

If storage is not scaling, check if any PVC has reached the max size. Thresholds and limits apply to all PVCs, so when one hits the limit, scaling stops for all. Adjust PVC sizes if needed.


## PVC resize is one-way

PVC resizing in Kubernetes is one-way. You cannot shrink a PVC to roll back to the old size without recreating it. Recreating PVCs can cause data loss, so make sure you have a backup strategy in place. See [About backups](backups.md).
