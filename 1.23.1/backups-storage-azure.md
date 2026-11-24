> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Microsoft Azure Blob storage

To store backups in Azure Blob storage, you create a Secret with your Azure Storage credentials and reference it in the `backup.storages` subsection of the Custom Resource.

You can provide the credentials in one of two ways:

- The storage account name and access key, as two separate keys in the Secret.
- An Azure Storage connection string, as one key in the Secret. Use it when your tooling, such as Terraform or Crossplane, outputs a connection string. Available starting with version 1.24.0.

Both ways are fully supported. Your existing Secrets that contain only the account name and key work as before, so you don’t need to change them when you upgrade. See [How the Operator reads the credentials](#how-the-operator-reads-the-credentials) for details.

## Before you start

Ensure you have the following:

- An Azure Storage account and a Blob container within it.
- The storage account name and access key, or a connection string that contains them.

Export your namespace so the commands can use it. Replace `<namespace>` with your value:

```
export NAMESPACE=<namespace>
```

## Configure the storage

1. Create a Secret with your credentials. Replace the placeholders with your values:

   **Account name and key**

   **Via the command line**

   Run the following command. Replace the `<storage-account-name>` and `<storage-account-key>` placeholders with your values.

   ```
   kubectl create secret generic my-cluster-azure-secret \
     --from-literal=AZURE_STORAGE_ACCOUNT_NAME=<storage-account-name> \
     --from-literal=AZURE_STORAGE_ACCOUNT_KEY=<storage-account-key> \
     -n $NAMESPACE
   ```

   **Using the manifest**

   1. Encode the keys:

      - On Linux:

      ```
      echo -n 'plain-text-string' | base64 --wrap=0
      ```

      - On macOS:

      ```
      echo -n 'plain-text-string' | base64
      ```

   1. Create a Secret configuration file. Add the encoded values to the `data` section:

      backup-azure.yaml

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

   1. Create the Secret object:

      ```
      kubectl apply -f backup-azure.yaml -n $NAMESPACE
      ```

   **Connection string**

   Version added: [1.24.0](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/RN/Kubernetes-Operator-for-PSMONGODB-RN1.24.0.md)

   The connection string must contain `AccountName` and `AccountKey`. See [How the Operator reads the credentials](#how-the-operator-reads-the-credentials).

   **Via the command line**

   Run the following command. Replace the `<storage-account-name>` and `<storage-account-key>` placeholders with your values:

   ```
   kubectl create secret generic my-cluster-azure-secret \
     --from-literal=AZURE_STORAGE_CONNECTION_STRING='DefaultEndpointsProtocol=https;AccountName=<storage-account-name>;AccountKey=<storage-account-key>;EndpointSuffix=core.windows.net' \
     -n $NAMESPACE
   ```

   Keep the single quotes: the connection string contains `;` characters, which the shell would otherwise interpret.

   **Using the manifest**

   1. Create a Secret configuration file. The `stringData` section takes the connection string as plain text, so you don’t encode it:

      backup-azure.yaml

      ```
      apiVersion: v1
      kind: Secret
      metadata:
        name: my-cluster-azure-secret
      type: Opaque
      stringData:
        AZURE_STORAGE_CONNECTION_STRING: DefaultEndpointsProtocol=https;AccountName=<storage-account-name>;AccountKey=<storage-account-key>;EndpointSuffix=core.windows.net
      ```

   1. Create the Secret object:

      ```
      kubectl apply -f backup-azure.yaml -n $NAMESPACE
      ```

1. Configure the storage in the `backup.storages` subsection of the `deploy/cr.yaml` Custom Resource:

   - `storages.NAME.type` - set to `azure`. Replace `NAME` with a name you will use to refer to this storage.
   - `storages.NAME.azure.credentialsSecret` - the name of your Secret, `my-cluster-azure-secret` in the example.
   - `storages.NAME.azure.container` - the name of the Azure container.
   - `storages.NAME.azure.prefix` - the path, or sub-folder, inside the container. If you don’t set it, backups are stored in the root directory.

   These and other options within the `storages.NAME.azure` subsection are described in the [Operator Custom Resource options](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#operator-backup-section).

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

## How the Operator reads the credentials

- If the Secret has a non-empty `AZURE_STORAGE_CONNECTION_STRING` key, the Operator uses it and ignores `AZURE_STORAGE_ACCOUNT_NAME` and `AZURE_STORAGE_ACCOUNT_KEY`.
- Otherwise, the Operator uses `AZURE_STORAGE_ACCOUNT_NAME` and `AZURE_STORAGE_ACCOUNT_KEY`.
- From the connection string, the Operator takes only `AccountName` and `AccountKey`. It ignores other fields, such as `DefaultEndpointsProtocol`, `EndpointSuffix` or `BlobEndpoint`. To use a custom endpoint, set [`azure.endpointUrl`](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#backupstoragesstorage-nameazureendpointurl) in the Custom Resource.
- A connection string without `AccountKey`, for example one that uses a shared access signature (SAS) token, isn’t supported.

## Switch an existing storage to a connection string

You don’t need to change the Custom Resource. Add the connection string to the Secret that your storage already uses:

```
kubectl patch secret my-cluster-azure-secret -n $NAMESPACE --type=merge \
  -p '{"stringData":{"AZURE_STORAGE_CONNECTION_STRING":"DefaultEndpointsProtocol=https;AccountName=<storage-account-name>;AccountKey=<storage-account-key>;EndpointSuffix=core.windows.net"}}'
```

From then on, the Operator uses the connection string. You can keep or remove the `AZURE_STORAGE_ACCOUNT_NAME` and `AZURE_STORAGE_ACCOUNT_KEY` keys.

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

## Troubleshooting

### Backups fail after you add a connection string

**Symptom:** the Operator log reports `parse azure connection string: AccountName or AccountKey not found in connection string`.

**Cause:** the `AZURE_STORAGE_CONNECTION_STRING` value has no `AccountName` or no `AccountKey`. For example, it’s a SAS-based connection string, or the value got cut off when you created the Secret.

**Fix:**

1. Check the value in the Secret:

   ```
   kubectl get secret my-cluster-azure-secret -n $NAMESPACE -o jsonpath='{.data.AZURE_STORAGE_CONNECTION_STRING}' | base64 -d
   ```

1. Replace it with a connection string that contains `AccountName` and `AccountKey`. You can copy it from **Access keys** of your storage account in the Azure portal.

For other backup problems, see [Troubleshoot backups and restores](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug-backup-restore.html).
