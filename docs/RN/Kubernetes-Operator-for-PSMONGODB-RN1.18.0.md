# Percona Operator for MongoDB 1.18.0

* **Date**

    November 14, 2024

* **Installation**

    [Installing Percona Operator for MongoDB](../System-Requirements.md#installation-guidelines)

## Release Highlights

### Enhancements of the declarative user management

The [declarative management of custom MongoDB users](../users.md#application-level-unprivileged-users) was improved compared to its initial implementation in the previous release, where the Operator did not track and sync user-related changes in the Custom Resource and the database. Also, starting from now you can create custom MongoDB roles on various databases just like users in the `deploy/cr.yaml` manifest:

```yaml
...
roles:
  - name: clusterAdmin
    db: admin
  - name: userAdminAnyDatabase
    db: admin
```

See [the documentation](../users.md#custom-mongodb-roles) to find more details about this feature.

### Support for selective restores 

Percona Backup for MongoDB 2.0.0 has introduced a new functionality that allows partial restores, which means selectively restoring only with the desired subset of data. Now the Operator also supports this feature, allowing you to restore a specific database or a collection from a backup. You can achieve this by using an additional `selective` section in the `PerconaServerMongoDBRestore` Custom Resource:

```yaml
spec:
  selective:
    withUsersAndRoles: true
    namespaces:
    - "db.collection"
```

You can find more on selective restores and their limitations [in our documentation](../backups-restore.md#selective-restore).

### Splitting the replica set of the database cluster over multiple Kubernetes clusters

Recent improvements in cross-site replication made it possible to [keep the replica set of the database cluster in different data centers](../replication-multi-dc.md). The Operator itself cannot deploy MongoDB replicas to other data centers, but this still can be achieved with a number of Operator deployments, equal to the size of your replica set: one Operator to control the replica set via cross-site replication, and at least two Operators to bootstrap the unmanaged clusters with other MongoDB replica set instances. Splitting the replica set of the database cluster over multiple Kubernetes clusters can be useful to get a fault-tolerant system in which all replicas are in different data centers.
You can find more about configuring such a multi-datacenter MongoDB cluster and the limitations of this solution on the [dedicated documentation page](../replication-multi-dc.md).

## New Features

* {{ k8spsmdbjira(894) }}:  It is now possible to restore a subset of data (a specific database or a collection) from a backup which is useful to reduce time on restore operations when fixing corrupted data fragment
* {{ k8spsmdbjira(1113) }}: The new `percona.com/delete-pitr-chunks` finalizer allows the deletion of PITR log files from the backup storage when deleting a cluster so that leftover data does not continue to take up space in the cloud
* {{ k8spsmdbjira(1124) }} and {{ k8spsmdbjira(1146) }}: Declarative user management now covers creating and managing user roles, and syncs user-related changes between the Custom Resource and the database
* {{ k8spsmdbjira(1140) }} and {{ k8spsmdbjira(1141) }}: Multi-datacenter cluster deployment [is now possible](../replication-multi-dc.md)

## Improvements

* {{ k8spsmdbjira(739) }}: A number of Service exposure options in the `replsets`, `sharding.configsvrReplSet`, and `sharding.mongos`  were renamed for unification with other Percona Operators
* {{ k8spsmdbjira(1002) }}: New Custom Resource options under the [replsets.primaryPreferTagSelector`](../operator.md#replsetsprimaryprefertagselectorregion) subsection allow providing Primary instance selection preferences based on specific zone and region, which may be especially useful within the planned zone switchover process (Thanks to sergelogvinov for contribution)
* {{ k8spsmdbjira(1096) }}: Restore logs were improved to contain pbm-agent logs in mongod containers, useful to debug failures in the backup restoration process
* {{ k8spsmdbjira(1135) }}: Split-horizon DNS for external (unmanaged) nodes [is now configurable](../expose.md#exposing-replica-set-with-split-horizon-dns) via the `replsets.externalNodes` subsection in Custom Resource
* {{ k8spsmdbjira(1152) }}: Starting from now, the Operator uses multi-architecture images of Percona Server for MongoDB and Percona Backup for MongoDB, making it easier to deploy a cluster on ARM
* {{ k8spsmdbjira(1160) }}: The [PVC resize](../scaling.md#scale-storage) feature introduced in previous release can now be enabled or disabled via the `enableVolumeExpansion` Custom Resource option (`false` by default), which protects the cluster from storage resize triggered by mistake 
* {{ k8spsmdbjira(1132) }}: A new [`secrets.keyFile`](../operator.md#secretskeyfile) Custom Resource option allows to configure custom name for the Secret with the MongoDB internal auth key file 

## Bugs Fixed

* {{ k8spsmdbjira(912) }}: Fix a bug where the full backup connection string including the password was visible in logs in case of the Percona Backup for MongoDB errors
* {{ k8spsmdbjira(1047) }}: Fix a bug where the Operator was changing [writeConcernMajorityJournalDefault](https://www.mongodb.com/docs/manual/reference/replica-configuration/#mongodb-rsconf-rsconf.writeConcernMajorityJournalDefault) to "true" during the replica set reconfiguring, ignoring the value set by user
* {{ k8spsmdbjira(1168) }}: Fix a bug where successful backups could obtain a failed state in case of the Operator configured with `watchAllNamespaces: true` and having the same name for MongoDB clusters across multiple namespaces (Thanks to Markus Küffner for contribution)
* {{ k8spsmdbjira(1170) }}: Fix a bug that prevented deletion of a cluster with the active `percona.com/delete-psmdb-pods-in-order` finalizer in case of the cluster error state (e.g. when mongo replset failed to reconcile)
* {{ k8spsmdbjira(1184) }}: Fix a bug where the Operator failed to reconcile when using the container security context with `readOnlyRootFilesystem` set to `true` (Thanks to applejag for contribution)
* {{ k8spsmdbjira(1180) }}: Fix a bug where rotation functionality didn't work for scheduled backups

## Deprecation, Rename and Removal

* The new `enableVolumeExpansion` Custom Resource option allows users to disable the [automated storage scaling with Volume Expansion capability](../scaling.md#storage-resizing-with-volume-expansion-capability). The default value of this option is `false`, which means that the automated scaling is turned off by default.

* A number of Service exposure Custom Resource options in the `replsets`, `sharding.configsvrReplSet`, and `sharding.mongos` subsections were renamed to provide a unified experience with other Percona Operators:

    * `expose.serviceAnnotations` option renamed to `expose.annotations`
    * `expose.serviceLabels` option renamed to `expose.labels`
    * `expose.exposeType` option renamed to `expose.type`

## Supported Platforms

The Operator was developed and tested with Percona Server for MongoDB 5.0.29-25,
6.0.18-15, and 7.0.14-8. Other options may also work but have not been tested. The
Operator also uses Percona Backup for MongoDB 2.7.0.

The following platforms were tested and are officially supported by the Operator
1.18.0:

* [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.28-1.30
* [Amazon Elastic Container Service for Kubernetes (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.28-1.31
* [OpenShift Container Platform :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.13.52 - 4.17.3
* [Azure Kubernetes Service (AKS) :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.28-1.31
* [Minikube :octicons-link-external-16:](https://github.com/kubernetes/minikube) 1.34.0 based on Kubernetes 1.31.0

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
