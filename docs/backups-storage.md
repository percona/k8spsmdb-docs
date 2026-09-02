# Configure storage for backups

Configure storage for backups in the `backup.storages` subsection of the
Custom Resource, using the [deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml)
configuration file. Each entry needs a storage type, the bucket or container details, and a way to authenticate.

For the list of supported storages and when to use each type, see [Backup cycle and backup storage](backups.md#backup-cycle-and-backup-storage). This page explains how to add storage to the cluster Custom Resource.

## Choose the storage type

* **S3** - Use this storage type for native AWS S3 and for S3-compatible storage services that support Signature Version 4 (SigV4) used in the AWS SDK 2.
* **minio** - Use this storage type for MinIO and other S3-compatible services that don't support SigV4 or require endpoint configuration that works better with the `minio` storage type.
* **gcp** - Use this storage type for Google Cloud Storage.
* **azure** - Use this storage type for Microsoft Azure Blob storage.
* **oss** - Use this storage type for Alibaba Cloud Object Storage Service (OSS).
* **oci** - Use this storage type for Oracle Cloud Infrastructure Object Storage.
* **filesystem** - Use this storage type for uploading backups to a remote file server.

!!! admonition "Choosing between S3 and MinIO

    The choice is not about the vendor name, since both serve S3-compatible storage. The `s3` type requires SigV4 support; the `minio` type uses the MinIO Go client and covers services without SigV4 or with endpoint requirements `s3` does not handle. Check your provider’s SigV4 support before choosing.

    The `minio` type requires Percona Backup for MongoDB 2.12.0 or later.

## Choose authentication method

For most backup storages, create a [Kubernetes Secret  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/) object with credentials and reference it in the Custom Resource. Some platforms such as AWS S3 and GCS support identity-based access instead, which lets you omit the Secret entirely.

| Type       | Authentication                     |
|------------|------------------------------------|
| `s3`         | A Secret, or [identity-based access with IRSA or an IAM instance profile](backups-storage-s3.md#choose-the-authentication-method)    |
| `gcs`        | A Secret, or [identity-based access with Workload Identity](backups-storage-gcp.md#automate-access-to-google-cloud-storage-using-workload-identity) |
| `oci`        | A Secret when the credentials type is userPrincipal, or identity-based access with instancePrincipal or okeWorkloadIdentity |
| `minio`      | A Secret                        |
| `azure`      | A Secret. Required — there is no identity-based option       |
| `oss`        | A Secret. Required — there is no identity-based option      |
| `filesystem` | None. The storage is a path on a mounted remote file server       |


## Storage setup guides

Use the page for your storage type:

* [Amazon S3 storage](backups-storage-s3.md)
* [MinIO and S3-compatible storages](backups-storage-minio.md)
* [Google Cloud storage](backups-storage-gcp.md)
* [Microsoft Azure Blob storage](backups-storage-azure.md)
* [Alibaba Cloud OSS storage](backups-storage-oss.md)
* [Oracle Cloud Infrastructure Object Storage](backups-storage-oci.md)
* [Remote file server](backups-storage-filesystem.md)
