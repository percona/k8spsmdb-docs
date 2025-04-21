# About backups

You can back up your data in two ways:

* *On-demand*. You can do them manually at any moment.
* *Scheduled backups*. Configure backups and their schedule in the [deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml). The Operator makes them automatically according to the specified schedule.

To make backups and restores, the Operator uses the [Percona Backup for MongoDB (PBM) :octicons-link-external-16:](https://github.com/percona/percona-backup-mongodb) tool. The Operator runs PBM as [a sidecar container](sidecar.md) to the database Pods. It configures PBM when it creates a new cluster if you defined the [backup storage configuration](backups-storage.md) for it. Otherwise, the Operator configures PBM when you configure the storage for a backup or when you start a restore on a new cluster. 

## Backup storage

You can store Percona Server for MongoDB backups outside the Kubernetes
cluster using the following remote backup storages: 

* [Amazon S3 or S3-compatible storage  :octicons-link-external-16:](https://en.wikipedia.org/wiki/Amazon_S3#S3_API_and_competing_services),
* [MinIO :octicons-link-external-16:](https://min.io/) S3-compatible storage
* [Azure Blob Storage  :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/storage/blobs/)

![image](assets/images/backup-cloud.svg)

### Multiple backup storages

Starting with version 1.20.0, the Operator natively supports [multiple backup storages :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/features/multi-storage.html), inheriting this feature from Percona Backup for MongoDB (PBM). This means you don't have to wait till the Operator reconfigures a cluster after you select a different storage for a backup or a restore. And you can make a point-in-time recovery from any backup stored on any storage - PBM and the Operator maintain the data consistency for you.

Find more information in the [Multiple storages for backups](multi-storage.md) chapter. 

## Backup types

The Operator can do either *logical* or *physical* backups.

* *Logical backup* means querying Percona Server for MongoDB for the database data and writing the retrieved data to the remote backup storage.

* *Physical backup* means copying physical files from Percona Server for MongoDB `dbPath` data directory to the remote backup storage.

Logical backups use less storage, but are much slower than physical backup/restore.

!!! warning

    Logical backups made with the Operator versions before 1.9.0 are
    incompatible for restore with the Operator 1.9.0 and later. That is because Percona Backup
    for MongoDB 1.5.0 used by the newer Operator versions
    [processes system collections Users and Roles differently  :octicons-link-external-16:](https://www.percona.com/doc/percona-backup-mongodb/running.html#pbm-running-backup-restoring).
    The recommended approach is to **make a fresh backup after upgrading**
    **the Operator to version 1.9.0**.
