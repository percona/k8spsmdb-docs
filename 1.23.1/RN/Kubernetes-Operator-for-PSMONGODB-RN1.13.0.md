> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Percona Operator for MongoDB 1.13.0

- **Date**

  September 15, 2022

- **Installation**

  [Installing Percona Operator for MongoDB](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/quickstart.html)

## Release Highlights

- [Azure Kubernetes Service (AKS)](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/aks.html) is now officially supported platform, so developers and vendors of the solutions based on the Azure platform can take advantage of the official support from Percona or just use officially certified Percona Operator for MongoDB images
- Starting from now, the Operator [can be installed in multi-namespace (so-called “cluster-wide”) mode](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/cluster-wide.html), when a single Operator can be given a list of namespaces in which to manage Percona Server for MongoDB clusters

## New Features

- [K8SPSMDB-203](https://jira.percona.com/browse/K8SPSMDB-203) Support for the [cluster-wide operator mode](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/cluster-wide.html) allowing one Operator to watch for Percona Server for MongoDB Custom Resources in several namespaces
- [K8SPSMDB-287](https://jira.percona.com/browse/K8SPSMDB-287) Support for the [HashiCorp Vault](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/encryption.html#use-hashicorp-vault-to-store-and-manage-encryption-keys) for encryption keys as a universal, secure and reliable way to store and distribute secrets without depending on the operating system, platform or cloud provider
- [K8SPSMDB-704](https://jira.percona.com/browse/K8SPSMDB-704) Support for the [Azure Kubernetes Service (AKS)](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/aks.html)

## Improvements

- [K8SPSMDB-515](https://jira.percona.com/browse/K8SPSMDB-515) Allow setting requireTLS mode for MongoDB through the Operator to enforce security by restricting each MongoDB server to use TLS/SSL encrypted connections only
- [K8SPSMDB-636](https://jira.percona.com/browse/K8SPSMDB-636) An additional `databaseAdmin` user was added to the list of system users which are automatically created by the Operator. This user is intended to provision databases, collections and perform data modifications
- [K8SPSMDB-699](https://jira.percona.com/browse/K8SPSMDB-699) Disable [automated upgrade](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-db.html) by default to prevent an unplanned downtime for user applications and to provide defaults more focused on strict user’s control over the cluster
- [K8SPSMDB-725](https://jira.percona.com/browse/K8SPSMDB-725) Configuring the log structuring and leveling [is now supported](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug-logs.html#changing-logs-representation) using the `LOG_STRUCTURED` and `LOG_LEVEL` environment variables. This reduces the information overload in logs, still leaving the possibility of getting more details when needed, for example, for debugging
- [K8SPSMDB-719](https://jira.percona.com/browse/K8SPSMDB-719) Details about using sharding, Hashicorp Vault and cluster-wide mode were added to [telemetry](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/telemetry.html)
- [K8SPSMDB-715](https://jira.percona.com/browse/K8SPSMDB-715) Starting from now, the Opearator changed its API version to v1 instead of having a separate API version for each release. Three last API version are supported in addition to `v1`, which substantially reduces the size of Custom Resource Definition to prevent reaching the etcd limit
- [K8SPSMDB-709](https://jira.percona.com/browse/K8SPSMDB-709) Make it possible to use API Key to authorize within Percona Monitoring and Management Server as a more convenient and modern alternative password-based authentication
- [K8SPSMDB-707](https://jira.percona.com/browse/K8SPSMDB-707) Allow to set Service labels for replica set, config servers and mongos in Custom Resource to enable various integrations with cloud providers or service meshes

## Bugs Fixed

- [K8SPSMDB-702](https://jira.percona.com/browse/K8SPSMDB-702) Fix a bug which resulted in always using the `force` option when reconfiguring MongoDB member, which is normally recommended only for special scenarios such as crash recovery
- [K8SPSMDB-730](https://jira.percona.com/browse/K8SPSMDB-730) Fix a bug due to which point-in-time recovery was enabled and consequently disabled when setting Percona Backup for MongoDB compression options without checking whether it was enabled in the Custom Resource
- [K8SPSMDB-660](https://jira.percona.com/browse/K8SPSMDB-660) Fix a bug due to which a successful backup could be erroneously marked as failed due to exceeding the start deadline in case of big number of nodes, especially on sharded clusters
- [K8SPSMDB-686](https://jira.percona.com/browse/K8SPSMDB-686) Fix a bug that prevented downscaling sharded MongoDB cluster to a non-sharded replica set variant
- [K8SPSMDB-691](https://jira.percona.com/browse/K8SPSMDB-691) Fix a bug that produced an error in the Operator log in case of the empty SSL Secret name in Custom Resource
- [K8SPSMDB-696](https://jira.percona.com/browse/K8SPSMDB-696) Fix a bug that prevented removing additional annotations previously added under the `spec.replsets.annotations` field
- [K8SPSMDB-724](https://jira.percona.com/browse/K8SPSMDB-724) Fix a bug which caused the delete-backup finalizer not working causing backups being not deleted from buckets
- [K8SPSMDB-746](https://jira.percona.com/browse/K8SPSMDB-746) Fix a bug due to which the Operator was unable to initialize a three-member replica set with a primary-secondary-arbiter (PSA) architecture
- [K8SPSMDB-762](https://jira.percona.com/browse/K8SPSMDB-762) Fix a bug due to which the Operator was running the replSetReconfig MongoDB command at every reconciliation if arbiter was enabled

## Deprecation, Rename and Removal

- [K8SPSMDB-690](https://jira.percona.com/browse/K8SPSMDB-690) CCustom Resource options under the sharding.mongos.auditLog subsection, deprecated since the Operator version 1.9.0 in favor of using replsets.configuration, were finally removed and cannot be used with the Operator
- [K8SPSMDB-709](https://jira.percona.com/browse/K8SPSMDB-709) Password-based authorization to Percona Monitoring and Management Server is now deprecated and will be removed in future releases in favor of a token-based one. Password-based authorization was used by the Operator before this release to provide MongoDB monitoring, but now using the API Key is the recommended authorization method

## Supported Platforms

The Operator was developed and tested with Percona Server for MongoDB 4.2.22, 4.4.8, 4.4.10, 4.4.13, 4.4.16, 5.0.2, 5.0.4, and 5.0.11. Other options may also work but have not been tested.

The following platforms were tested and are officially supported by the Operator 1.13.0:

- [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) 1.21 - 1.23
- [Amazon Elastic Container Service for Kubernetes (EKS)](https://aws.amazon.com) 1.21 - 1.23
- [OpenShift Container Platform](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.10 - 4.11
- [Azure Kubernetes Service (AKS)](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.22 - 1.24
- [Minikube](https://github.com/kubernetes/minikube) 1.26

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
