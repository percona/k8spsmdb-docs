# Restore the cluster from a previously saved backup

The backup is normally restored on the Kubernetes cluster where it was made, but [restoring it on a different Kubernetes-based environment with the installed Operator is also possible](backups-restore-to-new-cluster.md).

Following things are needed to restore a previously saved backup:

* Make sure that the cluster is running.
* Find out correct names for the **backup** and the **cluster**. Available backups can be listed with the following command:

    ``` {.bash data-prompt="$" }
    $ kubectl get psmdb-backup
    ```

    And the following command will list available clusters:

    ``` {.bash data-prompt="$" }
    $ kubectl get psmdb
    ```

!!! note

     If you have [configured storing operations logs for point-in-time recovery](backups-pitr.md), you will have possibility to roll back the cluster to a specific date and time. Otherwise, restoring backups without point-in-time recovery is the only option.

When the correct names for the backup and the cluster are known, backup restoration can be done in the following way.

## Without point-in-time recovery

1. Set appropriate keys in the [deploy/backup/restore.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/backup/restore.yaml) file.

    * set `spec.clusterName` key to the name of the target cluster to restore the backup on,
    * set `spec.backupName` key to the name of your backup,

        ```yaml
        apiVersion: psmdb.percona.com/v1
        kind: PerconaServerMongoDBRestore
        metadata:
          name: restore1
        spec:
          clusterName: my-cluster-name
          backupName: backup1
        ```

2. After that, the actual restoration process can be started as follows:

    ``` {.bash data-prompt="$" }
    $ kubectl apply -f deploy/backup/restore.yaml
    ```

    !!! note

        Storing backup settings in a separate file can be replaced by passing its content to the `kubectl apply` command as follows:

        ```bash
        $ cat <<EOF | kubectl apply -f-
        apiVersion: psmdb.percona.com/v1
        kind: PerconaServerMongoDBRestore
        metadata:
          name: restore1
        spec:
          clusterName: my-cluster-name
          backupName: backup1
        EOF
        ```

## With point-in-time recovery

1. Set appropriate keys in the [deploy/backup/restore.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/backup/restore.yaml) file.

    * set `spec.clusterName` key to the name of the target cluster to restore the backup on
    * set `spec.backupName` key to the name of your backup
    * put additional restoration parameters to the `pitr` section:
        * `type` key can be equal to one of the following options
            * `date` - roll back to specific date
            * `latest` - recover to the latest possible transaction
        * `date` key is used with `type=date` option and contains value in datetime format
    The resulting `restore.yaml` file may look as follows:

    ```yaml
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
    ```

    !!! note

        <a name="backups-latest-restorable-time"></a> Full backup objects available with the `kubectl get psmdb-backup` command have a "Latest restorable time" information field handy when selecting a backup to restore. You can easily query the backup for this information as follows:
   
        ``` {.bash data-prompt="$" }
        $ kubectl get psmdb-backup <backup_name> -o jsonpath='{.status.latestRestorableTime}'
        ```

2. Run the actual restoration process:

    ``` {.bash data-prompt="$" }
    $ kubectl apply -f deploy/backup/restore.yaml
    ```

    !!! note

        Storing backup settings in a separate file can be replaced by passing its content to the `kubectl apply` command as follows:

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

## Selective restore

Starting with the version 1.18.0, the Operator allows doing partial restores, which means to do a selective restore only with the desired subset of data. This feature allows you to restore a specific database or a collection from a backup.

Selective restores are controlled by the additional `selective` section in the `PerconaServerMongoDBRestore` Custom Resource:

```yaml
spec:
  selective:
    withUsersAndRoles: true
    namespaces:
    - "db1.collection1"
    - "db2.collection2"
```

The `selective.namespaces` field allows you to specify several "namespaces" (subsets of data) as a list. Each "namespace" is represented as a pair of database and collection names, or just `database_name.*` to get everything from the specific database. Specifying "*" as an item in the `namespaces` means restoring all databases and collections.

Also, you can use `selective.withUsersAndRoles` set to `true` to restore a custom database with users and roles from a full backup.

Selective restores support only logical backups and have a number of other limitations. See the full list of [current selective restore limitations :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/features/selective-backup.html) in Percona Backup for MongoDB documentation.
