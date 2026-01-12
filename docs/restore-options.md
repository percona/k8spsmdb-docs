# Restore Resource options

A Restore resource is a Kubernetes object that tells the Operator how to restore your database from a specific backup. The `deploy/backup/restore.yaml` file is a template for creating restore resources. It defines the `PerconaServerMongoDBRestore` resource.

This document describes all available options that you can use to customize a restore. 

## `apiVersion`

Specifies the API version of the Custom Resource.
`psmdb.percona.com` indicates the group, and `v1` is the version of the API.

## `kind`

Defines the type of resource being created: `PerconaServerMongoDBRestore`.

## `metadata`

The metadata part of the `deploy/backup/restore.yaml` contains metadata about the resource, such as its name and other attributes. It includes the following keys:

* `name` - The name of the restore object used to identify it in your deployment. You use this name to track the restore operation status and view information about it.

## `spec`

This section includes the configuration of a restore resource.

### `clusterName`

Specifies the name of the MongoDB cluster to restore. 

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `my-cluster-name` |

### `backupName`

Specifies the name of a backup to be used for a restore. This backup should be from the same cluster.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `backup1` |

## The `selective` subsection

Controls the selective restore, which enables you to restore a specific subset of namespaces - databases and collections. 

### `selective.withUsersAndRoles`

Allows restoring specified custom databases with users and roles that were created against them. Read more about [Selective restore with users and roles :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/features/selective-backup.html#restore-a-database-with-users-and-roles) in PBM documentation.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: boolean     | `true` |

### `selective.namespaces`

Specifies the list of namespaces to restore. The namespace has the format `<db.collection>`

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: array     | `["db1.collection1", "db2.collection2"]` |

## `replsetRemapping` 

Defines mapping between source and target replica set names during a restore. This should be a dictionary where each key is the replica set name from the source cluster, and the corresponding value is the desired replica set name in the target cluster. Read more about [restores to the cluster with different replica set names](backups-restore-replset-remapping.md).

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: array     | `sourceRs0: targetRs0` |


## The `pitr` subsection

Controls how to make a point-in-time restore

### `pitr.type`

Specifies the type of a point-in-time restore. Available options:

*  `date` - restore to a specific date.
* `latest` - recover to the latest possible transaction

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `date` |

### `pitr.date`

Specifies the timestamp for the restore in the datetime format `YYYY-MM-DD hh:mm:ss`. 

Use it together with the `type=date` option. 

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `YYYY-MM-DD hh:mm:ss` |

## The `backupSource` subsection

Contains the configuration options to restore from a backup made in a different cluster, namespace, or Kubernetes environment. 

### `backupSource.type`

Specifies the backup type. Available options: physical, logical, incremental

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `physical` |

### `backupSource.destination`

Specifies the path to the backup on the storage

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `s3://bucket-name/backup-destination/` |

### `backupSource.s3.credentialsSecret`

Specifies the Secrets object name with the credentials to access the storage with a backup. 

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `my-cluster-name-backup-s3` | 

### `backupSource.s3.serverSideEncryption.kmsKeyID`

Specifies your customer-managed key stored in the AWS Key Management Service (AWS KMS). This key is used to encrypt backup data uploaded to S3 buckets if you don't wish to use the default server-side encryption with Amazon S3 managed keys (SSE-S3)

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `1234abcd-12ab-34cd-56ef-1234567890ab` | 

### `backupSource.s3.serverSideEncryption.sseAlgorithm`

The encryption algorithm used to encrypt data

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `AES256` | 

### `backupSource.s3.serverSideEncryption.sseCustomerAlgorithm`

The encryption algorithm used for server-side encryption with customer-provided keys (SSE-C).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `AES256` | 

### `backupSource.s3.serverSideEncryption.sseCustomerKey`

The customer-provided encryption key.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Y3VzdG9tZXIta2V5` | 

### `backupSource.s3.region`

The [AWS region  :octicons-link-external-16:](https://docs.aws.amazon.com/general/latest/gr/rande.html) to use. Please note **this option is mandatory** for Amazon and all S3-compatible storages.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `us-west-2`|

### `backupSource.s3.bucket`

The [Amazon S3 bucket  :octicons-link-external-16:](https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingBucket.html) name for backups.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     |            |

### `backupSource.s3.endpointUrl`

The  URL of the S3-compatible storage to be used (not needed for the original Amazon S3 cloud).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `https://s3.us-west-2.amazonaws.com/` |

### `backupSource.s3.prefix`

The path to the data directory in the bucket. If undefined, backups are stored in the bucket’s root directory.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     |  |

### `backupSource.azure.credentialsSecret`

Specifies the Secrets object name with the credentials to access the Azure Blob storage with a backup. 

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     |  | 

### `backupSource.azure.prefix`

The path to the data directory in the bucket. If undefined, backups are stored in the bucket’s root directory.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     |  |

### `backupSource.s3.container`

The name of the storage container. See the [naming conventions :octicons-link-external-16:](https://docs.microsoft.com/en-us/rest/api/storageservices/naming-and-referencing-containers--blobs--and-metadata#container-names)

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     |  |