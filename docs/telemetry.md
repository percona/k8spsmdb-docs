# Telemetry

The Telemetry function enables the Operator to gather and send basic anonymous data to Percona, which helps us to determine where to focus the development and what is the uptake for each release of Operator.

Telemetry is enabled by default and is sent to the [Version Service server](update-db.md) when the Operator connects to it at scheduled times to obtain fresh information about version numbers and valid image paths needed for the upgrade.

The landing page for this service, [check.percona.com  :octicons-link-external-16:](https://check.percona.com/), explains what this service is.

## Cluster and software versions

The Operator reports the following for every cluster:

* Custom Resource ID (`metadata.uid`)
* Kubernetes version
* Platform (Kubernetes or OpenShift. Starting with Operator version 1.24, the Operator also collects the Kubernetes provider and appends it to the platform name. For example, `kubernetes-gke` for a Google Kubernetes Engine (GKE) cluster. If the Operator does not detect the provider, the value ends in `-unknown`)
* Operator version
* Percona Server for MongoDB version
* Percona Backup for MongoDB (PBM) version
* Whether Percona Monitoring and Management (PMM) is enabled, and the PMM version
* Cluster size
* Whether the Operator is [deployed with Helm](helm.md)
* Whether [sidecar containers](sidecar.md) are used

The Operator does not gather anything that identifies a system. The Custom Resource ID is a unique ID that Kubernetes generates for each Custom Resource.

## Features in use

The Operator reports what features are in use. The Since column shows the Operator version that added each report.

| Feature | Since |
| --- | --- |
| [Sharding](sharding.md) | 1.13 |
| [HashiCorp Vault](encryption.md#use-hashicorp-vault-to-store-and-manage-encryption-keys) | 1.13 |
| [Cluster-wide mode](cluster-wide.md) | 1.13 |
| [Volume expansion](scaling-storage-resize.md#storage-resizing-with-volume-expansion-capability) | 1.19 |
| [Multi-cluster Services](replication-mcs.md) | 1.19 |
| [Custom MongoDB users](app-users.md#create-users-via-custom-resource) and [custom MongoDB roles](app-users.md#custom-mongodb-roles) | 1.19 |
| [Vector search](search-overview.md) | 1.24 |
| [Percona ClusterSync for MongoDB](clustersync.md) for this cluster | 1.24 |
| [Data-at-rest encryption](encryption.md) | 1.24 |
| [Arbiter](arbiter.md#arbiter-nodes) | 1.24 |
| [Non-voting members](arbiter.md#non-voting-nodes) | 1.24 |
| [Transport Layer Security (TLS)](TLS.md) mode | 1.24 |
| Number of `mongos` Pods in a sharded cluster | 1.24 |

The TLS mode is one of the following:

* `disabled`
* `allowTLS`
* `preferTLS`
* `requireTLS`

## Backup configuration

The Operator reports the following about backups:

| Information | Values |
| --- | --- |
| [Backups](backups.md) enabled | |
| [Point-in-time recovery](backups-pitr.md) enabled | |
| Backup storage type | - [Amazon S3](backups-storage-s3.md) <br> - S3-compatible storage (including MinIO)<br> - [Azure Blob Storage](backups-storage-azure.md)<br> - [Google Cloud Storage](backups-storage-gcp.md) <br> - a [remote filesystem](backups-storage-filesystem.md) <br> - [Oracle Cloud Infrastructure (OCI) Object Storage](backups-storage-oci.md) <br>  - [Alibaba Cloud Object Storage Service](backups-storage-oss.md) |
| Scheduled backup type | Logical, physical, incremental, or [volume snapshot](backups-pvc-snapshots.md) |

## Disable telemetry

You can disable telemetry with a special option when installing the Operator:

* if you [install the Operator with helm](helm.md), use the following installation command:

  ```bash
  helm install my-db percona/psmdb-db --version {{ release }} --namespace my-namespace --set disable_telemetry="true"
  ```

* if you don't use helm for installation, you have to edit the `operator.yaml`
  before applying it with the `kubectl apply -f deploy/operator.yaml` command.
  Open the `operator.yaml` file with your text editor, find the value of the
  `DISABLE_TELEMETRY` environment variable and set it to `true`:

  ```yaml
  env:
    ...
    - name: DISABLE_TELEMETRY
      value: "true"
    ...
  ```
