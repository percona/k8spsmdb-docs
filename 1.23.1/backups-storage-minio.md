> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# MinIO and S3-compatible storages

Use the `minio` storage type for MinIO and other S3-compatible storages. It helps with connectivity and compatibility issues when your S3 implementation doesn’t support SigV4 or requires endpoint configuration that works better with the `minio` storage type.

## Assumptions

This page assumes you already have a MinIO (or other S3-compatible) service reachable from your cluster. To install MinIO itself on Kubernetes, see MinIO’s own [Kubernetes deployment documentation](https://docs.min.io/aistor/installation/kubernetes/) .

Note that MinIO’s standalone open-source server is no longer actively maintained, so MinIO’s current Kubernetes install path is through their AIStor product, which requires a license key (a free tier is available). Any other S3-compatible service (including one you already run) works with the `minio` storage type too.

## Preconditions

To use the `minio` storage type, you need the following:

- An S3-compatible bucket and the region it’s in
- Access key and secret key to authenticate to the bucket
- The storage’s endpoint URL, if it’s not AWS S3 itself (for example, your MinIO service address)

## Create a Secret

Create a Secret object with your access credentials. You can use the [`deploy/backup-s3.yaml`](https://github.com/percona/percona-server-mongodb-operator/blob/v1.23.1/deploy/backup-s3.yaml) file as the example.

You must specify the following information:

- `metadata.name` is the name of the Kubernetes secret which you will reference in the Custom Resource
- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are base64-encoded keys to access your S3 storage

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
  name: my-cluster-name-backup-minio
type: Opaque
data:
  AWS_ACCESS_KEY_ID: UkVQTEFDRS1XSVRILUFXUy1BQ0NFU1MtS0VZ
  AWS_SECRET_ACCESS_KEY: UkVQTEFDRS1XSVRILUFXUy1TRUNSRVQtS0VZ
```

Export your namespace so the commands below can use it. Replace `<namespace>` with your value:

```
export NAMESPACE=<namespace>
```

Create the Secret object with this file:

```
kubectl apply -f deploy/backup-s3.yaml -n $NAMESPACE
```

## Configure the storage

1. Configure the storage in the Custom Resource. Modify the `backup.storages` subsection of the `deploy/cr.yaml` file. Give the name to the storage (by default, `minio`). You will later use it to refer this storage when making backups and restores.

   Specify the following configuration:

   - Set `type` to `minio`.
   - Specify the bucket name for the `minio.bucket` option
   - Specify the location of the bucket for the `minio.region` option
   - Specify the name of the Secret you created previously for the `minio.credentialsSecret` option
   - Specify the `minio.endpointUrl` option if your storage requires it. This points to your storage service and is specific to your cloud provider. For example, the endpoint value for MinIO is `minio.psmdb.svc.cluster.local:9000/minio/`. Don’t use ‘http://’ or ‘https://’ prefixes.

   Organizing backups

   You can use the prefix option to specify a path (sub-folder) inside the S3 bucket where backups will be stored. If you don’t set a prefix, backups are stored in the root directory.

   Here’s the example configuration for MinIO storage:

   ```
   backup:
     storages:
       minio:
         type: minio
         minio:
           bucket: MINIO-BACKUP-BUCKET-NAME-HERE
           credentialsSecret: my-cluster-name-backup-minio
           endpointUrl: minio.psmdb.svc.cluster.local:9000/minio/
           forcePathStyle: true
           insecureSkipTLSVerify: true
           region: us-east-1
           secure: true
   ```

1. Apply the configuration:

   ```
   kubectl apply -f deploy/cr.yaml -n $NAMESPACE
   ```

## Configure TLS verification with custom certificates for S3 storage

You can use your organization’s custom TLS / SSL certificates and instruct the Operator to securely verify TLS communication with your custom S3 storage.

To configure TLS verification with custom certificates, do the following:

1. Create the Secret object that contains the CA bundle needed to verify the S3 endpoint’s TLS certificate.

1. Modify the S3 storage configuration in the Custom Resource and specify the following information:

   - `storages.<NAME>.minio.caBundle.name` is the name of the Secret object you created previously
   - `storages.<NAME>.minio.caBundle.key` is the name of the file in the Secret containing the CA bundle.

   Here’s the example configuration:

   ```
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

You may use [several S3 storages](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/multi-storage.html) for backups and may have TLS / SSL certificates for secure communication with each storage. In this case, the Operator merges the certificates into a single `ca-bundle.crt` file and passes it to PBM. When connecting to a specific S3 storage, PBM finds the corresponding certificate and uses it to securely verify TLS communication with this storage.

To encrypt backups at rest, see [Enable server-side encryption for backups](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-encryption.html).

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
