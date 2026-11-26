# Making scheduled backups

You can automate the backup process with scheduled backups. Define a schedule and the Operator runs backups automatically according to it. This provides reliability and efficiency to your backups strategy and ensures your data is timely and regularly backed up with no gaps.

## Configure a scheduled backup

To configure scheduled backups, modify the `backups` section of the [deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) Custom Resource manifest. Specify the following configuration:

1. `backup.enabled` - set to `true`,
2. `backup.storages` subsection - define at least one [configured storage](backups-storage.md).
3. `backup.tasks` subsection - specify the following configuration:

    * `name` - specify the task name. The Operator adds it to every backup the task creates, in the `percona.com/backup-ancestor` label, so you can find the task's backups. To [restore from a backup](backups-restore.md), you use the name of the backup itself, not the task name.
    * `schedule` - specify the desired backup schedule in [crontab format  :octicons-link-external-16:](https://en.wikipedia.org/wiki/Cron).
    * `enabled` - set this key to `true`. This enables making the `<backup name>` backup along with the specified schedule.
    * `storageName` - specify the name of your [already configured storage](backups-storage.md). Omit for PVC snapshot (`external`) tasks.
    * `volumeSnapshotClass` - specify the `VolumeSnapshotClass` name when `type` is `external`. See [Configure PVC snapshots](backups-pvc-setup.md) how to check if `VolumeSnapshotClass` exists in your cluster and how to add it if it doesn't.
    * `retention` - configure the retention policy: how many backups to keep before the Operator removes older ones. This setting is optional. It applies to base incremental backups but is ignored for increments. See [Configure backup retention](backups-delete.md#configure-backup-retention) for the fields and their behavior.
    * `type` - specify what [type of backup](backups.md#backup-types) to make. If you leave it empty, the Operator makes a **logical** backup by default.

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

=== "PVC snapshot (external)"

    This example runs a daily PVC snapshot at 2:00 a.m. and keeps the seven most recent snapshots:

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
        - name: daily-snapshot
          enabled: true
          schedule: "0 2 * * *"
          type: external
          volumeSnapshotClass: gke-snapshot-class
          retention:
            count: 7
            type: count
            deleteFromStorage: true
    ```

    See [Make a scheduled snapshot-based backup](backups-pvc-usage.md#make-a-scheduled-snapshot-based-backup).

--8<-- "restore-new-k8s-env.md"

## If the Operator misses a scheduled backup

The Operator runs backup schedules itself, not as Kubernetes CronJobs. If the Operator Pod isn't running when a backup is due, for example during a restart, an eviction or a node drain, it can't start that backup.

Starting with version 1.24.0, the Operator checks each task when it starts. If the task's latest backup is older than the last time the schedule was due, the Operator creates a catch-up backup right away. It creates only one backup, even if the task missed several scheduled runs. Then the task continues on its schedule.

The Operator doesn't create a catch-up backup when:

* The task has no backups yet, for example right after you add it.
* The task's latest backup is still in progress.
* Another backup of the cluster is running. The next backup runs on schedule.

A catch-up backup is a regular scheduled backup, and the task's retention policy applies to it. To find it, look for `catching up missed scheduled backup` in the Operator log. The timestamp in its name is when the Operator started, not a scheduled time.

In versions before 1.24.0, the Operator skips a missed backup and doesn't report it.

## Verify the schedule works

A scheduled task is silent until it fires, so confirm the first run rather than waiting for
an incident. List the backups after the schedule is due:

```bash
export NAMESPACE=<namespace>
kubectl get psmdb-backup -n $NAMESPACE
```

Backups that a task creates are named `cron-<cluster-name>-<YYYYMMDDhhmmss>-<suffix>` and carry the task name in the `percona.com/backup-ancestor` label. To list the backups of one task:

```bash
kubectl get psmdb-backup -n $NAMESPACE -l percona.com/backup-ancestor=<task-name>
```

The backup must reach the `ready` state; an
`error` there means the task is scheduled correctly but the storage or credentials are not.
If nothing appears at all, check that `backup.enabled` and the task's own `enabled` are both
`true`, and that the `schedule` expression is what you intended.
