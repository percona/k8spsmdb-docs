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

* [Restore from a full backup](#restore-from-a-full-backup) - restore from a backup snapshot without point-in-time
* [Point-in-time recovery](#restore-with-point-in-time-recovery) - restore to a specific time, a specific or  latest transaction or skip a specific transaction during a restore. This ability requires that you [configure storing oplog for point-in-time recovery](backups-pitr.md)

## Preconditions

1. When restoring to a new Kubernetes-based environment, make sure it has a Secrets object with the same user passwords as in the original cluster. 

2. To restore from a physical backup, set the corresponding encryption key of the target cluster. Find more details about encryption in [Data-at-rest encryption](encryption-setup.md). The name of the required Secrets object can be found out from the `spec.secrets` key in the `deploy/cr.yaml` (`my-cluster-name-secrets` by default). 

--8<-- "backups-restore.md:backup-prepare"

## Restore from a full backup

1. Set appropriate keys in the [deploy/backup/restore.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/backup/restore.yaml) file.

    * set `spec.clusterName` key to the name of the target cluster to restore the backup on,

    * set `spec.backupSource` subsection to point on the appropriate cloud storage. This `backupSource` subsection should contain the [backup type](backups.md#backup-types) (either `logical` or `physical`), and a `destination` key, followed by [necessary storage configuration keys](backups-storage.md), same as in the `deploy/cr.yaml` file:

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

        As you have noticed, `destination` value is composed of three parts in case of S3-compatible storage: the `s3://` prefix, the s3 bucket name, and the actual backup name, which you have already found out using the `kubectl get psmdb-backup` command). For Azure Blob storage, you don’t put the prefix, and use your container name as an equivalent of a bucket.

    * you can also use a `storageName` key to specify the exact name of the storage (the actual storage should be [already defined](backups-storage.md) in the `backup.storages` subsection of the `deploy/cr.yaml` file):

        ```yaml
        ...
        storageName: s3-us-west
        backupSource:
          destination: s3://S3-BUCKET-NAME/BACKUP-NAME
        ```

2. After that, the actual restoration process can be started as follows:

    ``` {.bash data-prompt="$" }
    $ kubectl apply -f deploy/backup/restore.yaml
    ```

## Point-in-time recovery

1. For point-in-time recovery to *the latest possible transaction*, update the metadata on the target cluster. This will also force PBM to recognize latest oplog chunks there. Connect to one of the database Pods (`my-cluster-name-rs0-2` for example) and run the following command:

    ```{.bash data-prompt="$"}
    $ kubectl exec -it my-cluster-name-rs0-2 -c backup-agent -- pbm config --force-resync
    ```

2. Set appropriate keys in the [deploy/backup/restore.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/backup/restore.yaml) file.

    * set `spec.clusterName` key to the name of the target cluster to restore the backup on
    * put additional restoration parameters to the `pitr` section:
    
        * `type` key can be equal to one of the following options
        
            * `date` - roll back to specific date
            * `latest` - recover to the latest possible transaction

        * `date` key is used with `type=date` option and contains value in datetime format

    * set `spec.backupSource` subsection to point on the appropriate cloud storage. For S3-compatible storage this`backupSource` subsection should contain a `destination` key equal to the s3 bucket with a special `s3://` prefix, followed by necessary S3 configuration keys, same as in `deploy/cr.yaml` file:

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

    * you can also use a `storageName` key to specify the exact name of the storage (the actual storage [should be already defined](backups-storage.md) in the `backup.storages` subsection of the `deploy/cr.yaml` file):

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

