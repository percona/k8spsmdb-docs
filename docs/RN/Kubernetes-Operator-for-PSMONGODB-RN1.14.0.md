# *Percona Operator for MongoDB* 1.14.0

* **Date**

    February 23, 2023

* **Installation**

    [Installing Percona Operator for MongoDB](../index.md#quickstart-guides)

## Release Highlights

* [Physical backups](backups-about.md#physical) are now officially supported by the Operator. Physical backups are much faster than logical backups, but need more storage, amd still have the **technical preview stauts**.

## New Features

* {{ k8spsmdbjira(713) }} Support for [physical backups](backups-about.md#physical)

* {{ k8spsmdbjira(737) }} Support for MongoDB 6.0

* {{ k8spsmdbjira(824) }} New `ignoreAnnotations` and `ignoreLabels` Custom Resource options allow to list [specific annotations and labels](../annotations.md) for Kubernetes Service objects, which the Operator should ignore (useful with various Kubernetes flavors which add annotations to the objects managed by the Operator)

* {{ k8spsmdbjira(853) }} [Telemetry](../telemetry.md) was expanded with details about using backups, as well as the cluster size and the facts of using helm, PMM, and/or sidecar containers

## Improvements

* {{ k8spsmdbjira(658) }} The Operator log messages appearing during the pause/unpause of the cluster were improved to more clearly indicate this event

* {{ k8spsmdbjira(708) }} The new `initContainerSecurityContext` option allows to configure securityContext for the container which can be used instead of the official image during the initial Operator installation

* {{ k8spsmdbjira(721) }} The backup subsystem was improved to allow the database to work in case if the backup agent is not able to connect to MongoDB (e.g. due to misconfigured password) instead of taking down the database Pod

* {{ k8spsmdbjira(758) }} The ServiceMesh fully qualified domain names (FQDNs) for config servers are now prioritized if DNSMode is set to ServiceMesh (thanks to Jo Lyshoel for contribution)

* {{ k8spsmdbjira(793) }} It is now possible to set annotations and labels for Persistent Volume Claims

* {{ k8spsmdbjira(803) }} The Operator now does not attempt to start Percona Monitoring and Management (PMM) client sidecar if the corresponding secret does not contain the `pmmserver` or `pmmserverkey` key

* {{ k8spsmdbjira(817) }} Allow external nodes to be added to the cluster even when the replicaset is not exposed

* {{ k8spsmdbjira(844) }} Update the RuntimeClass API version to `v1` from the `v1beta1` already deprecated since Kubernetes 1.22

* {{ k8spsmdbjira(848) }} Remove formatted strings from log messages to avoid confronting with structured logging based on key-value pairs

## Known Issues and Limitations

* {{ k8spsmdbjira(875) }} Physical backups cannot be restored on clusters with [non-voting members](../arbiter.md#adding-non-voting-nodes) in this release

## Bugs Fixed

* {{ k8spsmdbjira(784) }} Fix a bug due to which the `enableEncryption` MongoDB configuration option was always activated when using psmdb-db Helm Chart  **open**

* {{ k8spsmdbjira(796) }} Fix a bug due to which backup failed if replset was exposed

* {{ k8spsmdbjira(854) }} Fix a bug due to which backup stucked after cluster was exposed

* {{ k8spsmdbjira(471) }} Fix a bug due to which in case of scheduled backups with error status `delete-backup` finalizer didn't allow to delete the appropriate failed resources and Kubernetes namespace (thanks to Aliaksandr Karavai for reporting)
 
* {{ k8spsmdbjira(576) }} Managed cluster does not delete the old node
 
* {{ k8spsmdbjira(674) }} Services are not deleted after unexposing the replicaset

* {{ k8spsmdbjira(742) }} Updating the spec.sharding.mongos.expose.serviceAnnotations get silently rejected

* {{ k8spsmdbjira(766) }} failed to run finalizer delete-psmdb-pods-in-order

* {{ k8spsmdbjira(767) }} Ucombination of delete-psmdb-pods-in-order and delete-psmdb-pvc finalizers doesn't work

* {{ k8spsmdbjira(770) }} unclear logs in cluster wide mode

* {{ k8spsmdbjira(791) }} Unable to set LoadBalancerSourceRanges when LoadBalancer is set has type in replsets

* {{ k8spsmdbjira(797) }} Restore backup with S3 storage details in yaml in psmdb

* {{ k8spsmdbjira(800) }} Operator crash due to etcd leader election: Arbiter pod deletion request causing operator crash on unstable k8s cluster
 
* {{ k8spsmdbjira(820) }} Cluster-Wide mode does not support backups of multiple Mongo-Instances in v1.13.0
 
* {{ k8spsmdbjira(823) }} ReplicaSet nodeport exposure breaks backups
 
* {{ k8spsmdbjira(836) }} backups in starting status are marked as error
 
* {{ k8spsmdbjira(841) }} Cluster unready after switching from expose LoadBalancer to ClusterIP
 
* {{ k8spsmdbjira(843) }} Cannot start the cluster after it was deleted

* {{ k8spsmdbjira(845) }} elete backup finalizer fails with PBM v2 with old storage

* {{ k8spsmdbjira(846) }} Scaling down results in node as Secondary
 
* {{ k8spsmdbjira(866) }} Fix the bug due to which the Operator was continuously
    flooding the log with error messages if the credentials of the PMM server
    were missing

## Supported Platforms

The Operator was developed and tested with Percona Server for MongoDB 4.2.22, 4.4.8, 4.4.10, 4.4.13, 4.4.16, 5.0.2, 5.0.4, and 5.0.11. Other options may also work but have not been tested.

The following platforms were tested and are officially supported by the Operator 1.14.0:

* [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) 1.21 - 1.23

* [Amazon Elastic Container Service for Kubernetes (EKS)](https://aws.amazon.com) 1.21 - 1.23

* [OpenShift Container Platform](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.10 - 4.11

* [Azure Kubernetes Service (AKS)](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.22 - 1.24

* [Minikube](https://github.com/kubernetes/minikube) 1.26

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
