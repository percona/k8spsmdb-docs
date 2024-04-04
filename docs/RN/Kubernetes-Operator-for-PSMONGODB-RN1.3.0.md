# *Percona Kubernetes Operator for Percona Server for MongoDB* 1.3.0

Percona announces the *Percona Kubernetes Operator for Percona Server for
MongoDB* 1.3.0 release on December 11, 2019. This release is now the current
GA release in the 1.3 series. [Install the Kubernetes Operator for Percona
Server for MongoDB by following the instructions  :octicons-link-external-16:](https://www.percona.com/doc/kubernetes-operator-for-psmongodb/kubernetes.html).

The Operator simplifies the deployment and management of the [Percona Server
for MongoDB  :octicons-link-external-16:](https://www.percona.com/software/mongo-database/percona-server-for-mongodb)
in Kubernetes-based environments. It extends the Kubernetes API with a new
custom resource for deploying, configuring and managing the application through
the whole life cycle.

The Operator source code is available [in our Github repository  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator).
All of Percona’s software is open-source and free.

## New Features and Improvements


* [CLOUD-415  :octicons-link-external-16:](https://jira.percona.com/browse/CLOUD-415): Non-default cluster domain can now be specified with the new
`ClusterServiceDNSSuffix` Operator option.


* [CLOUD-395  :octicons-link-external-16:](https://jira.percona.com/browse/CLOUD-395): The Percona Server for MongoDB images size decrease by 42%
was achieved by removing unnecessary dependencies and modules to reduce the
cluster deployment time.


* [CLOUD-390  :octicons-link-external-16:](https://jira.percona.com/browse/CLOUD-390): Helm chart for Percona Monitoring and Management (PMM) 2.0
have been provided.

[Percona Server for MongoDB  :octicons-link-external-16:](https://www.percona.com/software/mongo-database/percona-server-for-mongodb)
is an enhanced, open source and highly-scalable database that is a
fully-compatible, drop-in replacement for MongoDB Community Edition. It supports
MongoDB protocols and drivers. Percona Server for MongoDB extends MongoDB
Community Edition functionality by including the Percona Memory Engine, as well
as several enterprise-grade features. It requires no changes to MongoDB
applications or code.

Help us improve our software quality by reporting any bugs you encounter using
[our bug tracking system  :octicons-link-external-16:](https://jira.percona.com/secure/Dashboard.jspa).
