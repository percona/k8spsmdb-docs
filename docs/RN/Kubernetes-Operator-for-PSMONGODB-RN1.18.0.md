# *Percona Operator for MongoDB* 1.18.0

* **Date**

    November 06, 2024

* **Installation**

    [Installing Percona Operator for MongoDB](../System-Requirements.md#installation-guidelines)

## Release Highlights

### Enchancements of the user management (technical preview)

Before the Operator version 1.17.0 custom MongoDB users had to be created manually. Now the declarative creation of custom MongoDB users [is supported](../users.md#unprivileged-users) via the `users` subsection in the Custom Resource. You can specify a new user in `deploy/cr.yaml` manifest, setting the user’s login name and database, PasswordSecretRef (a reference to a key in a Secret resource containing user’s password) and as well as MongoDB roles on various databases which should be assigned to this user:

```yaml
...
users:
- name: my-user
  db: admin
  passwordSecretRef: 
    name: my-user-password
    key: my-user-password-key
  roles:
    - name: clusterAdmin
      db: admin
    - name: userAdminAnyDatabase
      db: admin
```

See [documentation](../users.md#unprivileged-users) to find more details about this feature with additional explanations and the list of current limitations.

### Support for selective resotores 

Percona Backup for MongoDB 2.0.0 had introduced new functionality which allows to do partial restores, which means selectively restore only with the desired subset of data. Now the Operator also supports this feature, allowing you to restore a specific database or a collection from a backup. You can achieve this by using an additional `selective` section in the `PerconaServerMongoDBRestore` Custom Resource:

```yaml
spec:
  selective:
    withUsersAndRoles: true
    namespaces:
    - "db.collection"
```

You can find more on selective restores and their limitations [in official documentation](../backups-restore.md#selective-restores).

### Split-horizon DNS configuration for external nodes

Using [split-horizon DNS](../expose.md#exposing-replica-set-with-split-horizon-dns) with cross-site replication now allows users to configure horizons for external nodes in the Custom Resource in the `replsets.externalNodes` subsection:

```yaml
externalNodes:
- host: 34.124.76.90
  horizons:
    external: rs0-0.example.com
- host: 34.124.76.91
  port: 27017
  votes: 0
  priority: 0
  horizons:
    external: rs0-1.example.com
- host: 34.124.76.92
  horizons:
    external: rs0-2.example.com
```

## New Features

* {{ k8spsmdbjira(894) }}: It is now possible to restore a subset of data (a specific database or a collection) from a backup
* {{ k8spsmdbjira(1113 }}: The new `percona.com/delete-pitr-chunks` finalizer allows to delete PITR log files from the backup storage when deleting a cluster
* {{ k8spsmdbjira(1124) }} and {{ k8spsmdbjira(1146) }}: Declarative user management now covers creating and managing user roles, and has less limitations compared to its initial implementation in previous release
* {{ k8spsmdbjira(1140) }}: Multi-DC 3 node cluster deployment with ingress deployment

## Improvements

* {{ k8spsmdbjira(739) }}: A number Service exposure options in the `replsets`, `sharding.configsvrReplSet`, and `sharding.mongos` subsections were unified with other Percona Operators
* {{ k8spsmdbjira(1002) }}: New Custom Resource options under the [replsets.primaryPreferTagSelector`](../operator.md#replsets.primaryprefertagselectorregion) subsection allow to provide Primary instance selection preferences based on specific zone and region, which may be especially useful within the planned zone switchover process (Thanks to sergelogvinov for contribution)
* {{ k8spsmdbjira(1096) }}: Restore logs were improved to contain pbm-agent logs in mongod containers, useful to debug faults in the backup restoration process
* {{ k8spsmdbjira(1135) }}: Split-horizon DNS for external (unmanaged) nodes [is now configurable](../expose.md#exposing-replica-set-with-split-horizon-dns) via the `replsets.externalNodes` subsection in Custom Resource
* {{ k8spsmdbjira(1152) }}: Starting from now, the Operator uses multi-architecture images of Percona Server for MongoDB and Percona Backup for MongoDB, making it simpler to deploy cluster on ARM
* {{ k8spsmdbjira(1160) }}: The [PVC resize](../scaling.md#scale-storage) feature introduced in previous release can now be enabled or disabled via the `enableVolumeExpansion` Custom Resource option (`false` by default), which protects the cluster from storage resize triggered by mistake 
* {{ k8spsmdbjira(1132) }}: A new [`secrets.keyFile`](../operator.md#secretskeyfile) Custom Resource option allows to configure custom name for the Secret with the MongoDB Internal Auth Key file 

## Bugs Fixed

* {{ k8spsmdbjira(912) }}: Fix a bug where full backup connection string including password was visible in logs in case of the Percona Backup for MongoDB errors
* {{ k8spsmdbjira(1047) }}: Fix a bug where Operator was changing [writeConcernMajorityJournalDefault](https://www.mongodb.com/docs/manual/reference/replica-configuration/#mongodb-rsconf-rsconf.writeConcernMajorityJournalDefault) to "true" during the replica set reconfiguring, ignoring the value set by user
* {{ k8spsmdbjira(1141) }}: Fix a bug where cross-site replication with mongoDB didn't work when Ingress controller was used to expose a Service on top of ClusterIP
* {{ k8spsmdbjira(1168) }}: Fix a bug where successful backups could obtain failed state in case of the Operator configured with `watchAllNamespaces: true` and having the same name for MongoDB clusters across multiple namespaces due to coinciding certificate file names on the filesystem (Thanks to Markus Küffner for contribution)
* {{ k8spsmdbjira(1170) }}: Fix a bug which prevented to delete a cluster with active `percona.com/delete-psmdb-pods-in-order` finalizer in case of the cluster error state (e.g. when mongo replset failed to reconcile)
* {{ k8spsmdbjira(1184) }}: Fix a bug where the Operator failed to reconcile when using the container security context with `readOnlyRootFilesystem` set to `true` (Thanks to applejag for contribution)

## Deprecation, Rename and Removal

A number of Service exposure Custom Resource options in the `replsets`, `sharding.configsvrReplSet`, and `sharding.mongos` subsections were renamed to provide unified experience with other Percona Operators:

* `expose.serviceAnnotations` option renamed to `expose.annotations`
* `expose.serviceLabels` option renamed to `expose.labels`
* `expose.exposeType` option renamed to `expose.type`

## Known Issues and Limitations

* {{ k8spsmdbjira(1167) }}: Document PBM 2.6.0 limitation if not fixed before PSMDBO relese **ToDo**

## Supported Platforms

The Operator was developed and tested with Percona Server for MongoDB 5.0.28-24,
6.0.16-13, and 7.0.12-7. Other options may also work but have not been tested. The
Operator also uses Percona Backup for MongoDB 2.5.0.

The following platforms were tested and are officially supported by the Operator
1.17.0:

* [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.27-1.30
* [Amazon Elastic Container Service for Kubernetes (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.28-1.30
* [OpenShift Container Platform :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.13.48 - 4.16.9
* [Azure Kubernetes Service (AKS) :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.28-1.30
* [Minikube :octicons-link-external-16:](https://github.com/kubernetes/minikube) 1.33.1

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
