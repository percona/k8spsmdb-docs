# Delete the unneeded backup

<<<<<<< K8SPSMDB-1383-Doc-phys-restore-flow
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
=======
You can delete backups in the following way:

* Configure the retention policy and have the Operator delete them according to this policy rules
* Manually

## Configure backup retention

Use the `backup.tasks.retention` subsection to configure the retention policy for backups. Specify the following parameters:

* `backup.tasks.retention.type` - the retention strategy. The default (and currently only supported strategy) is `count`, which keeps the most recent `backup.tasks.retention.count` backups and removes older ones.
* `backup.tasks.retention.count` - how many backups to keep. Older backups are removed from the storage. See [Considerations](#considerations) for details on how this applies to incremental backups.
* `backup.tasks.retention.deleteFromStorage` - if to delete backup files from storage as well.

## Delete manually

To delete a backup manually, you need to specify the backup name. Get the name from the list of available backups returned
>>>>>>> main
by the following command:

```bash
kubectl get psmdb-backup -n <namespace>
```

??? example "Sample output"

    ```{.text .no-copy}
    backup1   some-name   minio        s3://operator-testing/2026-02-03T16:54:32Z                             logical   55.21KB   ready    16m         17m
    backup2   some-name   azure-blob   azure://operator-testing/psmdb-scheduled-backup/2026-02-03T16:54:00Z   logical   49.70KB   ready    17m         17m
    backup2   some-name   aws-s3       s3://operator-testing/psmdb-scheduled-backup/2026-02-03T16:54:11Z      logical   50.72KB   ready    17m         17m
    ```

Now, you can delete the desired backup as follows:

```bash
kubectl delete psmdb-backup/<backup-name> -n <namespace>
```

!!! note "Delete base backups for point-in-time recovery"

    You can delete a backup used [as a base for point-in-time recovery (PITR)](backups-pitr.md) starting from the Operator version 1.15.0. Note that  deleting such a backup will delete the stored operations log updates based on this backup.

### Delete backups with the legacy `ancestor` label

Backups created before version 1.17.0 have the `ancestor` label. The Operator doesn't automatically delete such backups according to the retention policy. You should manually delete them to free up storage.

To find and remove these legacy backups:

1. List all backups with the `ancestor` label:

    ```bash
    kubectl get psmdb-backup -l ancestor -n <namespace>
    ```

2. Delete them:

    ```bash
    kubectl delete psmdb-backup -l ancestor -n <namespace>
    ```
