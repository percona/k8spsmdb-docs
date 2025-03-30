# Making scheduled backups

Backups schedule is defined in the `backup` section of the Custom Resource and can be configured via the [deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) file.

1. The `backup.enabled` key should be set to `true`,
2. The `backup.storages` subsection should contain at least one [configured storage](backups-storage.md).
3. The `backup.tasks` subsection allows to actually schedule backups:
    * set the `name` key to some arbitray backup name (this name will be needed later to [restore the bakup](backups-restore.md)).
    * specify the `schedule` option with the desired backup schedule in [crontab format  :octicons-link-external-16:](https://en.wikipedia.org/wiki/Cron)).
    * set the `enabled` key to `true` (this enables making the `<backup name>` backup along with the specified schedule.
    * set the `storageName` key to the name of your [already configured storage](backups-storage.md).
    * you can optionally set the `keep` key to the number of backups which should be kept in the storage.
    * you can optionally set the `type` key to `physical` if you would like to make physical backups instead of logical ones (please see the [physical backups limitations](backups.md#physical)). Otherwise set this key to `logical`, or just omit it.

Here is an example of the `deploy/cr.yaml` with a scheduled Saturday night backup kept on the Amazon S3 storage:

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

!!! note

    If you plan to [restore backup to a new Kubernetes-based environment](backups-restore-to-new-cluster.md), make sure you will be able to create there a Secrets object with the same user passwords as in the original cluster. More details about secrets can be found in [System Users](users.md#system-users). The name of the current Secrets object you will need to recreate can be found out from the `spec.secrets` key in the `deploy/cr.yaml` (`my-cluster-name-secrets` by default).
