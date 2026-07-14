# Percona Operator for MongoDB 1.19.0

* **Date**

    January 21, 2025

* **Installation**

    [Installing Percona Operator for MongoDB](../System-Requirements.md#installation-guidelines)

## Release Highlights

### Using remote file server for backups (tech preview)

The new `filesystem` backup storage type was added in this release in addition to already existing `s3` and `azure` types. 
 It allows users to mount a remote file server to a local directory, and make Percona Backup for MongoDB using this directory as a storage for backups. The approach is based on common Network File System (NFS) protocol, and should be useful in network-restricted environments without S3-compatible storage or in cases with a non-standard storage service supporting NFS access.

To use NFS-capable remote file server as a backup storage, user needs to mount the remote storage as a sidecar volume in the `replsets` section of the Custom Resource (and also `configsvrReplSet` in case of a sharded cluster):

```yaml
replsets:
  ...
  sidecarVolumes:
  - name: backup-nfs
    nfs:
      server: "nfs-service.storage.svc.cluster.local"
      path: "/psmdb-some-name-rs0"
  ...
```

Finally, this new storage needs to be configured in the same Custom Resource as a normal storage for backups:

```yaml
backup:
  ...
  storages:
    backup-nfs:
      filesystem:
        path: /mnt/nfs/
          type: filesystem
  ...
  volumeMounts:
  - mountPath: /mnt/nfs/
    name: backup-nfs
```

See more in our [documentation about this storage type](../backups-storage-filesystem.md).

### Generated passwords for custom MongoDB users

A new improvement for the [declarative management of custom MongoDB users](../app-users.md) brings the possibility to use automatic generation of users passwords. When you specify a new user in `deploy/cr.yaml` configuration file, you can omit specifying a reference to an already existing Secret with the user’s password, and the Operator will generate it automatically:

```yaml
...
users:
  - name: my-user
    db: admin
    roles:
      - name: clusterAdmin
        db: admin
      - name: userAdminAnyDatabase
        db: admin
```

Find more details on this automatically created Secret [in our documentation](../app-users.md#custom-mongodb-roles).

### Percona Server for MongoDB 8.0 support

Percona Server for MongoDB 8.0 is now supported by the Operator in addition to 6.0 and 7.0 versions. The appropriate images are now included into the [list of Percona-certified images](../images.md).
See [this blogpost :octicons-link-external-16:](https://www.percona.com/blog/percona-server-for-mongodb-8-0-most-performant-ever/) for details about the latest MongoDB 8.0 features with the added reliability and performance improvements.

## New Features

* {{ k8spsmdbjira(1109) }}: Backups can now be [stored on a remote file server](../backups-storage-filesystem.md)
* {{ k8spsmdbjira(921) }}: [IAM Roles for Service Accounts (IRSA)](../backups-storage-s3.md#automating-access-to-amazon-s3-based-on-iam-roles) allow automating access to AWS S3 buckets based on Identity Access Management with no need to specify the S3 credentials explicitly
* {{ k8spsmdbjira(1133) }}: Manual change of Replica Set Member Priority in Percona Server MongoDB Operator [is now possible](../operator.md#replsetsreplsetoverridesmember-namepriority) with the new `replsetOverrides.MEMBER-NAME.priority` Custom Resource option
* {{ k8spsmdbjira(1164) }}: Add the possibility to create users in the `$external` database for external authentication purposes 

## Improvements

* {{ k8spsmdbjira(1123) }}: Percona Server for MongoDB 8.0 is now supported
* {{ k8spsmdbjira(1171) }}: The [declarative user management](../app-users.md#create-users-via-custom-resource) was enchanced with the possibility to automatically generate passwords
* {{ k8spsmdbjira(1174) }}: [Telemetry](../telemetry.md) was improved to to track whether the custom users and roles management, automatic volume expansion, and multi-cluster services features are enabled
* {{ k8spsmdbjira(1179) }}: It is now possible to configure externalTrafficPolicy for [mongod](../operator.md#replsetsexposeexternaltrafficpolicy), [configsvr](../operator.md#shardingconfigsvrreplsetexposeexternaltrafficpolicy) and [mongos](../operator.md#shardingmongosexternaltrafficpolicy) instances
* {{ k8spsmdbjira(1205) }}: Backups in unmanaged clusters [are now supported](../replication-backups.md), removing a long-standing limitation of [cross-site replication](../replication.md) that didn’t allow backups on replica clusters

## Bugs Fixed

* {{ k8spsmdbjira(1215) }}: Fix a bug where ExternalTrafficPolicy was incorrectly set for LoadBalancer and NodePort services (Thanks to Anton Averianov for contributing)
* {{ k8spsmdbjira(675) }}: Fix a bug where disabling sharding failed on a running cluster with enabled backups
* {{ k8spsmdbjira(754) }}: Fix a bug where some error messages had "INFO" log level and therefore were not seen in logs with the "ERROR" log level [turned on](../debug-logs.md#changing-logs-representation)
* {{ k8spsmdbjira(1088) }}: Fix a bug which caused the Operator starting two backup operations if the user patches the backup object while its state is empty or Waiting 
* {{ k8spsmdbjira(1156) }}: Fix a bug that prevented the Operator with enabled backups to recover from invalid TLS configurations (Thanks to KOS for reporting)
* {{ k8spsmdbjira(1172) }}: Fix a bug where backup user's password username with special characters caused Percona Backup for MongoDB to fail
* {{ k8spsmdbjira(1212) }}: Stop disabling balancer during restores, because it is not required for Percona Backup for MongoDB 2.x

## Deprecation, Rename and Removal

* The `psmdbCluster` option from the `deploy/backup/backup.yaml` manifest used for [on-demand backups](../backups-ondemand.md), which was deprecated since the Operator version 1.12.0 in favor of the `clusterName` option, has been removed and is no longer supported.
* Percona Server for MongoDB 5.0 has reached its end of life and in no longer supported by the Operator

## Supported Platforms

The Operator was developed and tested with Percona Server for MongoDB 6.0.19-16, 7.0.15-9, and 8.0.4-1. Other options may also work but have not been tested. The Operator also uses Percona Backup for MongoDB 2.8.0.

Percona Operators are designed for compatibility with all [CNCF-certified :octicons-link-external-16:](https://www.cncf.io/training/certification/software-conformance/) Kubernetes distributions. Our release process includes targeted testing and validation on major cloud provider platforms and OpenShift, as detailed below for Operator version 1.19.0:


* [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.28-1.30
* [Amazon Elastic Container Service for Kubernetes (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.29-1.31
* [OpenShift Container Platform :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.14.44 - 4.17.11
* [Azure Kubernetes Service (AKS) :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.28-1.31
* [Minikube :octicons-link-external-16:](https://github.com/kubernetes/minikube) 1.34.0 based on Kubernetes 1.31.0

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
