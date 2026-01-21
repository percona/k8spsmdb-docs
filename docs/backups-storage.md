# Configure storage for backups

You can configure storage for backups in the `backup.storages` subsection of the
Custom Resource, using the [deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml)
configuration file.

The Operator provides several storage types for different storages. To help you choose the right storage type, consider these points:

* **S3** - Use this storage type for native AWS S3 and for S3-compatible storage services that support Signature Version 4 (SigV4) used in the AWS SDK 2.
* **minio** - Use this storage type for MinIO and other S3-compatible services that don't support SigV4 or require endpoint configuration that works better with the `minio` storage type.
* **gcp** - Use this storage type for Google Cloud Storage.
* **azure** - Use this storage type for Microsoft Azure Blob storage.
* **filesystem** - Use this storage type for uploading backups to a remote file server.

For each backup storage, create a [Kubernetes Secret  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/) object with credentials and reference it in the Custom Resource.

## Storage setup guides

Use the page for your storage type:

* [Amazon S3 storage](backups-storage-s3.md)
* [MinIO and S3-compatible storages](backups-storage-minio.md)
* [Google Cloud storage](backups-storage-gcp.md)
* [Microsoft Azure Blob storage](backups-storage-azure.md)
* [Remote file server](backups-storage-filesystem.md)
