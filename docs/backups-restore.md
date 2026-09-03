# Restore on the same cluster

This page covers restoring a backup onto the cluster that produced it. Restoring somewhere
else is covered in [Other restore scenarios](#other-restore-scenarios), and the options are
compared in [Backup and restore](backups.md#restore-options).

Every restore is a Restore object, created from the
[`deploy/backup/restore.yaml`  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/backup/restore.yaml) manifest.

## Downtime to expect

Every restore causes downtime. How much, and whether Pods are replaced, depends on the
restore type and on whether the cluster is sharded:

| Restore | Downtime | Pods deleted and recreated |
|---|---|---|
| Logical, unsharded cluster | For the duration of the data restore | None |
| Logical, sharded cluster | Data restore, plus refreshing sharding metadata on `mongos` | `mongos` Pods only |
| Physical or incremental | Data restore, plus refreshing sharding metadata on `mongos` | All Pods - replica set, config server replica set if present, and `mongos` |

Also check PBM's [restore considerations :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/usage/restore.html#considerations)
for keeping MongoDB clients away from the database while the restore runs.

## Choose backupName or backupSource

Every restore names its source in one of two ways. Use exactly one - setting both is not allowed.

| | `backupName` | `backupSource` |
|---|---|---|
| Use it when | Backup objects exist in this cluster | No backup objects exist, for example [when restoring to a new cluster](backups-restore-to-new-cluster.md) |
| Backup type | PBM determines it automatically | You must state it yourself: `logical`, `physical`, `incremental`, or `external` |
| Typical case | Restoring onto the cluster that made the backup | Restoring into a fresh environment |

`backupSource` also works for restores onto the same cluster, if you prefer it.

## Before you begin

Two preconditions are easy to miss:

* The backup you restore from must be in the `ready` state. A backup still in `running`,
  `waiting`, or `error` cannot be restored.
* Restoring to a point in time additionally requires that
  [oplog collection](backups-pitr.md) was enabled **before** that backup was taken.
  Enabling it afterwards does not make earlier moments recoverable.

--8<-- [start:backup-prepare]

1. Make sure that the cluster is running.
   
2. Export your namespace as an environment variable. Replace the `<namespace>` placeholder with your value:

    ```bash
    export NAMESPACE=<namespace>
    ```

3. Get the backup information. List the backups using this command: 

    ```bash
    kubectl get psmdb-backup -n $NAMESPACE
    ```

4. Get cluster information. List available clusters using this command:

    ```bash
    kubectl get psmdb -n $NAMESPACE
    ```

--8<-- [end:backup-prepare]

## Restore from a backup

To restore your Percona Server for MongoDB cluster from any backup, define a `PerconaServerMongoDBRestore` custom resource. The `deploy/backup/restore.yaml` manifest is the same for all restore types. 

Set the following keys:

* set `spec.clusterName` key to the name of the target cluster to restore the backup on,
* set `spec.backupName` key to the name of your backup. This is the value from the output of the `kubectl get psmdb-backup` command. During the restore, PBM automatically determines the backup type and performs the corresponding restore procedure.

Pass this configuration to the Operator:

=== "via the YAML manifest"

    1. Edit the [deploy/backup/restore.yaml :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/v{{ release }}/deploy/backup/restore.yaml) file and specify the following keys:

        ```yaml
        apiVersion: psmdb.percona.com/v1
        kind: PerconaServerMongoDBRestore
        metadata:
          name: restore1
        spec:
          clusterName: my-cluster-name
          backupName: backup1
        ```

    2. Start the restore with this command:

        ```bash
        kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
        ```

=== "via the command line"

    Instead of storing restore settings in a separate file, you can pass them directly to the `kubectl apply` command as follows:

    ```bash
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

## If a physical restore fails

!!! warning

    A failed physical restore is not rolled back, and the Operator cannot guarantee data
    consistency afterwards. Data can be lost, corrupted, incomplete, or only partially
    restored. Read this section before you start a physical restore, not after.

If a physical restore fails, the Operator does not roll back the changes it made when preparing for the restore. You must either retry the restore or delete the StatefulSet yourself to return the cluster to its normal configuration. Deleting the StatefulSet can revert the cluster to its pre-restore configuration, but data loss or corruption is still possible depending on when the failure occurred.

The Operator cannot guarantee data consistency after a failed restore because it does not know at which stage the failure happened. Data can be lost, corrupted, incomplete, or only partially restored.

You can inspect restore logs by executing into the `mongod` container and checking the PBM logs. PBM keeps only the latest restore logs because it cleans up the data directory during the process.

For step-by-step diagnostics, see [Troubleshoot backups and restores](debug-backup-restore.md).


## Selective restore

Starting with version 1.18.0, you can restore a desired subset of data from a **full** logical backup. Selective logical backups are not yet supported.

Selective restores have a number of limitations. Learn more about the [current selective restore limitations :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/features/known-limitations.html#selective-backups-and-restores) in Percona Backup for MongoDB documentation.

Selective restores are controlled by the additional `selective` section in the `PerconaServerMongoDBRestore` Custom Resource. There you can specify a specific database or a collection that you wish to restore:

```yaml
spec:
  selective:
    withUsersAndRoles: true
    namespaces:
    - "db1.collection1"
    - "db2.collection2"
```

You can specify several "namespaces" (subsets of data) as a list for the `selective.namespaces` field. You can specify a namespace as follows:

* as a pair of database and collection names to restore just this database and collection. The format is `db1.collection1`
* as a database name with a wildcard to restore everything from the specific database. The format is `database_name.*`
* as a single star "*" to restore all databases and collections

Also, you can use `selective.withUsersAndRoles` set to `true` to restore a custom database with users and roles from a full backup. Read more about this functionality in [PBM documentation :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/usage/restore-selective.html#restore-with-users-and-roles).


## Verify the restore

Watch the Restore object until it finishes:

```bash
kubectl get psmdb-restore -n $NAMESPACE
```

The restore must reach the `ready` state. `rejected` means the Operator refused the request
before starting - check `status.error` on the object. `error` means the restore began and
failed; for physical restores read
[If a physical restore fails](#if-a-physical-restore-fails) before
retrying, because a failed physical restore is not rolled back.

Then connect to the cluster and confirm the data is there: compare database and collection
names, and document counts for your largest collections, against what you expect.

## Other restore scenarios

* [Restore to a point in time](backups-pitr-restore.md#restore-on-the-same-cluster) - recover to a
  specific date and time on this cluster.
* [Restore a collection under a different name](backups-restore-new-name.md)
* [Restore to a new Kubernetes-based environment](backups-restore-to-new-cluster.md)
* [Restore to a new cluster with different replica set names](backups-restore-replset-remapping.md)
