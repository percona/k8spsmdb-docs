> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# 3. Take your first backup

In this tutorial you will learn how to make a logical backup of your data manually. To learn more about backup types and storages, see [Backup and restore](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups.html).

## Considerations and prerequisites

In this tutorial we use the [AWS S3](https://aws.amazon.com/s3/) as the backup storage. You need the following S3-related information:

- the name of the S3 storage
- the name of the S3 bucket
- the region - the location of the bucket
- the S3 credentials to be used to access the storage.

If you don’t have access to AWS, you can use any S3-compatible storage like [MinIO](https://min.io/docs/minio/linux/index.html) . Also [check the list of supported storages](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups.html#backup-storage).

Also, we will use some files from the Operator repository for setting up backups. So, clone the percona-server-mongodb-operator repository:

```
git clone -b v1.23.1 https://github.com/percona/percona-server-mongodb-operator
cd percona-server-mongodb-operator
```

Note

It is crucial to specify the right branch with `-b` option while cloning the code on this step. Please be careful.

## Configure backup storage

1. Encode S3 credentials, substituting `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` with your real values:

   **on Linux**

   ```
   echo -n 'AWS_ACCESS_KEY_ID' | base64 --wrap=0
   echo -n 'AWS_SECRET_ACCESS_KEY' | base64 --wrap=0
   ```

   **on MacOS**

   ```
   echo -n 'AWS_ACCESS_KEY_ID' | base64 
   echo -n 'AWS_SECRET_ACCESS_KEY' | base64
   ```

1. Edit the [`deploy/backup-s3.yaml`](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/backup-s3.yaml) example Secrets configuration file and specify the following:

   - the `metadata.name` key is the name which you use to refer your Kubernetes Secret
   - the base64-encoded S3 credentials

   deploy/backup-s3.yaml

   ```
   apiVersion: v1
   kind: Secret
   metadata:
     name: my-cluster-name-backup-s3
   type: Opaque
   data:
     AWS_ACCESS_KEY_ID: UkVQTEFDRS1XSVRILUFXUy1BQ0NFU1MtS0VZ
     AWS_SECRET_ACCESS_KEY: UkVQTEFDRS1XSVRILUFXUy1TRUNSRVQtS0VZ
   ```

1. Create the Secrets object from this yaml file. Specify your namespace instead of the `<namespace>` placeholder:

   ```
   kubectl apply -f deploy/backup-s3.yaml -n <namespace>
   ```

1. Update your `deploy/cr.yaml` configuration. Specify the following parameters in the `backup` section:

   - set the `storages.<NAME>.type` to `s3`. Substitute the `<NAME>` part with some arbitrary name that you will later use to refer this storage when making backups and restores.
   - set the `storages.<NAME>.s3.credentialsSecret` to the name you used to refer your Kubernetes Secret (`my-cluster-name-backup-s3` in the previous step).
   - specify the S3 bucket name for the `storages.<NAME>.s3.bucket` option
   - specify the region in the `storages.<NAME>.s3.region` option. Also you can use the `storages.<NAME>.s3.prefix` option to specify the path (a sub-folder) to the backups inside the S3 bucket. If prefix is not set, backups are stored in the root directory.

   ```
   ...
   backup:
     ...
     storages:
       s3-us-west:
         type: s3
         s3:
           bucket: "S3-BACKUP-BUCKET-NAME-HERE"
           region: "<AWS_S3_REGION>"
           credentialsSecret: my-cluster-name-backup-s3
     ...
   ```

   If you use a different S3-compatible storage instead of AWS S3, add the `endpointUrl` key in the `s3` subsection, which should point to the actual cloud used for backups. This value is specific to the cloud provider. For example, using Google Cloud involves the following `endpointUrl`:

   ```
   endpointUrl: https://storage.googleapis.com
   ```

1. Apply the configuration. Specify your namespace instead of the `<namespace>` placeholder:

   ```
   kubectl apply -f deploy/cr.yaml -n <namespace>
   ```

## Make a logical backup

1. Before you start, verify the backup configuration in the `deploy/cr.yaml` file:

   - the `backup.enabled` key is set to `true`
   - the `backup.storages` subsection contains the [configured storage](#configure-backup-storage).

1. To make a backup, you need the configuration file. Edit the sample [`deploy/backup/backup.yaml`](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/backup/backup.yaml) configuration file and specify the following:

   - `metadata.name` - specify the backup name. You will use this name to restore from this backup
   - `spec.clusterName` - specify the name of your cluster. This is the name you specified when deploying Percona Server for MongoDB.
   - `spec.storageName` - specify the name of your already configured storage.

   deploy/backup/backup.yaml

   ```
   apiVersion: psmdb.percona.com/v1
   kind: PerconaServerMongoDBBackup
   metadata:
     finalizers:
     - percona.com/delete-backup
     name: backup1
   spec:
     clusterName: my-cluster-name
     storageName: s3-us-west
     type: logical
   ```

1. Apply the configuration. This instructs the Operator to start a backup. Specify your namespace instead of the `<namespace>` placeholder:

   ```
   kubectl apply -f deploy/backup/backup.yaml -n <namespace>
   ```

1. Track the backup progress.

   `bash kubectl get psmdb-backup -n <namespace>`

   Sample output

   ```{.text .no-copy}

   NAME CLUSTER STORAGE DESTINATION TYPE SIZE STATUS COMPLETED AGE
   backup1 my-cluster-name s3-us-west s3://my-bucket/2025-09-23T10:34:59Z logical 105.44MB ready 43s 43s
   ```

   When the status changes to `Ready`, backup is made.

## Troubleshooting

If you face issues with the backup, see [Troubleshoot backups and restores](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug-backup-restore.html).

Congratulations! You have made the first backup manually. Continue with [Configure backups](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-configure.html) to [enable point-in-time recovery](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pitr.html), [encrypt backups](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-encryption.html), and [run backups on a schedule](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-scheduled.html).

## Next steps

[Restore sample data](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/restore-tutorial.html)
