> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Configure backups

Use this path when you are ready to set up backups and restores. To learn more about backup types, storage, or whether you need point-in-time recovery, start with [Backup and restore](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups.html).

## Before you begin

- The cluster is running.
- You can create Kubernetes Secrets in the cluster namespace, or your platform provides identity-based access to the storage. See [Choose how to authenticate](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage.html#choose-how-to-authenticate).

Important

Two of the steps below cannot be applied retroactively. Point-in-time recovery and server-side encryption affect only the backups taken **after** you enable them. If you skip step 2 and enable it months later, the backups you already have still cannot be used to recover to an arbitrary moment, and they are still unencrypted.

- Export your namespace so the commands on this page can use it:

  ```
  export NAMESPACE=<namespace>
  ```

## 1. Configure storage

[Configure storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage.html) — required for every backup type. PVC snapshots still need object storage for backup metadata, even though they do not upload database files there.

Need more than one bucket? See [Multiple storages for backups](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/multi-storage.html).

## 2. Enable capabilities that must come first

Decide these now, before you take backups you may later depend on:

- [Enable point-in-time recovery](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pitr.html) — lets you recover to any moment, not just to a backup.
- [Encrypt backups](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-encryption.html) — has the storage encrypt backup data as it is written.

## 3. Choose how to back up

- [On a schedule](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-scheduled.html) — the usual choice for production.
- [On demand](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-ondemand.html) — before a risky change, or to test the setup.
- [PVC snapshots](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pvc-snapshots.html) — storage-level copies instead of uploading to object storage. Set them up with [Configure PVC snapshots](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pvc-setup.html).

## 4. Verify the backup works

A backup you have never checked is a guess. Confirm the backup object reaches the `ready` state:

```
kubectl get psmdb-backup -n $NAMESPACE
```

A backup in `error` never completed. `running` or `waiting` means it is not finished yet. Only `ready` is restorable. If it does not get there, see [Troubleshoot backups and restores](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug-backup-restore.html).

## 5. Restore

- [On the same cluster](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore.html#restore-on-the-same-cluster), or on a [new cluster](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore.html#restore-on-a-new-cluster).
- [Restore to a point in time](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pitr-restore.html) — roll the database back to a specific moment.
- [Restore from a PVC snapshot](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pvc-usage.html).
- [Restore a collection under a different name](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore-new-name.html).
- [Restore to a new cluster with different replica set names](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore.html#with-different-replica-set-names).

Practise a restore before you need one. Restores are the only proof that backups work.

## 6. Manage retention and delete backups

[Manage retention and delete backups](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-delete.html) — control how many backups you keep and remove the ones you no longer need.

## Next steps

[Configure storage for backups](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage.html)

## See also

Bringing data in from outside Kubernetes? See [Move an external database to Kubernetes](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-move-from-external-db.html).
