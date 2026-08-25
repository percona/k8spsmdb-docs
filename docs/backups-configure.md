# Configure backups

Use this path when you are ready to set up backups and restores. To learn more about backup types, storage, or whether you need point-in-time recovery, start with [Backup and restore](backups.md).

1. **[Configure storage](backups-storage.md)** — Required for every backup type. PVC snapshots still need object storage for backup metadata.
2. **Optional setup** — [Enable point-in-time recovery](backups-pitr.md), [encrypt backups](backups-encryption.md), or [configure PVC snapshots](backups-pvc-setup.md).
3. **Take a backup** — Run backups [on a schedule](backups-scheduled.md) or [on demand](backups-ondemand.md).
4. **Restore** — Recover on the [same cluster](backups-restore.md) or a [new cluster](backups-restore-to-new-cluster.md). 
5. Make a [point-in-time recovery](backups-pitr-restore.md) to roll back the database to a specific moment.
6. **[Manage retention and delete backups](backups-delete.md)** — Control how many backups you keep and remove the ones you no longer need.

Need more than one bucket, or to bring data from outside Kubernetes? See [Multiple storages for backups](multi-storage.md) and [Move an external database to Kubernetes](backups-move-from-external-db.md).

## Next steps

[Configure storage](backups-storage.md){.md-button}
