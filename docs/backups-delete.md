# Delete the unneeded backup

The maximum amount of stored backups is controlled by the [backup.tasks.keep](operator.md#backuptaskskeep)
option (only successful backups are counted). Older backups are automatically
deleted so that the number of stored backups does not exceed this value. Setting
`keep=0` or removing this option from `deploy/cr.yaml` disables automatic
deletion of backups.
The Operator applies this retention policy to both the backup objects in the
cluster and the backup files in storage.

Each backup object has the `delete-backup` finalizer. When you delete the backup
object, the Operator uses PBM to remove the corresponding backup files from the
configured storage. This keeps the cluster and the remote storage in sync with
your retention settings.

Manual deleting of a previously saved backup requires not more than the backup
name. This name can be taken from the list of available backups returned
by the following command:

```bash
kubectl get psmdb-backup -n <namespace>
```

When the name is known, backup can be deleted as follows:

```bash
kubectl delete psmdb-backup/<backup-name> -n <namespace>
```

!!! note

    Deleting a backup used [as a base for point-in-time recovery (PITR)](backups-pitr.md)
    is possible only starting from the Operator version 1.15.0. Also, deleting
    such a backup will delete the stored operations log updates based on this
    backup.
