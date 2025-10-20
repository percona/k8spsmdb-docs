# Percona Operator for MongoDB 1.20.1 ({{date.1_20_1}})

[Get started with the Operator :material-arrow-right:](../quickstart.md){.md-button}


## Release Highlights

This release of {{config.site_name}} fixes the failing backup that was caused by the Operator sending multiple requests to PBM. The issue was fixed by bypassing the cache for the backup controller and enabling direct communication with the API server for sending backup requests.

## Changelog

### Bugs Fixed

* [K8SPSMDB-1395](https://perconadev.atlassian.net/browse/K8SPSMDB-1395) - Fixed the issue with failing backups due to the Operator sending multiple backup requests based on the stale status data

## Supported software

The Operator was developed and tested with the following software:


* Percona Server for MongoDB 8.0.8-3, 7.0.18-11, and 6.0.21-18
* Percona Backup for MongoDB 2.9.1
* PMM Client 2.44.1
* cert-manager 1.17.2

Other options may also work but have not been tested. 


## Supported platforms

Percona Operators are designed for compatibility with all [CNCF-certified :octicons-link-external-16:](https://www.cncf.io/training/certification/software-conformance/) Kubernetes distributions. Our release process includes targeted testing and validation on major cloud provider platforms and OpenShift, as detailed below for Operator version {{release}}:

--8<-- [start:platforms]

* [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.30 - 1.32
* [Amazon Elastic Container Service for Kubernetes (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.30 - 1.32
* [OpenShift Container Platform :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.14 - 4.18
* [Azure Kubernetes Service (AKS) :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.30 - 1.32
* [Minikube :octicons-link-external-16:](https://github.com/kubernetes/minikube) 1.35.0 with Kubernetes 1.32.0

--8<-- [end:platforms]

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.

## Percona certified images

Find Percona’s certified Docker images that you can use with the Percona Operator for MongoDB in the following table:

**Images released with the Operator version {{release}}**:

--8<-- [start:images]

| Image                                                  | Digest                                                           |
|:-------------------------------------------------------|:-----------------------------------------------------------------|
| percona/percona-server-mongodb-operator:1.20.1         | b559cdd349916d806f6b13b4ac43fdbae982298fad2088b649631a356020ee46 |
| percona/percona-server-mongodb-operator:1.20.1 (ARM64) | 5a66e497dd1650e5a1123659292fe4c615e0ab5ce7e5d8437bf2101f91b625e1 |
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

