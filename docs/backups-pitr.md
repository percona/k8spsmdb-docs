# Storing operations logs for point-in-time recovery

Point-in-time recovery enables you to roll back your cluster to a
specific date and time. Starting from the Operator version 1.15.0, you can do a point-in-time recovery from both logical and physical backups. 

During point-in-time recovery, the Operator first restores a backup and then applies an operations log (oplog) on top of it. The oplog is the changes that occurred to the operations up to the defined moment.

## Preconditions for point-in-time recovery

1. To make a point-in-time recovery, the Operator must start saving oplog events. Set the [backup.pitr.enabled](operator.md#backuppitrenabled)
key in the `deploy/cr.yaml` configuration file to enable saving oplog:

    ```yaml
    backup:
      ...
      pitr:
        enabled: true
    ```

2. You must have a full backup to use point-in-time recovery. Without a full backup, Percona Backup for MongoDB will not upload operations logs. You must have a full backup for a new cluster and for a cluster that you restored from a backup.

After you enabled point-in-time recovery, it takes 10 minutes for a first oplog chunk to be uploaded. The default time period between uploads is 10 minutes. You can adjust this time by setting the new duration for the `backup.pitr.oplogSpanMin` option.  

PBM saves the oplog [to the cloud storage](backups-storage.md).

## Point-in-time recovery with multiple storages

=== "Version 1.20.0 and above"

    The Operator natively supports [multiple storages for backups](multi-storage.md) inheriting this functionality from Percona Backup for MongoDB. This allows you to enable point-in-time recovery and make backups on a storage of your choice. PBM saves oplog only to the main storage to ensure data consistency for all backups on all storages. As a result, you can [make a point-in-time restore](backups-restore.md#with-point-in-time-recovery) from any backup on any storage.  

=== "Version 1.19.1 and earlier"

    You must have a single storage defined in the [spec.backup.storages](operator.md#backupstoragesstorage-nametype) option to enable point-in-time recovery. This is because PBM writes oplog to the same bucket where the backup snapshot is saved. 

    If you defined several storages and try to enable point-in-time recovery, PBM won't know where to save oplog and can't therefore guarantee data consistency for the restore. Therefore, point-in-time recovery is not allowed for multiple storages. You will see the error message in the Operator logs. 



