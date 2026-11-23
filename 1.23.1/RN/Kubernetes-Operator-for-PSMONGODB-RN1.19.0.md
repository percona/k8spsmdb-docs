> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Percona Operator for MongoDB 1.19.0

- **Date**

  January 21, 2025

- **Installation**

  [Installing Percona Operator for MongoDB](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/System-Requirements.html#installation-guidelines)

## Release Highlights

### Using remote file server for backups (tech preview)

The new `filesystem` backup storage type was added in this release in addition to already existing `s3` and `azure` types. It allows users to mount a remote file server to a local directory, and make Percona Backup for MongoDB using this directory as a storage for backups. The approach is based on common Network File System (NFS) protocol, and should be useful in network-restricted environments without S3-compatible storage or in cases with a non-standard storage service supporting NFS access.

To use NFS-capable remote file server as a backup storage, user needs to mount the remote storage as a sidecar volume in the `replsets` section of the Custom Resource (and also `configsvrReplSet` in case of a sharded cluster):

```
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

```
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

See more in our [documentation about this storage type](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage-filesystem.html).

### Generated passwords for custom MongoDB users

A new improvement for the [declarative management of custom MongoDB users](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/app-users.html) brings the possibility to use automatic generation of users passwords. When you specify a new user in `deploy/cr.yaml` configuration file, you can omit specifying a reference to an already existing Secret with the user’s password, and the Operator will generate it automatically:

```
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

Find more details on this automatically created Secret [in our documentation](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/app-users.html#custom-mongodb-roles).

### Percona Server for MongoDB 8.0 support

Percona Server for MongoDB 8.0 is now supported by the Operator in addition to 6.0 and 7.0 versions. The appropriate images are now included into the [list of Percona-certified images](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/images.html). See [this blogpost](https://www.percona.com/blog/percona-server-for-mongodb-8-0-most-performant-ever/) for details about the latest MongoDB 8.0 features with the added reliability and performance improvements.

## New Features

- [K8SPSMDB-1109](https://jira.percona.com/browse/K8SPSMDB-1109): Backups can now be [stored on a remote file server](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage-filesystem.html)
- [K8SPSMDB-921](https://jira.percona.com/browse/K8SPSMDB-921): [IAM Roles for Service Accounts (IRSA)](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage-s3.html#automate-access-to-amazon-s3-using-iam-instance-profile) allow automating access to AWS S3 buckets based on Identity Access Management with no need to specify the S3 credentials explicitly
- [K8SPSMDB-1133](https://jira.percona.com/browse/K8SPSMDB-1133): Manual change of Replica Set Member Priority in Percona Server MongoDB Operator [is now possible](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#replsetsreplsetoverridesmember-namepriority) with the new `replsetOverrides.MEMBER-NAME.priority` Custom Resource option
- [K8SPSMDB-1164](https://jira.percona.com/browse/K8SPSMDB-1164): Add the possibility to create users in the `$external` database for external authentication purposes

## Improvements

- [K8SPSMDB-1123](https://jira.percona.com/browse/K8SPSMDB-1123): Percona Server for MongoDB 8.0 is now supported
- [K8SPSMDB-1171](https://jira.percona.com/browse/K8SPSMDB-1171): The [declarative user management](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/app-users.html#create-users-via-custom-resource) was enchanced with the possibility to automatically generate passwords
- [K8SPSMDB-1174](https://jira.percona.com/browse/K8SPSMDB-1174): [Telemetry](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/telemetry.html) was improved to to track whether the custom users and roles management, automatic volume expansion, and multi-cluster services features are enabled
- [K8SPSMDB-1179](https://jira.percona.com/browse/K8SPSMDB-1179): It is now possible to configure externalTrafficPolicy for [mongod](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#replsetsexposeexternaltrafficpolicy), [configsvr](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#shardingconfigsvrreplsetexposeexternaltrafficpolicy) and [mongos](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#shardingmongosexternaltrafficpolicy) instances
- [K8SPSMDB-1205](https://jira.percona.com/browse/K8SPSMDB-1205): Backups in unmanaged clusters [are now supported](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/replication-backups.html), removing a long-standing limitation of [cross-site replication](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/replication.html) that didn’t allow backups on replica clusters

## Bugs Fixed

- [K8SPSMDB-1215](https://jira.percona.com/browse/K8SPSMDB-1215): Fix a bug where ExternalTrafficPolicy was incorrectly set for LoadBalancer and NodePort services (Thanks to Anton Averianov for contributing)
- [K8SPSMDB-675](https://jira.percona.com/browse/K8SPSMDB-675): Fix a bug where disabling sharding failed on a running cluster with enabled backups
- [K8SPSMDB-754](https://jira.percona.com/browse/K8SPSMDB-754): Fix a bug where some error messages had “INFO” log level and therefore were not seen in logs with the “ERROR” log level [turned on](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug-logs.html#changing-logs-representation)
- [K8SPSMDB-1088](https://jira.percona.com/browse/K8SPSMDB-1088): Fix a bug which caused the Operator starting two backup operations if the user patches the backup object while its state is empty or Waiting
- [K8SPSMDB-1156](https://jira.percona.com/browse/K8SPSMDB-1156): Fix a bug that prevented the Operator with enabled backups to recover from invalid TLS configurations (Thanks to KOS for reporting)
- [K8SPSMDB-1172](https://jira.percona.com/browse/K8SPSMDB-1172): Fix a bug where backup user’s password username with special characters caused Percona Backup for MongoDB to fail
- [K8SPSMDB-1212](https://jira.percona.com/browse/K8SPSMDB-1212): Stop disabling balancer during restores, because it is not required for Percona Backup for MongoDB 2.x

## Deprecation, Rename and Removal

- The `psmdbCluster` option from the `deploy/backup/backup.yaml` manifest used for [on-demand backups](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-ondemand.html), which was deprecated since the Operator version 1.12.0 in favor of the `clusterName` option, has been removed and is no longer supported.
- Percona Server for MongoDB 5.0 has reached its end of life and in no longer supported by the Operator

## Supported Platforms

The Operator was developed and tested with Percona Server for MongoDB 6.0.19-16, 7.0.15-9, and 8.0.4-1. Other options may also work but have not been tested. The Operator also uses Percona Backup for MongoDB 2.8.0.

Percona Operators are designed for compatibility with all [CNCF-certified](https://www.cncf.io/training/certification/software-conformance/) Kubernetes distributions. Our release process includes targeted testing and validation on major cloud provider platforms and OpenShift, as detailed below for Operator version 1.19.0:

- [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) 1.28-1.30
- [Amazon Elastic Container Service for Kubernetes (EKS)](https://aws.amazon.com) 1.29-1.31
- [OpenShift Container Platform](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.14.44 - 4.17.11
- [Azure Kubernetes Service (AKS)](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.28-1.31
- [Minikube](https://github.com/kubernetes/minikube) 1.34.0 based on Kubernetes 1.31.0

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
