# Delete the unneeded backup

The maximum amount of stored backups is controlled by the [backup.tasks.keep](operator.md#backuptaskskeep)
option (only successful backups are counted). Older backups are automatically
deleted, so that amount of stored backups do not exceed this number. Setting
`keep=0` or removing this option from `deploy/cr.yaml` disables automatic
deletion of backups.

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
