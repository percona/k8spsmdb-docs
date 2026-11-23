> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Percona Operator for MongoDB 1.16.1

- **Date**

  June 24, 2024

- **Installation**

  [Installing Percona Operator for MongoDB](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/System-Requirements.html#installation-guidelines)

## Bugs Fixed

- [K8SPSMDB-1101](https://jira.percona.com/browse/K8SPSMDB-1101): Fix a bug where manually generated TLS certificates couldn’t be applied because Operator was replacing them with auto-generated ones

## Supported Platforms

The Operator was developed and tested with Percona Server for MongoDB 5.0.26-22, 6.0.15-12, and 7.0.8-5. Other options may also work but have not been tested. The Operator also uses Percona Backup for MongoDB 2.4.1.

The following platforms were tested and are officially supported by the Operator 1.16.1:

- [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) 1.26-1.29
- [Amazon Elastic Container Service for Kubernetes (EKS)](https://aws.amazon.com) 1.26-1.29
- [OpenShift Container Platform](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.12.56 - 4.15.11
- [Azure Kubernetes Service (AKS)](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.27-1.29
- [Minikube](https://github.com/kubernetes/minikube) 1.33.0

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
