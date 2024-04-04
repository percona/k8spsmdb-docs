# About backups

You can backup your data in two ways:

* *On-demand*. You can do them manually at any moment.
* *Scheduled backups*. Configure backups and their schedule in the [deploy/cr.yaml :material-arrow-top-right:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml). The Operator makes them automatically according to the specified schedule.

To make backups and restores, the Operator uses the [Percona Backup for MongoDB :material-arrow-top-right:](https://github.com/percona/percona-backup-mongodb) tool.

## Backup storage

You can store Percona Server for MongoDB backups outside the Kubernetes
cluster using the following remote backup storages: 

* [Amazon S3 or S3-compatible storage :material-arrow-top-right:](https://en.wikipedia.org/wiki/Amazon_S3#S3_API_and_competing_services),
* [Azure Blob Storage :material-arrow-top-right:](https://azure.microsoft.com/en-us/services/storage/blobs/)

![image](assets/images/backup-cloud.svg)

## Backup types

<a name="physical"></a> The Operator can do either *logical* or *physical* backups.

* *Logical backup* means querying the Percona Server for MongoDB for the database data and writing the retrieved data to the remote backup storage.

* *Physical backup* means copying physical files from the Percona Server for MongoDB `dbPath` data directory to the remote backup storage.

Logical backups use less storage, but are much slower than physical backup/restore.

Also, logical backups are stable, while physical backups are available since the
Operator version 1.14.0 and still have the **technical preview status**.

!!! warning

    Logical backups made with the Operator versions before 1.9.0 are
    incompatible for restore with the Operator 1.9.0 and later. That is because Percona Backup
    for MongoDB 1.5.0 used by the newer Operator versions
    [processes system collections Users and Roles differently :material-arrow-top-right:](https://www.percona.com/doc/percona-backup-mongodb/running.html#pbm-running-backup-restoring).
    The recommended approach is to **make a fresh backup after upgrading**
    **the Operator to version 1.9.0**.
