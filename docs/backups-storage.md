# Configure storage for backups

Backup storage is defined in the `backup.storages` subsection of the Custom Resource, in the
[deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml)
configuration file. Each entry needs a `type`, the settings for that type, and a way to
authenticate.

This page helps you pick the `type` value and the authentication method. For what backups
are and when to use each backup type, see [Backup and restore](backups.md).

## Anatomy of a storage entry

Each entry under `backup.storages` is a named block. The name is how you refer to the
storage everywhere else - in a backup task, in an on-demand backup, and in a restore.

```yaml
backup:
  storages:
    s3-us-east:          # the storage name you reference elsewhere
      main: true         # the default storage when several are defined
      type: s3           # decides which settings block below is read
      s3:
        bucket: S3-BACKUP-BUCKET-NAME-HERE
        region: us-east-1
        prefix: ""       # optional folder inside the bucket
        credentialsSecret: my-cluster-name-backup-s3
```

Three fields deserve attention:

* **`main`** marks the storage the Operator uses when a backup or restore does not name
  one. Set it on exactly one entry. If you define several storages, read
  [Multiple storages for backups](multi-storage.md) before you do.
* **`type`** selects which nested settings block is read. A `type: s3` entry reads the
  `s3:` block and ignores the others.
* **`prefix`** stores backups under a folder inside the bucket rather than at its root.
  If you set it, you must include the same prefix when restoring from that storage -
  a missing prefix is a common cause of a restore that cannot find its backup.

## Choose the storage type

Two of these need explaining, because the service you use does not always map to the type
name you would expect:

* `s3` covers native Amazon S3 **and** any S3-compatible service that supports Signature
  Version 4 (SigV4) as used in AWS SDK v2.
* `minio` exists for S3-compatible services that do **not** support SigV4, or that need
  endpoint handling the `s3` type does not provide. It uses the MinIO Go client instead.

| `type` value | Use it for |
|---|---|
| `s3` | Amazon S3, and S3-compatible services that support SigV4 |
| `minio` | MinIO and S3-compatible services without SigV4 support |
| `gcs` | Google Cloud Storage |
| `azure` | Microsoft Azure Blob storage |
| `oss` | Alibaba Cloud Object Storage Service |
| `oci` | Oracle Cloud Infrastructure Object Storage |
| `filesystem` | A remote file server |

!!! note

    The `minio` storage type requires Percona Backup for MongoDB 2.12.0 or later.

## Choose how to authenticate

Most storages read credentials from a [Kubernetes Secret  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/)
that you reference from the Custom Resource. On some cloud platforms you can instead use
identity-based access, where the platform issues short-lived credentials to the Pod and
there is no Secret to manage or rotate.

| `type` | Secret | Identity-based alternative |
|---|---|---|
| `s3` | Optional, if you use identity-based access | IAM Roles for Service Accounts (IRSA), or an IAM instance profile |
| `gcs` | Optional, if you use Workload Identity | Workload Identity |
| `oci` | Required for `userPrincipal` | `instancePrincipal` or `okeWorkloadIdentity` |
| `minio` | Required | - |
| `azure` | Required | - |
| `oss` | Required | - |
| `filesystem` | Not used | - |

Identity-based guides:

* [Amazon S3 with IRSA or an IAM instance profile](backups-storage-s3.md#choose-the-authentication-method)
* [Google Cloud Storage with Workload Identity](backups-storage-gcp.md#automate-access-to-google-cloud-storage-using-workload-identity)
* [Oracle Cloud Infrastructure Object Storage](backups-storage-oci.md#choose-the-authentication-method)

!!! warning

    For `s3`, a Secret referenced in the Custom Resource always wins over identity-based
    access: whenever `credentialsSecret` is set the Operator reads the keys from it, and
    only falls back to the platform's credential chain when it is empty. When you switch a
    cluster from access keys to IRSA, remove `credentialsSecret` from the storage
    configuration - otherwise the Operator keeps using the old keys and the change appears
    to have no effect.

## Verify the storage works

Storage problems surface as failed backups, not as errors when you apply the Custom
Resource. Confirm the configuration by taking a backup and watching it finish:

```bash
export NAMESPACE=<namespace>
kubectl get psmdb-backup -n $NAMESPACE
```

The backup must reach the `ready` state. A backup stuck in `running` or `waiting`, or one
that lands in `error`, usually means the bucket name, the region, the endpoint, or the
credentials are wrong. See [Troubleshoot backups and restores](debug-backup-restore.md).

## Storage setup guides

Use the page for your storage type:

* [Amazon S3 storage](backups-storage-s3.md)
* [MinIO and S3-compatible storages](backups-storage-minio.md)
* [Google Cloud storage](backups-storage-gcp.md)
* [Microsoft Azure Blob storage](backups-storage-azure.md)
* [Alibaba Cloud OSS storage](backups-storage-oss.md)
* [Oracle Cloud Infrastructure Object Storage](backups-storage-oci.md)
* [Remote file server](backups-storage-filesystem.md)

## Next steps

* [Making scheduled backups](backups-scheduled.md)
* [Making on-demand backups](backups-ondemand.md)
