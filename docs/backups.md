# About backups

You can backup your data in two ways:

* *On-demand*. You can do them manually at any moment.
* *Scheduled backups*. Configure backups and their schedule in the [deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml). The Operator makes them automatically according to the specified schedule.

To make backups and restores, the Operator uses the [Percona Backup for MongoDB  :octicons-link-external-16:](https://github.com/percona/percona-backup-mongodb) tool.

## Backup storage

You can store Percona Server for MongoDB backups outside the Kubernetes
cluster using the following remote backup storages: 

* [Amazon S3 or S3-compatible storage  :octicons-link-external-16:](https://en.wikipedia.org/wiki/Amazon_S3#S3_API_and_competing_services),
* [Azure Blob Storage  :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/storage/blobs/)

![image](assets/images/backup-cloud.svg)

## Backup types

| Backup type | Version added | Status | Description | Important considerations |
|------------|---------------|---------|-------------|-------------------------|
| Full logical | Initial | GA | Queries Percona Server for MongoDB for database data and writes this data to the remote storage | - Uses less storage but is slower than physical backups<br>- Supports selective restore since [1.18.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.18.0.md)<br>- Supports point-in-time recovery <br>- Incompatible for restores with backups made with Operator versions before 1.9.0. Make a new backup after the upgrade to the Operator 1.9.0. |
| Full physical | [1.14.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.14.0.md) | GA ([1.16.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.16.0.md)) | Copies physical files from MongoDB `dbPath` data directory to remote storage | - Faster backup/restore than logical<br>- Better for large datasets<br>- Supports point-in-time recovery since [1.15.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.15.0.md)|
| Physical incremental | [1.20.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.20.0.md) | Tech preview | Copies only data changed after the previous backup | - Speeds up backup/restore<br>- Reduces network load and storage consumption<br>- Requires a base incremental backup to start the incremental chain <br>- Base backup and increments must bet taken from the same node<br>- New base backup is needed if a node is down or if the cluster was restored from a backup|

