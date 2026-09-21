# Configure backups

Use this path when you are ready to set up backups and restores. To learn more about backup types, storage, or whether you need point-in-time recovery, start with [Backup and restore](backups.md).

## Before you begin

* The cluster is running.
* You can create Kubernetes Secrets in the cluster namespace, or your platform provides
  identity-based access to the storage. See [Choose how to authenticate](backups-storage.md#choose-how-to-authenticate).

!!! important

    Two of the steps below cannot be applied retroactively. Point-in-time recovery and
    server-side encryption affect only the backups taken **after** you enable them. If you
    skip step 2 and enable it months later, the backups you already have still cannot be
    used to recover to an arbitrary moment, and they are still unencrypted.

* Export your namespace so the commands on this page can use it:

    ```bash
    export NAMESPACE=<namespace>
    ```

## 1. Configure storage

[Configure storage](backups-storage.md) — required for every backup type. PVC snapshots still need object storage for backup metadata, even though they do not upload database files there.

Need more than one bucket? See [Multiple storages for backups](multi-storage.md).

## 2. Enable capabilities that must come first

Decide these now, before you take backups you may later depend on:

* [Enable point-in-time recovery](backups-pitr.md) — lets you recover to any moment, not just to a backup.
* [Encrypt backups](backups-encryption.md) — has the storage encrypt backup data as it is written.

## 3. Choose how to back up

* [On a schedule](backups-scheduled.md) — the usual choice for production.
* [On demand](backups-ondemand.md) — before a risky change, or to test the setup.
* [PVC snapshots](backups-pvc-snapshots.md) — storage-level copies instead of uploading to object storage. Set them up with [Configure PVC snapshots](backups-pvc-setup.md).

## 4. Verify the backup works

A backup you have never checked is a guess. Confirm the backup object reaches the `ready` state:

```bash
kubectl get psmdb-backup -n $NAMESPACE
```

A backup in `error` never completed. `running` or `waiting` means it is not finished yet. Only `ready` is restorable. If it does not get there, see [Troubleshoot backups and restores](debug-backup-restore.md).

## 5. Restore

* [On the same cluster](backups-restore.md#restore-on-the-same-cluster), or on a [new cluster](backups-restore.md#restore-on-a-new-cluster).
* [Restore to a point in time](backups-pitr-restore.md) — roll the database back to a specific moment.
* [Restore from a PVC snapshot](backups-pvc-usage.md).
* [Restore a collection under a different name](backups-restore-new-name.md).
* [Restore to a new cluster with different replica set names](backups-restore.md#with-different-replica-set-names).

Practise a restore before you need one. Restores are the only proof that backups work.

## 6. Manage retention and delete backups

[Manage retention and delete backups](backups-delete.md) — control how many backups you keep and remove the ones you no longer need.

## Next steps

[Configure storage for backups](backups-storage.md){.md-button}

## See also

Bringing data in from outside Kubernetes? See [Move an external database to Kubernetes](backups-move-from-external-db.md).
