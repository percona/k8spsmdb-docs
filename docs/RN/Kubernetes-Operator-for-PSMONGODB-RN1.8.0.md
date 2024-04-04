# *Percona Kubernetes Operator for Percona Server for MongoDB* 1.8.0


* **Date**

    May 6, 2021



* **Installation**

    [Installing Percona Kubernetes Operator for Percona Server for MongoDB](https://www.percona.com/doc/kubernetes-operator-for-psmongodb/index.html#installation)


## Release Highlights


* The support for [Point-in-time recovery](../backups.md#backups-pitr-oplog) added in this
release. Users can now recover to a specific date and time from operations
logs stored on S3


* It is now possible to perform a [major version upgrade](../update.md#operator-update-smartupdates)
for MongoDB (for example, upgrade 4.2 version to 4.4) with no manual steps

## New Features


* [K8SPSMDB-387](https://jira.percona.com/browse/K8SPSMDB-387): Add support for
[point-in-time recovery](../backups.md#backups-pitr-oplog) to recover to a specific date and
time


* [K8SPSMDB-284](https://jira.percona.com/browse/K8SPSMDB-284): Add support for automated major version MongoDB
upgrades

## Improvements


* [K8SPSMDB-436](https://jira.percona.com/browse/K8SPSMDB-436): The imagePullPolicy option in the `deploy/cr.yaml`
configuration file now is applied to init container as well


* [K8SPSMDB-400](https://jira.percona.com/browse/K8SPSMDB-400): Simplify secret change logic to avoid Pod restarts
when user changes the credentials


* [K8SPSMDB-381](https://jira.percona.com/browse/K8SPSMDB-381): Get credentials directly from Secrets instead of the
environment variables when initializing the Replica Set


* [K8SPSMDB-352](https://jira.percona.com/browse/K8SPSMDB-352): Restrict running run less than 5 Pods of Replica Sets
with enabled arbiter unless the `allowUnsafeConfigurations` option is set to
true


* [K8SPSMDB-332](https://jira.percona.com/browse/K8SPSMDB-332): Restrict running less than 3 Pods of Config Servers
unless the `allowUnsafeConfigurations` option is set to true


* [K8SPSMDB-331](https://jira.percona.com/browse/K8SPSMDB-331): Restrict running less than 3 mongos Pods unless the
`allowUnsafeConfigurations` option is set to true

## Bugs Fixed


* [K8SPSMDB-384](https://jira.percona.com/browse/K8SPSMDB-384):  Fix a bug due to which mongos Pods were failing
readiness probes for some period of time during the cluster initialization


* [K8SPSMDB-434](https://jira.percona.com/browse/K8SPSMDB-434): Fix a bug due to which nil pointer dereference error
was occurring when switching the `sharding.enabled` option from false to
true (thanks to srteam2020 for contributing)


* [K8SPSMDB-430](https://jira.percona.com/browse/K8SPSMDB-430): Fix a bug due to which a stale apiserver could
trigger undesired StatefulSet and PVC deletion when recreating the cluster
with the same name (thanks to srteam2020 for contributing)


* [K8SPSMDB-428](https://jira.percona.com/browse/K8SPSMDB-428): Fix a bug which caused mongos to fail in case of the
empty name field in configsvrReplSet section of the Custom Resource


* [K8SPSMDB-418](https://jira.percona.com/browse/K8SPSMDB-418): Fix a bug due to which `serviceAnnotations` changes
in the `deploy/cr.yaml` file were not applied to the running cluster


* [K8SPSMDB-364](https://jira.percona.com/browse/K8SPSMDB-364): Fix a bug where liveness probe of a mongo container
was always failing if the userAdmin password contained special characters


* [K8SPSMDB-43](https://jira.percona.com/browse/K8SPSMDB-43): Fix a bug due to which renaming Replica Set in the
Custom Resource caused creating new Replica Set without deleting the old one
