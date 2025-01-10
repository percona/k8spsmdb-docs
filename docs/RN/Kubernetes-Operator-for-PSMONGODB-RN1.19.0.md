# *Percona Operator for MongoDB* 1.19.0

* **Date**

    January 16, 2025

* **Installation**

    [Installing Percona Operator for MongoDB](../System-Requirements.md#installation-guidelines)

## Release Highlights

## New Features

* {{ k8spsmdbjira(1109) }}: Allow PBM to use a remote file server as backup location
* {{ k8spsmdbjira(921) }}: IRSA is not enabled for restore
* {{ k8spsmdbjira(1133) }}: Allow manual change of Replica Set Member Priority in Percona Server MongoDB Operator
* {{ k8spsmdbjira(1164) }}: Add the possibility to create users in the $external database

## Improvements

* {{ k8spsmdbjira(1075) }}: Use controller runtime builder to configure controllers
* {{ k8spsmdbjira(1123) }}: Add support for MongoDB/PSMDB 8.0
* {{ k8spsmdbjira(1162) }}: User/Role management post implemantation cleanup
* {{ k8spsmdbjira(1171) }}: Add auto-generated user password for custom users
* {{ k8spsmdbjira(1174) }}: Add VS support to track user management feature
* {{ k8spsmdbjira(1179) }}: Investigate set values for externalTrafficPolicy 
* {{ k8spsmdbjira(1205) }}: Allow backups in unmanaged clusters
* {{ k8spsmdbjira(1215) }}: fix ExternalTrafficPolicy for different service types
* {{ k8spsmdbjira(1209) }}: Add a new parameter to the Jenkins pipelines to allow selection of architecture - amd64 or arm64

## Bugs Fixed

* {{ k8spsmdbjira(675) }}: Disabling sharding fails on a running cluster
* {{ k8spsmdbjira(754) }}: ERROR log level not very useful
* {{ k8spsmdbjira(1088) }}: Operator can start two PBM backup operations if backup object is updated
* {{ k8spsmdbjira(1156) }}: MongoDB operator cannot recover from invalid tls configurations because it cannot contact with PBM
* {{ k8spsmdbjira(1172) }}: PBM fails when the backup user's password contains special character - psmdb operator
* {{ k8spsmdbjira(1212) }}: Don't disable balancer during restores

## Deprecation, Rename and Removal

## Supported Platforms

The Operator was developed and tested with Percona Server for MongoDB 5.0.29-25,
6.0.19-16, 7.0.15-9, and 8.0.4-1. Other options may also work but have not been tested. The
Operator also uses Percona Backup for MongoDB 2.8.0.

The following platforms were tested and are officially supported by the Operator
1.19.0:

* [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.28-1.30
* [Amazon Elastic Container Service for Kubernetes (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.29-1.31
* [OpenShift Container Platform :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.14.44 - 4.17.11
* [Azure Kubernetes Service (AKS) :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.28-1.31
* [Minikube :octicons-link-external-16:](https://github.com/kubernetes/minikube) 1.34.0 based on Kubernetes 1.31.0

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.
