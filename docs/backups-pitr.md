# Storing operations logs for point-in-time recovery

Point-in-time recovery enables you to roll back your cluster to a
specific date and time. The Operator first restores a backup and then applies an operation log (oplog) - the changes that occurred to the operations up to the defined moment. To do so, the Operator saves oplog [to the cloud storage](backups-storage.md).

Starting from the Operator version 1.15.0, you can do a point-in-time recovery from both logical and physical backups. 

To start saving oplog, set the [backup.pitr.enabled](operator.md#backuppitrenabled)
key in the `deploy/cr.yaml` configuration file:

```yaml
backup:
  ...
  pitr:
    enabled: true
```

It is necessary to have at least one full backup to use point-in-time recovery.
By default Percona Backup for MongoDB will not upload operations logs if there
is no full backup.
The rule of having at least one full backup is true for new clusters and also
true for clusters which have been just recovered from backup.

!!! note

    There is also the 'backup.pitr.oplogSpanMin` option which sets the time
    period between the uploads of oplogs, with default value of 10 minutes.

Percona Backup for MongoDB uploads operations logs to the same bucket/container,
where the full backup is stored. This makes point-in-time recovery functionality
available only if there is a single bucket/container in [spec.backup.storages](operator.md#backupstoragesstorage-nametype). Otherwise point-in-time recovery will not be enabled and there will be an error
message in the operator logs.

If you add a new bucket or a container when point-in-time recovery is enabled, you will see a message about it in the Operator logs.

Starting with version 1.20.0, the Operator natively supports [multiple storages for backups](multi-storage.md) and saves oplog only to the main storage.


