# System Requirements

The Operator was developed and tested with Percona Server for MongoDB 4.2,
4.4, and 5.0. Other options may also work but have not been tested.

!!! note
    The [MMAPv1 storage engine](https://docs.mongodb.com/manual/core/storage-engines/)
    is no longer supported for all MongoDB versions starting from the Operator
    version 1.6. MMAPv1 was already deprecated by MongoDB for a long time.
    WiredTiger is the default storage engine since MongoDB 3.2, and MMAPv1 was
    completely removed in MongoDB 4.2.

## Officially supported platforms

The following platforms were tested and are officially supported by the Operator
{{ release }}:


* [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) 1.19 - {{ gkerecommended }}
* [Amazon Elastic Container Service for Kubernetes (EKS)](https://aws.amazon.com) 1.19 - 1.22
* [OpenShift Container Platform](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.7 - 4.10
* [Minikube](https://minikube.sigs.k8s.io/docs/) 1.23
* [VMWare Tanzu](https://tanzu.vmware.com/)

Other Kubernetes platforms may also work but have not been tested.

## Resource Limits

A cluster running an officially supported platform contains at least 3
Nodes and the following resources (if [sharding](sharding.md#operator-sharding) is
turned off):


* 2GB of RAM,


* 2 CPU threads per Node for Pods provisioning,


* at least 60GB of available storage for Private Volumes provisioning.

Consider using 4 CPU and 6 GB of RAM if [sharding](sharding.md#operator-sharding) is
turned on (the default behavior).

Also, the number of Replica Set Nodes should not be odd
if [Arbiter](arbiter.md#arbiter) is not enabled.

!!! note
    Use Storage Class with XFS as the default filesystem if possible
    [to achieve better MongoDB performance](https://dba.stackexchange.com/questions/190578/is-xfs-still-the-best-choice-for-mongodb).
