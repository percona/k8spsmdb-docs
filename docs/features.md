# Features

The Percona Operator for MongoDB is a Kubernetes-native controller that automatically manages the full lifecycle of Percona Server for MongoDB clusters. The Operator offloads your teams from manual day-to-day database management so you can focus on building applications and running the platform.

## Core capabilities

Here is what the Operator brings to your infrastructure:

### High availability and failover

**MongoDB’s built-in high availability** — Replica sets and sharding give you data redundancy and automatic failover at the database layer. A [replica set](architecture.md#replica-set) uses elections to promote a new primary when the current one fails, with no manual intervention. With [sharding](sharding.md), data is distributed across shards (each shard is a replica set), and mongos routes traffic. Both topologies are designed for availability and scale.

**What the Operator adds** — The Operator runs these topologies reliably in Kubernetes:

* **Pod distribution** — Use [anti-affinity rules](constraints.md) to spread replica set members (and optionally arbiters) across nodes so a single node failure does not take down multiple members.
* **Health and rescheduling** — If a node or Pod fails, Kubernetes reschedules the workload; the replica set reconnects and continues serving traffic.
* **Rolling upgrades** — [Upgrade the Operator](update-operator.md) and [Percona Server for MongoDB](update-db.md) with minimal or no downtime.
* **Multi-cluster and multi-region** — Use [multi-cluster or multi-region deployments](replication.md) (including [Multi-cluster Services (MCS)](replication-mcs.md) where supported) for disaster recovery, cross-site replication, and migration. You can replicate data across clusters or regions so that if one site fails, another can serve traffic.

### Backup and restore

Protect your data with Percona Backup for MongoDB, which runs as a sidecar in your database Pods. The [Backup and restore](backups.md) overview covers types, storages, restores, and point-in-time recovery. When you are ready to set things up, follow [Configure backups](backups-configure.md).

* **Scheduled and on-demand backups** — [Run backups on a schedule](backups-scheduled.md) or [create one when you need it](backups-ondemand.md).
* **Logical, physical, incremental, and PVC snapshots** — See [backup types](backups.md#backup-types) to pick the right one.
* **Point-in-time recovery** — [Enable saving oplog](backups-pitr.md) and restore to a specific time.
* **Restore** — [Restore on the same cluster or a new cluster](backups-restore.md).

### Automated scaling and resource management

Scale your database infrastructure as demand grows:

* **Horizontal scaling** — [Add replica set members](scaling.md) or scale [shards and mongos](sharding.md) when sharding is enabled.
* **Vertical scaling** — Adjust CPU and memory limits in the PerconaServerMongoDB custom resource.
* **Storage expansion** — Expand PersistentVolumeClaims for database volumes when your storage class supports it.
* **Pod placement** — Use [affinity and anti-affinity](constraints.md) to control which nodes run MongoDB Pods, arbiters, or mongos.

### Security and compliance

Keep your data and backups secure with built-in options:

* **Transport encryption** — [Enable TLS](TLS.md) for client and server; use [cert-manager](tls-cert-manager.md) or [custom certificates](tls-manual.md).
* **Data-at-rest encryption** — [Encrypt MongoDB data on disk](encryption.md).
* **Users and roles** — Manage [application users](app-users.md) and [system users](system-users.md); optionally use [Vault](system-users-vault.md) for system user credentials.
* **Backup encryption** — [Encrypt backups](backups-encryption.md) in object storage.

### Monitoring and observability

Gain visibility into your database and cluster:

* **Percona Monitoring and Management (PMM)** — [Integrate PMM](monitoring.md) via sidecar for metrics, query analysis, and dashboards.
* **Kubernetes monitoring** — [Monitor the Kubernetes layer](monitor-kubernetes.md) alongside the database.
* **Logging** — Configure [persistent logging](persistent-logging.md) and [log rotation](logrotate.md).
* **Custom options** — [Tune MongoDB options](options.md) and [PBM options](options-pbm.md) via the custom resource.
* **Sidecars** — Add [sidecar containers](sidecar.md) (e.g. custom exporters or tools) to replica set, config server, or mongos Pods.

## Understand how it works

The [How the Operator works](how-it-works.md) and [Design and architecture](architecture.md) pages explain the controller model and the components it manages.

## Next steps

Get up and running in minutes, whether you build an application or need to deploy and operate the database.

[Get started](quickstart.md){.md-button}
