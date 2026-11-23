> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Microsoft Azure Blob storage

To use Azure Blob storage for backups, you need the following:

- An Azure Storage account and a Blob container within it
- Your storage account name and access key, to authenticate to the container

Create a Secret object with your access credentials. Use the `deploy/backup-azure.yaml` file as an example. You must specify the following information:

- `metadata.name` is the name of the Kubernetes secret which you will reference in the Custom Resource
- `AZURE_STORAGE_ACCOUNT_NAME` and `AZURE_STORAGE_ACCOUNT_KEY` are base64-encoded keys to access Azure Blob storage

Use the following command to encode the keys:

**in Linux**

```
echo -n 'plain-text-string' | base64 --wrap=0
```

**in macOS**

```
echo -n 'plain-text-string' | base64
```

Here’s the example configuration of the Secret file:

```
apiVersion: v1
kind: Secret
metadata:
  name: my-cluster-azure-secret
type: Opaque
data:
  AZURE_STORAGE_ACCOUNT_NAME: UkVQTEFDRS1XSVRILUFaVVJFLVNUT1JBR0UtQUNDT1VOVC1OQU1F
  AZURE_STORAGE_ACCOUNT_KEY: UkVQTEFDRS1XSVRILUFaVVJFLVNUT1JBR0UtQUNDT1VOVC1LRVk=
```

Export your namespace so the commands below can use it. Replace `<namespace>` with your value:

```
export NAMESPACE=<namespace>
```

1. Create the Kubernetes Secret object with this file:

   ```
   kubectl apply -f deploy/backup-azure.yaml -n $NAMESPACE
   ```

1. Configure the storage in the Custom Resource. Modify the `backup.storages` subsection of the Custom Resource.

   - `storages.NAME.type` - set to `azure` (substitute the `NAME` part with a name you will use to refer to this storage)
   - `storages.NAME.azure.credentialsSecret` - specify the name of your Secret (`my-cluster-azure-secret` in the example)
   - `storages.NAME.azure.container` - specify the name of the Azure container
   - `storages.NAME.azure.prefix` is the path (sub-folder) inside the container. If prefix is not set, backups are stored in the root directory.

   These and other options within the `storages.NAME.azure` subsection are further described in the [Operator Custom Resource options](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#operator-backup-section).

   Here is an example:

   ```
   ...
   backup:
     ...
     storages:
       azure-blob:
         type: azure
         azure:
           container: <your-container-name>
           prefix: psmdb
           credentialsSecret: my-cluster-azure-secret
         ...
   ```

1. Apply the configuration:

   ```
   kubectl apply -f deploy/cr.yaml -n $NAMESPACE
   ```

## Verify the storage works

Storage problems surface as failed backups, not as errors when you apply the Custom Resource. Confirm the configuration by taking a backup and watching it finish.

Set `spec.storageName` to the storage name you defined under `backup.storages` (and `spec.clusterName` to your cluster):

deploy/backup/backup.yaml

```
apiVersion: psmdb.percona.com/v1
kind: PerconaServerMongoDBBackup
metadata:
  name: backup1
spec:
  clusterName: my-cluster-name
  storageName: <storage-name>
```

Apply it and watch the backup:

```
kubectl apply -f deploy/backup/backup.yaml -n $NAMESPACE
kubectl get psmdb-backup -n $NAMESPACE
```

The backup must reach the `ready` state. A backup that lands in `error`, or stays in `running` or `waiting`, usually means the bucket, the endpoint, the region, or the credentials are wrong. Check the backup object’s status message and the `pbm-agent` logs, and see [Troubleshoot backups and restores](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug-backup-restore.html).
