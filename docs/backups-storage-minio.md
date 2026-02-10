# MinIO and S3-compatible storages

Use the `minio` storage type for MinIO and other S3-compatible storages. It helps with connectivity and compatibility issues when your S3 implementation doesn't support SigV4 or requires endpoint configuration that works better with the `minio` storage type.

To use the `minio` storage type, create a Secret object with your access credentials. You can use the [`deploy/backup-s3.yaml`](https://github.com/percona/percona-server-mongodb-operator/blob/v{{release}}/deploy/backup-s3.yaml) file as the example.

You must specify the following information:

* `metadata.name` is the name of the Kubernetes secret which you will reference in the Custom Resource
* `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are base64-encoded keys to access your S3 storage

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
  name: my-cluster-name-backup-minio
type: Opaque
data:
  AWS_ACCESS_KEY_ID: UkVQTEFDRS1XSVRILUFXUy1BQ0NFU1MtS0VZ
  AWS_SECRET_ACCESS_KEY: UkVQTEFDRS1XSVRILUFXUy1TRUNSRVQtS0VZ
```

1. Create the Secret object with this file:

    ```bash
    kubectl apply -f deploy/backup-s3.yaml -n <namespace>
    ```

2. Configure the storage in the Custom Resource. Modify the `backup.storages` subsection of the `deploy/cr.yaml` file. Give the name to the storage (by default, `minio`). You will later use it to refer this storage when making backups and restores.

    Specify the following configuration:

    * Set `type` to `minio`.
    * Specify the bucket name for the `minio.bucket` option
    * Specify the location of the bucket for the `minio.region` option
    * Specify the name of the Secret you created previously for the `minio.credentialsSecret` option
    * Specify the `minio.endpointUrl` option if your storage requires it. This points to your storage service and is specific to your cloud provider. For example, the endpoint value for MinIO is `minio.psmdb.svc.cluster.local:9000/minio/`

    !!! tip "Organizing backups"

        You can use the prefix option to specify a path (sub-folder) inside the S3 bucket where backups will be stored. If you don’t set a prefix, backups are stored in the root directory.

    Here's the example configuration for MinIO storage:

    ```yaml
    backup:
      storages:
        minio:
          type: minio
          minio:
            bucket: MINIO-BACKUP-BUCKET-NAME-HERE
            credentialsSecret: my-cluster-name-backup-minio
            endpointUrl: minio.psmdb.svc.cluster.local:9000/minio/
            region: us-east-1
    ```

3. Apply the configuration:

    ```bash
    kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

## Configure TLS verification with custom certificates for S3 storage

You can use your organization's custom TLS / SSL certificates and instruct the Operator to securely verify TLS communication with your custom S3 storage.


To configure TLS verification with custom certificates, do the following:

1. Create the Secret object that contains the CA bundle needed to verify the S3 endpoint's TLS certificate.
2. Modify the S3 storage configuration in the Custom Resource and specify the following information:

    * `storages.<NAME>.minio.caBundle.name` is the name of the Secret object you created previously
    * `storages.<NAME>.minio.caBundle.key` is the name of the file in the Secret containing the CA bundle.

    Here's the example configuration:

    ```yaml
    ...
    backup:
      ...
      storages:
        minio:
          type: minio
          minio:
            bucket: MINIO-BACKUP-BUCKET-NAME-HERE
            region: us-east-1
            credentialsSecret: my-cluster-name-backup-minio
            caBundle:
              name: minio-ca-bundle
              key: ca.crt
      ...
    ```

    After you apply the configuration, the Operator passes your custom certificate configuration to `pbm-agents`. `pbm-agents` then use it to securely verify TLS communication with S3 storage during backups and restores.

You may use [several S3 storages](multi-storage.md) for backups and may have TLS / SSL certificates for secure communication with each storage. In this case, the Operator merges the certificates into a single `ca-bundle.crt` file and passes it to PBM. When connecting to a specific S3 storage, PBM finds the corresponding certificate and uses it to securely verify TLS communication with this storage.
