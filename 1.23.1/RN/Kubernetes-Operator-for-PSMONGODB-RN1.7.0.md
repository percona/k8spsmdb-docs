> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Percona Kubernetes Operator for Percona Server for MongoDB 1.7.0

- **Date**

  March 8, 2021

- **Installation**

  [Installing Percona Kubernetes Operator for Percona Server for MongoDB](https://www.percona.com/doc/kubernetes-operator-for-psmongodb/index.html#installation)

## Release Highlights

- This release brings full support for the [Percona Server for MongoDB Sharding](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/sharding.html). Sharding allows you to scale databases horizontally, distributing data across multiple MongoDB Pods, and so it is extremely useful for large data sets. By default of the `deploy/cr.yaml` configuration file contains only one replica set, but when you [turn sharding on](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#shardingenabled), you can add more replica sets with different names to the `replsets` section.
- It is now [possible](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#metadata) to clean up Persistent Volume Claims automatically after the cluster deletion event. This feature is off by default. Particularly it is useful to avoid leftovers in testing environments, where the cluster can be re-created and deleted many times. Support for [custom sidecar containers](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/sidecar.html). The Operator makes it possible now to deploy additional (*sidecar*) containers to the Pod. This feature can be useful to run debugging tools or some specific monitoring solutions, etc. The sidecar container can be added to [replsets](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#replsetssidecarsimage), [sharding.configsvrReplSet](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#shardingconfigsvrreplsetsidecarsimage), and [sharding.mongos](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#shardingmongossidecarsimage) sections of the `deploy/cr.yaml` configuration file.

## New Features

- [K8SPSMDB-121](https://jira.percona.com/browse/K8SPSMDB-121): Add support for [sharding](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/sharding.html) to scale MongoDB cluster horizontally
- [K8SPSMDB-294](https://jira.percona.com/browse/K8SPSMDB-294): Support for [custom sidecar container](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/sidecar.html) to extend the Operator capabilities
- [K8SPSMDB-260](https://jira.percona.com/browse/K8SPSMDB-260): Persistent Volume Claims [can now be automatically removed](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#metadata) after MongoDB cluster deletion

## Improvements

- [K8SPSMDB-335](https://jira.percona.com/browse/K8SPSMDB-335): Operator can now automatically remove old backups from S3 if [retention period](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#backuptaskskeep) is set
- [K8SPSMDB-330](https://jira.percona.com/browse/K8SPSMDB-330): Add support for runtimeClassName Kubernetes feature for selecting the container runtime
- [K8SPSMDB-306](https://jira.percona.com/browse/K8SPSMDB-306): It is now possible to explicitly set the version of MongoDB for newly provisioned clusters. Before that, all new clusters were started with the latest MongoDB version if Version Service was enabled
- [K8SPSMDB-370](https://jira.percona.com/browse/K8SPSMDB-370): Fix confusing log messages about no backup / restore found which were caused by Percona Backup for MongoDB waiting for the backup metadata
- [K8SPSMDB-342](https://jira.percona.com/browse/K8SPSMDB-342): MongoDB container liveness probe will now use TLS to follow best practices and remove noisy log messages from mongod log

## Bugs Fixed

- [K8SPSMDB-346](https://jira.percona.com/browse/K8SPSMDB-346): Fix a bug which prevented adding/removing labels to Pods without downtime
- [K8SPSMDB-366](https://jira.percona.com/browse/K8SPSMDB-366): Fix a bug which prevented enabling Percona Monitoring and Management (PMM) due to incorrect request for the recommended PMM Client image version to the Version Service
- [K8SPSMDB-402](https://jira.percona.com/browse/K8SPSMDB-402): running multiple replica sets without sharding enabled should be prohibited
- [K8SPSMDB-382](https://jira.percona.com/browse/K8SPSMDB-382): Fix a bug which caused mongos process to fail when using `allowUnsafeConfigurations=true`
- [K8SPSMDB-362](https://jira.percona.com/browse/K8SPSMDB-362): Fix a bug due to which changing secrets in a single-shard mode caused mongos Pods to fail
