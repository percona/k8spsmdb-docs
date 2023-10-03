# System Requirements

The Operator was developed and tested with Percona Server for MongoDB
{{ mongodb44recommended }}, {{ mongodb50recommended }}, and
{{ mongodb60recommended }}. Other options may also work but have not been
tested. The Operator {{ release }} also uses Percona Backup for MongoDB
{{ pbmrecommended }}.

## Officially supported platforms

The following platforms were tested and are officially supported by the Operator
{{ release }}:

* [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) 1.24-1.28

* [Amazon Elastic Container Service for Kubernetes (EKS)](https://aws.amazon.com) 1.24-1.28

* [OpenShift Container Platform](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.11 - 4.13

* [Azure Kubernetes Service (AKS)](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.25-1.28

* [Minikube](https://github.com/kubernetes/minikube) 1.31.2 (based on Kubernetes 1.28)

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
    [to achieve better MongoDB performance](https://dba.stackexchange.com/questions/190578/is-xfs-still-the-best-choice-for-mongodb).
