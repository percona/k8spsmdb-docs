# Restore a collection under a different name

!!! admonition "Version added: 1.23.0"

You can restore a single collection from a full logical backup under a different database and/or collection name. The Operator remaps the namespace during the restore: the source collection stays in place, and PBM creates a new collection with the data and indexes from the backup.

This is useful when you need to inspect or compare restored data without overwriting the live collection. For example, to troubleshoot issues after an accidental delete.

Use the `selective.nsFrom` and `selective.nsTo` fields in the `PerconaServerMongoDBRestore` Custom Resource. Both fields use the `<db.collection>` format.

## Limitations

Namespace remapping has these constraints:

* Supported only on **replica set** clusters. It is not supported on sharded clusters.
* Supported for **unsharded** collections.
* The backup must be a **full logical** backup.
* You can remap **one** collection per restore.
* Both `selective.nsFrom` and `selective.nsTo` must be set together. Setting only one of them is not allowed.
* The source (`selective.nsFrom`) and the target (`selective.nsTo`) namespaces can't be the same.
* Do not set `selective.namespaces` or `selective.withUsersAndRoles` together with `nsFrom` / `nsTo`.
* The target namespace (`nsTo`) must **not** already exist on the destination cluster.

Also review the [selective restore limitations :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/features/known-limitations.html#selective-backups-and-restores) in Percona Backup for MongoDB documentation.

--8<-- "backups-restore.md:backup-prepare"

## Restore under a different collection name

To restore a collection with a new name in the same database, set `nsFrom` to the source namespace and `nsTo` to the new one:

```yaml
apiVersion: psmdb.percona.com/v1
kind: PerconaServerMongoDBRestore
metadata:
  name: restore-remap
spec:
  clusterName: my-cluster-name
  backupName: backup1
  selective:
    nsFrom: "myApp.test"
    nsTo: "myApp.test_remapped"
```

In this example, PBM restores `myApp.test` from the backup as `myApp.test_remapped`. The original `myApp.test` collection on the cluster is unchanged.

Start the restore:

```bash
kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
```

## Restore to a different database

To place the restored collection in another database, change the database part of `nsTo`:

```yaml
spec:
  clusterName: my-cluster-name
  backupName: backup1
  selective:
    nsFrom: "myApp.test"
    nsTo: "analytics.test_copy"
```

Here, data from `myApp.test` in the backup is restored as `analytics.test_copy`. The Operator creates the target database if it does not exist. Ensure that `analytics.test_copy` does not already exist before you start the restore.

## Point-in-time recovery with namespace remapping

You can combine remapping with point-in-time recovery. A precondition is to [enable saving oplog operations](backups-pitr.md).

```yaml
apiVersion: psmdb.percona.com/v1
kind: PerconaServerMongoDBRestore
metadata:
  name: restore-remap-pitr
spec:
  clusterName: my-cluster-name
  backupName: backup1
  pitr:
    type: date
    date: "2026-03-01 14:30:00"
  selective:
    nsFrom: "myApp.test"
    nsTo: "myApp.test_remapped"
```

PBM restores the collection from the backup and replays oplog events for that namespace up to the specified time, writing the result to `nsTo`.

## Restore to a different cluster

You can remap a collection onto another Percona Server for MongoDB cluster managed by the Operator. Requirements:

* The **target** cluster must be a **replica set** (not sharded).
* The backup must be a **logical** backup available to the target cluster.
* The target namespace (`nsTo`) must not already exist on the target cluster.
* When restoring to a new Kubernetes environment, follow the [preconditions for restore to a new cluster](backups-restore-to-new-cluster.md#preconditions).

On the target cluster, point `spec.clusterName` at that cluster and use `backupSource` when Backup objects from the source cluster are not present:

```yaml
apiVersion: psmdb.percona.com/v1
kind: PerconaServerMongoDBRestore
metadata:
  name: restore-remap-new-cluster
spec:
  clusterName: target-cluster-name
  backupSource:
    type: logical
    destination: s3://S3-BUCKET-NAME/BACKUP-NAME
    s3:
      credentialsSecret: my-cluster-name-backup-s3
      region: us-west-2
      endpointUrl: https://URL-OF-THE-S3-COMPATIBLE-STORAGE
  selective:
    nsFrom: "myApp.test"
    nsTo: "myApp.test_remapped"
```

You can also define storage on the target cluster’s `cr.yaml` and reference it with `storageName` instead of embedding credentials in `backupSource`. See [Restore to a new Kubernetes-based environment](backups-restore-to-new-cluster.md) for storage configuration details.

This restore adds one collection to the target cluster. It does not replace the whole cluster data.
