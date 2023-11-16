# Make a backup

In this tutorial you will learn how to make a logical backup of your data manually. To learn more about backups, see the [Backup and restore](backups.md) section.

## Considerations

In this tutorial we use the [AWS S3](https://aws.amazon.com/s3/) as the backup storage. You need the following S3-related information:
   
* the name of the S3 storage
* the name of the S3 bucket
* the region - the location of the bucket
* the S3 credentials to be used to access the storage. 

If you don’t have access to AWS, you can use any S3-compatible storage like [MinIO](https://min.io/docs/minio/linux/index.html). Also [check the list of supported storages](backups.md#backup-storage).

## Configure backup storage {.power-number}

1. Encode S3 credentials, substituting `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` with your real values:

    === "on Linux" 

        ```{.bash data-prompt="$"}
        $ echo -n 'AWS_ACCESS_KEY_ID' | base64 --wrap=0
        $ echo -n 'AWS_SECRET_ACCESS_KEY' | base64 --wrap=0
        ``` 

    === "on MacOS" 

        ```{.bash data-prompt="$"}
        $ echo -n 'AWS_ACCESS_KEY_ID' | base64 
        $ echo -n 'AWS_SECRET_ACCESS_KEY' | base64 
        ```

2. Edit the [`deploy/backup-s3.yaml`](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/backup-s3.yaml) example Secrets configuration file and specify the following:

    * the `metadata.name` key is the name which you use to refer your Kubernetes Secret
    * the base64-encoded S3 credentials

    ```yaml title="deploy/backup-s3.yaml"
    apiVersion: v1
    kind: Secret
    metadata:
      name: my-cluster-name-backup-s3
    type: Opaque
    data:
      AWS_ACCESS_KEY_ID: <YOUR_AWS_ACCESS_KEY_ID>
      AWS_SECRET_ACCESS_KEY: <YOUR_AWS_SECRET_ACCESS_KEY>
    ```

3. Create the Secrets object from this yaml file. Specify your namespace instead of the `<namespace>` placeholder:

	```{.bash data-prompt="$"}
	$ kubectl apply -f deploy/backup-s3.yaml -n <namespace>
	```

4. Update your `deploy/cr.yaml` configuration. Specify the following parameters in the `backups` section:

    * set the `storages.<NAME>.type` to `s3`. Substitute the `<NAME>` part with some arbitrary name that you will later use to refer this storage when making backups and restores.
    * set the `storages.<NAME>.s3.credentialsSecret` to the name you used to refer your Kubernetes Secret (`my-cluster-name-backup-s3` in the previous step).
    * specify the S3 bucket name for the `storages.<NAME>.s3.bucket` option
    * specify the  region in the `storages.<NAME>.s3.region` option. Also you can use the `storages.<NAME>.s3.prefix` option to specify the path (a sub-folder) to the backups inside the S3 bucket. If prefix is not set, backups are stored in the root directory.

   	```yaml
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

    !!! note ""

        If you use a different S3-compatible storage instead of AWS S3, add the `endpointURL` key in the `s3` subsection, which should point to the actual cloud used for backups. This value is specific to the cloud provider. For example, using Google Cloud involves the following `endpointUrl`:

        ```
        endpointUrl: https://storage.googleapis.com
        ```
  
5. Apply the configuration. Specify your namespace instead of the `<namespace>` placeholder:

	```{.bash data-prompt="$"}
	$ kubectl apply -f deploy/cr.yaml -n <namespace>
	```
 
## Make a logical backup {.power-number}

1. Before you start, verify the backup configuration in the `deploy/cr.yaml` file:

    * the `backup.enabled` key is set to `true`
    * the `backup.storages` subsection contains the [configured storage](#configure-backup-storage).

2. To make a backup, you need the configuration file. Edit the sample [`deploy/backup/backup.yaml`](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/backup/backup.yaml) configuration file and specify the following:

    * `metadata.name` - specify the backup name. You will use this name to restore from this backup
    * `spec.clusterName` - specify the name of your cluster. This is the name you specified when deploying Percona Server for MongoDB.
    * `spec.storageName key1` - specify the name of your already configured storage.

    ```yaml title="deploy/backup/backup.yaml"
    apiVersion: psmdb.percona.com/v1
    kind: PerconaServerMongoDBBackup
    metadata:
      finalizers:
      - delete-backup
      name: backup1
    spec:
      clusterName: my-cluster-name
      storageName: s3-us-west
      type: logical
    ```

3. Apply the configuration. This instructs the Operator to start a backup. Specify your namespace instead of the `<namespace>` placeholder:

    ```{.bash data-prompt="$"}
	$ kubectl apply -f deploy/backup/backup.yaml -n <namespace>
	```

4. Track the backup progress. 

    ```{.bash data-prompt="$"}
	$ kubectl get psmdb-backup -n <namespace>
	```

	??? example "Output"

	    ```{.text .no-copy}
	    NAME      CLUSTER           STORAGE      DESTINATION                                     TYPE      STATUS   COMPLETED   AGE
	    backup1   my-cluster-name   s3-us-west   s3://pg-operator-testing/2023-10-10T16:36:46Z   logical   running                43s
	    ```

	When the status changes to `Ready`, backup is made.

## Troubleshooting 

You may face issues with the backup. To identify the issue, you can do the following:

* View the information about the backup with the following command:

   ```{.bash data-prompt="$"}
   $ kubectl get psmdb-backup <backup-name> -n <namespace> -o yaml
   ```

* [View the backup-agent logs](debug-logs.md). Use the previous command to find the name of the pod where the backup was made:
  
  ```{.bash data-prompt="$"}
  $ kubectl logs pod/<pod-name> -c backup-agent -n <namespace>
  ```

Congratulations! You have made the first backup manually. Want to learn more about backups? See the [Backup and restore](backups.md) section for how to [configure point-in-time recovery](backups-pitr.md), [enable server-side encryption](backups-encryption.md) and how to [automatically make backups according to the schedule](backups-scheduled.md).

## Next steps

[Monitor the database :material-arrow-right:](monitoring-tutorial.md){.md-button}
