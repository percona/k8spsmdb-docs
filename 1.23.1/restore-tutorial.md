> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# 4. Restore sample data

Now that you have a backup, verify you can actually restore from it — this is worth confirming before you need it for real. In this tutorial you deliberately remove the sample data you inserted earlier, then use the restore to bring it back onto the same cluster — the same thing you’d do to recover from real data loss.

## Considerations and prerequisites

- The backup you restore from (`backup1`) must be in the `ready` state.
- Restoring causes downtime. This tutorial uses a logical restore on the default sharded cluster. The database stays unavailable while data is restored and while sharding metadata is refreshed on `mongos`. For that refresh, the Operator deletes and recreates the `mongos` Pods. The `rs0` and config server Pods stay running. See [Downtime to expect](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore.html#downtime-to-expect) for other restore types, including an unsharded cluster.
- This tutorial restores onto the same cluster that made the backup. For restoring into a different cluster, restoring to a point in time, or other scenarios, see [Restore from a backup](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore.html) and the [Restore Resource options](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/restore-options.html) reference.

## Delete the test data

To confirm the restore actually recovers your data rather than just running the mechanics, remove the `test` collection you created in [Insert sample data](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/connect.html#insert-sample-data):

```
admin> db.test.drop()
```

Output

```
true
```

Confirm the collection is gone:

```
admin> db.test.countDocuments()
```

Output

```
0
```

## Restore from the backup

1. Verify the backup is ready:

   ```
   kubectl get psmdb-backup -n <namespace>
   ```

   Sample output

   ```
   NAME      CLUSTER           STORAGE      DESTINATION                           TYPE      SIZE       STATUS   COMPLETED   AGE
   backup1   my-cluster-name   s3-us-west   s3://my-bucket/2025-09-23T10:34:59Z   logical   105.44MB   ready    5m          5m
   ```

1. Edit the [`deploy/backup/restore.yaml`](https://github.com/percona/percona-server-mongodb-operator/blob/v1.23.1/deploy/backup/restore.yaml) file and specify the following keys:

   deploy/backup/restore.yaml

   ```
   apiVersion: psmdb.percona.com/v1
   kind: PerconaServerMongoDBRestore
   metadata:
     name: restore1
   spec:
     clusterName: my-cluster-name
     backupName: backup1
   ```

1. Apply the configuration. This instructs the Operator to start the restore. Specify your namespace instead of the `<namespace>` placeholder:

   ```
   kubectl apply -f deploy/backup/restore.yaml -n <namespace>
   ```

1. Track the restore progress:

   ```
   kubectl get psmdb-restore -n <namespace>
   ```

   Sample output

   ```
   NAME       CLUSTER           STATUS   AGE
   restore1   my-cluster-name   ready    47s
   ```

   When the status changes to `ready`, the restore is complete.

## Verify the data

Connect to the database the same way you did in [Connect and insert sample data](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/connect.html), and confirm the sample data from [Insert sample data](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/connect.html#insert-sample-data) is back:

```
admin> db.test.countDocuments()
```

Output

```
50
```

## Troubleshooting

If you face issues with the restore, see [Troubleshoot backups and restores](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug-backup-restore.html).

Congratulations! You have restored your first backup. Continue with [Restore from a backup](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore.html) to learn about restoring to a new cluster, restoring to a point in time, and other restore scenarios. For all configuration options, see [Restore Resource options](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/restore-options.html).

## Next steps

[Delete the Operator and database](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/delete.html)

## See also

[What’s next for the operator](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/what-next-operations.html)
