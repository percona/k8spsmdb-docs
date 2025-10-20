# Backup Resource options

A Backup resource is a Kubernetes object that tells the Operator how to create and manage your database backups. The `deploy/backup/backup.yaml` file is a template for creating backup resources when you make an on-demand backup. It defines the `PerconaServerMongoDBBackup` resource.

This document describes all available options that you can use to customize your backups. 

## `apiVersion`

Specifies the API version of the Custom Resource.
`psmdb.percona.com` indicates the group, and `v1` is the version of the API.

## `kind`

Defines the type of resource being created: `PerconaServerMongoDBBackup`.

## `metadata`

The metadata part of the `deploy/backup/backup.yaml` contains metadata about the resource, such as its name and other attributes. It includes the following keys:

* `finalizers` ensure safe deletion of resources in Kubernetes under certain conditions. This subsection includes the following finalizers:
  
    * `percona.com/delete-backup` - deletes the backup resource after the backup data is deleted from storage. Note that it is ignored for incremental backups. 

* `name` - The name of the backup resource used to identify it in your deployment. You also use the backup name for the restore operation.

## `spec`

This subsection includes the configuration of a backup resource.

### `clusterName`

Specifies the name of the MongoDB cluster to back up. 

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `my-cluster-name` |

### `storageName`

Specifies the name of the storage where to save a backup. It must match the name you specified in the `spec.backup.storages` subsection of the `deploy/cr.yaml` file.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `s3-us-west` |

### `type`

Specifies the backup type. Supported types are: `logical`, `physical`, `incremental-base`, `incremental`.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `physical` |

### `compressionType`

Specifies the compression algorithm for backups. Supported values are: `gzip`, `pgzip`, `zstd`, `snappy`. Read more about compression types in the [Configure backup compression :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/usage/compression.html#configure-backup-compression) section of PBM documentation.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `gzip` |

### `compressionLevel`

Specifies the compression level. Note that the higher value you specify, the more time and computing resources it will take to compress the data. The default value depends on the compression method used. Read more about compression levels in the [Configure backup compression :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/usage/compression.html#configure-backup-compression) section of PBM documentation.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `6` |

### `startingDeadlineSeconds`

The maximum time in seconds for a backup to start. The Operator compares the timestamp of the backup object against the current time. If the backup is not started within the set time, the Operator automatically marks it as “failed”.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `300` |
