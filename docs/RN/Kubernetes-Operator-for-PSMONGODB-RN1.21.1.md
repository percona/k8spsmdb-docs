# Percona Operator for MongoDB 1.21.1 ({{date.1_21_1}})

[Get started with the Operator :material-arrow-right:](../quickstart.md){.md-button}

## Release Highlights

This release resolves the MongoDB connection leak issue that occurred during PBM operations. It also addresses issues with the Operator’s retrieval and display of the PBM version.

## Changelog

### Fixed bugs

- [K8SPSMDB-1504](https://perconadev.atlassian.net/browse/K8SPSMDB-1504) - Fixed connection leaks issue during PBM operations and the Operator crashing with out-of-memory error by properly closing connections after the PBM operation is complete.
- [K8SPSMDB-1506](https://perconadev.atlassian.net/browse/K8SPSMDB-1506) - Fixed an issue with the Operator not being able to get PBM version due to the change of log where latest PBM versions print the version. The Operator now combines both stderr and stdout to correctly retrieve the PBM version.

## Supported software

The Operator was developed and tested with the following software:

* Percona Server for MongoDB 6.0.25-20, 7.0.24-13, and 8.0.12-4.
* Percona Backup for MongoDB 2.11.0.
* PMM Client: 3.4.1
* LogCollector based on fluent-bit 4.0.1

Other options may also work but have not been tested. 


## Supported platforms

Percona Operators are designed for compatibility with all [CNCF-certified :octicons-link-external-16:](https://www.cncf.io/training/certification/software-conformance/) Kubernetes distributions. Our release process includes targeted testing and validation on major cloud provider platforms and OpenShift, as detailed below:

--8<-- [start:platforms]

* [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.31-1.33
* [Amazon Elastic Container Service for Kubernetes (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.31-1.34
* [OpenShift Container Platform :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.16 - 4.19
* [Azure Kubernetes Service (AKS) :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.31-1.33
* [Minikube :octicons-link-external-16:](https://github.com/kubernetes/minikube) 1.37.0 based on Kubernetes 1.34.0

--8<-- [end:platforms]

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.

## Percona certified images

Find Percona’s certified Docker images that you can use with the Percona Operator for MongoDB in the following table:

--8<-- [start:images]

| Image                                                  | Digest                                                           |
|:-------------------------------------------------------|:-----------------------------------------------------------------|
| percona/percona-server-mongodb-operator:1.21.1 (x86_64)         | 155f6ee71dcfc52ff30ed4e2c4396fc3d3534c83b4794de4d90c79542fbb0e34 |
| percona/percona-server-mongodb-operator:1.21.1 (ARM64) | 88926b82a5551c36592d1c83b2e80d3c3560f0809cdb7b5d6648038123b65097 |
| percona/percona-server-mongodb:8.0.12-4                | ab8793879409788b5a19f7e332a3700520e8eeaf4b068ec8cc7d1b680f097307 |
| percona/percona-server-mongodb:8.0.12-4 (ARM64)        | d367e225b57783bc2ff8451571c7568dc3b240176cf149a01cc3a7b13fb52a78 |
| percona/percona-server-mongodb:8.0.8-3                 | e4580ca292f07fd7800e139121aea4b2c1dfa6aa34f3657d25a861883fd3de41 |
| percona/percona-server-mongodb:8.0.8-3 (ARM64)         | 96cfee2102499aba05e63ca7862102c2b1da1cf9f4eea0cbea3793a07c183925 |
| percona/percona-server-mongodb:8.0.4-1-multi           | 873b201ce3d66d97b1225c26db392c5043a73cc19ee8db6f2dc1b8efd4783bcf |
| percona/percona-server-mongodb:8.0.4-1-multi (ARM64)   | 222ccf746ad4ffdfccf41b41edaa0d318d28f663e13c9629f8dad5a5078434e5 |
| percona/percona-server-mongodb:7.0.24-13               | 71d5389e91014cf6c486c4d28ee2b3f19f16eb421d9d65b36d70b9f712a43eaa |
| percona/percona-server-mongodb:7.0.24-13 (ARM64)       | 22012034c3e30029b34dda235aa14642377522ba307d742f64d7f69ed6feccf9 |
| percona/percona-server-mongodb:7.0.18-11               | 0115a72f5e60d86cb4f4b7eae32118c0910e8c96831e013de12798a1771c4c91 |
| percona/percona-server-mongodb:7.0.18-11 (ARM64)       | 86c17067f3e233f522612389ed2500231cbb22ce93524c476b9aa8d464d06f0b |
| percona/percona-server-mongodb:7.0.15-9-multi          | 7bffdf2e71c121e2ab37b4fa7e2f513237abdd65266da384bf8197cee1316917 |
| percona/percona-server-mongodb:7.0.15-9-multi (ARM64)  | fdc4875df82572267445811445ebf517f63e509be54d1a2599fe58e1c525e1d8 |
| percona/percona-server-mongodb:7.0.14-8-multi          | ed932d4e7231dcb793bf609f781226a8393aa8958b103339f4a503a8f70ed17e |
| percona/percona-server-mongodb:7.0.14-8-multi (ARM64)  | 052f84ee926ad9b5146f08a7e887820342d65b757a284c2f0ea8e937bb51cd7b |
| percona/percona-server-mongodb:7.0.12-7                | 7f00e19878bd143119772cd5468f1f0f9857dfcd2ae2f814d52ef3fa7cff6899 |
| percona/percona-server-mongodb:6.0.25-20               | 0254c10fb8c249c108cd0a6e5885dfe76785e8fdd6ceb23ce98854234672e5d6 |
| percona/percona-server-mongodb:6.0.25-20 (ARM64)       | 0fd4d1ca4da6377450964f225bd1d508730be9c1fca1c36c3bfcc107678d9a50 |
| percona/percona-server-mongodb:6.0.21-18               | 579d2fdc617ea42ab2be8c2682955b489dbf49ab19771b7a5d9c77da4dd323e7 |
| percona/percona-server-mongodb:6.0.21-18 (ARM64)       | b9d2b7e8c4a97b2d20e2aaccfbd183f65f8ccd9f2ea13939515e18e02bc64871 |
| percona/percona-server-mongodb:6.0.19-16-multi         | c8ff08c4b8a96679e2daf4845873fdd4d2c48646b84db19f0c5fe02e8f3808b4 |
| percona/percona-server-mongodb:6.0.19-16-multi (ARM64) | 6908b28ced260b762cd38a642c06dd802cbef0a43ab5f22afe7b583b234ebcec |
| percona/percona-server-mongodb:6.0.18-15-multi         | d197ce16ab0eed6df25e632b92dea5ce448e549e02028f39b78f5730c2ffef36 |
| percona/percona-server-mongodb:6.0.18-15-multi (ARM64) | 7fd1d8f74f71dea6ad423e8e202a0617bdd1e8783f2b5cb071b5281685ce0adf |
| percona/percona-server-mongodb:6.0.16-13               | 1497e58e39497d8425ccd053898dc323338d6eb3f0e3c4c223f9d5a468da7931 |
| percona/fluentbit:4.0.1                                | a4ab7dd10379ccf74607f6b05225c4996eeff53b628bda94e615781a1f58b779 |
| percona/pmm-client:3.4.1                               | 1c59d7188f8404e0294f4bfb3d2c3600107f808a023668a170a6b8036c56619b |
| percona/pmm-client:2.44.1-1                            | 52a8fb5e8f912eef1ff8a117ea323c401e278908ce29928dafc23fac1db4f1e3 |
| percona/percona-backup-mongodb:2.11.0                  | d09f5de92cfbc5a7a42a8cc86742a07481c98b3b42cffdc6359b3ec1f63de3a5 |
| percona/percona-backup-mongodb:2.11.0 (ARM64)          | a60d095439537b982209582d428b3b39a01e31e88b2b62d2dcbd99ea4e2d9928 |



--8<-- [end:images]

Find previous version images in the [documentation archive :octicons-link-external-16:](https://docs.percona.com/legacy-documentation/)

