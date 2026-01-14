# Restore from a backup to a new Kubernetes-based environment

You can restore from a backup as follows:

* [On the same cluster where you made a backup](backups-restore.md)
* On a new cluster deployed in a different Kubernetes-based environment.

This document focuses on the restore on a new cluster deployed in a different Kubernetes environment.

To restore from a backup, you create a Restore object using a special restore configuration file. The
example of such file is [deploy/backup/restore.yaml :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/v{{ release }}/deploy/backup/restore.yaml).

You can check available options in the [restore options reference](restore-options.md).

## Restore scenarios

This document covers the following restore scenarios:

* [Restore from a backup](#restore-from-a-backup) - restore from a full backup  without point-in-time
* [Point-in-time recovery](#point-in-time-recovery) - restore to a specific time, a specific or a latest transaction or skip a specific transaction during a restore. This ability requires that you [configure storing oplog for point-in-time recovery](backups-pitr.md)

## Preconditions

1. When restoring to a new Kubernetes-based environment, make sure it has a Secrets object with the same user passwords as in the original cluster. 

2. To restore from a physical backup, set the corresponding encryption key of the target cluster. Find more details about encryption in [Data-at-rest encryption](encryption.md). The name of the required Secrets object can be found out from the `spec.secrets` key in the `deploy/cr.yaml` (`my-cluster-name-secrets` by default). 

--8<-- "backups-restore.md:backup-prepare"

## Restore from a backup

To make a restore, PBM must know where to take the backup from and have access to that storage.

You can define the backup storage in two ways: within the restore object configuration or pre-configure it on the target cluster's `cr.yaml` file.

### Approach 1: Define storage configuration in the restore object

If you haven't defined storage in the target cluster's `cr.yaml` file, you can configure it directly in the restore object:

1. Set appropriate keys in the [deploy/backup/restore.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/backup/restore.yaml) file:

    * set `spec.clusterName` key to the name of the target cluster to restore the backup on
    * configure the `spec.backupSource` subsection to point to the cloud storage where the backup is stored. This subsection should include:

        * the [backup type](backups.md#backup-types) - either `logical` or `physical`
        * a `destination` key. Take it from the output of the `kubectl get psmdb-backup` command.
        * the [necessary storage configuration keys](backups-storage.md), just like in the `deploy/cr.yaml` file of the source cluster.

        ```yaml
        ...
        backupSource:
          type: logical
          destination: s3://S3-BUCKET-NAME/BACKUP-NAME
          s3:
            credentialsSecret: my-cluster-name-backup-s3
            region: us-west-2
            endpointUrl: https://URL-OF-THE-S3-COMPATIBLE-STORAGE
        ```

        The `destination` key is composed of three parts in case of S3-compatible storage: the `s3://` prefix, the s3 bucket name, and the actual backup name. For Azure Blob storage, you don't put the prefix, and use your container name as an equivalent of a bucket.

2. Apply the configuration to start the restore:

    ```bash
    kubectl exec -it my-cluster-name-rs0-2 -c backup-agent -- pbm config --force-resync
    ```

    During the restore process, the Operator:

    1. Takes the storage configuration from the Restore object
    2. Configures PBM using this configuration
    3. Resyncs metadata to update it on the target cluster
    4. Performs the restore operation
    5. Reverts the PBM configuration back to the one defined in the `cr.yaml` file (if any)

3. As the post-restore step, configure the [main storage](multi-storage.md#define-the-main-storage) within the target cluster's `cr.yaml` to be able to make subsequent backups. 
        
### Approach 2: The storage is defined on target

You can [already define](backups-storage.md) the storage where the backup is stored in the `backup.storages` subsection of your target cluster's `deploy/cr.yaml` file. In this case, reference it by name within the restore configuration.

1. Set appropriate keys in the [deploy/backup/restore.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/backup/restore.yaml) file:

    * set `spec.clusterName` key to the name of the target cluster to restore the backup on
    * specify the storage name in the `storageName` key. The name must match the name in the `backup.storages` subsection of the `deploy/cr.yaml` file.
    * configure the `spec.backupSource` subsection with the backup destination

        ```yaml
        ...
        storageName: s3-us-west
        backupSource:
          destination: s3://S3-BUCKET-NAME/BACKUP-NAME
        ```

2. After configuring the restore object, start the restoration process:

    ```bash
    kubectl apply -f deploy/backup/restore.yaml
    ```

## Point-in-time recovery

As with the restore from a backup, PBM must know where to take the backup from and have access to the storage. You can define the backup storage in two ways: within the restore object configuration or pre-configure it on the target cluster's `cr.yaml` file.

### Approach 1: Define storage configuration in the restore object

You can configure the storage within the restore object configuration:

1. Set appropriate keys in the [deploy/backup/restore.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/backup/restore.yaml) file.

    * set `spec.clusterName` key to the name of the target cluster to restore the backup on
    * put additional restoration parameters to the `pitr` section:
    
        * `type` key can be equal to one of the following options
        
            * `date` - roll back to specific date
            * `latest` - recover to the latest possible transaction

        * `date` key is used with `type=date` option and contains value in datetime format

    * configure the `spec.backupSource` subsection to point to the cloud storage where the backup is stored. This subsection should include:

        * the [backup type](backups.md#backup-types) - either `logical` or `physical`
        * a `destination` key. Take it from the output of the `kubectl get psmdb-backup` command.
        * the [necessary storage configuration keys](backups-storage.md), just like in the `deploy/cr.yaml` file of the source cluster.

        ```yaml
        apiVersion: psmdb.percona.com/v1
        kind: PerconaServerMongoDBRestore
        metadata:
          name: restore1
        spec:
          clusterName: my-cluster-name
          pitr:
            type: date
            date: YYYY-MM-DD hh:mm:ss
          backupSource:
            destination: s3://S3-BUCKET-NAME/BACKUP-NAME
            s3:
              credentialsSecret: my-cluster-name-backup-s3
              region: us-west-2
              endpointUrl: https://URL-OF-THE-S3-COMPATIBLE-STORAGE
        ```


2. Run the actual restoration process:

    ```bash
    kubectl apply -f deploy/backup/restore.yaml
    ```
    
    During the restore process, the Operator:

    1. Takes the storage configuration from the Restore object
    2. Configures PBM using this configuration
    3. Resyncs metadata to update it on the target cluster
    4. Performs the restore operation
    5. Reverts the PBM configuration back to the one defined in the `cr.yaml` file (if any)

3. As the post-restore step, configure the [main storage](multi-storage.md#define-the-main-storage) within the target cluster's `cr.yaml` to be able to make subsequent backups.

### Approach 2: The storage is defined on target

You can [define the storage](backups-storage.md) where the backup is stored in the `backup.storages` subsection of your target cluster's `deploy/cr.yaml` file. In this case, reference it by name within the restore configuration.

1. Set appropriate keys in the [deploy/backup/restore.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/backup/restore.yaml) file.

    * set `spec.clusterName` key to the name of the target cluster to restore the backup on
    * put additional restoration parameters to the `pitr` section:

        * `type` key can be equal to one of the following options

            * `date` - roll back to specific date
            * `latest` - recover to the latest possible transaction

        * `date` key is used with `type=date` option and contains value in datetime format

    * specify the storage name for the `storageName` key. The name must match the name the `backup.storages` subsection of the `deploy/cr.yaml` file.
    * configure the `spec.backupSource` subsection with the backup destination

        ```yaml
        ...
        storageName: s3-us-west
        backupSource:
          destination: s3://S3-BUCKET-NAME/BACKUP-NAME
        ```

2. Though PBM resyncs metadata on the target cluster when you start the restore process, for point-in-time recovery to *the latest possible transaction*, we recommend to run a manual resync before the restore. This ensures PBM has the latest oplog chunks on the target cluster. Connect to one of the database Pods (`my-cluster-name-rs0-2` for example) and run the following command:

    ```bash
    kubectl exec -it my-cluster-name-rs0-2 -c backup-agent -- pbm config --force-resync
    ```
  
3. Start the restore process:

    ``` bash
    kubectl apply -f deploy/backup/restore.yaml
    ```

## Restore from a backup with a prefix in a bucket path

If you defined a prefix (a folder) in a bucket where you store backups, you must specify this prefix in the `spec.backupSource` subsection of the restore configuration.

To illustrate, let's say you defined a prefix `my-prefix` for your AWS s3 bucket `my-example-bucket`. You wish to restore a logical backup `2025-05-19T07:23:46Z`. The pull path to this backup is `"s3://my-example-bucket/my-prefix/2025-05-19T07:23:46Z"`. In this case, your restore configuration looks like this:

=== "Storage defined in a Restore object" 

    ```yaml
    apiVersion: psmdb.percona.com/v1
    kind: PerconaServerMongoDBRestore
    metadata:
      name: restore-prefix
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

=== "Storage defined on target"

    Make sure the Custom Resource of the target cluster includes the storage configuration and the defined prefix. Then you reference this storage by name in the restore configuration.

    ```yaml
    apiVersion: psmdb.percona.com/v1
    kind: PerconaServerMongoDBRestore
    metadata:
      name: restore-prefix
    spec:
      clusterName: my-cluster-name
      storageName: us-east-1
      backupSource:
        type: logical
        destination: "s3://my-example-bucket/my-prefix/2025-05-19T07:23:46Z"
    ```

Apply the configuration to start a restore:

```bash
kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
```
