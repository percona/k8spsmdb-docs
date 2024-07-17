# *Percona Operator for MongoDB* 1.16.2

* **Date**

    July 18, 2024

* **Installation**

    [Installing Percona Operator for MongoDB](../System-Requirements.md#installation-guidelines)

## Bugs Fixed

* {{ k8spsmdbjira(1117) }}: Fix a bug where the Operator issued warnings when the unit of the storage size was specified as `G` instead of `Gi`

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
