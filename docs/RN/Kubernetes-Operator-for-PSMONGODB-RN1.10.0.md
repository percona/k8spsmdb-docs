# Percona Distribution for MongoDB Operator 1.10.0


* **Date**

    September 30, 2021



* **Installation**

    For installation please refer to [the documentation page](https://www.percona.com/doc/kubernetes-operator-for-psmongodb/index.html#installation)


## Release Highlights


* Starting from this release, the Operator implements as a technical preview the possibility to [include non-voting replica set members](../arbiter.md#adding-non-voting-nodes) into the cluster, which do not participate in the primary election process. This feature enables users to deploy non-voting members with the Operator through a Custom Resource object without manual configuration.


* The technical preview of the [cross-site replication](../replication.md) feature allows users to add external replica set nodes into the cluster managed by the Operator, including scenarios when one of the clusters is outside of the Kubernetes environment. External nodes can be run by another Operator or can be regular MongoDB deployment. The feature is intended for the following use cases:


    * provide migrations of your regular MongoDB database to the Percona Server for MongoDB cluster under the Operator control, or carry on backward migration,


    * deploy cross-regional clusters for Disaster Recovery.

## New Features


* [K8SPSMDB-479](https://jira.percona.com/browse/K8SPSMDB-479): Allow users to add [non-voting members](../arbiter.md#adding-non-voting-nodes) to MongoDB replica, needed to have more than 7 nodes or to create a node in the edge location


* [K8SPSMDB-265](https://jira.percona.com/browse/K8SPSMDB-265): [Cross region replication](../replication.md) feature simplifies the migrations and enables Disaster Recovery capabilities for MongoDB on Kubernetes

## Improvements


* [K8SPSMDB-537](https://jira.percona.com/browse/K8SPSMDB-537): PMM container should not cause the crash of the whole database Pod if pmm-agent is not working properly


* [K8SPSMDB-517](https://jira.percona.com/browse/K8SPSMDB-517): Users can now run Percona Server for MongoDB 5 with the Operator. Version 5 support is added as a technical preview and is not recommended for Production.


* [K8SPSMDB-490](https://jira.percona.com/browse/K8SPSMDB-490): Add validation for the Custom Resource name so that cluster name and replica set name do not exceed 51 characters in total

## Bugs Fixed


* [K8SPSMDB-504](https://jira.percona.com/browse/K8SPSMDB-504): Fixed a race condition that could prevent the cluster with  LoadBalancer-exposed replica set members from becoming ready


* [K8SPSMDB-470](https://jira.percona.com/browse/K8SPSMDB-470): Fix a bug where ServiceAnnotation and LoadBalancerSourceRanges fields didn’t propagate to Kubernetes service (Thanks to Aliaksandr Karavai for reporting this issue)


* [K8SPSMDB-531](https://jira.percona.com/browse/K8SPSMDB-531): Fix compatibility issues between Percona Kubernetes Operator for MongoDB and Calico (Thanks to Mykola Kruliv for reporting this issue)


* [K8SPSMDB-514](https://jira.percona.com/browse/K8SPSMDB-514): Fix a bug where backup cronJob created by the Operator did not include resources limits and requests, which prevented it to run in the namespaces with resource quotas (Thanks to George Asenov for reporting this issue)


* [K8SPSMDB-512](https://jira.percona.com/browse/K8SPSMDB-512): Fix a bug where configuring getLastErrorModes in the replica set causes the Operator to fail to reconcile (Thanks to Adam Watson for contribution)


* [K8SPSMDB-553](https://jira.percona.com/browse/K8SPSMDB-553): Fix a bug where wrong S3 credentials caused backup to keep running despite the actual failure


* [K8SPSMDB-496](https://jira.percona.com/browse/K8SPSMDB-496): Fix a bug where Pods did not restart if custom MongoDB config was updated with a secret or a configmap

## Supported Platforms

The following platforms were tested and are officially supported by the Operator 1.10.0:


* OpenShift 4.6 - 4.8


* Google Kubernetes Engine (GKE) 1.17 - 1.21


* Amazon Elastic Container Service for Kubernetes (EKS) 1.16 - 1.21


* Minikube 1.22

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
