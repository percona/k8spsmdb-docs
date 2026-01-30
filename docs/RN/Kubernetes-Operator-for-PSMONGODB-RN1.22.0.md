# Percona Operator for MongoDB 1.22.0 ({{date.1_22_0}})

[Get started with the Operator :material-arrow-right:](../quickstart.md){.md-button}
[Upgrade :material-arrow-right:](../update.md){.md-button}

## What's new at a glance

* [Deprecated support for Percona Server for MongoDB 6.0](#deprecated-support-for-percona-server-for-mongodb-60)

### Backup and restore

* [Restore into clusters with different replica set names using remapping](#restore-to-a-cluster-with-different-replica-set-names)
* [Configure a longer PBM startup deadline to prevent false backup failures](#configurable-deadline-for-pbm-to-start-backups)
* [Use native MinIO support for S3-compatible storage](#native-minio-support-as-a-backup-storage)
* [Verify TLS for S3 storage with your own CA certificates (MinIO type)](#use-your-own-ca-certificates-for-tls-verification-with-custom-s3-storage)
* [Track PBM readiness via the new `PBMReady` status condition](#cluster-readiness-now-reflects-pbm-state)

### Operations

* [Automatically resize PVCs based on usage thresholds](#automatic-storage-resizing)
* [Configure log rotation for persistent logs](#configure-log-rotation-for-persistent-logs)
* [Define custom environment variables for `mongod`, `mongos`, and `logcollector`](#ability-to-define-custom-environment-variables)
* [Run pre-start `hookScript` logic for `mongod`, `mongos`, and `pbm-agent`](#hook-script-support)

### Automation and integrations

* [Better service mesh compatibility with automatic `appProtocol: mongo` on services](#ensure-smooth-integration-with-service-meshes)
* [Improved GitOps workflows via automated CRD upgrades from a dedicated Helm chart](#automatic-crd-updates-for-helm-installations)
* [Disable authentication for dev/test environments to speed up setup](#speed-up-development-or-testing-pipelines-by-disabling-authentication)
* [Integrate with HashCorp Vault for system users management](#)

## Release Highlights

### Deprecated support for Percona Server for MongoDB 6.0

The Operator deprecates the support of Percona Server for MongoDB 6.0 as this major version entered end-of-life stage. You can still run Percona Server for MongoDB 6.0 in the Operator and existing functionality remains compatible. However, we will no longer test new features and improvements against this version.

Percona Server for MongoDB 6.0 will be removed from the Operator in version 1.23.0. 

### Ensure smooth integration with service meshes

The Operator now supports the Kubernetes `appProtocol` field and automatically sets the `mongo` application layer protocol on all services.

For users running MongoDB with service meshes like Istio, this enhancement ensures that the mesh can correctly recognize and interpret MongoDB traffic. The result is reliable cluster formation and secure mutual TLS (mTLS) connections in Kubernetes environments.

With this enhancement, you gain the full benefits of service meshes such as advanced traffic management, observability, and stronger security without manual configuration or workarounds.

### Restore to a cluster with different replica set names

You can now make physical and logical restores to clusters with different replica set names using the Operator. This feature builds on the [implementation in Percona Backup for MongoDB :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/features/restore-remapping.html?h=remapp#restoring-into-a-cluster-replica-set-with-a-different-name) and is now embedded directly into the Operator.

To make a restore, define source and target replica set mappings directly in your `PerconaServerMongoDBRestore` object:

```yaml
apiVersion: psmdb.percona.com/v1
kind: PerconaServerMongoDBRestore
metadata:
  name: restore-with-remapping
spec:
  clusterName: some-name-target
  backupName: backup1
  replsetRemapping:
    shard0: rs0
    shard1: rs1
    csReplSet: cfg
```

Define mappings as key-value pairs where the key is the source replica set name and the value is the target replica set name. Read more about how to set it up in the [documentation](../backups-restore-replset-remapping.md).

This enhancement expands the number of environments where restores are possible, making recovery more flexible and reliable.

### Speed up development or testing pipelines by disabling authentication

You can now disable authentication in Percona Server for MongoDB clusters managed by the Operator. This helps you:

* Simplify setup in local environments and speed up development
* Simplify migration from external MongoDB instances that don’t use authentication
* Debug authentication issues without credential complexity
* Connect applications that don't support MongoDB authentication

Disable authentication by adding `security.authorization: disabled` to your MongoDB component configuration in the Custom Resource. For sharded clusters, set this for each replica set, the config server replica set, and `mongos`. See the [documentation](../auth-disable.md) for preconditions and step-by-step guidance.

Note that disabling authentication poses security risk, that's why use this feature with caution.

### Ability to define custom environment variables

You can now use environment variables to parameterize and control database Pod behavior without hardcoding values in manifests.

This is useful when you need to:

* Align container behavior with your platform (cache size settings, time zone, locale)
* Pass non-sensitive runtime flags to custom entrypoints
* Provide credentials or third-party API tokens from a Secret without baking them into images

You can set environment variables for `mongod`, `mongos`, and `logcollector` containers in these ways:

* Directly in the Custom Resource
* Via a ConfigMap
* Via a Secret

Custom environment variables make deployments flexible, reproducible, and environment-aware. Instead of maintaining separate manifests for each environment, you inject variables dynamically.

See our [documentation](../env-vars-cluster.md) on how to define custom environment variables.

### Automatic CRD updates for Helm installations

By default all components for the Operator Deployment are installed from the same Helm repository. To prevent accidental CRD updates, Helm v3 doesn't automatically update the CRDs during the upgrade, and you must update them manually, after you update the Operator deployment.

Starting with version 1.22.0, the Operator has a separate `psmdb-operator-crds` chart for CRDs. This lets you:

* Manage CRDs with Helm instead of updating them manually, reducing overhead and human error
* Ensure compatibility with GitOps tools like ArgoCD and FluxCD that expect Helm to manage all resources
* Take advantage of Helm’s version control and rollback capabilities

You can use the CRD chart on new installs and add it to your upgrade workflow. See the [upgrade documentation](../update-operator.md) for step-by-step instructions.

This change is fully compatible with the previous behavior, where CRDs are installed from the `crds/` folder of the main Helm repository. We keep this behavior as default for the next three releases to give you more time to adjust your workflows and update.

### Configure log rotation for persistent logs

You can now customize log rotation for persistent logs. This helps you keep the right amount of data for troubleshooting or compliance, rotate additional files like audit logs, and schedule rotations to fit your operational windows.

You can configure log rotation in these ways:

* Override the default configuration via the Custom Resource
* Define additional configuration via a ConfigMap or a Secret. In this case, the Operator adds your options to the default configuration
* Set a new rotation schedule

See our [documentation](../logrotate.md) for step-by-step instructions for each option.

### Configurable deadline for PBM to start backups

You can now configure how long the Operator waits for PBM to report that a backup has begun. Instead of relying on a fixed timeout of 120 seconds, you can tune this value to match your cluster's performance characteristics.

This deadline is controlled by the `startingDeadlineSeconds` option in the Custom Resource.

With this improvement, you:

* Reduce false backup failures when PBM starts slowly under load
* Give PBM enough time to start in environments with limited CPU or memory
* Get more predictable backup flows where PBM and the Operator stay in sync
* Reduce the risk of OOM errors during backups

### Native MinIO support as a backup storage

The Operator now includes native support for MinIO and other S3-compatible storage services through the MinIO Go client. It also adds the `minio` storage type, aligning with recent PBM changes. This addition helps avoid connectivity and compatibility issues when S3-compatible services don't support Signature Version 4 (SigV4) used in AWS SDK v2.

If your S3-compatible storage shows connectivity issues or depends on older signing mechanisms, consider switching to the `minio` storage type.

Adjust your Custom Resource configuration as follows:

```yaml
minio:
  type: minio
  minio:
    bucket: MINIO-BACKUP-BUCKET-NAME-HERE
    region: us-east-1
    credentialsSecret: my-cluster-name-backup-minio
    endpointUrl: minio.psmdb.svc.cluster.local:9000/minio/
    insecureSkipTLSVerify: false
    prefix: ""
    secure: false
```
 
The use of the `minio` storage type offers a more stable and straightforward configuration for custom S3 storage services. It also keeps your Operator setup aligned with PBM's current behavior.

### Use your own CA certificates for TLS verification with custom S3 storage

You can now use your organization’s custom Certificate Authority (CA) to securely verify TLS communication with S3 storage during backups and restores.

The configuration is straightforward: create the Secret that stores your custom CA and certificates to authorize in the S3 storage. Then reference this Secret and specify the CA certificate in the `caBundle` option in the Custom Resource. The Operator will verify TLS communication against it.

Note that you must use the `minio` storage type for your S3-compatible storage services. Read more about this storage type in the [Native MinIO support as a backup storage](#native-minio-support-as-a-backup-storage) section.

Here's the example configuration:

```yaml
backup:
  storages:
    minio:
      type: minio
      minio:
        caBundle:
           name: minio-ca-bundle
           key: ca.crt
```

You can specify several storages and use custom CA certificates with each. In this case, the Operator merges the certificates into a single file, which is used for secure communication with the respective storage.

With this improvement, you ensure the following:

* Security without compromise – no more bypassing identity checks.
* Alignment with your internal standards – use the CA your company already trusts.
* Confidence in backup and restore flows – every S3 interaction is properly verified.

Read more about the use of own CA certificates in our [documentation](../backups-storage-minio.md#configure-tls-verification-with-custom-certificates-for-s3-storage).

### Hook Script support

A new `hookScript` option lets you run a custom shell script before `mongod`, `mongos`, or a `pbm-agent` starts, without maintaining custom images or modifying the Operator code. You can define the script inline or provide it via a ConfigMap. The script runs inside the container and can block startup if it exits with a non-zero status. See the [documentation](../hookscript.md) for setup details.

`hookScript` is supported across all major components: replica set members, hidden, arbiter, and non-voting nodes, the config server replica set, `mongos` Pods, and `pbm-agent` containers.

This feature is intended for environments that require additional startup logic. An example of such logic can be retrieving external secrets, enforcing security checks, adjusting configuration files, or registering nodes in external systems. It lets you adapt startup behavior while keeping the deployment fully managed by the Operator.

### Automatic storage resizing

Starting with version 1.22.0, the Operator can automatically resize Persistent Volume Claims (PVCs) for replica sets and config server Pods based on your configured thresholds. The Operator monitors storage usage and when it exceeds the defined threshold, triggers resizing until it reaches the maximum storage size. This gives you:

* Fewer outages from full disks because storage grows with demand
* Less guesswork in capacity planning and fewer last-minute fixes
* Lower operational effort for developers and platform engineers
* Cost control by expanding only when needed
* A more predictable environment so teams can focus on delivery

To enable automatic storage resizing, edit the Custom Resource manifest as follows:

```yaml
spec:
  storageScaling:
    enableVolumeScaling: true
    autoscaling:
      enabled: true
      triggerThresholdPercent: 80
      growthStep: 2Gi
      maxSize: "10Gi"
```

Learn more about the workflow and troubleshooting tips in our [documentation](../scaling.md#automatic-storage-resizing).

### Cluster readiness now reflects PBM state

The `PerconaServerMongoDB` Custom Resource status now includes a new `PBMReady` condition. It provides a clear, stable signal that PBM has finished processing all configured storages, so automation tools can reliably trigger backups and other operations.

To check the status, use either the `kubectl describe psmdb <cluster-name>` or `kubectl get psmdb <cluster-name> -o yaml` command.

During initialization or configuration changes, the `PBMReady` condition is `false` and you clearly see the reason.

```yaml
- type: PBMReady
  status: "False"
  reason: PBMConfigurationIsChanged
  lastTransitionTime: "2025-12-24T09:06:20Z"
```

Once PBM is fully configured and any required resync is complete, the condition changes to `true`:

```yaml
- type: PBMReady
  status: "True"
  reason: PBMConfigurationIsUpToDate
  lastTransitionTime: "2025-12-24T09:06:40Z"
```

### Vault integration for system user password management

You can now integrate the Operator with HashiCorp Vault for system user password management. This allows organizations to centralize password management while keeping the Operator responsible for applying those passwords to the database.

When this integration is enabled, the Operator authenticates to Vault using either the Kubernetes authentication method or a Vault token. It retrieves system user passwords during cluster creation and generates the corresponding Kubernetes Secret from this data. The Operator periodically checks Vault for password changes and updates the Secret when differences are detected. If Vault is temporarily unavailable or the Operator cannot retrieve the passwords, it logs the event and continues cluster reconciliation to ensure the cluster availability.

Organizations benefit from this integration when they need:

- Centralized credential governance
- Auditable password rotation
- Compliance with internal security policies
- Separation of duties (DBA vs. security team)
- Consistent password lifecycle management across environments

Vault becomes the single source of truth, while the Operator ensures Percona Server for MongoDB always uses the correct credentials.

Learn more about the workflow and the setup in our [documentation](../system-users-vault.md).


## Deprecation, rename and removal

**Deprecated (will be removed in 1.25.0):**

* The `spec.enableVolumeExpansion` option is deprecated. It remains working for backward compatibility but it will be removed in version 1.25.0. Use the `enableVolumeScaling` option under the `spec.storageScaling` subsection instead.
* The `spec.enableExternalVolumeAutoscaling` option is deprecated. It remains working for backward compatibility but it will be removed in version 1.25.0. Use the `enableExternalAutoscaling` option under the `spec.storageScaling` subsection instead.

   After the upgrade, reconfigure your Custom Resource to use the new structure.

## CRD Changes

* The `.spec.startingDeadlineSeconds` option has now a minimum value of 1 and the default value of 120

## Changelog

### New Features

* [K8SPSMDB-1418](https://perconadev.atlassian.net/browse/K8SPSMDB-1418)- Added the ability to load custom SSL certificates for backup operations to S3 storage. This enables secure communication with S3-compatible storage using the certificates approved and trusted by your company

* [K8SPSMDB-1419](https://perconadev.atlassian.net/browse/K8SPSMDB-1419) - Added the ability to restore data to clusters with different replica set names than the original source via the replica set remapping support

* [K8SPSMDB-1472](https://perconadev.atlassian.net/browse/K8SPSMDB-1472) - Added the ability to automatically resize PVC based on user-defined thresholds

* [K8SPSMDB-1503](https://perconadev.atlassian.net/browse/K8SPSMDB-1503) - Improved Split Horizon support by automatically including specified horizon domains in certificates generated by the Operator, eliminating manual TLS configuration steps.

* [K8SPSMDB-1531](https://perconadev.atlassian.net/browse/K8SPSMDB-1531) - Added the ability to define and execute custom scripts at specific lifecycle events of a container via the `hookScript` support. 

* [K8SPSMDB-1548](https://perconadev.atlassian.net/browse/K8SPSMDB-1548) Added the ability to specify custom environment variables for containers for cluster components via the Custom Resource. This provides more granular control over container configurations.

### Improvements

* [K8SPSMDB-1062](https://perconadev.atlassian.net/browse/K8SPSMDB-1062) - Added the `appProtocol` support to Service objects, improving compatibility with service meshes and ingress controllers that require explicit protocol definitions.

* [K8SPSMDB-1410](https://perconadev.atlassian.net/browse/K8SPSMDB-1410) - Enhanced backup status visibility by adding a specific condition to indicate when PBM initialization and storage resync are complete. This enables external tools to safely trigger backups

* [K8SPSMDB-1445](https://perconadev.atlassian.net/browse/K8SPSMDB-1445) - Updated base images to RHEL 10, ensuring the Operator benefits from the latest OS-level security patches and performance improvements.

* [K8SPSMDB-1448](https://perconadev.atlassian.net/browse/K8SPSMDB-1448) - Integrated HashiCorp Vault for system user credentials management, enabling you to store and manage them in a centralized place. The Operator securely fetches and manages database passwords from a central Vault instance during cluster creation.

* [K8SPSMDB-1451](https://perconadev.atlassian.net/browse/K8SPSMDB-1451) Fix replica set init checking

* [K8SPSMDB-1470](https://perconadev.atlassian.net/browse/K8SPSMDB-1470) - Automated Custom Resource Definitions (CRDs) updates during chart upgrades by creating a dedicated CRD Helm chart and adding it as a dependency to the main chart. 

* [K8SPSMDB-1518](https://perconadev.atlassian.net/browse/K8SPSMDB-1518) Added the ability to customize logrotate configuration. This gives users the flexibility to define their own rotation rules and retention policies.

* [K8SPSMDB-1520](https://perconadev.atlassian.net/browse/K8SPSMDB-1520) - Added native MinIO support for backup storage, utilizing the MinIO Go client to improve compatibility with S3-compatible services that do not support SigV4 used in AWS SDK 2

* [K8SPSMDB-1532](https://perconadev.atlassian.net/browse/K8SPSMDB-1532) - Added support for revisionHistoryLimit in Helm charts, allowing users to control how many old ReplicaSets are retained by Kubernetes for easier rollbacks and cleaner environments.

* [K8SPSMDB-1539](https://perconadev.atlassian.net/browse/K8SPSMDB-1539) - Improved the Helm chart by adding a `namespaceOverride` field to the `values.yaml` file. This improvement allows users to explicitly configure the deployment namespace within their values file, providing greater flexibility for managing resources in environments where the target namespace differs from the default Helm installation namespace.

### Bugs Fixed

* [K8SPSMDB-1208](https://perconadev.atlassian.net/browse/K8SPSMDB-1208) - Fixed a deletion deadlock where clusters stuck in the "initializing" state (due to unschedulable pods) could not be removed from the namespace

* [K8SPSMDB-1296](https://perconadev.atlassian.net/browse/K8SPSMDB-1296) - Fixed a bug where MongoDB pods were incorrectly marked as "Ready" while still in the initial sync (STARTUP2) state. The health check logic now correctly identifies the STARTUP2 state as unready, ensuring that pods only receive traffic once they are fully synchronized with the replica set.

* [K8SPSMDB-1359](https://perconadev.atlassian.net/browse/K8SPSMDB-1359) - Added the ability to disable authentication for non-production or testing environments by using a Custom Resource. (Thank you Abdullah Alaqeel for reporting this issue)

* [K8SPSMDB-1387](https://perconadev.atlassian.net/browse/K8SPSMDB-1387) - Resolved a startup failure that occurred when cert-manager was configured with the --enable-certificate-owner-ref option, which previously blocked MongoDB clusters from starting

* [K8SPSMDB-1390](https://perconadev.atlassian.net/browse/K8SPSMDB-1390) - Reduced log noise by stopping the Operator from incorrectly reporting and attempting to delete "outdated backup jobs" for the wrong clusters in shared namespaces. 

* [K8SPSMDB-1429](https://perconadev.atlassian.net/browse/K8SPSMDB-1429) - Fixed a race condition during restores in sharded clusters, where a restore task would fail if triggered immediately after all StatefulSets reported `ready` but before the cluster state was fully stabilized.

* [K8SPSMDB-1431](https://perconadev.atlassian.net/browse/K8SPSMDB-1431) - Improved error reporting for backup configuration, ensuring the cluster enters an "Error" state if a referenced backup storage secret is missing, rather than reporting a misleading "Ready" status.

* [K8SPSMDB-1466](https://perconadev.atlassian.net/browse/K8SPSMDB-1466) - Fixed an Operator crash caused by stale discovery information in environments using Kubernetes Multi-Cluster Services (MCS), improving stability for multi-cluster deployments.

* [K8SPSMDB-1477](https://perconadev.atlassian.net/browse/K8SPSMDB-1477) - Fixed a bug where scheduled backups were not deleted due to a change in the ancestor label format. The Operator now correctly recognizes both old and new labels, ensuring that orphaned backup resources are properly cleaned up to prevent unnecessary storage consumption.

* [K8SPSMDB-1488](https://perconadev.atlassian.net/browse/K8SPSMDB-1488) - Ensured PBM configuration updates when credentials in the storage secret are modified, correctly triggering a resync for MinIO and other S3-compatible storage types.

* [K8SPSMDB-1493](https://perconadev.atlassian.net/browse/K8SPSMDB-1493) - Fixed a synchronization deadlock between backups and SmartUpdate operations, where a backup in the "requested" state could indefinitely block a cluster update.

* [K8SPSMDB-1524](https://perconadev.atlassian.net/browse/K8SPSMDB-1524) - Fixed a bug where missing the `region` parameter in S3 storage configurations caused the pbm-agent to enter an infinite resynchronization loop. The Operator now makes the `region` field mandatory for S3-compatible storages and uses a default values for those that don't require the region to ensure stable configuration detection and prevent backup delays.

* [K8SPSMDB-1527](https://perconadev.atlassian.net/browse/K8SPSMDB-1527) - Added the `PBMReady` condition to the cluster status to ensure the Operator only marks a cluster as ready once Percona Backup for MongoDB  is fully initialized and operational.

* [K8SPSMDB-1541](https://perconadev.atlassian.net/browse/K8SPSMDB-1541) - Restored support for Primary-Secondary-Arbiter (PSA) architectures, resolving an issue where arbiter nodes were not correctly handled by the Operator logic.

* [K8SPSMDB-1542](https://perconadev.atlassian.net/browse/K8SPSMDB-1542) - Added a configurable PBM starting deadline, allowing users to adjust the timeout for backups in the "starting" phase to suit their network and storage performance.

* [K8SPSMDB-1552](https://perconadev.atlassian.net/browse/K8SPSMDB-1552) - Fixed the issue with the Operator reporting the panic state if Secret retrieval fails

* [K8SPSMDB-1553](https://perconadev.atlassian.net/browse/K8SPSMDB-1553) - Preserved annotations during PVC resizing, ensuring that the `kubectl.kubernetes.io/restartedAt` annotation is not lost when a StatefulSet is recreated to accommodate volume expansion.

[K8SPSMDB-1560](https://perconadev.atlassian.net/browse/K8SPSMDB-1560) - Fixed a bug where log rotation incorrectly produced duplicate files, resolving issues with unnecessary storage growth. The updated logic ensures only a single log file is generated and changes the default rotation schedule from hourly to daily for more efficient resource management.

* [K8SPSMDB-1561](https://perconadev.atlassian.net/browse/K8SPSMDB-1561) - Mounted the PVC to the PMM3 container. This enables the node_exporter running in the pmm-client container to collect metrics on the database's persistent volume. (Thank you Stephen Foulkes for contributing to this issue)


## Supported software

The Operator was developed and tested with the following software:

* Percona Server for MongoDB 6.0.27-21, 7.0.28-15, and 8.0.17-6
* Percona Backup for MongoDB 2.11.0
* PMM Client: 2.44.1-1
* PMM3 Client: 3.5.0
* cert-manager: 1.18.2
* LogCollector based on fluent-bit 4.0.1

Other options may also work but have not been tested.

## Supported platforms

Percona Operators are designed for compatibility with all [CNCF-certified :octicons-link-external-16:](https://www.cncf.io/training/certification/software-conformance/) Kubernetes distributions. Our release process includes targeted testing and validation on major cloud provider platforms and OpenShift, as detailed below:

--8<-- [start:platforms]

* [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.31 - 1.33
* [Amazon Elastic Kubernetes Service (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.31 - 1.34
* [Azure Kubernetes Service (AKS) :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.31 - 1.33
* [OpenShift Container Platform :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.16 - 4.19
* [Minikube :octicons-link-external-16:](https://github.com/kubernetes/minikube) 1.37.0 based on Kubernetes v1.34.0

--8<-- [end:platforms]

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.

## Percona certified images

Find Percona's certified Docker images that you can use with the Percona Operator for MongoDB in the following table:

--8<-- [start:images]

| Image                                                        | Digest                                                           |
|:-------------------------------------------------------------|:-----------------------------------------------------------------|
| percona/percona-server-mongodb:8.0.17-6                      | ae6380469f6b73d3517ec4eae7b2f12ff6310dc2deae8e52fe514276c45e9440 |
| percona/percona-server-mongodb:8.0.17-6 (ARM64)              | f1170f8bf68d051816cd4d956ca1f6ee9885c6cf0e1e5db5dc00a137af3603ee |
| percona/percona-server-mongodb:7.0.28-15                     | d131a4375c3e669f97da6cdf5eef847099c731fd956341345f37e6e6fb68d699 |
| percona/percona-server-mongodb:7.0.28-15 (ARM64)             | 6bc8ee24a7e60ec8ef32002165584320b9cc0eb6067a5f304cee6f1ea708f9b3 |
| percona/percona-server-mongodb:6.0.27-21                     | 2bd82853fd207ecadc8e5cd3ee598db7b9943f6976d9ae2140f5bdc997b0e8bb |
| percona/percona-server-mongodb:6.0.27-21 (ARM64)             | a23e4fa1b956299fb7403eef70082b13b3ecf75e51bba12f674f552508a42d61 |
| percona/percona-backup-mongodb:2.11.0                        | d09f5de92cfbc5a7a42a8cc86742a07481c98b3b42cffdc6359b3ec1f63de3a5 |
| percona/percona-backup-mongodb:2.11.0 (ARM64)                | a60d095439537b982209582d428b3b39a01e31e88b2b62d2dcbd99ea4e2d9928 |
| percona/pmm-client:2.44.1-1                                  | 52a8fb5e8f912eef1ff8a117ea323c401e278908ce29928dafc23fac1db4f1e3 |
| percona/pmm-client:2.44.1-1 (ARM64)                          | 390bfd12f981e8b3890550c4927a3ece071377065e001894458047602c744e3b |
| percona/pmm-client:3.5.0                                     | 352aee74f25b3c1c4cd9dff1f378a0c3940b315e551d170c09953bf168531e4a |
| percona/pmm-client:3.5.0 (ARM64)                             | cbbb074d51d90a5f2d6f1d98a05024f6de2ffdcb5acab632324cea4349a820bd |
| percona/fluentbit:4.0.1                                      | a4ab7dd10379ccf74607f6b05225c4996eeff53b628bda94e615781a1f58b779 |
| percona/percona-server-mongodb-operator:1.21.2               | 76d59626914f4d18eb0c19d8e31d2480f7a358daa3ded777cafb7e3717c7508d |
| percona/percona-server-mongodb-operator:1.21.2 (ARM64)       | b6adecc41de81f69a4faf552aeca31c06411f012378be248ead70a538c8ea365 |

--8<-- [end:images]

Find previous version images in the [documentation archive :octicons-link-external-16:](https://docs.percona.com/legacy-documentation/)
