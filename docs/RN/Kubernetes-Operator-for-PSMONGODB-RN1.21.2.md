# Percona Operator for MongoDB 1.21.2 ({{date.1_21_2}})

[Get started with the Operator :material-arrow-right:](../quickstart.md){.md-button}

## Release Highlights

### Security update: Mitigation of heap memory disclosure vulnerability

This release includes the fix for security vulnerability [CVE-2025-14847: CWE-130 :material-arrow-right:](https://radar.offseq.com/threat/cve-2025-14847-cwe-130-improper-handling-of-length-dd0a4a45), which is about how MongoDB uses `zlib` compression library. Attackers with network access to `mongod` or `mongos` can extract fragments of uninitialized server memory without authentication if zlib compression is enabled. This memory may contain sensitive data, which poses a serious information disclosure risk.

The issue is resolved upstream and is included in Percona Server for MongoDB 6.0.27-21, 7.0.28-15 and 8.0.17-6. Percona Operator for MongoDB includes these updated Percona Server for MongoDB images. 

We strongly recommend upgrading to this latest version of the Operator to ensure your deployments remain secure.

Learn more about the vulnerability in the [upstream bug report :material-arrow-right:](https://jira.mongodb.org/browse/SERVER-115508) and in Percona Blog: [Urgent Security Update: Patching "Mongobleed" (CVE-2025-14847) in Percona Server for MongoDB :material-arrow-right:](https://www.percona.com/blog/urgent-security-update-patching-mongobleed-cve-2025-14847-in-percona-server-for-mongodb/).


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
| percona/percona-server-mongodb:6.0.27-21                     | --                                                               |
| percona/percona-server-mongodb:6.0.27-21 (ARM64)             | --                                                               |
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

