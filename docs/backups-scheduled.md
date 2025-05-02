# Making scheduled backups

You can automate the backup process with scheduled backups. You define a schedule and the Operator runs backups automatically according to it. This provides reliability and efficiency to your backups strategy and ensures your data is timely and regularly backed up with no gaps.

To configure scheduled backups, modify the `backups` section of the [deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) Custom Resource manifest. Specify the following configuration:

1. `backup.enabled` - set to `true`,
2. `backup.storages` subsection - define at least one [configured storage](backups-storage.md).
3. Configure the `backup.tasks` subsection:

    * `name` - specify a backup name. You will need this name when you [restore from this backup](backups-restore.md).
    * `schedule` - specify the desired backup schedule in [crontab format  :octicons-link-external-16:](https://en.wikipedia.org/wiki/Cron)).
    * `enabled` - set this key to `true`. This enables making the `<backup name>` backup along with the specified schedule.
    * `storageName` - specify the name of your [already configured storage](backups-storage.md).
    * `keep` - define the number of backups to keep in the storage. This key is optional. It applies to base incremental backups but is ignored for increments. 
    * `type` - specify what [type of backup](backups.md#backup-types) to make. If you leave it empty, the Operator makes a logical backup by default.

    Note that the `percona.com/delete-backup` finalizer applies for an incremental base backup but is ignored for increments. This means that when an incremental base backup is deleted, PBM also deletes all increments that derived from it from the backup storage. There is the limitation that the Backup resource for the base incremental backup is deleted but the Backup resources for increments remain in the Operator. This is because the Operator doesn't control their deletion outsourcing this task to PBM. This limitation will be fixed in future releases.

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
         keep: 3
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
         keep: 3
         type: physical
         storageName: s3-us-west
      ...
    ```

=== "Incremental"  

    To run incremental backups, consider the following: 

    1. You must use the same storage for the base backup and subsequent incremental ones
    2. The `percona.com/delete-backup` finalizer and the [` .spec.backup.tasks.[].keep`](operator.md##backuptaskskeep) option are is considered for incremental base backup but are ignored for increments. This means that when a base backup is deleted, PBM deletes all increments that derive from it.

       There is the limitation that the Backup resource for the base incremental backup is deleted but the Backup resources for increments remain in the Operator. This is because the Operator doesn't control their deletion outsourcing this task to PBM. This limitation will be fixed in future releases.

    This example shows how to set up incremental base backups to run every Sunday at 5 a.m and subsequent incremental backups every night at 1:00 a.m. and store them in Amazon S3:  

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
         type: incremental-base
         storageName: s3-us-west
         compressionType: gzip
         compressionLevel: 6
      ...
    ```

--8<-- "restore-new-k8s-env.md"