# Making scheduled backups

You can automate the backup process with scheduled backups. Define a schedule and the Operator runs backups automatically according to it. This provides reliability and efficiency to your backups strategy and ensures your data is timely and regularly backed up with no gaps.

## Considerations

1. The `percona.com/delete-backup` finalizer applies for an incremental base backup but is ignored for increments. This means that when an incremental base backup is deleted, PBM also deletes all increments that derived from it from the backup storage. There is the limitation that the Backup resource for the base incremental backup is deleted but the Backup resources for increments remain in the Operator. This is because the Operator doesn't control their deletion outsourcing this task to PBM. This limitation will be fixed in future releases.

2. Starting with Operator version 1.17.0, the backup label changed from `ancestor` to `percona.com/backup-ancestor`. The Operator automatically deletes backups with the new `percona.com/backup-ancestor` label, but it does not remove older backups that use the `ancestor` label. To free up storage, you need to manually delete backups created with Operator versions before 1.17.0. For instructions, see [Delete backups](backups-delete.md).

To configure scheduled backups, modify the `backups` section of the [deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) Custom Resource manifest. Specify the following configuration:

1. `backup.enabled` - set to `true`,
2. `backup.storages` subsection - define at least one [configured storage](backups-storage.md).
3. `backup.tasks` subsection - specify the following configuration:

    * `name` - specify a backup name. You will need this name when you [restore from this backup](backups-restore.md).
    * `schedule` - specify the desired backup schedule in [crontab format  :octicons-link-external-16:](https://en.wikipedia.org/wiki/Cron)).
    * `enabled` - set this key to `true`. This enables making the `<backup name>` backup along with the specified schedule.
    * `storageName` - specify the name of your [already configured storage](backups-storage.md).
    * `retention` - configure the retention policy: how many backups to keep in the storage. This setting is optional. It applies to base incremental backups but is ignored for increments. Read more about it in the [Configure retention](#configure-retention) section.
    * `type` - specify what [type of backup](backups.md#backup-types) to make. If you leave it empty, the Operator makes a **logical** backup by default.

## Configure retention

Use the `backup.tasks.retention` subsection to configure the retention policy for backups. Specify the following parameters:

* `backup.tasks.retention.type` - the retention strategy. The default (and currently only supported strategy) is `count`, which keeps the most recent `backup.tasks.retention.count` backups and removes older ones.
* `backup.tasks.retention.count` - how many backups to keep. Older backups are removed from the storage. See [Considerations](#considerations) for details on how this applies to incremental backups.
* `backup.tasks.retention.deleteFromStorage` - if to delete backup files from storage as well. This option is supported only for AWS and Azure storage.

**Examples**

=== "Logical"

    This example shows how to set up backups to run every Saturday night and store them in Amazon S3:

    ```yaml
    ...
    backup:
      enabled: true
      storages:
        s3-us-west:
          type: s3
          s3:
            bucket: S3-BACKUP-BUCKET-NAME-HERE
            region: us-west-2
            credentialsSecret: my-cluster-name-backup-s3
      tasks:
       - name: "sat-night-backup"
         enabled: true
         schedule: "0 0 * * 6"
         retention:
            count: 3
            type: count
            deleteFromStorage: true
         type: logical
         storageName: s3-us-west
      ...
    ```

=== "Physical"

    This example shows how to set up backups to run every Saturday night and store them in Amazon S3:

    ```yaml
    ...
    backup:
      enabled: true
      storages:
        s3-us-west:
          type: s3
          s3:
            bucket: S3-BACKUP-BUCKET-NAME-HERE
            region: us-west-2
            credentialsSecret: my-cluster-name-backup-s3
      tasks:
       - name: "sat-night-backup"
         enabled: true
         schedule: "0 0 * * 6"
         retention:
            count: 3
            type: count
            deleteFromStorage: true
         type: physical
         storageName: s3-us-west
      ...
    ```

=== "Incremental"

    To run incremental backups, consider the following:

    1. You must use the same storage for the base backup and subsequent incremental ones
    2. The `percona.com/delete-backup` finalizer and the [`backup.tasks.retention`](operator.md#backuptasksretentiontype) settings are considered for incremental base backups but are ignored for increments. This means that when a base backup is deleted, PBM deletes all increments that derive from it.

       There is the limitation that the Backup resource for the base incremental backup is deleted but the Backup resources for increments remain in the Operator. This is because the Operator doesn't control their deletion outsourcing this task to PBM. This limitation will be fixed in future releases.

    This example shows how to set up incremental base backups to run every Sunday at 5 a.m. and subsequent incremental backups every night at 1:00 a.m., and store them in Amazon S3:

    ```yaml
    ...
    backup:
      enabled: true
      storages:
        s3-us-west:
          type: s3
          s3:
            bucket: S3-BACKUP-BUCKET-NAME-HERE
            region: us-west-2
            credentialsSecret: my-cluster-name-backup-s3
      tasks:
       - name: weekly-s3-us-west-incremental
         enabled: true
         schedule: "0 1 * * *"
         type: incremental
         storageName: s3-us-west
         compressionType: gzip
         compressionLevel: 6
       - name: weekly-s3-us-west-incremental-base
         enabled: true
         schedule: "0 5 * * 0"
         retention:
            count: 3
            type: count
            deleteFromStorage: true
         type: incremental-base
         storageName: s3-us-west
         compressionType: gzip
         compressionLevel: 6
      ...
    ```

--8<-- "restore-new-k8s-env.md"
