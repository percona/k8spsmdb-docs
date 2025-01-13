# *Percona Operator for MongoDB* 1.19.0

* **Date**

    January 16, 2025

* **Installation**

    [Installing Percona Operator for MongoDB](../System-Requirements.md#installation-guidelines)

## Release Highlights

### Generated passwords for custom MongoDB users

A new improvement for the [declarative management of custom MongoDB users](https://docs.percona.com/percona-operator-for-mongodb/users.html#unprivileged-users) brings the possibility to use automatic generation of users passwords. When you specify a new user in `deploy/cr.yaml` configuration file, you can ommit specifying a reference to an aleready existing Secret with the user's password, and the Operator will generate it automatically:

``` {.bash data-prompt="$"}
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

Find more details on this automatically created Secret [in our documentation](../users.md#custom-mongodb-roles).

## New Features

* {{ k8spsmdbjira(1109) }}: Allow PBM to use a remote file server as backup location
* {{ k8spsmdbjira(921) }}: IRSA is not enabled for restore
* {{ k8spsmdbjira(1133) }}: Manual change of Replica Set Member Priority in Percona Server MongoDB Operator [is now possible](../operator.md#replsetoverridesmember-namepriority) with the new `replsetOverrides.MEMBER-NAME.priority` Custom Resource option
* {{ k8spsmdbjira(1164) }}: Add the [possibility](../users.md#commonsecret) to create users in the $external database for external authentication purposes 

## Improvements

* {{ k8spsmdbjira(1123) }}: Percona Server for MongoDB 8.0 is now supported
* {{ k8spsmdbjira(1171) }}: The [declarative user management](users.md#create-users-in-the-custom-resource) was enchanced with the possibility to automatically generate passwords
* {{ k8spsmdbjira(1174) }}: [Telemetry](../telemetry.md) was improved to to track if the custom users and roles management, automatic volume expansion, and multi-cluster services features are enabled
* {{ k8spsmdbjira(1179) }}: It is now possiblt to configure externalTrafficPolicy for [mongod](../operator.md#replsetsexposeexternaltrafficpolicy), [configsvr](../operator.md#shardingconfigsvrreplsetexposeexternaltrafficpolicy) and [mongos](../operator.md#shardingmongosexternaltrafficpolicy) instances
* {{ k8spsmdbjira(1205) }}: Backups in unmanaged clusters [are now supported](../replication-backups.md)
* {{ k8spsmdbjira(1215) }}: Fix a bug where ExternalTrafficPolicy was incorectly set for LoadBalancer and NodePort services (Thanks to Anton Averianov for contributing) **BUG**

## Bugs Fixed

* {{ k8spsmdbjira(675) }}: Fix a bug where disabling sharding failed on a running cluster with enabled backups
* {{ k8spsmdbjira(754) }}: Fix a bug where some error messages had "INFO" log level and therefore were not seen in logs with the "ERROR" log level [turned on](debug-logs.md#changing-logs-representation)
* {{ k8spsmdbjira(1088) }}: Fix a bug which caused the Operator starting two backup operations if the user patches the backup object while its state is empty or Waiting 
* {{ k8spsmdbjira(1156) }}: Fix a bug that prevented the Operator with enabled backups to recover from invalid TLS configurations (Thanks to KOS for reporting)
* {{ k8spsmdbjira(1172) }}: Fix a bug where backup user's password username with special characters caused Percona Backup for MongoDB to fail
* {{ k8spsmdbjira(1212) }}: Stop diasbling balancer during restores, not needed for Percona Backup for MongoDB 2.x

## Deprecation, Rename and Removal

* The `psmdbCluster` option from the `deploy/backup/backup.yaml` manifest used for [on-demand backups](backups-ondemand.md), which was deprecated since the Operator version 1.12.0 in favor of the `clusterName` option, has been removed and is no longer supported.

## Supported Platforms

The Operator was developed and tested with Percona Server for MongoDB 5.0.29-25,
6.0.19-16, 7.0.15-9, and 8.0.4-1. Other options may also work but have not been tested. The
Operator also uses Percona Backup for MongoDB 2.8.0.

The following platforms were tested and are officially supported by the Operator
1.19.0:

* [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.28-1.30
* [Amazon Elastic Container Service for Kubernetes (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.29-1.31
* [OpenShift Container Platform :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.14.44 - 4.17.11
* [Azure Kubernetes Service (AKS) :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.28-1.31
* [Minikube :octicons-link-external-16:](https://github.com/kubernetes/minikube) 1.34.0 based on Kubernetes 1.31.0

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
