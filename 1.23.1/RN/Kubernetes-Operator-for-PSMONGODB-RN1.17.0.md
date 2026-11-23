> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Percona Operator for MongoDB 1.17.0

- **Date**

  September 09, 2024

- **Installation**

  [Installing Percona Operator for MongoDB](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/System-Requirements.html#installation-guidelines)

## Release Highlights

### Declarative user management (technical preview)

Before the Operator version 1.17.0 custom MongoDB users had to be created manually. Now the declarative creation of custom MongoDB users [is supported](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/app-users.html) via the `users` subsection in the Custom Resource. You can specify a new user in `deploy/cr.yaml` manifest, setting the user’s login name and database, PasswordSecretRef (a reference to a key in a Secret resource containing user’s password) and as well as MongoDB roles on various databases which should be assigned to this user:

```
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

See [documentation](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/app-users.html) to find more details about this feature with additional explanations and the list of current limitations.

### Liveness check improvements

Several improvements in logging were made related to the liveness checks, to allow getting more information for debugging, and to make these logs persist on failures to allow further examination.

Liveness check logs are stored in the `/data/db/mongod-data/logs/mongodb-healthcheck.log` file, which can be [accessed in the corresponding Pod](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug-shell.html) if needed. Starting from now, Liveness check generates more log messages, and the default log level is set to `DEBUG`.

Each time the health check fails, the current log is saved to a gzip compressed file named `mongodb-healthcheck-<timestamp>.log.gz`, and the `mongodb-healthcheck.log` log file is reset. Logs older than 24 hours are automatically deleted.

## New Features

- [K8SPSMDB-253](https://jira.percona.com/browse/K8SPSMDB-253): It is now possible to create and manage users via the Custom Resource

## Improvements

- [K8SPSMDB-899](https://jira.percona.com/browse/K8SPSMDB-899): Add Labels for all Kubernetes objects created by Operator (backups/restores, Secrets, Volumes, etc.) to make them clearly distinguishable
- [K8SPSMDB-919](https://jira.percona.com/browse/K8SPSMDB-919): The Operator now checks if the needed Secrets exist and connects to the storage to check the validity of credentials and the existence of a backup before starting the restore process
- [K8SPSMDB-934](https://jira.percona.com/browse/K8SPSMDB-934): Liveness checks are providing more debug information and keeping separate log archives for each failure with the 24 hours retention
- [K8SPSMDB-1057](https://jira.percona.com/browse/K8SPSMDB-1057): Finalizers were renamed to contain fully qualified domain names (FQDNs), avoiding potential conflicts with other finalizer names in the same Kubernetes environment
- [K8SPSMDB-1108](https://jira.percona.com/browse/K8SPSMDB-1108): The new Custom Resource option allows setting custom containerSecurityContext for PMM containers
- [K8SPSMDB-994](https://jira.percona.com/browse/K8SPSMDB-994): Remove a limitation where it wasn’t possible to create a new cluster with splitHorizon enabled, leaving the only way to enable it later on the running cluster

## Bugs Fixed

- [K8SPSMDB-925](https://jira.percona.com/browse/K8SPSMDB-925): Fix a bug where the Operator generated “failed to start balancer” and “failed to get mongos connection” log messages when using Mongos with servicePerPod and LoadBalancer services, while the cluster was operating properly
- [K8SPSMDB-1105](https://jira.percona.com/browse/K8SPSMDB-1105): The memory requests and limits for backups were increased in the `deploy/cr.yaml` configuration file example to reflect the Percona Backup for MongoDB minimal pbm-agents requirement of 1 Gb RAM needed for stable operation
- [K8SPSMDB-1074](https://jira.percona.com/browse/K8SPSMDB-1074): Fix a bug where MongoDB Cluster could not failover in case of all Pods downtime and `exposeType` Custom Resource option set to either `NodePort` or `LoadBalancer`
- [K8SPSMDB-1089](https://jira.percona.com/browse/K8SPSMDB-1089): Fix a bug where it was impossible to delete a cluster in error state with finalizers present
- [K8SPSMDB-1092](https://jira.percona.com/browse/K8SPSMDB-1092): Fix a bug where Percona Backup for MongoDB log messages during physical restore were not accessible with the `kubectl logs` command
- [K8SPSMDB-1094](https://jira.percona.com/browse/K8SPSMDB-1094): Fix a bug where it wasn’t possible to create a new cluster with `upgradeOptions.setFCV` Custom Resource option set to `true`
- [K8SPSMDB-1110](https://jira.percona.com/browse/K8SPSMDB-1110): Fix a bug where nil Custom Resource annotations were causing the Operator panic

## Deprecation, Rename and Removal

Finalizers were renamed to contain fully qualified domain names to comply with the Kubernetes standards.

- `PerconaServerMongoDB` Custom Resource:
  - `delete-psmdb-pods-in-order` finalizer renamed to `percona.com/delete-psmdb-pods-in-order`
  - `delete-psmdb-pvc` finalizer renamed to `percona.com/delete-psmdb-pvc`
- `PerconaServerMongoDBBackup` Custom Resource:
  - `delete-backup` finalizer renamed to `percona.com/delete-backup`

Key change in [`psmdb-db` Helm chart](https://github.com/percona/percona-helm-charts/tree/main/charts/psmdb-db): the parameter for defining [system users](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/system-users.html) is renamed from `users` to `systemUsers`. The `users` parameter now handles the new [Declarative user management](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/app-users.html#create-users-via-custom-resource) feature. This change impacts users upgrading to this version via Helm: make sure that values manifests are changed accordingly.

## Supported Platforms

The Operator was developed and tested with Percona Server for MongoDB 5.0.28-24, 6.0.16-13, and 7.0.12-7. Other options may also work but have not been tested. The Operator also uses Percona Backup for MongoDB 2.5.0.

The following platforms were tested and are officially supported by the Operator 1.17.0:

- [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) 1.27-1.30
- [Amazon Elastic Container Service for Kubernetes (EKS)](https://aws.amazon.com) 1.28-1.30
- [OpenShift Container Platform](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.13.48 - 4.16.9
- [Azure Kubernetes Service (AKS)](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.28-1.30
- [Minikube](https://github.com/kubernetes/minikube) 1.33.1

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
