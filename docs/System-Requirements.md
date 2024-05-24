# System Requirements

The Operator was developed and tested with Percona Server for MongoDB
{{ mongodb50recommended }}, {{ mongodb60recommended }}, and
{{ mongodb70recommended }}. Other options may also work but have not been
tested. The Operator {{ release }} also uses Percona Backup for MongoDB
{{ pbmrecommended }}.

## Officially supported platforms

The following platforms were tested and are officially supported by the Operator
{{ release }}:

* [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.26-1.29
* [Amazon Elastic Container Service for Kubernetes (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.26-1.29
* [OpenShift Container Platform :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.12.56 - 4.15.11
* [Azure Kubernetes Service (AKS) :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.27-1.29
* [Minikube :octicons-link-external-16:](https://github.com/kubernetes/minikube) 1.33.0

Other Kubernetes platforms may also work but have not been tested.

## Resource Limits

A cluster running an officially supported platform contains at least 3 Nodes
and the following resources (if [sharding](sharding.md#operator-sharding) is
turned off):

* 2GB of RAM,
* 2 CPU threads per Node for Pods provisioning,
* at least 60GB of available storage for Private Volumes provisioning.

Consider using 4 CPU and 6 GB of RAM if [sharding](sharding.md#operator-sharding)
is turned on (the default behavior).

Also, the number of Replica Set Nodes should not be odd if [Arbiter](arbiter.md#arbiter)
is not enabled.

!!! note

    Use Storage Class with XFS as the default filesystem if possible
    [to achieve better MongoDB performance  :octicons-link-external-16:](https://dba.stackexchange.com/questions/190578/is-xfs-still-the-best-choice-for-mongodb).

## Installation guidelines

Choose how you wish to install the Operator:

* [with Helm](helm.md)
* [with `kubectl`](kubectl.md)
* [on Minikube](minikube.md)
* [on Google Kubernetes Engine (GKE)](gke.md)
* [on Amazon Elastic Kubernetes Service (AWS EKS)](eks.md)
* [on Microsoft Azure Kubernetes Service (AKS)](aks.md)
* [on Openshift](openshift.md)
* [in a Kubernetes-based environment](kubernetes.md)
