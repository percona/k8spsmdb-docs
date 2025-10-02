# Percona Operator for MongoDB 1.21.0 ({{date.1_21_0}})

[Get started with the Operator :material-arrow-right:](../quickstart.md){.md-button}

## Release Highlights

This release of {{config.site_name}} includes the following new features and improvements:

### Percona Server for MongoDB 8.0 is now the default version

For you to enjoy all features and improvements that come with the latest major version out of the box, the Operator now deploys the cluster with Percona Server for MongoDB 8.0 by default. You can always change the version to your desired one for the installation and update. Check the list of [Percona certified images](#percona-certified-images) for the database versions available for this release. For previous Operator versions, learn [how to query the Version Service](image-query.md) and retrieve the available images from it.

### PMM3 support

The Operator is natively integrated with PMM 3, enabling you to monitor the health and performance of your Percona Distribution for MongoDB deployment and at the same time enjoy enhanced performance, new features, and improved security that PMM 3 provides.

Note that the Operator supports both PMM2 and PMM3. The decision on what PMM version is used depends on the authentication method you provide in the Operator configuration: PMM2 uses API keys while PMM3 uses service account tokens. If the Operator configuration contains both authentication methods with non-empty values, PMM3 takes the priority.

To use PMM, ensure that the PMM client image is compatible with the PMM Server version. Check [Percona certified images](#percona-certified-images) for the correct client image.

For how to configure monitoring with PMM [see the documentation](../monitoring.md).

### Hidden nodes support

In addition to arbiters and non-voting nodes, you can now deploy hidden nodes in your Percona Server for MongoDB cluster. These nodes hold a full copy of the data but remain invisible to client applications. They are good for tasks like backups and reporting, since they access the data without affecting normal traffic.

Hidden nodes are added as voting members and can participate in primary elections. Therefore, the Operator enforces rules to ensure the number of voting members is odd and doesn't exceed seven, which is the maximum allowed number of voting members:

* If the total number of voting members is even, the Operator converts one node to non-voting to maintain an odd number of voters. The node to convert is typically the last Pod in the list.
* If the number of voting members is odd and not more than 7, all nodes participate in elections.
* If the number of voting members exceeds 7, the Operator automatically converts some nodes to non-voting to stay within MongoDB’s limit.

To inspect the current configuration, connect to the cluster with the `clusterAdmin` privileges and run the `rs.config().members` command.

## Support for Google Cloud Client library in PBM

The Operator comes with the latest PBM version 2.11.0, which includes the support of Google Cloud Client library and authentication with service account keys. 

To use Google Cloud Storage for backups with service account keys, you need to do the following:

1. Create a service account key 
2. Create a Secrets object with this key
3. Configure the storage in the Custom Resource

See the [Configure Google Cloud Storage](../backups-storage.md#configure-storage-for-backups) documentation for detailed steps.

The configuration of Google Cloud Storage with HMAC keys remains unchanged. However, this authentication method is deprecated and we encourage you to plan the migration to using service account keys.

## Improve operational resilience and observability with persistent cluster-level logging for MongoDB Pods

Debugging distributed systems just got easier. The Percona Operator for MongoDB now supports cluster-level logging, ensuring that logs from your `mongod` instances are stored persistently, even across Pod restarts.

Cluster-level logging is done with Fluent Bit, running as a sidecar container within each database Pods. 

Currently, logs are collected only for the `mongod` instances. All other logs are ephemeral, meaning they will not persist after a Pod restart. Logs are stored for 7 days and are rotated afterwards.

Learn more about cluster-level logging in the [documentation](../debug-logs.md#cluster-level-logging)

### Improved backup retention for streamlined management of scheduled backups in cloud storage

A new backup retention configuration gives you more control over how backups are managed in storage and retained in Kubernetes.

With the `deleteFromStorage` flag, you can disable automatic deletion from AWS S3 or Azure Blob storage and instead rely on native cloud lifecycle policies. This makes backup cleanup more efficient and better aligned with flexible storage strategies.

The legacy `keep` option is now deprecated and mapped to the new `retention` block for compatibility. We encourage you to start using the `backup.tasks.retention` configuration:

```yaml
spec:
  backup:
    tasks:
      - name: daily-s3-us-west
        enabled: true
        schedule: "0 0 ** *"
        retention:
          count: 3
          type: count
          deleteFromStorage: true
        storageName: s3-us-west
        compressionType: gzip
        compressionLevel: 6
```

### Improve operational efficiency with the support for concurrent cluster reconciliation

Reconciliation is a Kubernetes mechanism to keep your cluster in sync with its desired state. Previously, the Operator ran only one reconciliation loop at a time. This sequential processing meant that other clusters managed by the same Operator had to wait for the current reconciliation to complete before receiving updates.

With this release, the Operator supports concurrent reconciling and can process several clusters simultaneously. You can define the maximum number of concurrent reconciles as the environment variable for the Operator deployment.

This enhancement significantly improves scalability and responsiveness, especially in multi-cluster environments.

### Added labels to identify the version of the Operator

Custom Resource Definition (CRD) is compatible with the last three Operator versions. To know which Operator version is attached to it, we've added labels to all Custom Resource Definitions. The labels help you identify the current Operator version and decide if you need to update the CRD. 

To view the labels, run: 

```{.bash data-prompt="$"}
$ kubectl get crd perconaservermongodbs.psmdb.percona.com --show-labels
```

### View backup size

You can now see the size of each backup when viewing the backup list either via the command line or from Everest or other apps integrated with the Operator. This improvement makes it easier to monitor storage usage and manage your backups efficiently.

### Delegate PVC resizing to an external autoscaler

You can now configure the Operator to use an external storage autoscaler in instead of its own resizing logic. This ability may be useful for organizations needing centralized, advanced, or cross-application scaling policies.

To use an external autoscaler, set the `spec.enableExternalVolumeAutoscaling` option to `true` in the Custom Resource manifest.

### Deprecation, rename and removal

* The `backup.schedule.keep` field is deprecated and will be removed in future releases. We recommend using the `backup.schedule.retention` instead as follows:

   ```yaml
   schedule:
     - name: "sat-night-backup"
       schedule: "0 0 ** 6"
       retention:
         count: 3
         type: count
         deleteFromStorage: true
       storageName: s3-us-west
  ```

## Changelog

### New features

* [K8SPSMDB-297](https://perconadev.atlassian.net/browse/K8SPSMDB-297): Added cluster-wide logging with the Fluent Bit log collector
* [K8SPSMDB-1268](https://perconadev.atlassian.net/browse/K8SPSMDB-1268) - Added support for PMM v3.
* [K8SPSMDB-723](https://perconadev.atlassian.net/browse/K8SPSMDB-723) - Added the ability to add hidden members to MongoDB replica sets for specialized purposes.

### Improvements

- [K8SPSMDB-1072](https://perconadev.atlassian.net/browse/K8SPSMDB-1072) - Added the ability to configure retention policy for scheduled backups
* [K8SPSMDB-1216](https://perconadev.atlassian.net/browse/K8SPSMDB-1216) - Updated the command to describe the `mongod` instance role to `db.hello()`, which is the currently used one. 
- [K8SPSMDB-1243](https://perconadev.atlassian.net/browse/K8SPSMDB-1243) - Added the ability to pass PBM restore configuration options to the Operator.
- [K8SPSMDB-1261](https://perconadev.atlassian.net/browse/K8SPSMDB-1261) - Improved the test suite for physical backups to run on every supported platform individually.
* [K8SPSMDB-1262](https://perconadev.atlassian.net/browse/K8SPSMDB-1262) - Improved the test suite foron demand backups to run on OpenShift
- [K8SPSMDB-1272](https://perconadev.atlassian.net/browse/K8SPSMDB-1272) - The `helm upgrade` command now displays warnings to clarify when CRDs are not updated.
- [K8SPSMDB-1284](https://perconadev.atlassian.net/browse/K8SPSMDB-1284) - Clearer error messages are now displayed if a filesystem backup deletion fails.
- [K8SPSMDB-1285](https://perconadev.atlassian.net/browse/K8SPSMDB-1285) - CRDs now include labels that make it easy to identify their associated Operator version.
- [K8SPSMDB-1304](https://perconadev.atlassian.net/browse/K8SPSMDB-1304) - Added labels recommended by Kubernetes to the Operator deployment object
- [K8SPSMDB-1318](https://perconadev.atlassian.net/browse/K8SPSMDB-1318) - Added the ability to configure concurrent reconciles to speed up cluster reconciliation in setups where the Operator manages several database clusters.
- [K8SPSMDB-1319](https://perconadev.atlassian.net/browse/K8SPSMDB-1319) - Scheduled database backups now wait for the database to be healthy before starting, preventing unnecessary failures.
* [k8spsmdb-1339](https://perconadev.atlassian.net/browse/K8SPSMDB-1339) - Added validation for the selected restore time, preventing the point-in-time restore process from starting with an invalid date or time.
* [K8SPSMDB-1344](https://perconadev.atlassian.net/browse/K8SPSMDB-1344), [K8SPSMDB-871](https://perconadev.atlassian.net/browse/K8SPSMDB-871) - Added the ability to retrieve and store the backup size
- [K8SPSMDB-1398](https://perconadev.atlassian.net/browse/K8SPSMDB-1398) - Added the ability to configure the use of an external autoscaler (Thank you Terry for contribution)
- [K8SPSMDB-1412](https://perconadev.atlassian.net/browse/K8SPSMDB-1412) - Added the support for Google Cloud Storage with authentication via service account keys.

## Fixed bugs

- [K8SPSMDB-1154](https://perconadev.atlassian.net/browse/K8SPSMDB-1154) - MongoDB clusters using the `inMemory` storage engine now deploy correctly (Thank you user KOS for reporting this issue).
- [K8SPSMDB-1292](https://perconadev.atlassian.net/browse/K8SPSMDB-1292) - Fixed the issue with physical restores failing when TLS configuration is defined by using it to construct the correct MongoDB connection string URL. 
- [K8SPSMDB-1297](https://perconadev.atlassian.net/browse/K8SPSMDB-1297) - Exposed the data directory for the `pmm-client` sidecar container to enable it to gather required metrics.
* [K8SPSMDB-1308](https://perconadev.atlassian.net/browse/K8SPSMDB-1308) - Improved PBM restore logging to store logs for the latest restore in the `/data/db/pbm-restore-logs`.
- [K8SPSMDB-1336](https://perconadev.atlassian.net/browse/K8SPSMDB-1336) -  Logical backups can now be restored to a new cluster without encountering `Time monotonicity violation` errors or service restarts.
- [K8SPSMDB-1371](https://perconadev.atlassian.net/browse/K8SPSMDB-1371) - Physical point-in-time recovery using the `latest` type no longer crashes but gracefully fails the restore process when oplog data is unavailable.
- [K8SPSMDB-1400](https://perconadev.atlassian.net/browse/K8SPSMDB-1400) - Resolved an issue that caused physical restores to fail on AKS and EKS environments.
* [K8SPSMDB-1425](https://perconadev.atlassian.net/browse/K8SPSMDB-1425) - Restoring a MongoDB cluster with point-in-time recovery now succeeds even when source and target storage prefixes differ.
- [K8SPSMDB-1480](https://perconadev.atlassian.net/browse/K8SPSMDB-1480) - Fixed an issue that caused cluster errors when scaling replica sets resulted in an invalid number of voting members.

## Documentation improvements

* The [multi-cluster and multi-region deployment](../replication.md) section has been improved and expanded with the information about multi-cluster deployment and its value as well as how it works. It provides improved guidance on multi-cluster services, a step-by-step tutorial for enabling multi-cluster deployments on GKE, and revised instructions for deploying and interconnecting sites for replication. The docs also walk you through planned switchover and controlled failover procedures in disaster scenarios.

* Updated the [Scale Percona Server for MongoDB on Kubernetes](../scaling.md) topic with the information about the `pvc-resize-in-progress` annotation and how it works.

* Updated the [Configure backup storage](../backups-storage.md) with the Google Cloud Storage configuration.

* Configuration for config server split horizons is now accurately documented, simplifying multi-cluster deployments and external DNS integration.

* The [Data-at-rest encryption](../encryption.md) topic is updated with the correct steps for using HashiCorp Vault.

* New documentation is available detailing [important considerations for upgrading your Kubernetes cluster](../update-operator.md#considerations) before updating any Operator.

## Supported software

The Operator was developed and tested with the following software:

* Percona Server for MongoDB 6.0.21-18, 7.0.18-11, and 8.0.8-3. 
* Percona Backup for MongoDB 2.9.1.
* PMM Client: 2.44.1

Other options may also work but have not been tested. 


## Supported platforms

Percona Operators are designed for compatibility with all [CNCF-certified :octicons-link-external-16:](https://www.cncf.io/training/certification/software-conformance/) Kubernetes distributions. Our release process includes targeted testing and validation on major cloud provider platforms and OpenShift, as detailed below for Operator version {{release}}:

--8<-- [start:platforms]

* [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.30-1.32
* [Amazon Elastic Container Service for Kubernetes (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.30-1.32
* [OpenShift Container Platform :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.14 - 4.18
* [Azure Kubernetes Service (AKS) :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.30-1.32
* [Minikube :octicons-link-external-16:](https://github.com/kubernetes/minikube) 1.35.0 based on Kubernetes 1.32.0

--8<-- [end:platforms]

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.

## Percona certified images

Find Percona’s certified Docker images that you can use with the Percona Operator for MongoDB in the following table:

**Images released with the Operator version {{release}}**:

--8<-- [start:images]

| Image                                                  | Digest                                                           |
|:-------------------------------------------------------|:-----------------------------------------------------------------|
| percona/percona-server-mongodb-operator:1.20.0 (x86_64)| 01da3139b0f7f64a27f3642ca06581ea065a02891b13ce2375d61471011d6dd4 |
| percona/percona-server-mongodb-operator:1.20.0 (ARM64) | 26d885398af42d18928f51f070aff770df900eb5ddf46e3e0bc2570720089bb1 |
| percona/pmm-client:2.44.1                              | 8b2eaddffd626f02a2d5318ffebc0c277fe8457da6083b8cfcada9b6e6168616 |
| percona/pmm-client:2.44.1 (ARM64)                      | 337fecd4afdb3f6daf2caa2b341b9fe41d0418a0e4ec76980c7f29be9d08b5ea |
| percona/percona-backup-mongodb:2.9.1 (x86_64)          | 976bfbaa548eb70dd90bf0bd2dcfe40b2994d749ef644af3a0590f4856e4d7e2 |
| percona/percona-backup-mongodb:2.9.1 (ARM64)           | ebc6e5c5aa3ed97991d3fd90e9201597b485ddc0eae8d7ee4311ecb785c03bf0 |
| percona/percona-server-mongodb:8.0.8-3 (x86_64)        | e4580ca292f07fd7800e139121aea4b2c1dfa6aa34f3657d25a861883fd3de41 |
| percona/percona-server-mongodb:8.0.8-3 (ARM64)         | 96cfee2102499aba05e63ca7862102c2b1da1cf9f4eea0cbea3793a07c183925 |
| percona/percona-server-mongodb:8.0.4-1-multi (x86_64)  | 873b201ce3d66d97b1225c26db392c5043a73cc19ee8db6f2dc1b8efd4783bcf |
| percona/percona-server-mongodb:8.0.4-1-multi (ARM64)   | 222ccf746ad4ffdfccf41b41edaa0d318d28f663e13c9629f8dad5a5078434e5 |
| percona/percona-server-mongodb:7.0.18-11 (x86_64)      | 0115a72f5e60d86cb4f4b7eae32118c0910e8c96831e013de12798a1771c4c91 |
| percona/percona-server-mongodb:7.0.18-11 (ARM64)       | 86c17067f3e233f522612389ed2500231cbb22ce93524c476b9aa8d464d06f0b |
| percona/percona-server-mongodb:7.0.15-9-multi (x86_64) | 7bffdf2e71c121e2ab37b4fa7e2f513237abdd65266da384bf8197cee1316917 |
| percona/percona-server-mongodb:7.0.15-9-multi (ARM64)  | fdc4875df82572267445811445ebf517f63e509be54d1a2599fe58e1c525e1d8 |
| percona/percona-server-mongodb:7.0.14-8-multi (x86_64) | ed932d4e7231dcb793bf609f781226a8393aa8958b103339f4a503a8f70ed17e |
| percona/percona-server-mongodb:7.0.14-8-multi (ARM64)  | 052f84ee926ad9b5146f08a7e887820342d65b757a284c2f0ea8e937bb51cd7b |
| percona/percona-server-mongodb:7.0.12-7                | 7f00e19878bd143119772cd5468f1f0f9857dfcd2ae2f814d52ef3fa7cff6899 |
| percona/percona-server-mongodb:6.0.21-18 (x86_64)      | 579d2fdc617ea42ab2be8c2682955b489dbf49ab19771b7a5d9c77da4dd323e7 |
| percona/percona-server-mongodb:6.0.21-18 (ARM64)       | b9d2b7e8c4a97b2d20e2aaccfbd183f65f8ccd9f2ea13939515e18e02bc64871 |
| percona/percona-server-mongodb:6.0.19-16-multi (x86_64)| c8ff08c4b8a96679e2daf4845873fdd4d2c48646b84db19f0c5fe02e8f3808b4 |
| percona/percona-server-mongodb:6.0.19-16-multi (ARM64) | 6908b28ced260b762cd38a642c06dd802cbef0a43ab5f22afe7b583b234ebcec |
| percona/percona-server-mongodb:6.0.18-15-multi (x86_64)| d197ce16ab0eed6df25e632b92dea5ce448e549e02028f39b78f5730c2ffef36 |
| percona/percona-server-mongodb:6.0.18-15-multi (ARM64) | 7fd1d8f74f71dea6ad423e8e202a0617bdd1e8783f2b5cb071b5281685ce0adf |
| percona/percona-server-mongodb:6.0.16-13               | 1497e58e39497d8425ccd053898dc323338d6eb3f0e3c4c223f9d5a468da7931 |
| percona/percona-server-mongodb:6.0.15-12               | f12dd271d78cf3e70088fea0c420e8c03703457d8a5959b645053546bff94dea |


--8<-- [end:images]

Find previous version images in the [documentation archive :octicons-link-external-16:](https://docs.percona.com/legacy-documentation/)

