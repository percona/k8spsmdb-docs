# Restore the cluster from a previously saved backup

You can restore from a backup as follows:

* On the same cluster where you made a backup
* On [a new cluster deployed in a different Kubernetes-based environment](backups-restore-to-new-cluster.md).

This document focuses on the restore to the same cluster.

## Restore scenarios

You can make the following restores:

* [Restore to a specific point in time](#make-a-point-in-time-recovery). A precondition for this restore is to [enable saving oplog operations](backups-pitr.md)
* [Restore from a full backup](#restore-from-a-full-backup)
* [Selective restore from a full logical backup](#selective-restore)

For either type of a restore you need to create a Restore object using the [`deploy/backup/restore.yaml`  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/backup/restore.yaml) manifest.

## Considerations

1. Check PBM's [considerations :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/usage/restore.html#considerations) **to prevent MongoDB clients from accessing the database when the restore is in progress**.
2. During the restore, the Operator may delete and recreate Pods. This may cause downtime. The downtime duration depends on the restore type and the database deployment:

    * Logical restore in an unsharded cluster results causes downtime for the duration of the data restore. No Pods are deleted or recreated
    * Logical restore in a sharded cluster causes downtime for the duration of the data restore and the time needed to refresh sharding metadata on `mongos`. This results in deleting and recreating only `mongos` Pods.
    * Physical restore causes downtime for the entire period required to restore the data and refresh the sharding metadata on `mongos`. The Operator deletes and recreates all Pods - replica set, config server replica set (if present) and mongos Pods. 

--8<-- [start:backup-prepare]

## Before you begin

1. Make sure that the cluster is running.
2. Export your namespace as an environment variable. Replace the `<namespace>` placeholder with your value:

   ``` {.bash data-prompt="$" }
   $ export NAMESPACE = <namespace>
   ```

3. Get the backup information. List the backups using this command: 

    ``` {.bash data-prompt="$" }
    $ kubectl get psmdb-backup -n $NAMESPACE
    ```

4. Get cluster information. List available clusters using this command:

    ``` {.bash data-prompt="$" }
    $ kubectl get psmdb -n $NAMESPACE
    ```

--8<-- [end:backup-prepare]

## Restore from a full backup

To restore your Percona Server for MongoDB cluster from a backup, define a `PerconaServerMongoDBRestore` custom resource. Set the following keys:

* set `spec.clusterName` key to the name of the target cluster to restore the backup on,
* set `spec.backupName` key to the name of your backup. This is the value from the output of the `kubectl get psmdb-backup` command.


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
        $ kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
        ```

=== "via the command line"

    Instead of storing restore settings in a separate file, you can pass them directly to the `kubectl apply` command as follows:

    ```{.bash data-prompt="$"}
    $ cat <<EOF | kubectl apply -n $NAMESPACE -f-
    apiVersion: psmdb.percona.com/v1
    kind: PerconaServerMongoDBRestore
    metadata:
      name: restore1
    spec:
      clusterName: my-cluster-name
      backupName: backup1
    EOF -n $NAMESPACE
    ```


## Make a point-in-time recovery

1. Check a time to restore for a backup. Use the command below to find the latest restorable timestamp:
    
    ``` {.bash data-prompt="$" }
    $ kubectl get psmdb-backup <backup_name> -n $NAMESPACE -o jsonpath='{.status.latestRestorableTime}'
    ```
    
2. Modify the [deploy/backup/restore.yaml :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/backup/restore.yaml) manifest and specify the following configuration:

    * set the `spec.clusterName` key to the name of your cluster. When restoring to the same cluster where the backup was created, the cluster name will be identical in both the Backup and Restore objects.
    * set the `spec.backupName` key to the name of your backup
    * configure point-in-time recovery settings in the `pitr` section:
    
        * `type` - specify one of the following options
        
            * `date` - roll back to a specific date
            * `latest` - recover to the latest possible transaction
           
        * `date` - specify the target datetime in the format `YYYY-MM-DD HH:MM:SS` when `type` is set to `date`

    Here is the example configuration of the `restore.yaml` file:

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
            $ kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
            ```

    === "via the command line"

        You can skip editing the YAML file and pass its contents to the Operator via the command line. For example:

        ```{.bash data-prompt="$" }
        $ cat <<EOF | kubectl apply -n $NAMESPACE -f-
        apiVersion: psmdb.percona.com/v1
        kind: PerconaServerMongoDBRestore
        metadata:
          name: restore1
        spec:
          clusterName: my-cluster-name
          backupName: backup1
        EOF 
        ```

## Selective restore

Starting with the version 1.18.0, you can restore a desired subset of data from a full logical backup. Selective logical backups are not yet supported.

Selective restores have a number of limitations. Learn more about the [current selective restore limitations :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/features/known-limitations.html#selective-backups-and-restores) in Percona Backup for MongoDB documentation.

Selective restores are controlled by the additional `selective` section in the `PerconaServerMongoDBRestore` Custom Resource. There you can specify a specific database or a collection that you wish to restore:

```yaml
spec:
  selective:
    withUsersAndRoles: true
    namespaces:
    - "db1.collection1"
    - "db2.collection2"
```

You can specify several "namespaces" (subsets of data) as a list for the `selective.namespaces` field. You can specify a namespace as follows:

* as a pair of database and collection names to restore just this database and collection. The format is `db1.collection1`
* as a database name with a wildcard to restore everything from the specific database. The format is `database_name.*`
* as a single star "*" to restore all databases and collections

Also, you can use `selective.withUsersAndRoles` set to `true` to restore a custom database with users and roles from a full backup. Read more about this functionality in [PBM documentation :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/usage/restore-selective.html#restore-with-users-and-roles).

## Restore from a backup with a prefix in a bucket path

If you defined a prefix (a folder) in a bucket where you store backups, you must specify this prefix in the `spec.backupSource` subsection of the restore configuration. 

To illustrate, let's say you defined a prefix `my-prefix` for your AWS s3 bucket `my-example-bucket`. You wish to restore a backup`2025-05-19T07:23:46Z`. The pull path to this backup is `"s3://my-example-bucket/my-prefix/2025-05-19T07:23:46Z"`. In this case, your restore configuration looks like this:

```yaml
apiVersion: psmdb.percona.com/v1
kind: PerconaServerMongoDBRestore
metadata:
  name: restore1
spec:
  clusterName: my-cluster-name
  backupSource:
    type: logical
    destination: "s3://my-example-bucket/my-prefix/2025-05-19T07:23:46Z"
    s3:
      credentialsSecret: my-cluster-name-backup-s3
      region: us-east-1
      bucket: backup-testing
      prefix: my-prefix
```

Apply the configuration to start a restore:

``` {.bash data-prompt="$" }
$ kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
```
