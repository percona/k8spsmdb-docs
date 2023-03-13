# Storing operations logs for point-in-time recovery

Point-in-time recovery functionality allows users to roll back the cluster to a
specific date and time. Technically, this feature involves saving operations log
updates [to the cloud storage](backups-storage.md).

Currently, point-in-time recovery functionality can be used with logical backups
only.

To be used, it requires setting the [backup.pitr.enabled](operator.md#backup-pitr-enabled)
key in the `deploy/cr.yaml` configuration file:

```yaml
backup:
  ...
  pitr:
    enabled: true
```

!!! note

    It is necessary to have at least one full backup to use point-in-time
    recovery. Percona Backup for MongoDB will not upload operations logs if there
    is no full backup. This is true for new clusters and also true for clusters
    which have been just recovered from backup.

Percona Backup for MongoDB uploads operations logs to the same bucket/container,
where full backup is stored. This makes point-in-time recovery functionality
available only if there is a single bucket/container in [spec.backup.storages](operator.md#backup-storages-type).
Otherwise point-in-time recovery will not be enabled and there will be an error
message in the operator logs.

!!! note

    Adding a new bucket or container when point-in-time recovery is enabled will
    not break it, but put error message about the additional bucket in the
    Operator logs as well.

