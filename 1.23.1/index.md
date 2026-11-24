> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Percona Operator for MongoDB

The Percona Operator for MongoDB runs and manages Percona Server for MongoDB inside Kubernetes for you. You describe the database you want (for example how many nodes, where to store backups), and the Operator keeps the cluster running that way: it creates the right pods, handles failures, and applies upgrades when you ask for them.

**Why use it?** You get a production-ready MongoDB cluster on Kubernetes without wiring every detail yourself. The Operator handles provisioning, scaling, backups, and high availability so you can focus on building your application or operating the platform.

[Get started](#get-started) [What’s new in version 1.23.1](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/RN/Kubernetes-Operator-for-PSMONGODB-RN1.23.1.html)

What’s coming next

See what the team is working on in the [public roadmap](https://github.com/orgs/percona/projects/10/views/1) , and when to expect it in the [release timeline](https://github.com/orgs/percona/projects/10/views/10) .

______________________________________________________________________

## Understand the Operator

Just evaluating? See how the Operator works, how it’s designed and how it stands out among other ways to run MongoDB on Kubernetes:

- [Architecture](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture.html)
- [Key workflows](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-workflows.html)
- [Compare with other solutions](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/compare.html)
- [Features](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/features.html)

______________________________________________________________________

## Get started

Choose how you want to use the Operator:

- **I’m building an application** — I need to connect my app to Percona Server for MongoDB on Kubernetes.\
  [Start integrating your application](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/get-a-cluster.html)
- **I’m deploying or operating the cluster** — I install, back up, and maintain the database.\
  [Try the Operator](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/quickstart.html)

______________________________________________________________________

## Installation and upgrade

Ready to run robust, production-grade Percona Server for MongoDB on Kubernetes, or keep an existing deployment current?

- [Full installation options](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/namespace-mode.html)
- [Upgrade the Operator and database](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update.html)

## Day-to-day operations

Configure, scale, and secure your cluster for ongoing use.

- [Configure backups](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-configure.html)
- [Configure TLS](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/TLS.html)
- [Encrypt data at rest](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/encryption.html)
- [Scale the cluster](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling.html)
- [Monitor the database](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/monitoring.html)
- [Set up disaster recovery with multi-cluster deployment](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/replication.html)

## Troubleshooting

Diagnose and resolve issues with your Operator installation and database.

- [Troubleshoot the Operator installation](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/troubleshoot-operator.html)
- [Check the logs](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug-logs.html)
- [Troubleshoot backups and restores](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug-backup-restore.html)

## Reference materials

Explore Custom Resource, backup and restore options, certified images and version compatibility.

- [Custom Resource options](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html)
- [Backup Resource options](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backup-resource-options.html)
- [Restore Resource options](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/restore-options.html)
- [Percona certified images](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/images.html)
- [Version compatibility matrix](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/versions.html)
