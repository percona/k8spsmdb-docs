# Percona Kubernetes Operator for Percona Server for MongoDB 1.1.0

Percona announces the general availability of *Percona Kubernetes Operator for Percona Server for MongoDB* 1.1.0 on July 15, 2019. This release is now the current GA release in the 1.1 series. [Install the Kubernetes Operator for Percona Server for MongoDB by following the instructions](../kubernetes.md). Please see the [GA release announcement :octicons-link-external-16:](https://www.percona.com/blog/2019/05/29/percona-kubernetes-operators/).

The Operator simplifies the deployment and management of the [Percona Server for MongoDB :octicons-link-external-16:](https://www.percona.com/software/mongo-database/percona-server-for-mongodb) in Kubernetes-based environments. It extends the Kubernetes API with a new custom resource for deploying, configuring and managing the application through the whole life cycle.

The Operator source code is available [in our Github repository :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator). All of Percona’s software is open-source and free.

## New Features and Improvements


* Now the Percona Kubernetes Operator [allows upgrading](../update.md) Percona Server for MongoDB to newer versions, either in semi-automatic or in manual mode.


* Also, two modes are implemented for updating the Percona Server for MongoDB `mongod.conf` configuration file: in *automatic configuration update* mode Percona Server for MongoDB Pods are immediately re-created to populate changed options from the Operator YAML file, while in *manual mode* changes are held until Percona Server for MongoDB Pods are re-created manually.


* [Percona Server for MongoDB data-at-rest encryption :octicons-link-external-16:](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/data_at_rest_encryption.html) is now supported by the Operator to ensure that encrypted data files cannot be decrypted by anyone except those with the decryption key.


* A separate service account is now used by the Operator’s containers which need special privileges, and all other Pods run on default service account with limited permissions.


* [User secrets](../users.md) are now generated automatically if don’t exist: this feature especially helps reduce work in repeated development environment testing and reduces the chance of accidentally pushing predefined development passwords to production environments.


* The Operator [is now able to generate TLS certificates itself](../TLS.md) which removes the need in manual certificate generation.


* The list of officially supported platforms now includes the [Minikube](../minikube.md), which provides an easy way to test the Operator locally on your own machine before deploying it on a cloud.


* Also, Google Kubernetes Engine 1.14 and OpenShift Platform 4.1 are now supported.

[Percona Server for MongoDB :octicons-link-external-16:](https://www.percona.com/software/mongo-database/percona-server-for-mongodb) is an enhanced, open source and highly-scalable database that is a fully-compatible, drop-in replacement for MongoDB Community Edition. It supports MongoDB protocols and drivers. Percona Server for MongoDB extends MongoDB Community Edition functionality by including the Percona Memory Engine, as well as several enterprise-grade features. It requires no changes to MongoDB applications or code.

Help us improve our software quality by reporting any bugs you encounter using [our bug tracking system :octicons-link-external-16:](https://jira.percona.com/secure/Dashboard.jspa).
