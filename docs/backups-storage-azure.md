# Microsoft Azure Blob storage

To use Azure Blob storage, create a Secret object with your access credentials. Use the `deploy/backup-azure.yaml` file as an example. You must specify the following information:

* `metadata.name` is the name of the Kubernetes secret which you will reference in the Custom Resource
* `AZURE_STORAGE_ACCOUNT_NAME` and `AZURE_STORAGE_ACCOUNT_KEY` are base64-encoded keys to access Azure Blob storage

Use the following command to encode the keys:

=== ":simple-linux: in Linux"

    ```bash
    echo -n 'plain-text-string' | base64 --wrap=0
    ```

=== ":simple-apple: in macOS"

    ```bash
    echo -n 'plain-text-string' | base64
    ```

Here's the example configuration of the Secret file:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-cluster-azure-secret
type: Opaque
data:
  AZURE_STORAGE_ACCOUNT_NAME: UkVQTEFDRS1XSVRILUFXUy1BQ0NFU1MtS0VZ
  AZURE_STORAGE_ACCOUNT_KEY: UkVQTEFDRS1XSVRILUFXUy1TRUNSRVQtS0VZ
```

1. Create the Kubernetes Secret object with this file:

    ```bash
    kubectl apply -f deploy/backup-azure.yaml
    ```

2. Configure the storage in the Custom Resource. Modify the `backup.storages` subsection of the Custom Resource.

    * `storages.NAME.type` - set to `azure` (substitute the `NAME` part with a name you will use to refer to this storage)

    * `storages.NAME.azure.credentialsSecret` - specify the name of your Secret (`my-cluster-azure-secret` in the example)

    * `storages.NAME.azure.container` - specify the name of the Azure container
    * `storages.NAME.azure.prefix` is the path (sub-folder) inside the container. If prefix is not set, backups are stored in the root directory.

    These and other options within the `storages.NAME.azure` subsection are
    further described in the [Operator Custom Resource options](operator.md#operator-backup-section).

    Here is an example:

    ```yaml
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

3. Apply the configuration:

    ```bash
    kubectl apply -f deploy/cr.yaml -n <namespace>
    ```