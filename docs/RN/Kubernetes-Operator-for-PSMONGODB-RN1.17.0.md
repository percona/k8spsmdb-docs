# *Percona Operator for MongoDB* 1.16.2

* **Date**

    September XX, 2024

* **Installation**

    [Installing Percona Operator for MongoDB](../System-Requirements.md#installation-guidelines)

## Release Highlights

### Liveness check improvements

Several improvements in logging were made related to the liveness checks, to allow getting more information for debug, and to make these logs persist on failures to allow further examination.

Liveness check logs are stored in the `/data/db/mongod-data/logs/mongodb-healthcheck.log` file, which can be [accessed in the correspondent Pod](../debug-shell.md) if needed. Starting from now, Liveness check generates mover log messages, and the default log level is set to `DEBUG`.

Each time the health check fails, the current log is saved to a gzip compressed file named `mongodb-healthcheck-<timestamp>.log.gz`, and the `mongodb-healthcheck.log` log file is reset.
Log archives older than 24 hours are automatically deleted.

## New Features

* {{ k8spsmdbjira(919) }}:  The Operator now checks if the needed Secrets exist and connects to the storage to check the validify of credentials and the existence of a backup before starting the restore process

## Improvements

* {{ k8spsmdbjira(253) }}: Creating users in Percona Operator for MongoDB
* {{ k8spsmdbjira(899) }}: Add Labels for all Kubernetes objects created by Operator (backups/restores, Secrets, Volumes, etc.) to make them clearly distinguishable
* {{ k8spsmdbjira(934) }}: Liveness checks are providing more debug infromation and keep separate log archives for each failure with the 24 hours retention
* {{ k8spsmdbjira(1057) }}: Finalizers were renamed to contain fully qualified domain names (FQDNs), avoiding potential conflicts with other finalizer names in the same Kubernetes environmentAdd domain-qualified finalizer names

## Bugs Fixed

* {{ k8spsmdbjira(925) }}: Fix a bug where the Operator generated "failed to start balancer" and "failed to get mongos connection" log messages when using Mongos with servicePerPod and LoadBalancer services, while the cluster was operating properly
* {{ k8spsmdbjira(994) }}: Fix a bug where it wasn't possible to create a new cluster with splitHorizon enabled, leaving the only way to enable it later on the running cluster
* {{ k8spsmdbjira(1105) }}: The memory requests and limits for backups were increased in the `deploy/cr.yaml` configuration file exapmle to reflect the Percona Backup for MongoDB minimal pbm-agents requirement of 1 Gb RAM needed for stable operation
* {{ k8spsmdbjira(1074) }}: Fix a bug where MongoDB Cluster could not failover in case of all Pods downtime and `exposeType` Custom Resource option set to either `NodePort` or `LoadBalancer`
* {{ k8spsmdbjira(1089) }}: Fix a bug where it was impossible to delete a cluster in error state with finalizers present
* {{ k8spsmdbjira(1092) }}: Big databases restore is not easy to investigate and causing OOM for big chunks
* {{ k8spsmdbjira(1094) }}: Fix a bug where it wasn't possible to create a new cluster with `upgradeOptions.setFCV` Custom Resource option set to `true`
* {{ k8spsmdbjira(1103) }}: Broken MongoDB cluster after scaling down if Pods are deleted before memberships are updated **CHECK WHAT'S DONE**
* {{ k8spsmdbjira(1108) }}: The new Custom Resource option allows setting custom containerSecurityContext for PMM containers **IMPROVEMENT**
* {{ k8spsmdbjira(1110) }}: Fix a bug where nil Custom Resource annotations were causing the Operator panic

## Deprecation, Rename and Removal

Finalizers were renamed to contain fully qualified domain names.

* `PerconaServerMongoDB` Custom Resource:
    * `delete-psmdb-pods-in-order` finalizer renamed to `percona.com/delete-psmdb-pods-in-order`
    * `delete-psmdb-pvc` finalizer renamed to `percona.com/delete-psmdb-pvc`
* `PerconaServerMongoDBBackup` Custom Resource:
    * `delete-backup` finalizer renamed to `percona.com/delete-backup`

## Supported Platforms

The Operator was developed and tested with Percona Server for MongoDB 5.0.26-22,
6.0.15-12, and 7.0.8-5. Other options may also work but have not been tested. The
Operator also uses Percona Backup for MongoDB 2.4.1.

The following platforms were tested and are officially supported by the Operator
1.17.0:

* [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.26-1.29
* [Amazon Elastic Container Service for Kubernetes (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.26-1.29
* [OpenShift Container Platform :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.12.56 - 4.15.11
* [Azure Kubernetes Service (AKS) :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.27-1.29
* [Minikube :octicons-link-external-16:](https://github.com/kubernetes/minikube) 1.33.0

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
