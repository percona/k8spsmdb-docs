# *Percona Operator for MongoDB* 1.15.0

* **Date**

    October 5, 2023

* **Installation**

    [Installing Percona Operator for MongoDB](../index.md#quickstart-guides)

## Release Highlights

* Backups and Restores are critical for business continuity. With this release you can significantly reduce your Recovery Time Objective (RTO) with [Physical backups](../backups.md#physical) support in the Operator. The feature is now in technical preview.
* MongoDB 6.0 [comes with a variety](https://www.percona.com/blog/mongodb-6-0-should-you-upgrade-now/) of improvements and new features. It is now fully supported by the Operator. See our [documentation](../update.md#major-version-automated-upgrades) to learn how to upgrade.

## New Features

* {{ k8spsmdbjira(227) }} Add topologySpreadConstraints to the specs for even distribution of the pods

* {{ k8spsmdbjira(792) }} Crash recovery infrastructure with ability to run --repair

* {{ k8spsmdbjira(801) }} Add support for PITR retention

* {{ k8spsmdbjira(926) }} Add support for PITR with physical backups

* {{ k8spsmdbjira(961) }} Balancer disable option with managed mode

## Improvements

* {{ k8spsmdbjira(662) }} add PITR option for restoring to latest position

* {{ k8spsmdbjira(774) }} Add section about TLS/SSL certificates update into docs

* {{ k8spsmdbjira(807) }} Allow to set custom name for Replica Set Config Server

* {{ k8spsmdbjira(814) }} Unclean shutdown when pausing the cluster

* {{ k8spsmdbjira(850) }} Add support for Server Side Encryption for backups

* {{ k8spsmdbjira(864) }} Add the possibility of enabling and disabling debug mode for e2e tests

* {{ k8spsmdbjira(903) }} Add bucket name to backup destination

* {{ k8spsmdbjira(924) }} make cronjob less verbose

* {{ k8spsmdbjira(927) }} Pass terminationGracePeriodSeconds to RS containers

* {{ k8spsmdbjira(938) }} Allow configuring hostAliases for pods

* {{ k8spsmdbjira(946) }} Difficult backup failure troubleshooting

* {{ k8spsmdbjira(974) }} Allow "sleep infinity" for psmdb pods

* {{ k8spsmdbjira(976) }} Do not start backups if storages or credentials are not set



## Bugs Fixed

* {{ k8spsmdbjira(913) }} Fix a bug due to which restoring a backup on a cluster with mongos exposed via LoabBalancer resulted in recreating mongos Service with a new IP address

* {{ k8spsmdbjira(956) }} Fix a bug that certificate rotation was bringing the sharded MongoDB cluster down (thanks to Stiliyan for reporting)

* {{ k8spsmdbjira(854) }} Backup stucks after cluster was exposed

* {{ k8spsmdbjira(977) }} The out of memory problem could cause cluster got stuck in the "initializing" state at reconciliation

* {{ k8spsmdbjira(712) }} Want to create excess port in psmdb-db helm chart **STILL OPEN**

* {{ k8spsmdbjira(778) }} Fix a bug due to which the Operator did not delete arbiter instances during replica set deletion

* {{ k8spsmdbjira(791) }} Fix a bug which prevented setting `LoadBalancerSourceRanges` Custom Resource option when `replsets.expose.exposeType` is set to `Loadbalancer`

* {{ k8spsmdbjira(813) }} Fix a bug due to which secure connection was not used for MongoDB Liveness check (thanks to t-yrka for contribution)

* {{ k8spsmdbjira(818) }} Fix a bug where `clusterMonitor` user had not enough permissions for PMM monitoring with `--enable-all-collectors` flag turned on

* {{ k8spsmdbjira(872) }} The Operator didn't prevent attempts to restore a backup with "error" status, which could cause the cluster got stuck in the "initializing" state

* {{ k8spsmdbjira(876) }} Fix a bug due to which `delete-psmdb-pods-in-order` finalizer, intended to shutdown primary Pod last, affected only shards and did not affect config replica set 

* {{ k8spsmdbjira(911) }} Fix a bug where connection string with credentials was included in the backup-agent container logs

* {{ k8spsmdbjira(929) }} Can't connect to MongoDB Replica Set via LoadBalancer

* {{ k8spsmdbjira(930) }} Helm chart - watchNamespace doesn't work **STILL OPEN**

* {{ k8spsmdbjira(958) }} Fix insufficient permissions issue that didn't allow to monitor mongos instances with Percona Monitoring and Management (PMM)

* {{ k8spsmdbjira(962) }} Fix a memory leak due to which the Operator's Pod continually increased both CPU and memory usage in cluster-wide mode (with an unmanaged cluster)

* {{ k8spsmdbjira(968) }} Fix a bug due to which the endpoints list returned by `kubectl get psmdb` command contained fully qualified domain names (FQDN) instead of IP addresses when the replset was exposed as a LoadBalancer and the clusterServiceDNSMode was set to Internal

## Deprecation and removal

* {{ k8spsmdbjira(883) }} The `spec.mongod` section deprecated in the Operator version 1.12.0 is finally removed from the Custom Resource configuration 

## Supported Platforms

The Operator was developed and tested with Percona Server for MongoDB 4.4.18, 5.0.14, and 6.0.4. Other options may also work but have not been tested.

The following platforms were tested and are officially supported by the Operator 1.14.0:

* [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) 1.22 - 1.25

* [Amazon Elastic Container Service for Kubernetes (EKS)](https://aws.amazon.com) 1.22 - 1.24

* [OpenShift Container Platform](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.10 - 4.12

* [Azure Kubernetes Service (AKS)](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.23 - 1.25

* [Minikube](https://github.com/kubernetes/minikube) 1.29

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
