# Percona Operator for MongoDB

The [Percona Operator for MongoDB  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator) is a Kubernetes-native application that uses custom resources to manage the lifecycle of Percona Server for MongoDB clusters. It works as a controller, monitoring the desired database state defined by you (through YAML files) and ensuring your MongoDB deployment matches that state automatically.

The Operator simplifies and automates tasks related to MongoDB cluster management such as:

* Provisioning and scaling: 

    * Automatically creates MongoDB clusters on Kubernetes.

    * Dynamically scales your MongoDB instances up or down based on workload requirements.

* Upgrade: Manages seamless upgrades of MongoDB versions without downtime or data loss.

* Backups and Restores: Simplifies backing up data to external storage (e.g., AWS S3, Azure) and restoring it when needed.

* Self-Healing: Detects and resolves issues such as pod failures, keeping the cluster healthy.

* High Availability: Manages replica sets and failover mechanisms to ensure your database remains available.

[What's new in version {{release}}](RN/Kubernetes-Operator-for-PSMONGODB-RN{{release}}.md){.md-button}
