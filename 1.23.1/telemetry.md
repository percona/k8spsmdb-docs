> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Telemetry

The Telemetry function enables the Operator to gather and send basic anonymous data to Percona, which helps us to determine where to focus the development and what is the uptake for each release of Operator.

Telemetry is enabled by default and is sent to the [Version Service server](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-db.html) when the Operator connects to it at scheduled times to obtain fresh information about version numbers and valid image paths needed for the upgrade.

The landing page for this service, [check.percona.com](https://check.percona.com/) , explains what this service is.

## Cluster and software versions

The Operator reports the following for every cluster:

- Custom Resource ID (`metadata.uid`)
- Kubernetes version
- Platform (Kubernetes or OpenShift. Starting with Operator version 1.24, the Operator also collects the Kubernetes provider and appends it to the platform name. For example, `kubernetes-gke` for a Google Kubernetes Engine (GKE) cluster. If the Operator does not detect the provider, the value ends in `-unknown`)
- Operator version
- Percona Server for MongoDB version
- Percona Backup for MongoDB (PBM) version
- Whether Percona Monitoring and Management (PMM) is enabled, and the PMM version
- Cluster size
- Whether the Operator is [deployed with Helm](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/helm.html)
- Whether [sidecar containers](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/sidecar.html) are used

The Operator does not gather anything that identifies a system. The Custom Resource ID is a unique ID that Kubernetes generates for each Custom Resource.

## Features in use

The Operator reports what features are in use. The Since column shows the Operator version that added each report.

| Feature                                                                                                                                                                                                                                                           | Since |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| [Sharding](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/sharding.html)                                                                                                                                                                            | 1.13  |
| [HashiCorp Vault](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/encryption.html#use-hashicorp-vault-to-store-and-manage-encryption-keys)                                                                                                           | 1.13  |
| [Cluster-wide mode](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/cluster-wide.html)                                                                                                                                                               | 1.13  |
| [Volume expansion](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling-storage-resize.html#resize-storage-yourself)                                                                                                                              | 1.19  |
| [Multi-cluster Services](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/replication-mcs.html)                                                                                                                                                       | 1.19  |
| [Custom MongoDB users](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/app-users.html#create-users-via-custom-resource) and [custom MongoDB roles](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/app-users.html#custom-mongodb-roles) | 1.19  |
| [Vector search](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/search-overview.html)                                                                                                                                                                | 1.24  |
| [Percona ClusterSync for MongoDB](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/clustersync.html) for this cluster                                                                                                                                 | 1.24  |
| [Data-at-rest encryption](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/encryption.html)                                                                                                                                                           | 1.24  |
| [Arbiter](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/arbiter.html#arbiter-nodes)                                                                                                                                                                | 1.24  |
| [Non-voting members](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/arbiter.html#non-voting-nodes)                                                                                                                                                  | 1.24  |
| [Transport Layer Security (TLS)](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/TLS.html) mode                                                                                                                                                      | 1.24  |
| Number of `mongos` Pods in a sharded cluster                                                                                                                                                                                                                      | 1.24  |

The TLS mode is one of the following:

- `disabled`
- `allowTLS`
- `preferTLS`
- `requireTLS`

## Backup configuration

The Operator reports the following about backups:

| Information                                                                                                      | Values                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Backups](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups.html) enabled                     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| [Point-in-time recovery](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pitr.html) enabled |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Backup storage type                                                                                              | - [Amazon S3](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage-s3.html) - S3-compatible storage (including MinIO) - [Azure Blob Storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage-azure.html) - [Google Cloud Storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage-gcp.html) - a [remote filesystem](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage-filesystem.html) - [Oracle Cloud Infrastructure (OCI) Object Storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage-oci.html) - [Alibaba Cloud Object Storage Service](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage-oss.html) |
| Scheduled backup type                                                                                            | Logical, physical, incremental, or [volume snapshot](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pvc-snapshots.html)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## Disable telemetry

You can disable telemetry with a special option when installing the Operator:

- if you [install the Operator with helm](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/helm.html), use the following installation command:

```
helm install my-db percona/psmdb-db --version 1.23.1 --namespace my-namespace --set disable_telemetry="true"
```

- if you don’t use helm for installation, you have to edit the `operator.yaml` before applying it with the `kubectl apply -f deploy/operator.yaml` command. Open the `operator.yaml` file with your text editor, find the value of the `DISABLE_TELEMETRY` environment variable and set it to `true`:

```
env:
  ...
  - name: DISABLE_TELEMETRY
    value: "true"
  ...
```
