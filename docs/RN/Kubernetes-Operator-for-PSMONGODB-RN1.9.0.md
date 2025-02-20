# Percona Distribution for MongoDB Operator 1.9.0


* **Date**

    June 29, 2021



* **Installation**

    For installation please refer to [the documentation page](https://www.percona.com/doc/kubernetes-operator-for-psmongodb/index.html#installation)


## Release Highlights


* Starting from this release, the Operator changes its official name to
**Percona Distribution for MongoDB Operator**. This new name emphasizes
graduate changes which incorporated a collection of Percona’s solutions to run
and operate MongoDB Server, available separately as
[Percona Distribution for MongoDB](https://www.percona.com/doc/percona-distribution-for-mongodb/4.2/index.html).


* It is now possible to restore backups from S3-compatible storage
[to a new Kubernetes-based environment](../backups-restore.md) with no existing
Backup Custom Resources


* You can now customize Percona Server for MongoDB by
[storing custom configuration](../options.md) for Replica Set,
mongos, and Config Server instances in ConfigMaps or in Secrets

## New Features


* [K8SPSMDB-276](https://jira.percona.com/browse/K8SPSMDB-276): Restore backups
to a new Kubernetes-based environment <backups-restore> with no existing
Backup Custom Resource


* [K8SPSMDB-444](https://jira.percona.com/browse/K8SPSMDB-444), [K8SPSMDB-445](https://jira.percona.com/browse/K8SPSMDB-445): Allow storing custom
configuration in ConfigMaps and Secrets

## Improvements


* [K8SPSMDB-365](https://jira.percona.com/browse/K8SPSMDB-365): Unblock backups even if just a single Replica Set
node is available by setting `allowUnsafeConfigurations` flag to true


* [K8SPSMDB-453](https://jira.percona.com/browse/K8SPSMDB-453): It is now possible to see the overall progress of the
provisioning of MongoDB cluster resources and dependent components in Custom
Resource status


* [K8SPSMDB-451](https://jira.percona.com/browse/K8SPSMDB-451), [K8SPSMDB-398](https://jira.percona.com/browse/K8SPSMDB-398): MongoDB cluster resource
statuses in Custom Resource output (e.g. returned by `kubectl get psmdb`
command) have been improved and now provide more precise reporting


* [K8SPSMDB-425](https://jira.percona.com/browse/K8SPSMDB-425): Remove `mongos.expose.enabled` option from Custom
Resource and always expose mongos (with the ClusterIP exposeType by default)


* [K8SPSMDB-421](https://jira.percona.com/browse/K8SPSMDB-421): Secret object containing system users passwords is
now deleted along with the Cluster if delete-psmdb-pvc finalizer is enabled


* [K8SPSMDB-411](https://jira.percona.com/browse/K8SPSMDB-411): Added options to specify custom memory and CPU
requirements for Arbiter instances


* [K8SPSMDB-329](https://jira.percona.com/browse/K8SPSMDB-329): Reduced the number of various etcd and k8s object
updates from the operator to minimize the pressure on the Kubernetes cluster

## Bugs Fixed


* [K8SPSMDB-437](https://jira.percona.com/browse/K8SPSMDB-437): Fixed a bug where Labels were not set on Persistent
Volume Claim objects when set on the respective Pods


* [K8SPSMDB-435](https://jira.percona.com/browse/K8SPSMDB-435): Fixed a bug that prevented adding custom Labels to
mongos Pods


* [K8SPSMDB-423](https://jira.percona.com/browse/K8SPSMDB-423): Fixed a bug where unpause of a cluster did not work
when `replsets.expose = LoadBalancer` because of provisioning new Load
Balancers with different names (Thanks to Aliaksandr Karavai for reporting
this issue)


* [K8SPSMDB-494](https://jira.percona.com/browse/K8SPSMDB-494): When upgrading MongoDB clusters with Smart Update,
the statuses reported in Custom Resource are now reflecting the real state


* [K8SPSMDB-489](https://jira.percona.com/browse/K8SPSMDB-489): Fixed a bug where the status of successful backups
could be set to error in case of a cluster crash


* [K8SPSMDB-462](https://jira.percona.com/browse/K8SPSMDB-462): Fixed a bug where psmdb-backup object could not be
deleted if the backup was not successful


* [K8SPSMDB-456](https://jira.percona.com/browse/K8SPSMDB-456): Fixed a bug where Smart Update was not upgrading a
MongoDB deployment with a replica set consisting of one node


* [K8SPSMDB-455](https://jira.percona.com/browse/K8SPSMDB-455): Fixed a bug that prevented major version downgrade to
a specific version number when `upgradeOptions.setFCV` Custom Resource
option was not updated to the new version


* [K8SPSMDB-485](https://jira.percona.com/browse/K8SPSMDB-485): Fixed TLS documentation that referenced incorrect
Secrets names from the cr.yaml configuration file

## Deprecation and Removal


* We are simplifying the way the user can customize MongoDB components such as
mongod and mongos. [It is now possible](../options.md)
to set custom configuration through ConfigMaps and Secrets Kubernetes
resources. The following options will be deprecated in Percona Distribution
for MongoDB Operator v1.9.0+, and completely removed in v1.12.0+:


    * `sharding.mongos.auditLog.\*`


    * `mongod.security.redactClientLogData`


    * `mongod.security.\*`


    * `mongod.setParameter.\*`


    * `mongod.storage.\*`


    * `mongod.operationProfiling.mode`


    * `mongod.auditLog.\*`


* The mongos.expose.enabled option has been completely removed from the Custom
Resource as it was causing confusion for the users
