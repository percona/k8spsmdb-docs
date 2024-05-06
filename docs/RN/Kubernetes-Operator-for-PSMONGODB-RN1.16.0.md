# *Percona Operator for MongoDB* 1.16.0

* **Date**

    May 08, 2024

* **Installation**

    [Installing Percona Operator for MongoDB](../System-Requirements.md#installation-guidelines)

## Release Highlights

### General availability of Physical Backups

Two releases ago we added experimental support for [Physical Backups and Restores](../backups.md#physical) to significantly reduce Recovery Time Objective ([RTO :octicons-link-external-16:](https://www.percona.com/blog/backups-and-disaster-recovery/#:~:text=Recovery%20time%20objective%20(RTO)%20is,afford%20to%20lose%20after%20recovery).)), especially for big data sets. Until now this feature was a technical preview, but with this release Percona announces the general availability of physical backups and restores for MongoDB with the Operator.

### Automated volume expansion

Kubernetes supports the Persistent Volume expansion as a stable feature since v1.24. Using it with the Operator previously involved manual operations. Now this is automated, and users can resize their PVCs [by just changing the value](../scaling.md#scale-storage) of the `resources.requests.storage` option in the PerconaServerMongoDB custom resource. This feature is in a technical preview stage and is not recommended for production environments.

### Fixing the overloaded allowUnsafeConfigurations flag

In the previous Operator versions `allowUnsafeConfigurations` Custom Resource option was used to allow configuring a cluster with unsafe parameters, such as starting it with less than 3 replica set instances. In fact, setting this option to `true` resulted in a wide range of reduced safety features without the user's explicit
intent: disabling TLS, allowing backups in unhealthy clusters, etc.

With this release, a separate `unsafeFlags` Custom Resource section is introduced for the fine-grained control of the safety loosening features:

```yaml
unsafeFlags:
  tls: false
  replsetSize: false
  mongosSize: false
  terminationGracePeriod: false
  backupIfUnhealthy: false
```

Also, TLS configuration is now enabled or disabled by a special `tls.mode` Custom Resource option, which can be set to `disabled`, `allowTLS`, `preferTLS`, or `requireTLS` values.

## New Features

* {{ k8spsmdbjira(1000) }}: Azure Blob Storage [private endpoints](../operator.html#backup-storages-azure-endpointurl) are now supported for backups
* {{ k8spsmdbjira(1055) }}: The `kubectl get psmdb-backup` command now shows Latest restorable time to make it easier to pick a point-in-time recovery target
* {{ k8spsmdbjira(491) }}: It is now possible to specify the [existing cert-manager issuer](../operator.md#tls-issuerconf-name) which should be used by the Operator
* {{ k8spsmdbjira(733) }}: It is now possible to [resize Persistent Volume Claims](../operator.md#automated-scaling-with-volume-expansion-capability) by patching the PerconaServerMongoDB custom resource: change  `persistentVolumeClaim.resources.requests.storage` and let the Operator do the scaling

## Improvements

* {{ k8spsmdbjira(1004) }}: [Exposing replica set with split-horizon DNS](../expose.md#exposing-replica-set-with-split-horizon-dns) allows to specify URIs with non-standard port numbers, which are particularly useful with the NodePort service type
* {{ k8spsmdbjira(1013) }}: MongoDB 7.0 is now supported. Read our take on top-5 changes in MongoDB version 7 in this [blog post](https://www.percona.com/blog/5-changes-you-should-know-in-mongodb-7-0/)

* {{ k8spsmdbjira(1015) }}: Information about backup and restore operations is now included in the Operator's logs
* {{ k8spsmdbjira(951) }}, {{ k8spsmdbjira(979) }} and {{ k8spsmdbjira(1021) }}: The Operator now allows setting custom configuration for Percona Backup for MongoDB through the set of new Custom Resource options under `backup.backup`, `backup.restore`, and `backup.storages.s3.retryer` subsections
* {{ k8spsmdbjira(1029) }}: Mongod is now run in [quiet mode  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/program/mongod/#std-option-mongod.--quiet) by default to reduce the amount of log messages
* {{ k8spsmdbjira(1032) }}: It is now [possible](../operator.md#sharding-mongos-expose-nodeport) define TCP port for  mongos Service when it is exposed through a NodePort (thanks to Mike Devresse for contribution)
* {{ k8spsmdbjira(1062) }}: The Operator now sets [appProtocol :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/#application-protocol) to `mongo` for Service objects, which is useful for service mesh implementations (thanks to Søren Mathiasen for contribution)
* {{ k8spsmdbjira(732) }}: [Integration of the Operator with OpenLDAP](../ldap.md#using-ldap-over-tls-connection) can now be secured by using TLS connections
* {{ k8spsmdbjira(755) }}: New `allowInvalidCertificates` option allows to [enable or disable](../operator.md#tls-allowinvalidcertificates) bypassing MongoDB Shell checks for the certificates presented by the mongod/mongos instance, useful for self-signed certificates
* {{ k8spsmdbjira(948) }}: ARM  support was added for the Operator image, making it possible to deploy MongoDB cluster on ARM when the database images become available
* {{ k8spsmdbjira(993) }}: To avoid backup fail on clusters where Percona Backup for MongoDB resync process takes too long, the Operator now checks if there is still a resync operation working with exponentially increasing interval and total wait time until failure equal to 8715 seconds
* {{ k8spsmdbjira(995) }}: The Operator now allows storing key for [backups server-side AWS KMS encryption](../backups-encryption.md) in a Secret configurable with the  `secrets.sse` Custom Resource option
* {{ k8spsmdbjira(780) }}: Removing `allowUnsafeConfigurations` Custom Resource option in favor of fine-grained safety control in the `unsafeFlags` subsection

## Bugs Fixed

* {{ k8spsmdbjira(1011) }}: Fix a bug where custom logins for system users stopped working after deleting and recreating back the users Secret (thanks for Patrick Wolleb for report)
* {{ k8spsmdbjira(1014) }}: Fix a bug that certificate rotation was bringing the sharded MongoDB cluster down for clusters originally created with the Operator version prior to 1.15.0 (thanks to Stiliyan Stefanov for reporting)
* {{ k8spsmdbjira(1018) }}: Fix a bug where MongoDB container startup would fail if the MongoDB image being used contained the numactl package
* {{ k8spsmdbjira(1024) }}: Fix a bug where environment variable wasn't properly updated in the Percona Backup for MongoDB container entry script (thanks to Rockawear for contribution) **ToDo**
* {{ k8spsmdbjira(1035) }}: Fixed a bug where the empty `secretName` field was not allowed for backup jobs that might not need it when accessing AWS S3 buckets based on IAM roles. (thanks to Sergey Zelenov for contribution)
* {{ k8spsmdbjira(1036) }}: Fix a bug due to which restoring backup to a new cluster was broken
* {{ k8spsmdbjira(1038) }}: Fix a bug where mongos Services were deleted if the cluster was set to paused state
* {{ k8spsmdbjira(1039) }}: Fix a bug which prevented deleting PMM agent from the PMM Server inventory on Pod termination
* {{ k8spsmdbjira(1058) }}: A minor missing privileges issue caused flooding MongoDB logs with "Checking authorization failed" errors
* {{ k8spsmdbjira(1070) }}: Fix a bug where panic was happening in delete-psmdb-pods-in-order finalizer if the cluster was deleted prior to creating Pods
* {{ k8spsmdbjira(940) }}: Fix a bug due to which the Operator didn't allow to set serviceAccount for mongos Pods
* {{ k8spsmdbjira(985) }}: pbmPod key in backup object only shows one replica/pod

## Deprecation and removal

* Starting from now, `allowUnsafeConfigurations` Custom Resource option is deprecated in favor of a number of options under the `unsafeFlags` subsection. Setting `allowUnsafeConfigurations` won't have any affect.

## Supported Platforms

The Operator was developed and tested with Percona Server for MongoDB 4.4.24,
5.0.20, and 6.0.9. Other options may also work but have not been tested. The
Operator also uses Percona Backup for MongoDB 2.3.0.

The following platforms were tested and are officially supported by the Operator
1.15.0:

* [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.24-1.28

* [Amazon Elastic Container Service for Kubernetes (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.24-1.28

* [OpenShift Container Platform :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.11 - 4.13

* [Azure Kubernetes Service (AKS) :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.25-1.28

* [Minikube :octicons-link-external-16:](https://github.com/kubernetes/minikube) 1.31.2 (based on Kubernetes 1.28)

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
