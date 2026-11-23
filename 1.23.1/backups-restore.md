> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Restore from a backup

You can restore a backup:

- [onto the cluster that produced it](#restore-on-the-same-cluster)
- [into a different Kubernetes environment](#restore-on-a-new-cluster)
- [into a cluster with different replica set names](#with-different-replica-set-names)

Compare these options in [Backup and restore](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups.html#restore-options).

Every restore is a `PerconaServerMongoDBRestore` object, created from the [`deploy/backup/restore.yaml`](https://github.com/percona/percona-server-mongodb-operator/blob/v1.23.1/deploy/backup/restore.yaml) manifest.

## Downtime to expect

Every restore causes downtime. How much and whether Pods are replaced depends on the restore type and on whether the cluster is sharded:

| Restore                    | Downtime                                                                  | Pods deleted and recreated                                                 |
| -------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Logical, unsharded cluster | For the duration of the data restore                                      | None                                                                       |
| Logical, sharded cluster   | Data restore, plus refreshing sharding metadata on `mongos`               | `mongos` Pods only                                                         |
| Physical or incremental    | Data restore, plus refreshing sharding metadata on `mongos`               | All Pods - replica set, config server replica set if present, and `mongos` |
| PVC snapshot (external)    | Time to recreate each data PVC from its snapshot, plus the restore itself | All Pods - replica set, config server replica set if present, and `mongos` |

Also check PBM’s [restore considerations](https://docs.percona.com/percona-backup-mongodb/usage/restore.html#considerations) for keeping MongoDB clients away from the database while the restore runs.

How Pods are shut down in physical and PVC snapshot restores

Physical restores replace data on existing volumes, while PVC snapshot restores recreate data PVCs from snapshots. To speed up restore performance, the Operator version 1.24.0 and newer no longer shuts down the replica set Pods in order, with secondaries first and the primary last. It stops `mongos` and arbiter Pods first, then deletes the replica set and config server replica set Pods together. Each `mongod` still has the Pod’s termination grace period to shut down.

## Choose `backupName` or `backupSource`

Every restore names its source in one of two ways. Use exactly one - setting both is not allowed.

|              | `backupName`                                    | `backupSource`                                                                                    |
| ------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Use it when  | Backup objects exist in this cluster            | No backup objects exist, for example [when restoring to a new cluster](#restore-on-a-new-cluster) |
| Backup type  | PBM determines it automatically                 | You must state it yourself: `logical`, `physical`, `incremental`, or `external`                   |
| Typical case | Restoring onto the cluster that made the backup | Restoring into a fresh environment                                                                |

`backupSource` also works for restores onto the same cluster, if you prefer it.

## Before you begin

These preconditions are easy to miss:

- The backup you restore from must be in the `ready` state. A backup still in `running`, `waiting`, or `error` cannot be restored.

- Restoring to a point in time additionally requires that [oplog collection](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pitr.html) was enabled **before** that backup was taken. Enabling it afterwards does not make earlier moments recoverable.

- For a physical or snapshot restore, all replica set members must be healthy and schedulable. If a member is down, the Operator still stops the healthy members. The restore then stays in `waiting` with no error and no timeout, and continues by itself once the member is back. See [Restore stays in the `waiting` state](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug-backup-restore.html#restore-stays-in-the-waiting-state).

- Make sure that the cluster is running.

- Export your namespace as an environment variable. Replace the `<namespace>` placeholder with your value:

  ```
  export NAMESPACE=<namespace>
  ```

- Get the backup information. List the backups using this command:

  ```
  kubectl get psmdb-backup -n $NAMESPACE
  ```

- Get cluster information. List available clusters using this command:

  ```
  kubectl get psmdb -n $NAMESPACE
  ```

## Restore on the same cluster

Configure a `PerconaServerMongoDBRestore` object to restore your cluster from any backup. The [`deploy/backup/restore.yaml`](https://github.com/percona/percona-server-mongodb-operator/blob/v1.23.1/deploy/backup/restore.yaml) manifest is the same for all restore types. Set these keys:

- `spec.clusterName` - the name of the target cluster to restore the backup on
- `spec.backupName` - the name of your backup, from the output of `kubectl get psmdb-backup`. PBM detects the backup type automatically and runs the matching restore procedure.

Pass this configuration to the Operator:

**via the YAML manifest**

1. Edit the [deploy/backup/restore.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/v1.23.1/deploy/backup/restore.yaml) file and specify the following keys:

   ```
   apiVersion: psmdb.percona.com/v1
   kind: PerconaServerMongoDBRestore
   metadata:
     name: restore1
   spec:
     clusterName: my-cluster-name
     backupName: backup1
   ```

1. Start the restore with this command:

   ```
   kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
   ```

**via the command line**

Instead of storing restore settings in a separate file, you can pass them directly to the `kubectl apply` command as follows:

```
cat <<EOF | kubectl apply -n $NAMESPACE -f-
apiVersion: psmdb.percona.com/v1
kind: PerconaServerMongoDBRestore
metadata:
  name: restore1
spec:
  clusterName: my-cluster-name
  backupName: backup1
EOF
```

## Restore on a new cluster

Restore a backup into a **different** Kubernetes environment than the one it was taken in. To restore onto the cluster that made the backup, see [Restore on the same cluster](#restore-on-the-same-cluster).

Check the [restore options reference](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/restore-options.html) for all available options.

### Preconditions for a new environment

1. When restoring to a new Kubernetes-based environment, make sure it has a Secrets object with the same user passwords as in the original cluster.
1. To restore from a physical backup, set the corresponding encryption key of the target cluster. Find more details about encryption in [Data-at-rest encryption](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/encryption.html). The name of the required Secrets object can be found out from the `spec.secrets` key in the `deploy/cr.yaml` (`my-cluster-name-secrets` by default).

PBM must know where to take the backup from and have access to that storage. You can define it in two ways: within the restore object configuration, or pre-configured on the target cluster’s `cr.yaml` file.

### Approach 1: Define storage configuration in the restore object

Use this approach if you haven’t defined storage in the target cluster’s `cr.yaml` file.

1. Edit the [deploy/backup/restore.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/v1.23.1/deploy/backup/restore.yaml) file and specify these keys:

   - `spec.clusterName` - the name of the target cluster to restore the backup on

   - `spec.backupSource` - the cloud storage where the backup is stored:

     - `type` - the [backup type](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups.html#backup-types): `logical`, `physical`, `incremental`, or `external`. Defaults to `logical` when you omit it.
     - `destination` - take it from the output of the `kubectl get psmdb-backup` command.
     - the [storage configuration keys](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage.html) you need, same as in the source cluster’s `deploy/cr.yaml` file.

     ```
     ...
     backupSource:
       type: logical
       destination: s3://S3-BUCKET-NAME/BACKUP-NAME
       s3:
         credentialsSecret: my-cluster-name-backup-s3
         region: us-west-2
         endpointUrl: https://URL-OF-THE-S3-COMPATIBLE-STORAGE
     ```

     For S3-compatible storage, `destination` has three parts: the `s3://` prefix, the bucket name, and the backup name. For Azure Blob storage, skip the prefix and use your container name as the bucket.

1. Apply the configuration to start the restore:

   ```
   kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
   ```

   You do not need to resync PBM by hand - the Operator does it as part of the sequence below.

   During the restore process, the Operator:

   1. Takes the storage configuration from the Restore object
   1. Configures PBM using this configuration
   1. Resyncs metadata to update it on the target cluster
   1. Performs the restore operation
   1. Reverts the PBM configuration back to the one defined in the `cr.yaml` file (if any)

1. After the restore, configure the [main storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/multi-storage.html#define-the-main-storage) in the target cluster’s `cr.yaml` so you can make subsequent backups.

### Approach 2: The storage is defined on target

Use this approach if you already [defined](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage.html) the storage in the `backup.storages` subsection of the target cluster’s `deploy/cr.yaml` file. Reference it by name in the restore configuration.

1. Edit the [deploy/backup/restore.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/v1.23.1/deploy/backup/restore.yaml) file and specify these keys:

   - `spec.clusterName` - the name of the target cluster to restore the backup on

   - `storageName` - the storage name, matching an entry in the `backup.storages` subsection of the `deploy/cr.yaml` file

   - `spec.backupSource` - the backup destination

     ```
     ...
     storageName: s3-us-west
     backupSource:
       destination: s3://S3-BUCKET-NAME/BACKUP-NAME
     ```

1. Apply the configuration to start the restore:

   ```
   kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
   ```

### With different replica set names

Version added: [1.22.0](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/RN/Kubernetes-Operator-for-PSMONGODB-RN1.22.0.html)

You can restore from a backup to a cluster that has different replica set names. The number of shards you need on the target cluster depends on the restore type:

- *Logical* restores: the target can have the same number of shards as the source, or more.
- *Physical* and *incremental* restores: the target **must have the same number of shards** as the source.

Configure the name mapping in the `replsetRemapping` subsection of the Restore object: set each source replica set name as a key, and the matching target replica set name as the value.

Here’s the example configuration:

```
...
metadata:
  name: restore1
spec:
  clusterName: my-cluster-name
  backupName: backup1
  replsetRemapping:
    sourceRs0: targetRs0
    sourceRs1: targetRs1
```

Apply the configuration to start the restore:

```
kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
```

A restore that violates the shard-count rule above, or maps to a replica set name that doesn’t exist on the target, is rejected - see [Verify the restore](#verify-the-restore).

## Point-in-time recovery

For point-in-time recovery on a new cluster, see [Restore to a point in time](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pitr-restore.html#restore-on-a-new-cluster).

## Restore from a backup with a prefix in a bucket path

If you defined a prefix (a folder) in your backup bucket, specify it in the `spec.backupSource` subsection of the restore configuration.

For example, say you defined the prefix `my-prefix` for your AWS S3 bucket `my-example-bucket`, and you want to restore the logical backup `2025-05-19T07:23:46Z`. The pull path to this backup is `"s3://my-example-bucket/my-prefix/2025-05-19T07:23:46Z"`. Your restore configuration looks like this:

**Storage defined in a Restore object**

```
apiVersion: psmdb.percona.com/v1
kind: PerconaServerMongoDBRestore
metadata:
  name: restore-prefix
spec:
  clusterName: my-cluster-name
  backupSource:
    type: logical
    destination: "s3://my-example-bucket/my-prefix/2025-05-19T07:23:46Z"
    s3:
      credentialsSecret: my-cluster-name-backup-s3
      region: us-east-1
      bucket: backup-testing
      prefix: my-prefix
```

**Storage defined on target**

Make sure the Custom Resource of the target cluster includes the storage configuration and the defined prefix. Then you reference this storage by name in the restore configuration.

```
apiVersion: psmdb.percona.com/v1
kind: PerconaServerMongoDBRestore
metadata:
  name: restore-prefix
spec:
  clusterName: my-cluster-name
  storageName: us-east-1
  backupSource:
    type: logical
    destination: "s3://my-example-bucket/my-prefix/2025-05-19T07:23:46Z"
```

Apply the configuration to start a restore:

```
kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
```

## Selective restore

Starting with version 1.18.0, you can restore a desired subset of data from a **full** logical backup. Selective logical backups are not yet supported.

Selective restores have limitations - see the [current selective restore limitations](https://docs.percona.com/percona-backup-mongodb/features/known-limitations.html#selective-backups-and-restores) in the Percona Backup for MongoDB documentation.

Control selective restores with the `selective` section in the `PerconaServerMongoDBRestore` Custom Resource. Use it to specify the database or collection you want to restore:

```
spec:
  selective:
    withUsersAndRoles: true
    namespaces:
    - "db1.collection1"
    - "db2.collection2"
```

Specify one or more “namespaces” (subsets of data) as a list in `selective.namespaces`:

- a pair of database and collection names to restore just that database and collection, in the format `db1.collection1`
- a database name with a wildcard to restore everything from that database, in the format `database_name.*`
- a single star `*` to restore all databases and collections

Set `selective.withUsersAndRoles` to `true` to also restore users and roles for the selected database. Read more about this functionality in the [PBM documentation](https://docs.percona.com/percona-backup-mongodb/usage/restore-selective.html#restore-with-users-and-roles) .

## If a physical restore fails

Warning

A failed physical restore is not rolled back, and the Operator cannot guarantee data consistency afterwards. Data can be lost, corrupted, incomplete, or only partially restored. Read this section before you start a physical restore, not after.

If a physical restore fails, the Operator does not roll back the changes it made while preparing for the restore - it doesn’t know at which stage the failure happened, so it cannot guarantee data consistency. Retry the restore, or delete the StatefulSet yourself to return the cluster to its normal configuration; deleting the StatefulSet can revert the cluster to its pre-restore configuration, but data loss or corruption is still possible depending on when the failure occurred.

To inspect restore logs, exec into the `mongod` container and check the PBM logs. PBM keeps only the latest restore logs, because it cleans up the data directory during the process.

For step-by-step diagnostics, see [Troubleshoot backups and restores](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug-backup-restore.html).

## Verify the restore

Watch the Restore object until it finishes:

```
kubectl get psmdb-restore -n $NAMESPACE
```

The restore must reach the `ready` state. `rejected` means the Operator refused the request before starting - check `status.error` on the object. `error` means the restore began and failed; for physical restores read [If a physical restore fails](#if-a-physical-restore-fails) before retrying, because a failed physical restore is not rolled back.

Then connect to the cluster and confirm the data is there: compare database and collection names, and document counts for your largest collections, against what you expect.

## Other restore scenarios

- [Restore to a point in time](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pitr-restore.html) - recover to a specific date and time.
- [Restore a collection under a different name](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore-new-name.html)
