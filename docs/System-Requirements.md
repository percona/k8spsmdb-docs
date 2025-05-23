# System Requirements

The Operator was developed and tested with Percona Server for MongoDB
{{ mongodb60recommended }}, 
{{ mongodb70recommended }}, and {{ mongodb80recommended }}. Other options may also work but have not been
tested. The Operator {{ release }} also uses Percona Backup for MongoDB
{{ pbmrecommended }}.

## Officially supported platforms

The following platforms were tested and are officially supported by the Operator
{{ release }}:

--8<-- "Kubernetes-Operator-for-PSMONGODB-RN{{release}}.md:platforms"


Other Kubernetes platforms may also work but have not been tested.

## Resource Limits

A cluster running an officially supported platform contains at least 3 Nodes
and the following resources (if [sharding](sharding.md) is
turned off):

* 2GB of RAM,
* 2 CPU threads per Node for Pods provisioning,
* at least 60GB of available storage for Private Volumes provisioning.

Consider using 4 CPU and 6 GB of RAM if [sharding](sharding.md)
is turned on (the default behavior).

Also, the number of Replica Set Nodes should not be odd if [Arbiter](arbiter.md)
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
