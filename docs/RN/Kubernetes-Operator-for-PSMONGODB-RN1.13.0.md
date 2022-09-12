# *Percona Operator for MongoDB* 1.13.0

* **Date**

    September 13, 2022

* **Installation**

    [Installing Percona Operator for MongoDB](https://www.percona.com/doc/kubernetes-operator-for-psmongodb/index.html#installation)

## Release Highlights

* Starting from now, the Operator will not add new API versions to its Custom Resource Definition with every new release. It will use `v1` version from now on, and three last Custom Resource versions will be supported as deprecated ones

* The [cross-site replication](replication.md) feature allows an asynchronous replication between two Percona Server for MongoDB Clusters, including scenarios when one of the clusters is outside of the Kubernetes environment. The feature is intended for the following use cases:

   * provide migrations of your Percona Server for MongoDB Cluster to Kubernetes or vice versa,
   * migrate regular MongoDB database to Percona Server for MongoDB Cluster under the Operator control, or carry on backward migration,
   * enable disaster recovery capability for your cluster deployment.

* The [automated upgrade](../update.md#automatic-upgrade) is now disabled by default to prevent an unplanned downtimes for user applications and to provide defaults more focused on strict user’s control over the cluster

* [Azure Kubernetes Service (AKS)](aks.md) was added to the list of the officially supported platforms

## New Features

* {{ k8spsmdbjira(203) }} Support for the [cluster-wide operator mode](cluster-wide.md)

* {{ k8spsmdbjira(287) }} Support for the [HashiCorp Vault](https://www.vaultproject.io/) storage for encryption keys

* {{ k8spsmdbjira(704) }} Support for the [Azure Kubernetes Service (AKS)](aks.md)

## Improvements

* {{ k8spsmdbjira(515) }} Allow setting requireTLS mode for MongoDB through the Operator

* {{ k8spsmdbjira(636) }} Automatically create the `databaseAdmin` user that can provision databases, collections and perform data modifications out of the box

* {{ k8spsmdbjira(699) }} Disable automated upgrade by default

* {{ k8spsmdbjira(725) }} Configuring the log structuring and detalization [is now supported](debug.md#log) using the LOG_STRUCTURED and LOG_LEVEL environment variables

* {{ k8spsmdbjira(719) }} Details about using sharding, Hashicorp Vault and cluster-wide mode were added to [telemetry](telemetry.md)

* {{ k8spsmdbjira(715) }} to reduce the size of Custom Resource Definition to prevent reaching the etcd limit

* {{ k8spsmdbjira(709) }} Make it possible [to use API Key](monitoring.md#operator-monitoring-client-token) to authorize within Percona Monitoring and Management Server

* {{ k8spsmdbjira(707) }} Allow to set Service labels for replica set, config servers and mongos in Custom Resource to enable various integrations with cloud providers or service meshes

* {{ k8spsmdbjira(666) }} and {{ k8spsmdbjira(702) }} Avoid using `force` option when reconfiguring MongoDB member

## Bugs Fixed


* {{ k8spsmdbjira(730) }} Fix a bug due to which point-in-time recovery was enabled and consequently disabled when setting Percona Backup for MongoDB compression options without checking whether it was enabled in the Custom Resource

* {{ k8spsmdbjira(660) }} Fix a bug due to which a successful backup could be erroneously marked as failed due to exceeding the start deadline in case of big number of nodes, especially on sharded clusters

* {{ k8spsmdbjira(686) }} Fix a bug that prevented downscaling sharded MongoDB cluster to a non-sharded replica set variant

* {{ k8spsmdbjira(691) }} Fix a bug that produced an error in the Operator log in case of the empty SSL Secret name in Custom Resource

* {{ k8spsmdbjira(696) }} Fix a bug that prevented removing additional annotations previously added under the `spec.replsets.annotations` field

* {{ k8spsmdbjira(724) }} Fix a bug which caused the `delete-backup` finalizer not working causing backups being not deleted from buckets

* {{ k8spsmdbjira(746) }} Fix a bug due to which the Operator was unable to initialize a three-member replica set with a primary-secondary-arbiter (PSA) architecture

* {{ k8spsmdbjira(762) }} Fix a bug due to which the Operator was running the `replSetReconfig` MongoDB command at every reconciliation if arbiter was enabled

## Deprecation, Rename and Removal

* {{ k8spsmdbjira(690) }} Custom Resource options under the `sharding.mongos.auditLog` subsection, deprecated since the Operator version 1.9.0 in favor of using `replsets.configuration`, were finally removed and cannot be used with the Operator

## Supported Platforms

The following platforms were tested and are officially supported by the Operator
1.13.0:

* [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) 1.21 - 1.23

* [Amazon Elastic Container Service for Kubernetes (EKS)](https://aws.amazon.com) 1.21 - 1.23

* [OpenShift Container Platform](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.10 - 4.11

* [Azure Kubernetes Service (AKS)](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.22 - 1.24

* [Minikube](https://github.com/kubernetes/minikube) 1.26

This list only includes the platforms that the Percona Operators are
specifically tested on as part of the release process. Other Kubernetes flavors
and versions depend on the backward compatibility offered by Kubernetes itself.
