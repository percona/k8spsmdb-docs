# Configure backups

This page is the order to set things up in. To choose a backup type or storage, or to decide whether you need point-in-time recovery, start with [Backup and restore](backups.md).

## Configure storage

Required for every backup type. Choose among supported storage types:

* [Amazon S3](backups-storage-s3.md)
* [Google Cloud Storage](backups-storage-gcp.md)
* [MinIO and S3-compatible storages](backups-storage-minio.md)
* [Microsoft Azure Blob storage](backups-storage-azure.md)
* [Alibaba Cloud OSS](backups-storage-oss.md)
* [Oracle Cloud Infrastructure Object Storage](backups-storage-oci.md)
* [Remote file server](backups-storage-filesystem.md)
  
PVC snapshots also need an entry here. They do not upload database files to object storage, but PBM stores backup metadata there.

## Enable optional capabilities

Turn these on before the backups you intend to rely on, not after.

* [Enable point-in-time recovery](backups-pitr.md) — the Operator saves oplog only while PITR is enabled and only once a full backup exists. Enabling it after an incident is too late.
* [Enable server-side encryption](backups-encryption.md) — encrypts backup data at the storage backend.

## Take a backup

* [Scheduled backup](backups-scheduled.md) — recurring protection.
* [On-demand backup](backups-ondemand.md) — a one-off copy before a change.
* [Configure PVC snapshots](backups-pvc-setup.md) — volume snapshots instead of an upload, for large datasets.

## Restore

* [On the same cluster](backups-restore.md) 
* [On a new cluster](backups-restore-to-new-cluster.md)
* [On a new cluster with different replica set names](backups-restore-replset-remapping.md)
* [Restore a collection under a different name](backups-restore-new-name.md)
* [Restore to a point in time](backups-restore-pitr.md) — requires step 2.
* [Restore from a PVC snapshot](backups-pvc-usage.md#make-an-in-place-restore-from-a-pvc-snapshot-backup)

## Manage retention and deletion

* [Configure retention policy](backups-delete.md#configure-backup-retention) — control how many backups to keep with backup.tasks.retention.
* [Delete an unneeded backup](backups-delete.md#delete-the-unneeded-backup) — deleting the object also removes its files from storage.

## Advanced setups

* [Multiple storages for backups](multi-storage.md) -  more than one bucket.
* [Move an external database to Kubernetes](backups-move-from-external-db.md) - bring data from outside Kubernetes

## Next steps

[Configure storage](backups-storage.md){.md-button}
