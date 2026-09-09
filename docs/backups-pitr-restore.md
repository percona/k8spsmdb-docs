# Make a point in time restore 

Use this guide to run a point-in-time recovery (PITR): recover the cluster to a specific date and time, or to the latest restorable transaction. The Operator restores a backup, then replays oplog up to that moment.

Turn oplog collection on first. See [Enable point-in-time recovery](backups-pitr.md). PVC snapshot (`external`) backups do not support this restore.

To restore a backup without replaying oplog, use [Restore on the same cluster](backups-restore.md#restore-on-the-same-cluster) or [Restore on a new cluster](backups-restore.md#restore-on-a-new-cluster).

Restore options for the `pitr` stanza are listed in the [Restore resource reference](restore-options.md#the-pitr-subsection).

## Before you begin

* [Enable oplog collection](backups-pitr.md#enable-oplog-collection) and wait until oplog is uploading (about 10 minutes by default).
* You need a successful backup (full logical, physical, or incremental base) to use as the restore base. After a restore, take a new backup before you rely on PITR again.
* Check PBM's [considerations :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/usage/restore.html#considerations) so clients do not write during the restore. The Operator may delete and recreate Pods; see [restore considerations](backups-restore.md#downtime-to-expect).

--8<-- "backups-restore.md:backup-prepare"

## Choose the target time

In the Restore object, set `spec.pitr.type` to one of:

* `date` — roll back to a specific timestamp. Set `spec.pitr.date` in the format `YYYY-MM-DD HH:MM:SS`.
   
    To pick a `date` value, check the latest restorable timestamp for a backup:

    ```bash
    kubectl get psmdb-backup <backup_name> -n $NAMESPACE -o jsonpath='{.status.latestRestorableTime}'
    ```

* `latest` — recover to the latest possible transaction.

## Restore on the same cluster

Use this path when the Backup object still exists in the cluster. Set `spec.backupName`. Do not set `spec.backupSource` in the same Restore object.

1. Edit the [deploy/backup/restore.yaml :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/v{{release}}/deploy/backup/restore.yaml) manifest:

    * `spec.clusterName` — the cluster to restore. On the same cluster this matches the name in the Backup object.
    * `spec.backupName` — the backup to use as the base.
    * `spec.pitr.type` — `date` or `latest`.
    * `spec.pitr.date` — required when `type` is `date`.

2. Pass this configuration to the Operator:

=== "via the YAML manifest"

    1. Edit `deploy/backup/restore.yaml`:

        ```yaml
        apiVersion: psmdb.percona.com/v1
        kind: PerconaServerMongoDBRestore
        metadata:
          name: restore1
        spec:
          clusterName: my-cluster-name
          backupName: backup1
          pitr:
            type: date
            date: YYYY-MM-DD hh:mm:ss
        ```

    2. Start the restore:

        ```bash
        kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
        ```

=== "via the command line"

    ```bash
    cat <<EOF | kubectl apply -n $NAMESPACE -f-
    apiVersion: psmdb.percona.com/v1
    kind: PerconaServerMongoDBRestore
    metadata:
      name: restore1
    spec:
      clusterName: my-cluster-name
      backupName: backup1
      pitr:
        type: date
        date: YYYY-MM-DD hh:mm:ss
    EOF
    ```

If a physical restore fails, see [If a physical restore fails](backups-restore.md#if-a-physical-restore-fails).

## Restore on a new cluster

Use this path when you restore into a different Kubernetes environment and there is no Backup object on the target. Set `spec.backupSource` (and storage) instead of `spec.backupName`.

--8<-- "backups-restore.md:backup-new-env-preconditions"

PBM must know where the backup and oplog live. Define storage in the Restore object, or pre-configure it on the target cluster and reference it by name.

If the target replica set names differ from the source, add `replsetRemapping`. See [Restore to a new cluster with different replica set names](backups-restore.md#with-different-replica-set-names).

### Storage defined in the Restore object

1. Set these keys in [deploy/backup/restore.yaml :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/backup/restore.yaml):

    * `spec.clusterName` — the **target** cluster.
    * `spec.pitr.type` — `date` or `latest`. Set `spec.pitr.date` when `type` is `date`. Refer to [Choose the target time](#choose-the-target-time) to identify the time for the restore
    * `spec.backupSource` — where the backup is stored:

        * the [backup type](backups.md#backup-types) — `logical` or `physical`
        * `destination` from `kubectl get psmdb-backup` on the source cluster
        * the same [storage keys](backups-storage.md) as in the source cluster `deploy/cr.yaml`
        * if you specified a `prefix` in a bucket where you store backups, you must specify this prefix in the restore configuration.

    Example configuration for AWS S3 storage:

    ```yaml
    apiVersion: psmdb.percona.com/v1
    kind: PerconaServerMongoDBRestore
    metadata:
      name: restore1
    spec:
      clusterName: my-cluster-name
      pitr:
        type: date
        date: YYYY-MM-DD hh:mm:ss
      backupSource:
        destination: s3://S3-BUCKET-NAME/BACKUP-NAME
        s3:
          credentialsSecret: my-cluster-name-backup-s3
          region: us-west-2
          endpointUrl: https://URL-OF-THE-S3-COMPATIBLE-STORAGE
          prefix: my-prefix
    ```

    For S3-compatible storage, `destination` is `s3://`, the bucket name, and the backup name. For Azure Blob storage, omit the prefix and use the container name as the bucket equivalent.

2. Start the restore:

    ```bash
    kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
    ```

    During the restore, the Operator takes storage from the Restore object, configures PBM, resyncs metadata on the target, runs the restore, then reverts PBM to the configuration in `cr.yaml` (if any).

3. After the restore, set the [main storage](multi-storage.md#define-the-main-storage) on the target cluster so you can take further backups.

### Storage already defined on the target

If `backup.storages` on the target `deploy/cr.yaml` already points at the source backup location, reference that storage by name.

1. Set these keys in `deploy/backup/restore.yaml`:

    * `spec.clusterName` — the target cluster
    * `spec.pitr.type` and, for `date`, `spec.pitr.date`
    * `spec.storageName` — must match a name under `backup.storages` on the target
    * `spec.backupSource.destination` — the backup path. If you specified a prefix (a folder) in a bucket where you store backups, you must specify this prefix destination path.

    ```yaml
    apiVersion: psmdb.percona.com/v1
    kind: PerconaServerMongoDBRestore
    metadata:
      name: restore1
    spec:
      clusterName: my-cluster-name
      storageName: s3-us-west
      pitr:
        type: date
        date: YYYY-MM-DD hh:mm:ss
      backupSource:
        destination: s3://S3-BUCKET-NAME/<MY_PREFIX>/BACKUP-NAME
    ```

2. For restore to the **latest** possible transaction, run a manual resync first so PBM has the latest oplog chunks on the target. Connect to a database Pod (for example `my-cluster-name-rs0-2`):

    ```bash
    kubectl exec -it my-cluster-name-rs0-2 -c backup-agent -- pbm config --force-resync
    ```

    The Operator also resyncs when the restore starts. The manual step is the extra safeguard for `type: latest`.

3. Start the restore:

    ```bash
    kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
    ```


## Verify the restore

Watch the Restore object until it finishes:

```bash
kubectl get psmdb-restore -n $NAMESPACE
```

The restore must reach the `ready` state. `rejected` means the Operator refused the request
before starting - check `status.error` on the object. `error` means the restore began and
failed; for physical restores read
[If a physical restore fails](backups-restore.md#if-a-physical-restore-fails) before
retrying, because a failed physical restore is not rolled back.

Then connect to the cluster and confirm the data is there: compare database and collection
names, and document counts for your largest collections, against what you expect.

## Related

* [Restore a collection under a different name](backups-restore-new-name.md#point-in-time-recovery-with-namespace-remapping) — combine remapping with PITR
* [Restore to a new cluster with different replica set names](backups-restore.md#with-different-replica-set-names)
* [Restore resource options](restore-options.md#the-pitr-subsection)
* [Troubleshoot backups and restores](debug-backup-restore.md)
