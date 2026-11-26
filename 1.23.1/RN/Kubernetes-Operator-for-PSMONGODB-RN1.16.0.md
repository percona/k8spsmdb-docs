> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Percona Operator for MongoDB 1.16.0

- **Date**

  May 24, 2024

- **Installation**

  [Installing Percona Operator for MongoDB](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/System-Requirements.html#installation-guidelines)

## Release Highlights

### General availability of Physical Backups

Two releases ago we added experimental support for [Physical Backups and Restores](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups.html#backup-types) to significantly reduce Recovery Time Objective ([RTO](<https://www.percona.com/blog/backups-and-disaster-recovery/#:~:text=Recovery%20time%20objective%20(RTO)%20is,afford%20to%20lose%20after%20recovery>) ), especially for big data sets. With this release Percona announces the general availability of physical backups and restores for Percona Server for MongoDB with the Operator.

### Automated volume expansion

Kubernetes supports the Persistent Volume expansion as a stable feature since v1.24. Using it with the Operator previously involved manual operations. Now this is automated, and users can resize their PVCs [by just changing the value](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling-storage-resize.html) of the `resources.requests.storage` option in the PerconaServerMongoDB custom resource. This feature is in a technical preview stage and is not recommended for production environments.

*Update from September 16, 2025* Though the Operator automates the storage resizing, the users must still trigger the process by modifying the Custom Resource and applying the new configuration.

### Support for MongoDB 7

Starting from this release, MongoDB 7.0 is now supported. Read our take on top-5 changes in MongoDB version 7 in this [blog post](https://www.percona.com/blog/5-changes-you-should-know-in-mongodb-7-0/) .

### Support for ARM architecture (technical preview)

ARM architecture meets the intensive growth of its usage nowadays, both in a segment of highly efficient cloud computing based on systems like AWS Graviton, and the Internet of Things or Edge. [Officially certified images for ARM](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/images.html) are now available for the Operator, as well as Percona Server for MongoDB and Percona Backup for MongoDB, while database monitoring based on PMM Client is yet to follow.

### Fixing the overloaded allowUnsafeConfigurations flag

In the previous Operator versions `allowUnsafeConfigurations` Custom Resource option was used to allow configuring a cluster with unsafe parameters, such as starting it with less than 3 replica set instances. In fact, setting this option to `true` resulted in a wide range of reduced safety features without the user’s explicit intent: disabling TLS, allowing backups in unhealthy clusters, etc.

With this release, a separate `unsafeFlags` Custom Resource section is introduced for the fine-grained control of the safety loosening features:

```
unsafeFlags:
  tls: false
  replsetSize: false
  mongosSize: false
  terminationGracePeriod: false
  backupIfUnhealthy: false
```

Also, TLS configuration is now enabled or disabled by a special `tls.mode` Custom Resource option, which can be set to `disabled`, `allowTLS`, `preferTLS`, or `requireTLS` values.

## New Features

- [K8SPSMDB-1000](https://jira.percona.com/browse/K8SPSMDB-1000): Users who store backups on Azure Blob Storage can now use [private endpoints](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#backupstoragesstorage-nameazureendpointurl)
- [K8SPSMDB-1055](https://jira.percona.com/browse/K8SPSMDB-1055): The `kubectl get psmdb-backup` command now shows [latest restorable time](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pitr-restore.html#choose-the-target-time) to make it easier to pick a point-in-time recovery target
- [K8SPSMDB-491](https://jira.percona.com/browse/K8SPSMDB-491): It is now possible to specify the [existing cert-manager issuer](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#tlsissuerconfname) which should be used by the Operator
- [K8SPSMDB-733](https://jira.percona.com/browse/K8SPSMDB-733): It is now possible to [resize Persistent Volume Claims](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling-storage-resize.html#resize-storage-yourself) by patching the PerconaServerMongoDB custom resource: change `persistentVolumeClaim.resources.requests.storage` and let the Operator do the scaling

## Improvements

- [K8SPSMDB-1004](https://jira.percona.com/browse/K8SPSMDB-1004): [Exposing replica set with split-horizon DNS](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/expose.html#exposing-replica-set-with-split-horizon-dns) allows to specify URIs with non-standard port numbers, which are particularly useful with the NodePort service type
- [K8SPSMDB-1013](https://jira.percona.com/browse/K8SPSMDB-1013): MongoDB 7.0 is now supported.
- [K8SPSMDB-1015](https://jira.percona.com/browse/K8SPSMDB-1015): Information about backup and restore operations is now included in the Operator’s logs
- [K8SPSMDB-951](https://jira.percona.com/browse/K8SPSMDB-951), [K8SPSMDB-979](https://jira.percona.com/browse/K8SPSMDB-979) and [K8SPSMDB-1021](https://jira.percona.com/browse/K8SPSMDB-1021): The Operator now allows setting custom configuration for Percona Backup for MongoDB through the set of new Custom Resource options under `backup.configuration.backupOptions`, `backup.configuration.restoreOptions`, and `backup.storages.s3.retryer` subsections
- [K8SPSMDB-1029](https://jira.percona.com/browse/K8SPSMDB-1029): Mongod is now run in [quiet mode](https://www.mongodb.com/docs/manual/reference/program/mongod/#std-option-mongod.--quiet) by default to reduce the amount of log messages
- [K8SPSMDB-1032](https://jira.percona.com/browse/K8SPSMDB-1032): It is now [possible](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#shardingmongosexposenodeport) to define TCP port for mongos Service when it is exposed through a NodePort (thanks to Mike Devresse for contribution)
- [K8SPSMDB-1062](https://jira.percona.com/browse/K8SPSMDB-1062): The Operator now sets [appProtocol](https://kubernetes.io/docs/concepts/services-networking/service/#application-protocol) to `mongo` for Service objects, which is useful for service mesh implementations (thanks to Søren Mathiasen for contribution)
- [K8SPSMDB-732](https://jira.percona.com/browse/K8SPSMDB-732): [Integration of the Operator with OpenLDAP](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/ldap.html#using-ldap-over-tls-connection) can now be secured by using TLS connections
- [K8SPSMDB-755](https://jira.percona.com/browse/K8SPSMDB-755): New `allowInvalidCertificates` option allows to [enable or disable](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#tlsallowinvalidcertificates) bypassing MongoDB Shell checks for the certificates presented by the mongod/mongos instance, useful for self-signed certificates
- [K8SPSMDB-948](https://jira.percona.com/browse/K8SPSMDB-948): Officially certified images for ARM architecture are now available for the Operator, as well as Percona Server for MongoDB and Percona Backup for MongoDB
- [K8SPSMDB-993](https://jira.percona.com/browse/K8SPSMDB-993): To avoid backup fail on clusters where Percona Backup for MongoDB resync process takes too long, the Operator now checks, if there is still a resync operation working, with exponentially increasing interval and total wait time until failure equal to 8715 seconds
- [K8SPSMDB-995](https://jira.percona.com/browse/K8SPSMDB-995): The Operator now allows storing key for [backups server-side AWS KMS encryption](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-encryption.html) in a Secret configurable with the `secrets.sse` Custom Resource option
- [K8SPSMDB-780](https://jira.percona.com/browse/K8SPSMDB-780): Removing `allowUnsafeConfigurations` Custom Resource option in favor of fine-grained safety control in the `unsafeFlags` subsection
- [K8SPSMDB-1042](https://jira.percona.com/browse/K8SPSMDB-1042): Helm chart for Percona Server for MongoDB now accepts replica set options as the map argument instead of the array one used in previous releases; this simplifies [how arguments are specified in the command line](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/custom-install.html#__tabbed_2_1) and allows to specify only part of the replica set parameters, relying on the default values for the other part. **Take this change into account** if you are installing database via helm and want to use set of custom options from previous releases

## Bugs Fixed

- [K8SPSMDB-1011](https://jira.percona.com/browse/K8SPSMDB-1011): Fix a bug where custom logins for system users stopped working after deleting and recreating back the users Secret (thanks for Patrick Wolleb for report)
- [K8SPSMDB-1014](https://jira.percona.com/browse/K8SPSMDB-1014): Fix a bug that certificate rotation was bringing the sharded MongoDB cluster down for clusters originally created with the Operator version prior to 1.15.0 (thanks to Stiliyan Stefanov for reporting)
- [K8SPSMDB-1018](https://jira.percona.com/browse/K8SPSMDB-1018): Fix a bug where MongoDB container startup would fail if the MongoDB image being used contained the numactl package
- [K8SPSMDB-1024](https://jira.percona.com/browse/K8SPSMDB-1024): Fix a bug where environment variable wasn’t properly updated in the Percona Backup for MongoDB container entry script (thanks to Rockawear for contribution)
- [K8SPSMDB-1035](https://jira.percona.com/browse/K8SPSMDB-1035): Fixed a bug where the empty `secretName` field was not allowed for backup jobs that might not need it when accessing AWS S3 buckets based on IAM roles (thanks to Sergey Zelenov for contribution)
- [K8SPSMDB-1036](https://jira.percona.com/browse/K8SPSMDB-1036): Fix a bug due to which restoring backup to a new cluster was broken by incompatibility with Percona Backup for MongoDB 2.3.0
- [K8SPSMDB-1038](https://jira.percona.com/browse/K8SPSMDB-1038): Fix a bug where mongos Services were deleted if the cluster was set to paused state
- [K8SPSMDB-1039](https://jira.percona.com/browse/K8SPSMDB-1039): Fix a bug which prevented deleting PMM agent from the PMM Server inventory on Pod termination
- [K8SPSMDB-1058](https://jira.percona.com/browse/K8SPSMDB-1058): A minor missing privileges issue caused flooding MongoDB logs with “Checking authorization failed” errors
- [K8SPSMDB-1070](https://jira.percona.com/browse/K8SPSMDB-1070): Fix a bug where panic was happening in `delete-psmdb-pods-in-order` finalizer if the cluster was deleted prior to creating Pods
- [K8SPSMDB-940](https://jira.percona.com/browse/K8SPSMDB-940): Fix a bug due to which the Operator didn’t allow to set serviceAccount for mongos Pods
- [K8SPSMDB-985](https://jira.percona.com/browse/K8SPSMDB-985): Fix a bug where `pbmPod` key in backup object was only showing one replica/pod

## Deprecation and removal

- Starting from now, `allowUnsafeConfigurations` Custom Resource option is deprecated in favor of a number of options under the `unsafeFlags` subsection. Setting `allowUnsafeConfigurations` won’t have any effect; upgrading existing clusters with `allowUnsafeConfigurations=true` will cause everything under [unsafeFlags](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#operator-unsafeflags-section) set to true and [TLS funuctionality disabled](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/tls-disable.html)
- MongoDB 4.4 support in the Operator has reached its end-of-life. Starting from now Percona will not provide [officially certified images](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/images.html) for it. Make sure that you have a supported MongoDB version before upgrading the Operator to 1.16.0. You can use [major version upgrade functionality](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-major.html).

## Supported Platforms

The Operator was developed and tested with Percona Server for MongoDB 5.0.26-22, 6.0.15-12, and 7.0.8-5. Other options may also work but have not been tested. The Operator also uses Percona Backup for MongoDB 2.4.1.

The following platforms were tested and are officially supported by the Operator 1.16.0:

- [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) 1.26-1.29
- [Amazon Elastic Container Service for Kubernetes (EKS)](https://aws.amazon.com) 1.26-1.29
- [OpenShift Container Platform](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.12.56 - 4.15.11
- [Azure Kubernetes Service (AKS)](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.27-1.29
- [Minikube](https://github.com/kubernetes/minikube) 1.33.0

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
