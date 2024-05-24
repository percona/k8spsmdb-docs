# *Percona Kubernetes Operator for Percona Server for MongoDB* 1.6.0


* **Date**

    December 22, 2020



* **Installation**

    [Installing Percona Kubernetes Operator for Percona Server for MongoDB](https://www.percona.com/doc/kubernetes-operator-for-psmongodb/index.html#installation)


## New Features


* [K8SPSMDB-273](https://jira.percona.com/browse/K8SPSMDB-273): Add support for `mongos` service to expose a single
[shard](../sharding.md) of a MongoDB cluster through one entry point instead of
provisioning a load-balancer per replica set node. In the following release,
we will add support for multiple shards.


* [K8SPSMDB-282](https://jira.percona.com/browse/K8SPSMDB-282): Official support for [Percona Monitoring and Management (PMM) v.2](../monitoring.md)

!!! note
    Monitoring with PMM v.1 configured according to the [unofficial instruction :octicons-link-external-16:](https://www.percona.com/blog/2020/07/23/using-percona-kubernetes-operators-with-percona-monitoring-and-management/)
    will not work after the upgrade. Please switch to PMM v.2.

## Improvements


* [K8SPSMDB-258](https://jira.percona.com/browse/K8SPSMDB-258): Add support for Percona Server for MongoDB version 4.4


* [K8SPSMDB-319](https://jira.percona.com/browse/K8SPSMDB-319): Show Endpoint in the `kubectl get psmdb` command output to connect to a MongoDB cluster easily


* [K8SPSMDB-257](https://jira.percona.com/browse/K8SPSMDB-257): Store the Operator version as a `crVersion` field in the `deploy/cr.yaml` configuration file


* [K8SPSMDB-266](https://jira.percona.com/browse/K8SPSMDB-266): Use plain-text passwords instead of base64-encoded ones when creating [System Users](../users.md#system-users) secrets for simplicity

## Bugs Fixed


* [K8SPSMDB-268](https://jira.percona.com/browse/K8SPSMDB-268): Fix a bug affecting the support of TLS certificates issued by [cert-manager :octicons-link-external-16:](https://github.com/jetstack/cert-manager),
due to which proper rights were not set for the role-based access control, and
Kubernetes versions newer than 1.15 required other certificate issuing sources


* [K8SPSMDB-261](https://jira.percona.com/browse/K8SPSMDB-261): Fix a bug due to which cluster pause/resume functionality didn’t work in previous releases


* [K8SPSMDB-292](https://jira.percona.com/browse/K8SPSMDB-292): Fix a bug due to which not all clusters managed by the Operator were upgraded by the automatic update

## Removal


* The [MMAPv1 storage engine :octicons-link-external-16:](https://docs.mongodb.com/manual/core/storage-engines/)
is no longer supported for all MongoDB versions starting from this version of
the Operator. MMAPv1 was already deprecated by MongoDB for a long time.
WiredTiger is the default storage engine since MongoDB 3.2, and MMAPv1 was
completely removed in MongoDB 4.2.

!!! note
    Upgrade of the Operator from 1.5.0 to 1.6.0 will fail if MMAPv1 is
    used, but MongoDB cluster will continue to run. It is recommended to
    migrate your clusters to WiredTiger engine before the upgrade.
