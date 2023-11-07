# How to restore backup to a new Kubernetes-based environment

The Operator allows restoring a backup not only on the Kubernetes cluster where
it was made, but also on any Kubernetes-based environment with the installed
Operator.

When restoring to a new Kubernetes-based environment, make sure it has a Secrets
object with the same user passwords as in the original cluster. More details
about secrets can be found in [System Users](users.md#users-system-users).
The name of the required Secrets object can be found out from the `spec.secrets`
key in the `deploy/cr.yaml` (`my-cluster-name-secrets` by default).

You will need correct names for the **backup** and the **cluster**. If you have
access to the original cluster, available backups can be listed with the
following command:

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

        * set `spec.backupSource` subsection to point on the appropriate
            cloud storage. This `backupSource` subsection should contain the
            [backup type](backups.md#physical) (either `logical` or `physical`),
            and a `destination` key, followed by
            [necessary storage configuration keys](backups-storage.md),
            same as in the `deploy/cr.yaml` file:

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

           As you have noticed, `destination` value is composed of three parts
           in case of S3-compatible storage:
           the `s3://` prefix, the s3 bucket name, and the actual backup name,
           which you have already found out using the `kubectl get psmdb-backup`
           command). For Azure Blob storage, you don’t put the prefix, and use
           your container name as an equivalent of a bucket.

        * you can also use a `storageName` key to specify the exact name of the
           storage (the actual storage should be [already defined](backups-storage.md)
           in the `backup.storages` subsection of the `deploy/cr.yaml` file):

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

=== "With point-in-time recovery"

    1. Set appropriate keys in the [deploy/backup/restore.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/backup/restore.yaml) file.

        * set `spec.clusterName` key to the name of the target cluster to restore
            the backup on

        * put additional restoration parameters to the `pitr` section:

            * `type` key can be equal to one of the following options

                * `date` - roll back to specific date
                * `latest` - recover to the latest possible transaction

            * `date` key is used with `type=date` option and contains value in
                datetime format

        * set `spec.backupSource` subsection to point on the appropriate cloud
            storage. For S3-compatible storage this`backupSource` subsection
            should contain a `destination` key equal to the s3 bucket with a
            special `s3://` prefix, followed by necessary S3 configuration keys,
            same as in `deploy/cr.yaml` file:

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

        * you can also use a `storageName` key to specify the exact name of the
            storage (the actual storage [should be already defined](backups-storage.md)
            in the `backup.storages` subsection of the `deploy/cr.yaml` file):

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

