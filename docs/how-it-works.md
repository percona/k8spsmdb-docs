# How the Operator works

The Percona Operator for MongoDB is a custom controller. It is deployed as a Deployment. The Operator automates deployment and management of Percona Server for MongoDB on Kubernetes. This page explains how the Operator fits into Kubernetes and how it keeps your database cluster in the state you define.

## Extending the Kubernetes API

The Operator extends the Kubernetes API with a set of Custom Resources: 

* **PerconaServerMongoDB** for the database cluster
* **PerconaServerMongoDBBackup** for backups
* **PerconaServerMongoDBRestore** for restores. 

These Custom Resources are defined by the Custom Resource Definitions (CRD), which you install when you install the Operator. 

Then you describe the database you want by creating or updating a `PerconaServerMongoDB` object in `deploy/cr.yaml`. At this point, the Operator steps in and handles the hard work for you. It automatically does the following:

* Creates and manages the necessary Kubernetes resources (StatefulSets, Services, Pods)
* Ensures your cluster matches the desired state you've defined
* Monitors the cluster health and automatically recovers from failures
* Coordinates upgrades and scaling operations

These operations ensure that your actual database environment always matches your request.

Each `PerconaServerMongoDB` object corresponds to a single Percona Server for MongoDB setup - either a replica set or a sharded cluster. The Operator does not manage MongoDB servers that were created without using these custom resources.

## Default database deployment

By default, the Operator creates Percona Server for MongoDB replica set with three members: one primary and the remaining secondaries. This is the minimal recommended configuration and it natively provides high availability. A replica set can have up to 50 members with the maximum of 7 voting members. Read more about these requirements in [MongoDB documentation :octicons-link-external-16:](https://www.mongodb.com/docs/manual/core/replica-set-architectures/#strategies).

## Storage

To keep your data safe and persistent, the Operator uses Kubernetes storage systems called Persistent Volumes (PVs) and PersistentVolumeClaims (PVCs). When you request storage for your database, a PVC automatically finds and attaches available storage for you. If a node fails, the Kubernetes storage system can move your data to another node, making sure your database remains available and your data stays protected. For local or special storage needs, see [Local Storage](storage.md).

## Next steps

Ready to get started? Continue to the [quickstart guide](quickstart.md) to deploy your first cluster. Or, explore the [architecture overview](architecture.md) to understand the inner workings of the Operator.

[Quickstart guide](quickstart.md){.md-button}

## Useful links

- [Design and architecture](architecture.md)
- [Features and capabilities](features-and-capabilities.md) 
