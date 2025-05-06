# Percona Operator for MongoDB 1.20.0 ({{date.1_20_0}})

[Get started with the Operator :material-arrow-right:](../quickstart.md){.md-button}


## Release Highlights

This release of {{config.site_name}} includes the following new features and improvements:

### Point-in-time recovery from any backup storage 

The Operator now natively supports [multiple backup storages](../multi-storage.md) inheriting this feature from Percona Backup for MongoDB (PBM). This enables you to make a point-in-time recovery from any backup stored on any storage - PBM and the Operator maintain the data consistency for you. And you no longer have to wait till the Operator reconfigures a cluster after you select a different storage for a backup or a restore. As a result, overall performance of your backup flow improves.

### Improve RTO with the added support of incremental physical backups (tech preview)

Using [incremental physical backups](../backup.md) in the Operator, you can now back up only the changes happened since the previous backup. Since increments are smaller in size than the whole backup, the backup completion is faster and you also save on the storage and data transfer costs. Using incremental backups and point-in-time recovery improves your recovery time objective (RTO).

You do need the base backup to start the incremental backup chain and you must make the whole chain from the same storage. Also, note that the `percona.com/delete-backup` finalizer and the [`.spec.backup.tasks.[].keep`](operator.md#backuptaskskeep) option apply for the incremental base backup but are ignore for subsequent incremental backups.

### Improved monitoring for clusters in multi-region or multi-namespace deployments in PMM

Now you can define a custom name for your clusters deployed in different data centers. This name helps Percona Management and Monitoring (PMM) Server to correctly recognize clusters as connected and monitor them as one deployment. Similarly, PMM Server identifies clusters deployed with the same names in different namespaces as separate ones and correctly displays performance metrics for you on dashboards. 

To assign a custom name, define this configuration in the Custom Resource manifest for your cluster:

```yaml
spec:
  pmm:
    customClusterName: mongo-cluster
```


## Changelog

### New Features

* [K8SPSMDB-1237](https://perconadev.atlassian.net/browse/K8SPSMDB-1237) - Added support for incremental physical backups

* [K8SPSMDB-1329](https://perconadev.atlassian.net/browse/K8SPSMDB-1329) -  Allowed setting loadBalancerClass service type and using a custom implementation of a load balancer rather than the cloud provider default one.  

### Improvements

* [K8SPSMDB-621](https://perconadev.atlassian.net/browse/K8SPSMDB-621) - Set `PBM_MONGODB_URI` env variable in PBM container to avoid defining it for every shell session and improve setup automation (Thank you Damiano Albani for reporting this issue)

* [K8SPSMDB-1219](https://perconadev.atlassian.net/browse/K8SPSMDB-1219) - Improved the support of multiple storages for backups by using the  Multi Storage support functionality in PBM. This enables users to make point-in-time recovery from any storage

* [K8SPSMDB-1223](https://perconadev.atlassian.net/browse/K8SPSMDB-1223) Improve the `MONGODB_PBM_URI` connection string construction by enabling every `pbm-agent` to connect to local mongoDB directly

* [K8SPSMDB-1226](https://perconadev.atlassian.net/browse/K8SPSMDB-1226) - Documented how to pass custom configuration for PBM

* [K8SPSMDB-1234](https://perconadev.atlassian.net/browse/K8SPSMDB-1234) - Added the ability to use non default ports 27017 for MongoDB cluster components: `mongod`, `mongos` and `configsvrReplSet` Pods

* [K8SPSMDB-1236](https://perconadev.atlassian.net/browse/K8SPSMDB-1236) - Added a check for a username to be unique when defining it via the Custom Resource manifest

* [K8SPSMDB-1253](https://perconadev.atlassian.net/browse/K8SPSMDB-1253) - Made the SmartUpdate the default update strategy

* [K8SPSMDB-1276](https://perconadev.atlassian.net/browse/K8SPSMDB-1276) - Added logic to the getMongoUri function to compare the content of the existing TLS and CA certificate files with the secret data. Files are only overwritten if the data has changed, preventing redundant writes and ensuring smoother operations during backup checks. (Thank you Anton Averianov for reporting and contributing to this issue)

* [K8SPSMDB-1316](https://perconadev.atlassian.net/browse/K8SPSMDB-1316) - Added the ability to define a custom cluster name for `pmm-admin` component

* [K8SPSMDB-1325](https://perconadev.atlassian.net/browse/K8SPSMDB-1325) Added the `directShardOperations` role for a `mongo` user used for monitoring MongoDB 8 and above

* [K8SPSMDB-1337](https://perconadev.atlassian.net/browse/K8SPSMDB-1337) Add imagePullSecrets for PMM and backup images


### Bugs Fixed

* [K8SPSMDB-1197](https://perconadev.atlassian.net/browse/K8SPSMDB-1197) - Fixed the healthcheck log rotation routine to delete log file created 1 day before.

* [K8SPSMDB-1231](https://perconadev.atlassian.net/browse/K8SPSMDB-1231) - Fixed the issue with a single-node cluster to temporarily report the Error state during initial provisioning by ignoring the `No mongod containers in running state` error.

* [K8SPSMDB-1239](https://perconadev.atlassian.net/browse/K8SPSMDB-1239) - Fixed the issue with cron jobs running simultaneously 

* [K8SPSMDB-1245](https://perconadev.atlassian.net/browse/K8SPSMDB-1245) - Improved Telemetry for cluster-wide deployments to handle both an empty value and a comma-separated list of namespaces

* [K8SPSMDB-1256](https://perconadev.atlassian.net/browse/K8SPSMDB-1256) - Fixed the issue with PBM failing with the `length of read message too large` error by verifying the existence of TLS files when constructing the `PBM_MONGODB_URI` connection string URI

* [K8SPSMDB-1263](https://perconadev.atlassian.net/browse/K8SPSMDB-1263) - Fixed the issue with the Operator losing connection to `mongod` pods during backup and throwing an error by retrying to connect and proceed with the backup 

* [K8SPSMDB-1274](https://perconadev.atlassian.net/browse/K8SPSMDB-1274) - Disable balancer before logical restore to meet the PBM restore requirements  

* [K8SPSMDB-1275](https://perconadev.atlassian.net/browse/K8SPSMDB-1275) - Fixed the issue with the Operator failing when the `getLastErrorModes` write concern value is set for a replica set by using the data type for a value that matches MongoDB behavior (Thank you user `clrxbl` for reporting and contributing to this issue)

* [K8SPSMDB-1294](https://perconadev.atlassian.net/browse/K8SPSMDB-1294) - Fixed the API mismatch error with the multi-cluster Services (MCS) enabled in the Operator by using the `DiscoveryClient.ServerPreferredResources` method to align with the `kubectl` behavior.

* [K8SPSMDB-1302](https://perconadev.atlassian.net/browse/K8SPSMDB-1302) - Fixed the issue with the Operator being stuck during physical restore when the update strategy is set to SmartUpdate

* [K8SPSMDB-1306](https://perconadev.atlassian.net/browse/K8SPSMDB-1306) - Fixed the Operator panics if a user configures PBM priorities without timeouts

* [K8SPSMDB-1347](https://perconadev.atlassian.net/browse/K8SPSMDB-1347) - Fixed the issue with the Operator throwing errors when auto generating password for multiple users by properly updating the secret after a password generation

## Known limitations


## Supported software

The Operator was developed and tested with the following software:

* Percona Server for MongoDB 6.0.21-18, 7.0.18-11, and 8.0.8-3. 
* Percona Backup for MongoDB 2.9.1.

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
| percona/percona-server-mongodb-operator:1.20.0 (x86_64)| 8636e0966969b9aef4055f52f3ed139a3057790dcc59332652772d5b28f0e047 |
| percona/percona-server-mongodb-operator:1.20.0 (ARM64) | 99d3bdede540d638036e0e9fd7f1db18b14da751d77f78a5e1bd612607b02486 |
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

