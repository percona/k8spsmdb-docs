# *Percona Operator for MongoDB* 1.18.0

* **Date**

    November XX, 2024

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

## New Features

* {{ k8spsmdbjira(894) }}: Add support for partial restores
* {{ k8spsmdbjira(1113 }}: Provide a way to cleanup PITR log files when deleting cluster
* {{ k8spsmdbjira(1124) }}: User management: Creating and managing user roles
* {{ k8spsmdbjira(1140) }}: Multi-DC 3 node cluster deployment with ingress deployment

## Improvements

* {{ k8spsmdbjira(739) }}: Standardize cluster and components service exposure
* {{ k8spsmdbjira(1002) }}: Primary node preferer (Thanks to sergelogvinov for contribution)
* {{ k8spsmdbjira(1096) }}: Improve physical restore logs
* {{ k8spsmdbjira(1135) }}: Split-horizon DNS should be configurable for external nodes
* {{ k8spsmdbjira(1146) }}: User management improvements
* {{ k8spsmdbjira(1152) }}: Use multi architecture images by default
* {{ k8spsmdbjira(1160) }}: Disable PVC resize by default
* {{ k8spsmdbjira(1183) }}: Generate OLM bundle automatically

## Bugs Fixed

* {{ k8spsmdbjira(912) }}: Backup password is visible in case of PBM error
* {{ k8spsmdbjira(1047) }}: Operator changes writeConcernMajorityJournalDefault to "true" despite what user configured
* {{ k8spsmdbjira(1090) }}: It's not possible to make physical backups for databases with files greater 320GB
* {{ k8spsmdbjira(1132) }}: Keyfile authentication is not working
* {{ k8spsmdbjira(1141) }}: Cross-site replication with mongoDB doesn't work when Ingress is used to expose service on top of ClusterIP
* {{ k8spsmdbjira(1158) }}: Upgrade PBM go module to 2.6.0
* {{ k8spsmdbjira(1168) }}: PBM certificate error if there are two cluster with same name across namespaces
* {{ k8spsmdbjira(1170) }}: Cluster deletion is stuck if mongo replset fails to reconcile
* {{ k8spsmdbjira(1175) }}: MongoDB cluster broken after the unsafe.tls is set to true
* {{ k8spsmdbjira(1184) }}: Operator fails with readOnlyRootFilesystem field set

## Known Issues and Limitations

* {{ k8spsmdbjira(1167) }}: Document PBM 2.6.0 limitation if not fixed before PSMDBO relese

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