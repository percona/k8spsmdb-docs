# *Percona Operator for MongoDB* 1.13.0

* **Date**

    September 8, 2022

* **Installation**

    [Installing Percona Operator for MongoDB](https://www.percona.com/doc/kubernetes-operator-for-psmongodb/index.html#installation)

## Release Highlights

## New Features

* {{ k8spsmdbjira(203) }} Add support for cluster-wide operators

* {{ k8spsmdbjira(287) }} Support hashicorp vault for PSMDB Operator

* {{ k8spsmdbjira(704) }} Certify Azure Kubernetes Service 

## Improvements

* {{ k8spsmdbjira(515) }} Allow setting requireTLS mode for MongoDB through the Operator

* {{ k8spsmdbjira(636) }} Create admin user by default

* {{ k8spsmdbjira(699) }} Disable automated upgrade by default

* {{ k8spsmdbjira(725) }} Support for configurable log output

* {{ k8spsmdbjira(719) }} Add more details into telemetry

* {{ k8spsmdbjira(715) }} Reduce the size of CRD 

* {{ k8spsmdbjira(709) }} Add support for API key authentication with PMM

* {{ k8spsmdbjira(707) }} Allow to set service labels for HAProxy and ProxySQL in Custom Resource to enable various integrations with cloud providers or service meshes

* {{ k8spsmdbjira(666) }} Don't force reconfig by default

## Bugs Fixed

* {{ k8spsmdbjira(702) }} The version overflow lead to cluster stuck at Initializing. 

* {{ k8spsmdbjira(730) }} PITR is enabled and disabled unnecessarily 

* {{ k8spsmdbjira(660) }} backup error - starting deadline exceeded

* {{ k8spsmdbjira(686) }} Failed to downscale sharding to replica set

* {{ k8spsmdbjira(691) }} The absence of ssl name in CR causes the error in operator log. 

* {{ k8spsmdbjira(696) }} Unable to delete the annotations on pods by deleting them in spec.replsets.annotations field

* {{ k8spsmdbjira(724) }} The delete-backup finalizer does not work

* {{ k8spsmdbjira(746) }} PSA setup will not work automatically with current main branch

* {{ k8spsmdbjira(762) }} Operator runs reconfig in every reconciliation if arbiter is enabled

## Supported Platforms

The following platforms were tested and are officially supported by the Operator
1.13.0:

* [Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine) 1.21 - 1.23

* [Amazon Elastic Container Service for Kubernetes (EKS)](https://aws.amazon.com) 1.21 - 1.23

* [OpenShift Container Platform](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.10 - 4.11

 Azure 1.22 - 1.24 (should be, checking 1.24. it doesn't work a couple of weeks ago)

* [Minikube](https://github.com/kubernetes/minikube) 1.26

This list only includes the platforms that the Percona Operators are
specifically tested on as part of the release process. Other Kubernetes flavors
and versions depend on the backward compatibility offered by Kubernetes itself.
