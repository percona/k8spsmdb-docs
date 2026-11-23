> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# System Requirements

The Operator was developed and tested with Percona Server for MongoDB 7.0.43-23, 8.0.32-14, and 8.3.13-4. Other options may also work but have not been tested. The Operator 1.23.1 also uses Percona Backup for MongoDB 2.15.0 and Percona ClusterSync for MongoDB.

## Officially supported platforms

The following platforms were tested and are officially supported by the Operator 1.23.1:

- [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) 1.34 - 1.35
- [Amazon Elastic Kubernetes Service (EKS)](https://aws.amazon.com) 1.34 - 1.36
- [Azure Kubernetes Service (AKS)](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.34 - 1.36
- [OpenShift Container Platform](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.19 - 4.22
- [Rancher](https://www.rancher.com/) with Rancher Kubernetes Engine (RKE2) 1.34 - 1.36
- [Minikube](https://github.com/kubernetes/minikube) 1.39.0 with Kubernetes v1.37.0

Other Kubernetes platforms may also work but have not been tested.

## CPU microarchitecture

Starting with version 1.22.0, the Operator base image was upgraded from UBI 9 to UBI 10.

RHEL 10 / UBI 10 enforces a minimum CPU microarchitecture of **x86-64-v3** on `amd64` (requires AVX2, BMI1, BMI2, FMA — Intel Haswell 2013+ / AMD Excavator 2015+).

## Resource Limits

A cluster running an officially supported platform contains at least 3 Nodes and the following resources (if [sharding](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/sharding.html) is turned off):

- 2GB of RAM,
- 2 CPU threads per Node for Pods provisioning,
- at least 60GB of available storage for Private Volumes provisioning.

Consider using 4 CPU and 6 GB of RAM if [sharding](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/sharding.html) is turned on (the default behavior).

Also, the number of Replica Set Nodes should not be odd if [Arbiter](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/arbiter.html) is not enabled.

Note

Use Storage Class with XFS as the default filesystem if possible [to achieve better MongoDB performance](https://dba.stackexchange.com/questions/190578/is-xfs-still-the-best-choice-for-mongodb) .

## Installation guidelines

Choose how you wish to install the Operator:

[With Helm](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/helm.html) [Using manifests with kubectl](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/kubectl.html)
