# Percona Operator for MongoDB

The [Percona Operator for MongoDB](https://github.com/percona/percona-server-mongodb-operator) automates the creation, modification, or deletion of items in your Percona Server for MongoDB environment. The Operator contains the necessary Kubernetes settings to maintain a consistent Percona Server for MongoDB instance.

The Percona Kubernetes Operators are based on best practices for the configuration of a Percona Server for MongoDB replica set. The Operator provides many benefits but saving time, a consistent environment are the most important.

# Features

* [Design and architecture](architecture.md)

* [Comparison with other solutions](compare.md)

# Quickstart

* [Install with Helm](helm.md)

* [Install with kubectl](kubectl.md)

# Installation guides

* [System Requirements](System-Requirements.md)

* [Install on Minikube](minikube.md)

* [Install on Google Kubernetes Engine (GKE)](gke.md)

* [Install on Amazon Elastic Kubernetes Service (AWS EKS)](eks.md)

* [Install on Microsoft Azure Kubernetes Service (AKS)](aks.md)

* [Generic Kubernetes installation](kubernetes.md)

* [Install on OpenShift](openshift.md)

# Configuration

* [Application and system users](users.md)

* [Changing MongoDB options](options.md)

* [Anti-affinity and tolerations](constraints.md)

* [Labels and annotations](annotations.md)

* [Exposing the cluster](expose.md)

* [Local storage support](storage.md)

* [Arbiter and non-voting nodes](arbiter.md)

* [MongoDB sharding](sharding.md)

* [Transport encryption (TLS/SSL)](TLS.md)

* [Data at rest encryption](encryption.md)

* [Telemetry](telemetry.md)

# Management

* Backup and restore

    * [About backups](backups.md)
    
    * [Configure storage for backups](backups-storage.md)
    
    * [Making scheduled backups](backups-scheduled.md)
    
    * [Making on-demand backup](backups-ondemand.md)
    
    * [Storing operations logs for point-in-time recovery](backups-pitr.md)
    
    * [Restore from a previously saved backup](backups-restore.md)
    
    * [Delete the unneeded backup](backups-delete.md)

* [Upgrade MongoDB and the Operator](update.md)

* [Horizontal and vertical scaling](scaling.md)

* [Multi-cluster and multi-region deployment](replication.md)

* [Monitor with Percona Monitoring and Management (PMM)](monitoring.md)

* [Add sidecar containers](sidecar.md)

* [Restart or pause the cluster](pause.md)

* [Debug and troubleshoot](debug.md)

# HOWTOs

* [OpenLDAP integration](ldap.md)

* [How to use private registry](custom-registry.md)

* [Creating a private S3-compatible cloud for backups](private.md)

* [Restore backup to a new Kubernetes-based environment](backups-restore-to-new-cluster.md)

* [How to use backups to move the external database to Kubernetes](backups-move-from-external-db.md)

* [Install Percona Server for MongoDB in multi-namespace (cluster-wide) mode](cluster-wide.md)

* [Upgrading Percona Server for MongoDB manually](update_manually.md)


# Reference

* [Custom Resource options](operator.md)

* [Percona certified images](images.md)

* [Operator API](api.md)

* [Frequently asked questions](faq.md)

* [Release notes](RN/index.md)
