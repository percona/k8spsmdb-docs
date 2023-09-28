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

* {{ k8spsmdbjira(913) }} restore recreates mongos pod which recreates load balancer

* {{ k8spsmdbjira(956) }} Certificate Rotation brought the Sharded MongoDB cluster down

* {{ k8spsmdbjira(854) }} Backup stucks after cluster was exposed

* {{ k8spsmdbjira(977) }} ERROR failed to reconcile cluster in the logs for no apparent reason

* {{ k8spsmdbjira(247) }} after restore from backup cluster passwords out of sync and operator cannot authenticate

* {{ k8spsmdbjira(712) }} Want to create excess port in psmdb-db helm chart

* {{ k8spsmdbjira(778) }} Operator don't delete arbiter during replica set deletion

* {{ k8spsmdbjira(791) }} Unable to set LoadBalancerSourceRanges when LoadBalancer is set as type in replsets

* {{ k8spsmdbjira(813) }} mongodb-healthcheck never uses a secure connection

* {{ k8spsmdbjira(818) }} ClusterRole user does not have enough permissions

* {{ k8spsmdbjira(872) }} operator should not try to restore backup with error status

* {{ k8spsmdbjira(875) }} cannot run physical restores with non-voting/arbiter/delayed replica members

* {{ k8spsmdbjira(876) }} delete-psmdb-pods-in-order finalizer doesn't affect config replica set

* {{ k8spsmdbjira(885) }} E2E tests - start mongod major upgrade from the lowest version

* {{ k8spsmdbjira(907) }} Implement custom MarshalJSON function for PITRestoreDate data type

* {{ k8spsmdbjira(911) }} Fix credentials in backup-agent container logs

* {{ k8spsmdbjira(929) }} Can't connect to MongoDB Replica Set via LoadBalancer

* {{ k8spsmdbjira(930) }} Helm chart - watchNamespace doesn't work

* {{ k8spsmdbjira(937) }} Deconding to an empty interface fails with official mongo driver

* {{ k8spsmdbjira(958) }} PMM fails to monitor mongoS due to lack of permission

* {{ k8spsmdbjira(962) }} Percona Operator POD constantly increasing CPU and Memory usage

* {{ k8spsmdbjira(963) }} votes and priority are mandatory when specifying external nodes

* {{ k8spsmdbjira(965) }} PerconaServerMongoDB Failing in k8s 1.26.6 control plane version

* {{ k8spsmdbjira(968) }} CR endpoint is wrong if replsets are exposed

* {{ k8spsmdbjira(970) }} pkg/apis/psmdb/v1 module imported more than once

* {{ k8spsmdbjira(971) }} demand-backup-physical fails on EKS v1.27

* {{ k8spsmdbjira(980) }} cannot pause or delete cluster started from template cr.yaml

## Deprecation and removal

* {{ k8spsmdbjira(883) }} Remove mongod section from CR

* {{ k8spsmdbjira(906) }} Remove unnecessary LOG_VERBOSE env var
## Supported Platforms

The Operator was developed and tested with Percona Server for MongoDB 4.4.18, 5.0.14, and 6.0.4. Other options may also work but have not been tested.

The following platforms were tested and are officially supported by the Operator 1.14.0:

* [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) 1.22 - 1.25

* [Amazon Elastic Container Service for Kubernetes (EKS)](https://aws.amazon.com) 1.22 - 1.24

* [OpenShift Container Platform](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.10 - 4.12

* [Azure Kubernetes Service (AKS)](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.23 - 1.25

* [Minikube](https://github.com/kubernetes/minikube) 1.29

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
