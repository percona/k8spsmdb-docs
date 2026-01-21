# About backups

You can back up your data in two ways:

* *On-demand*. You can do them manually at any moment.
* *Scheduled backups*. Configure backups and their schedule in the [deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml). The Operator makes them automatically according to the specified schedule.

To make backups and restores, the Operator uses the [Percona Backup for MongoDB (PBM) :octicons-link-external-16:](https://github.com/percona/percona-backup-mongodb) tool. The Operator runs PBM as [a sidecar container](sidecar.md) to the database Pods. It configures PBM in the following cases:

* when it creates a new cluster if you defined the [backup storage configuration](backups-storage.md) for it. 
* when you configure the backup storage for a backup 
* when you [start a restore on a new cluster](backups-restore-to-new-cluster.md) and defined the backup storage configuration within the `backupSource` subsection of the Restore resource. 

## Backup storage

You can store Percona Server for MongoDB backups outside the Kubernetes
cluster using the following remote backup storages:

* [Amazon S3 storage](backups-storage-s3.md)
* [Google Cloud storage](backups-storage-gcp.md)
* [MinIO and S3-compatible storages](backups-storage-minio.md)
* [Microsoft Azure Blob storage](backups-storage-azure.md)
* [Remote file server](backups-storage-filesystem.md)

![image](assets/images/backup-cloud.svg)

### Multiple backup storages

Starting with version 1.20.0, the Operator natively supports [multiple backup storages :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/features/multi-storage.html), inheriting this feature from Percona Backup for MongoDB (PBM). This means you don't have to wait till the Operator reconfigures a cluster after you select a different storage for a backup or a restore. And you can make a point-in-time recovery from any backup stored on any storage - PBM and the Operator maintain the data consistency for you.

Find more information in the [Multiple storages for backups](multi-storage.md) chapter. 

## Backup types


| Backup type | Version added | Status | Description | Important considerations |
|------------|---------------|---------|-------------|-------------------------|
| Full logical | Initial | GA | Queries Percona Server for MongoDB for database data and writes this data to the remote storage | - Uses less storage but is slower than physical backups<br>- Supports selective restore since [1.18.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.18.0.md)<br>- Supports point-in-time recovery <br>- Incompatible for restores with backups made with Operator versions before 1.9.0. Make a new backup after the upgrade to the Operator 1.9.0. |
| Full physical | [1.14.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.14.0.md) | GA ([1.16.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.16.0.md)) | Copies physical files from MongoDB `dbPath` data directory to remote storage | - Faster backup/restore than logical<br>- Better for large datasets<br>- Supports point-in-time recovery since [1.15.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.15.0.md)|
| Physical incremental | [1.20.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.20.0.md) | Tech preview | Copies only data changed after the previous backup | - Speeds up backup/restore<br>- Reduces network load and storage consumption<br>- Requires a base incremental backup to start the incremental chain <br>- Base backup and increments must bet taken from the same node<br>- New base backup is needed if a node is down or if the cluster was restored from a backup|

