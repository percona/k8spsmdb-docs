# Percona Kubernetes Operator for Percona Server for MongoDB 1.5.0


* **Date**

    September 7, 2020



* **Installation**

    [Installing Percona Kubernetes Operator for Percona Server for MongoDB](https://www.percona.com/doc/kubernetes-operator-for-psmongodb/index.html#installation)


## New Features


* [K8SPSMDB-233](https://jira.percona.com/browse/K8SPSMDB-233): Automatic management of system users for MongoDB on password rotation via Secret


* [K8SPSMDB-226](https://jira.percona.com/browse/K8SPSMDB-226): Official Helm chart for the Operator


* [K8SPSMDB-199](https://jira.percona.com/browse/K8SPSMDB-199): Support multiple PSMDB minor versions by the Operator


* [K8SPSMDB-198](https://jira.percona.com/browse/K8SPSMDB-198): Fully Automate Minor Version Updates (Smart Update)

## Improvements


* [K8SPSMDB-192](https://jira.percona.com/browse/K8SPSMDB-192): The ability to set the mongod cursorTimeoutMillis parameter in YAML (Thanks to user xprt64 for the contribution)


* [K8SPSMDB-234](https://jira.percona.com/browse/K8SPSMDB-234): OpenShift 4.5 support


* [K8SPSMDB-197](https://jira.percona.com/browse/K8SPSMDB-197): Additional certificate SANs useful for reverse DNS lookups (Thanks to user phin1x for the contribution)


* [K8SPSMDB-190](https://jira.percona.com/browse/K8SPSMDB-190): Direct API quering with “curl” instead of using “kubectl” tool in scheduled backup jobs (Thanks to user phin1x for the contribution)


* [K8SPSMDB-133](https://jira.percona.com/browse/K8SPSMDB-133): A special Percona Server for MongoDB debug image which avoids restarting on fail and contains additional tools useful for debugging


* [CLOUD-556](https://jira.percona.com/browse/CLOUD-556): Kubernetes 1.17 / Google Kubernetes Engine 1.17 support

## Bugs Fixed


* [K8SPSMDB-213](https://jira.percona.com/browse/K8SPSMDB-213): Installation instruction not reflecting recent changes in git tags (Thanks to user geraintj for reporting this issue)


* [K8SPSMDB-210](https://jira.percona.com/browse/K8SPSMDB-210): Backup documentation not reflecting changes in Percona Backup for MongoDB


* [K8SPSMDB-180](https://jira.percona.com/browse/K8SPSMDB-180): Replset and cluster having “ready” status set before mongo initialization and replicasets configuration finished


* [K8SPSMDB-179](https://jira.percona.com/browse/K8SPSMDB-179): The “error” cluster status instead of the “initializing” one during the replset initialization


* [CLOUD-531](https://jira.percona.com/browse/CLOUD-531): Wrong usage of `strings.TrimLeft` when processing apiVersion
