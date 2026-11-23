> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Features

The Percona Operator for MongoDB is a Kubernetes-native controller that automatically manages the full lifecycle of Percona Server for MongoDB clusters. The Operator offloads your teams from manual day-to-day database management so you can focus on building applications and running the platform.

## Core capabilities

Here is what the Operator brings to your infrastructure:

### High availability and failover

**MongoDB’s built-in high availability** — Replica sets and sharding give you data redundancy and automatic failover at the database layer. A [replica set](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture.html#replica-set) uses elections to promote a new primary when the current one fails, with no manual intervention. With [sharding](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/sharding.html), data is distributed across shards (each shard is a replica set), and mongos routes traffic. Both topologies are designed for availability and scale.

**What the Operator adds** — The Operator runs these topologies reliably in Kubernetes:

- **Pod distribution** — Use [anti-affinity rules](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/constraints.html) to spread replica set members (and optionally arbiters) across nodes so a single node failure does not take down multiple members.
- **Health and rescheduling** — If a node or Pod fails, Kubernetes reschedules the workload; the replica set reconnects and continues serving traffic.
- **Rolling upgrades** — [Upgrade the Operator](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-operator.html) and [Percona Server for MongoDB](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-db.html) with minimal or no downtime.
- **Multi-cluster and multi-region** — Use [multi-cluster or multi-region deployments](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/replication.html) (including [Multi-cluster Services (MCS)](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/replication-mcs.html) where supported) for disaster recovery, cross-site replication, and migration. You can replicate data across clusters or regions so that if one site fails, another can serve traffic.

### Backup and restore

Protect your data with Percona Backup for MongoDB, which runs as a sidecar in your database Pods. The [Backup and restore](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups.html) overview covers types, storages, restores, and point-in-time recovery. When you are ready to set things up, follow [Configure backups](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-configure.html).

- **Scheduled and on-demand backups** — [Run backups on a schedule](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-scheduled.html) or [create one when you need it](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-ondemand.html).
- **Logical, physical, incremental, and PVC snapshots** — See [backup types](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups.html#backup-types) to pick the right one.
- **Point-in-time recovery** — Roll back the database to a specific time.
- **Restore** — [Restore on the same cluster or a new cluster](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore.html).

### Automated scaling and resource management

Scale your database infrastructure as demand grows:

- **Horizontal scaling** — [Add replica set members](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling.html) or scale [shards and mongos](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/sharding.html) when sharding is enabled.
- **Vertical scaling** — Adjust CPU and memory limits in the PerconaServerMongoDB custom resource.
- **Storage expansion** — Expand PersistentVolumeClaims for database volumes when your storage class supports it.
- **Pod placement** — Use [affinity and anti-affinity](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/constraints.html) to control which nodes run MongoDB Pods, arbiters, or mongos.

### Security and compliance

Keep your data and backups secure with built-in options:

- **Transport encryption** — [Enable TLS](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/TLS.html) for client and server; use [cert-manager](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/tls-cert-manager.html) or [custom certificates](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/tls-manual.html).
- **Data-at-rest encryption** — [Encrypt MongoDB data on disk](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/encryption.html).
- **Users and roles** — Manage [application users](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/app-users.html) and [system users](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/system-users.html); optionally use [Vault](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/system-users-vault.html) for system user credentials.
- **Backup encryption** — [Encrypt backups](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-encryption.html) in object storage.

### Monitoring and observability

Gain visibility into your database and cluster:

- **Percona Monitoring and Management (PMM)** — [Integrate PMM](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/monitoring.html) via sidecar for metrics, query analysis, and dashboards.
- **Kubernetes monitoring** — [Monitor the Kubernetes layer](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/monitor-kubernetes.html) alongside the database.
- **Logging** — Configure [persistent logging](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/persistent-logging.html) and [log rotation](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/logrotate.html).
- **Custom options** — [Tune MongoDB options](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/options.html) and [PBM options](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/options-pbm.html) via the custom resource.
- **Sidecars** — Add [sidecar containers](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/sidecar.html) (e.g. custom exporters or tools) to replica set, config server, or mongos Pods.

## Understand how it works

The [How the Operator works](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/how-it-works.html) and [Design and architecture](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture.html) pages explain the controller model and the components it manages.

## Next steps

Get up and running in minutes, whether you build an application or need to deploy and operate the database.

[Get started](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/quickstart.html)
