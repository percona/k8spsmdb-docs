# *Percona Kubernetes Operator for Percona Server for MongoDB* 1.4.0


* **Date**

    March 31, 2020



* **Installation**

    [Installing Percona Kubernetes Operator for PSMDB](https://www.percona.com/doc/kubernetes-operator-for-psmongodb/index.html#installation)


## New Features


* [K8SPSMDB-89](https://jira.percona.com/browse/K8SPSMDB-89): Amazon Elastic Container Service for Kubernetes (EKS)
was added to the list of the officially supported platforms


* [K8SPSMDB-113](https://jira.percona.com/browse/K8SPSMDB-113): Percona Server for MongoDB 4.2 is now supported


* OpenShift Container Platform 4.3 is now supported

## Improvements


* [K8SPSMDB-79](https://jira.percona.com/browse/K8SPSMDB-79): The health check algorithm improvements have increased the overall stability of the Operator


* [K8SPSMDB-176](https://jira.percona.com/browse/K8SPSMDB-176): The Operator was updated to use Percona Backup for MongoDB version 1.2


* [K8SPSMDB-153](https://jira.percona.com/browse/K8SPSMDB-153): Now the user can adjust securityContext, replacing the automatically generated securityContext with the customized one


* [K8SPSMDB-175](https://jira.percona.com/browse/K8SPSMDB-175): Operator now updates observedGeneration status message to allow better monitoring of the cluster rollout or backups/restore process

## Bugs Fixed


* [K8SPSMDB-182](https://jira.percona.com/browse/K8SPSMDB-182): Setting the `updateStrategy: OnDelete` didn’t work if was not specified from scratch in CR


* [K8SPSMDB-174](https://jira.percona.com/browse/K8SPSMDB-174): The inability to update or delete existing CRD was possible because of too large records in etcd, resulting in “request is too large” errors. Only 20 last status changes are now stored in etcd to avoid this problem.

Help us improve our software quality by reporting any bugs you encounter using
[our bug tracking system :octicons-link-external-16:](https://jira.percona.com/secure/Dashboard.jspa).
