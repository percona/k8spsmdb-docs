# *Percona Operator for MongoDB* 1.15.0

* **Date**

    October 9, 2023

* **Installation**

    [Installing Percona Operator for MongoDB](../index.md#quickstart-guides)

## Release Highlights

### Physical Backups now support Point-in-time Recovery (in tech preview)

In the previous [1.14.0 release](Kubernetes-Operator-for-PSMONGODB-RN1.14.0.md) we added support for [Physical Backups and Restores](../backups.md#physical) to significantly reduce Recovery Time Objective ([RTO](https://www.percona.com/blog/backups-and-disaster-recovery/#:~:text=Recovery%20time%20objective%20(RTO)%20is,afford%20to%20lose%20after%20recovery).)), especially for big data sets. But the problem with losing data between backups - in other words Recovery Point Objective (RPO) - for physical backups was not solved. With this release users can greatly reduce RPO by leveraging the Point-in-time Recovery feature in the Operators. Under the hood we store logical oplogs along with physical backups into the object storage. Read more about this feature in our [documentation](https://docs.percona.com/percona-operator-for-mongodb/backups.html).

### Encrypted backups with Server Side Encryption (SSE)

Backups stored on S3 compatible storage [can now be encrypted](../backups-encryption.md) with Server Side Encryption (SSE) to pass certain compliance or security requirements. Users can leverage integration with AWS KMS or just encrypt/decrypt backups with AES-256 encryption algorithm. It is important to remember that Operator does not store keys and users can choose which key storage to use.

## New Features

* {{ k8spsmdbjira(227) }} The new `topologySpreadConstraints` Custom Resource option allows to use [Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/workloads/pods/pod-topology-spread-constraints/#spread-constraints-for-pods) to achieve even distribution of Pods across the Kubernetes cluster

* {{ k8spsmdbjira(792) }} and {{ k8spsmdbjira(974) }} The new "sleep infinity" mode available for replset and config server containers allows [running the Pod without starting mongod](../debug-shell.md#avoid-the-restart-on-fail-loop-for-percona-server-for-mongodb-containers) useful to examine a problematic Pod that is constantly restarting

* {{ k8spsmdbjira(801) }} It is now possible to delete a backup with its PITR data on retention period or with `delete-backup` finalizer (there were no PITR files deletion in previous versions )

* {{ k8spsmdbjira(926) }} Point-in-time recovery is now supported with physical backups to significantly reduce Recovery Point Objective (RPO)

* {{ k8spsmdbjira(961) }} The new `sharding.balancer.enabled` Custom Resource option allows to disable Load Balancer on a cross-site replication managed cluster

## Improvements

* {{ k8spsmdbjira(662) }} Restoring a backup with point-in-time recovery can now be easily done to a latest available position by setting `pitr.type` PerconaServerMongoDBRestore Custom Resource option to `latest`

* {{ k8spsmdbjira(774) }} The Transport encryption documentation now includes details on [updating TLS certificates](../TLS.md#update-certificates)

* {{ k8spsmdbjira(807) }} A custom name for a Replica Set config server instead of the default `cfg` one [can be set](../sharding.md#turning-sharding-on-and-off) in the custom configuration, which can be useful for migration purposes

* {{ k8spsmdbjira(814) }} and {{ k8spsmdbjira(927) }} The new `terminationGracePeriodSeconds` Custom Resource option allows to set termination period for Replica Set containers, useful to cleanly shutdown clusters with big data sets

* {{ k8spsmdbjira(850) }} [Server Side Encryption for backups](../backups-encryption.md) with for S3 and S3-compatible storage is now supported (thanks to Mert Gönül for contribution)

* {{ k8spsmdbjira(903) }} The [backup destination](../backups-restore.md) URI now includes bucket/container name, allowing the user to specify the full path to the backup as an easy to read string

* {{ k8spsmdbjira(924) }} The token associated with the operator's ServiceAccount is no longer printed in the log when a scheduled backup is running; this improves security and avoids logging uninformative elements

* {{ k8spsmdbjira(938) }} Configuring [Kubernetes host aliases](../operator.md#replsets.hostaliases.hostnames) is now possible for replica set, config server, and mongos Pods

* {{ k8spsmdbjira(946) }} The psmdb-backup object now includes the name of the Pod that made the backup, to save users from searching for the correct Pod to examine the Percona Backup for MongoDB logs (previously it was necessary to check replica set Pods one by one until logs were found)

* {{ k8spsmdbjira(976) }} The Operator now does not start backups if storages or credentials are not set, avoiding fruitless attempts to configure Percona Backup for MongoDB and cluster state repeatedly changing between ready and error

* {{ k8spsmdbjira(929) }} [Using split-horizon DNS](../expose.md#exposing-replica-set-with-split-horizon-dns) for the external access to MongoDB Replica Set Pods of the exposed cluster is now possible

## Bugs Fixed

* {{ k8spsmdbjira(913) }} Fix a bug due to which restoring a backup on a cluster with mongos exposed via LoabBalancer resulted in recreating mongos Service with a new IP address

* {{ k8spsmdbjira(956) }} Fix a bug that certificate rotation was bringing the sharded MongoDB cluster down (thanks to Stiliyan for reporting)

* {{ k8spsmdbjira(854) }} Backup stucks after cluster was exposed

* {{ k8spsmdbjira(977) }} The out of memory problem could cause cluster got stuck in the "initializing" state at reconciliation

* {{ k8spsmdbjira(778) }} Fix a bug due to which the Operator did not delete arbiter instances during replica set deletion

* {{ k8spsmdbjira(791) }} Fix a bug which prevented setting `LoadBalancerSourceRanges` Custom Resource option when `replsets.expose.exposeType` is set to `Loadbalancer`

* {{ k8spsmdbjira(813) }} Fix a bug due to which secure connection was not used for MongoDB Liveness check (thanks to t-yrka for contribution)

* {{ k8spsmdbjira(818) }} Fix a bug where `clusterMonitor` user had not enough permissions for PMM monitoring with `--enable-all-collectors` flag turned on

* {{ k8spsmdbjira(872) }} The Operator didn't prevent attempts to restore a backup with "error" status, which could cause the cluster got stuck in the "initializing" state

* {{ k8spsmdbjira(876) }} Fix a bug due to which `delete-psmdb-pods-in-order` finalizer, intended to shutdown primary Pod last, affected only shards and did not affect config replica set 

* {{ k8spsmdbjira(911) }} Fix a bug where connection string with credentials was included in the backup-agent container logs

* {{ k8spsmdbjira(958) }} Fix insufficient permissions issue that didn't allow to monitor mongos instances with Percona Monitoring and Management (PMM)

* {{ k8spsmdbjira(962) }} Fix a memory leak due to which the Operator's Pod continually increased both CPU and memory usage in cluster-wide mode (with an unmanaged cluster)

* {{ k8spsmdbjira(968) }} Fix a bug due to which the endpoints list returned by `kubectl get psmdb` command contained fully qualified domain names (FQDN) instead of IP addresses when the replset was exposed as a LoadBalancer and the clusterServiceDNSMode was set to Internal

## Deprecation and removal

* {{ k8spsmdbjira(883) }} The `spec.mongod` section deprecated in the Operator version 1.12.0 is finally removed from the Custom Resource configuration 

## Supported Platforms

The Operator was developed and tested with Percona Server for MongoDB 4.4.24,
5.0.20, and 6.0.9. Other options may also work but have not been tested. The
Operator also uses Percona Backup for MongoDB 2.3.0.

The following platforms were tested and are officially supported by the Operator
1.15.0:

* [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) 1.24-1.28

* [Amazon Elastic Container Service for Kubernetes (EKS)](https://aws.amazon.com) 1.24-1.28

* [OpenShift Container Platform](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.11 - 4.13

* [Azure Kubernetes Service (AKS)](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.25-1.28

* [Minikube](https://github.com/kubernetes/minikube) 1.31.2 (based on Kubernetes 1.28)

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
