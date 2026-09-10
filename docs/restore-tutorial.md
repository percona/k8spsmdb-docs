# 5. Restore sample data

Now that you have a backup, verify you can actually restore from it — this is worth
confirming before you need it for real. In this tutorial you deliberately remove the sample
data you inserted earlier, then use the restore to bring it back onto the same cluster —
the same thing you'd do to recover from real data loss.

## Considerations and prerequisites

* The backup you restore from (`backup1`) must be in the `ready` state.
* Restoring causes downtime. This tutorial uses a logical restore on the default
  sharded cluster. The database stays unavailable while data is restored and while
  sharding metadata is refreshed on `mongos`. For that refresh, the Operator deletes
  and recreates the `mongos` Pods. The `rs0` and config server Pods stay running.
  See [Downtime to expect](backups-restore.md#downtime-to-expect) for other restore
  types, including an unsharded cluster.
* This tutorial restores onto the same cluster that made the backup. For restoring into a
  different cluster, restoring to a point in time, or other scenarios, see
  [Restore from a backup](backups-restore.md) and the [Restore Resource
  options](restore-options.md) reference.

## Delete the test data

To confirm the restore actually recovers your data rather than just running the mechanics,
remove the `test` collection you created in [Insert data](data-insert.md):

``` {.javascript data-prompt="admin>"}
admin> db.test.drop()
```

??? example "Output"

    ```{.text .no-copy}
    true
    ```

Confirm the collection is gone:

``` {.javascript data-prompt="admin>"}
admin> db.test.countDocuments()
```

??? example "Output"

    ```{.text .no-copy}
    0
    ```

## Restore from the backup {.power-number}

1. Verify the backup is ready:

    ```bash
    kubectl get psmdb-backup -n <namespace>
    ```

    ??? example "Sample output"

        ``` {.text .no-copy}
        NAME      CLUSTER           STORAGE      DESTINATION                           TYPE      SIZE       STATUS   COMPLETED   AGE
        backup1   my-cluster-name   s3-us-west   s3://my-bucket/2025-09-23T10:34:59Z   logical   105.44MB   ready    5m          5m
        ```

2. Edit the [`deploy/backup/restore.yaml` :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/v{{ release }}/deploy/backup/restore.yaml) file and specify the following keys:

    ```yaml title="deploy/backup/restore.yaml"
    apiVersion: psmdb.percona.com/v1
    kind: PerconaServerMongoDBRestore
    metadata:
      name: restore1
    spec:
      clusterName: my-cluster-name
      backupName: backup1
    ```

3. Apply the configuration. This instructs the Operator to start the restore. Specify your namespace instead of the `<namespace>` placeholder:

    ```bash
    kubectl apply -f deploy/backup/restore.yaml -n <namespace>
    ```

4. Track the restore progress:

    ```bash
    kubectl get psmdb-restore -n <namespace>
    ```

    ??? example "Sample output"

        ``` {.text .no-copy}
        NAME       CLUSTER           STATUS   AGE
        restore1   my-cluster-name   ready    47s
        ```

    When the status changes to `ready`, the restore is complete.

## Verify the data

Connect to the database the same way you did in [Connect to Percona Server for
MongoDB](connect.md), and confirm the sample data from [Insert data](data-insert.md) is back:

``` {.javascript data-prompt="admin>"}
admin> db.test.countDocuments()
```

??? example "Output"

    ```{.text .no-copy}
    50
    ```

## Troubleshooting

If you face issues with the restore, see [Troubleshoot backups and restores](debug-backup-restore.md).

Congratulations! You have restored your first backup. Continue with [Restore from a
backup](backups-restore.md) to learn about restoring to a new cluster, restoring to a point
in time, and other restore scenarios. For all configuration options, see [Restore Resource
options](restore-options.md).

## Next steps

[Monitor the database :material-arrow-right:](monitoring-tutorial.md){.md-button}
