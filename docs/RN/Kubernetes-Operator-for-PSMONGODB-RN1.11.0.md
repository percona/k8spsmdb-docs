# Percona Distribution for MongoDB Operator 1.11.0


* **Date**

    December 21, 2021



* **Installation**

    For installation please refer to [the documentation page](https://www.percona.com/doc/kubernetes-operator-for-psmongodb/index.html#installation)


## Release Highlights


* In addition to S3-compatible storage, you can now configure backups [to use Microsoft Azure Blob storage](../backups-storage.md#microsoft-azure-blob-storage). This feature makes the Operator fully compatible with Azure Cloud.


* [Custom sidecar containers](../sidecar.md) allow users to customize Percona Distribution for MongoDB and other Operator components without changing the container images. In this release, we enable even more customization, by allowing users to mount volumes into the sidecar containers.

## New Features


* [K8SPSMDB-513](https://jira.percona.com/browse/K8SPSMDB-513): Add support of Microsoft Azure Blob storage for backups

## Improvements


* [K8SPSMDB-422](https://jira.percona.com/browse/K8SPSMDB-422): It is now possible to set annotations to backup cron jobs (Thanks to Aliaksandr Karavai for contribution)


* [K8SPSMDB-534](https://jira.percona.com/browse/K8SPSMDB-534): mongos readiness probe now avoids running listDatabases command for all databases in the cluster to avoid unneeded delays on clusters with an extremely large amount of databases


* [K8SPSMDB-527](https://jira.percona.com/browse/K8SPSMDB-527): Timeout parameters for liveness and readiness probes can be customized to avoid false-positives for heavy-loaded clusters


* [K8SPSMDB-520](https://jira.percona.com/browse/K8SPSMDB-520): Mount volumes into sidecar containers to enable customization


* [K8SPSMDB-463](https://jira.percona.com/browse/K8SPSMDB-463): Update backup status as error if it’s not started for a long time


* [K8SPSMDB-388](https://jira.percona.com/browse/K8SPSMDB-388): New `backup.pitr.oplogSpanMin` option controls how often oplogs are uploaded to the cloud storage

## Bugs Fixed


* [K8SPSMDB-603](https://jira.percona.com/browse/K8SPSMDB-603): Fixed a bug where the Operator checked the presence of CPU limit and not memory limit when deciding whether to set the size of cache memory for WiredTiger


* [K8SPSMDB-511](https://jira.percona.com/browse/K8SPSMDB-511) and [K8SPSMDB-558](https://jira.percona.com/browse/K8SPSMDB-558): Fixed a bug where Operator changed NodePort port every 20 seconds for a Replica Set service (Thanks to Rajshekar Reddy for reporting this issue)


* [K8SPSMDB-608](https://jira.percona.com/browse/K8SPSMDB-608): Fix a bug that resulted in printing the password of backup user the in backup agent logs (Thanks to Antoine Ozenne for reporting this issue)


* [K8SPSMDB-592](https://jira.percona.com/browse/K8SPSMDB-592): Fixed a bug where helm chart was incorrectly setting the `serviceAnnotations` and `loadBalancerSourceRanges` for mongos exposure


* [K8SPSMDB-568](https://jira.percona.com/browse/K8SPSMDB-568): Fixed a bug where upgrading to MongoDB 5.0 failed when using the `upgradeOptions:apply` option

## Supported Platforms

The following platforms were tested and are officially supported by the Operator 1.11.0:


* OpenShift 4.7 - 4.9


* Google Kubernetes Engine (GKE) 1.19 - 1.22


* Amazon Elastic Container Service for Kubernetes (EKS) 1.18 - 1.22


* Minikube 1.22

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
