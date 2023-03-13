# Restore the cluster from a previously saved backup

The backup is normally restored on the Kubernetes cluster where it was made,
but [restoring it on a different Kubernetes-based environment with the installed Operator is also possible](backups-restore-to-new-cluster.md).

Following things are needed to restore a previously saved backup:

* Make sure that the cluster is running.
* Find out correct names for the **backup** and the **cluster**. Available
    backups can be listed with the following command:

    ``` {.bash data-prompt="$" }
    $ kubectl get psmdb-backup
    ```

    And the following command will list available clusters:

    ``` {.bash data-prompt="$" }
    $ kubectl get psmdb
    ```

!!! note

     If you have [configured storing operations logs for point-in-time recovery](backups-pitr.md),
     you will have possibility to roll back the cluster to a specific date and time. Otherwise,
     restoring backups without point-in-time recovery is the only option.

When the correct names for the backup and the cluster are known, backup
restoration can be done in the following way.

=== "Without point-in-time recovery"

    1. Set appropriate keys in the [deploy/backup/restore.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/backup/restore.yaml) file.

        * set `spec.clusterName` key to the name of the target cluster to restore
            the backup on,

        * set `spec.backupName` key to the name of your backup,

        * you can also use a `storageName` key to specify the exact name of the
            storage (the actual storage should be already defined in the
            `backup.storages` subsection of the `deploy/cr.yaml` file):

            ```yaml
            apiVersion: psmdb.percona.com/v1
            kind: PerconaServerMongoDBRestore
            metadata:
              name: restore1
            spec:
              clusterName: my-cluster-name
              backupName: backup1
              storageName: s3-us-west
            ```

    2. After that, the actual restoration process can be started as follows:

        ``` {.bash data-prompt="$" }
        $ kubectl apply -f deploy/backup/restore.yaml
        ```

        !!! note

            Storing backup settings in a separate file can be replaced by
            passing its content to the `kubectl apply` command as follows:

            ```bash
            $ cat <<EOF | kubectl apply -f-
            apiVersion: psmdb.percona.com/v1
            kind: PerconaServerMongoDBRestore
            metadata:
              name: restore1
            spec:
              clusterName: my-cluster-name
              backupName: backup1
              storageName: s3-us-west
            EOF
            ```

=== "With point-in-time recovery"

    1. Set appropriate keys in the [deploy/backup/restore.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/backup/restore.yaml) file.

        * set `spec.clusterName` key to the name of the target cluster to restore
            the backup on,

        * put additional restoration parameters to the `pitr` section:

            ```yaml
            ...
            spec:
              clusterName: my-cluster-name
              pitr:
                type: date
                date: YYYY-MM-DD hh:mm:ss
            ```

        * set `spec.backupName` key to the name of your backup,

        * you can also use a `storageName` key to specify the exact name of the
            storage (the actual storage should be already defined in the
            `backup.storages` subsection of the `deploy/cr.yaml` file):

            ```yaml
            ...
            storageName: s3-us-west
            backupSource:
              destination: s3://S3-BUCKET-NAME/BACKUP-NAME
            ```

    2. Run the actual restoration process:

        ``` {.bash data-prompt="$" }
        $ kubectl apply -f deploy/backup/restore.yaml
        ```

        !!! note

            Storing backup settings in a separate file can be replaced by
            passing its content to the `kubectl apply` command as follows:

            ``` {.bash data-prompt="$" }
            $ cat <<EOF | kubectl apply -f-
            apiVersion: psmdb.percona.com/v1
            kind: PerconaServerMongoDBRestore
            metadata:
              name: restore1
            spec:
              clusterName: my-cluster-name
              backupName: backup1
              pitr:
                type: date
                date: YYYY-MM-DD hh:mm:ss
            EOF
            ```
