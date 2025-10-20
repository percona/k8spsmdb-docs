# Restore the cluster from a previously saved backup

You can restore from a backup as follows:

* On the same cluster where you made a backup
* On [a new cluster deployed in a different Kubernetes-based environment](backups-restore-to-new-cluster.md).

This document focuses on the restore to the same cluster.

To restore from a backup, you create a Restore object using a special restore configuration file. The
example of such file is [deploy/backup/restore.yaml :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/v{{ release }}/deploy/backup/restore.yaml).

You can check available options in the [restore options reference](restore-options.md).

## Restore scenarios

This document covers the following restore scenarios:

* [Restore from a full backup](#restore-from-a-full-backup) - restore from a backup snapshot without point-in-time
* [Point-in-time recovery](#restore-with-point-in-time-recovery) - restore to a specific time, a specific or latest transaction or skip a specific transaction during a restore. This ability requires that you [configure storing oplog for point-in-time recovery](backups-pitr.md)
* [Selective restore from a full logical backup](#selective-restore)

--8<-- [start:backup-prepare]

## Before you start

1. Make sure that the cluster is running.
2. List the cluster to find the correct cluster name. Replace the `<namespace>` with your value:

    ``` {.bash data-prompt="$" }
    $ kubectl get psmdb -n <namespace>
    ```

3. List backups to retrieve the desired backup name. Replace the `<namespace>` with your value:

    ``` {.bash data-prompt="$" }
    $ kubectl get psmdb-backup -n <namespace>
    ```

--8<-- [end:backup-prepare]

## Restore from a full backup

To restore your Percona XtraDB cluster from a backup, define a `PerconaServerMongoDBRestore` custom resource. Set the following keys:

* set `spec.clusterName` key to the name of the target cluster to restore the backup on,
* set `spec.backupName` key to the name of your backup

Pass this configuration to the Operator:

=== "via the YAML manifest"

    1. Edit the [deploy/backup/restore.yaml :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/v{{ release }}/deploy/backup/restore.yaml) file and specify the following keys:

        ```yaml
        apiVersion: psmdb.percona.com/v1
        kind: PerconaServerMongoDBRestore
        metadata:
          name: restore1
        spec:
          clusterName: my-cluster-name
          backupName: backup1
        ```

    2. Start the restore with this command:

        ``` {.bash data-prompt="$" }
        $ kubectl apply -f deploy/backup/restore.yaml
        ```

=== "via the command line"

    You can skip creating a separate file by passing YAML content directly:

    ```{.bash data-prompt="$"}
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

## Restore with point-in-time recovery

1. Check a time to restore for a backup. Use the command below to find the latest restorable timestamp:
    
    ``` {.bash data-prompt="$" }
    $ kubectl get psmdb-backup <backup_name> -o jsonpath='{.status.latestRestorableTime}'
    ```
    

2. Set the following keys for the `PerconaServerMongoDBRestore` custom resource:

    * set `spec.clusterName` key to the name of the target cluster to restore the backup on
    * set `spec.backupName` key to the name of your backup
    * put additional restoration parameters to the `pitr` section:
        * `type` key can be equal to one of the following options
            * `date` - roll back to specific date
            * `latest` - recover to the latest possible transaction
        * `date` key is used with `type=date` option and contains value in datetime format

3. Pass this configuration to the Operator.

    === "via the YAML manifest"
    
        1. Edit the [deploy/backup/restore.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/v{{release}}/deploy/backup/restore.yaml) file. 

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

        2. Start the restore with this command:

            ``` {.bash data-prompt="$" }
            $ kubectl apply -f deploy/backup/restore.yaml
            ```

    === "via the command line"

        You can skip editing the YAML file and pass its contents to the Operator via the command line. For example:

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

Starting with the version 1.18.0, you can restore a desired subset of data from a full logical backup. Selective logical backups are not yet supported.

Selective restores are controlled by the additional `selective` section in the `PerconaServerMongoDBRestore` Custom Resource. There you can specify a specific database or a collection that you wish to restore:

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

Selective restores support only logical backups and have a number of other limitations. See the full list of [current selective restore limitations :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/features/known-limitations.html#selective-backups-and-restores) in Percona Backup for MongoDB documentation.

