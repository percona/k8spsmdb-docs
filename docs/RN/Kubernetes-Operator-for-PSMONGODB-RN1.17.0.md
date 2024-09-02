# *Percona Operator for MongoDB* 1.16.2

* **Date**

    September XX, 2024

* **Installation**

    [Installing Percona Operator for MongoDB](../System-Requirements.md#installation-guidelines)

## Release Highlights

## New Features

* {{ k8spsmdbjira(919) }}: Do not start restore if credentials are invalid or backup doesn't exist

## Improvements

* {{ k8spsmdbjira(253) }}: Creating users in Percona Operator for MongoDB
* {{ k8spsmdbjira(888) }}: Document installation and upgrades with RedHat OLM
* {{ k8spsmdbjira(899) }}: Add Labels for all the k8s objects created by Operator
* {{ k8spsmdbjira(934) }}: Make liveness checks more debuggable
* {{ k8spsmdbjira(1057) }}: Finalizers were renamed to contain fully qualified domain names (FQDNs), avoiding potential conflicts with other finalizer names in the same Kubernetes environmentAdd domain-qualified finalizer names

## Bugs Fixed

* {{ k8spsmdbjira(925) }}: Operator Errors in the Operator Log when using Mongos with servicePerPod and LoadBalancer services
* {{ k8spsmdbjira(994) }}: cannot start a cluster with splitHorizon enabled from the begining
* {{ k8spsmdbjira(1028) }}: Update list of roles for each user
* {{ k8spsmdbjira(1105) }}: using PBM exit when set to use a little amount of memory
* {{ k8spsmdbjira(1074) }}: MongoDB Cluster cannot failover when down time all pods and using mode External (NodePort and LB)
* {{ k8spsmdbjira(1089) }}: PSMDB clusters with error state stuck in deleting
* {{ k8spsmdbjira(1092) }}: Big databases restore is not easy to investigate and causing OOM for big chunks
* {{ k8spsmdbjira(1094) }}: operator tries to set FCV even if not doing major upgrade
* {{ k8spsmdbjira(1103) }}: Broken MongoDB cluster after scaling down if Pods are deleted before memberships are updated
* {{ k8spsmdbjira(1108) }}: PMM container is created without security context
* {{ k8spsmdbjira(1110) }}: Fix panic when CR annotations are nil

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
1.16.2:

* [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.26-1.29
* [Amazon Elastic Container Service for Kubernetes (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.26-1.29
* [OpenShift Container Platform :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.12.56 - 4.15.11
* [Azure Kubernetes Service (AKS) :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.27-1.29
* [Minikube :octicons-link-external-16:](https://github.com/kubernetes/minikube) 1.33.0

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
