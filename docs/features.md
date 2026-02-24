# Features

The Percona Operator for MongoDB is a Kubernetes-native controller that automatically manages the full lifecycle of Percona Server for MongoDB clusters. The Operator offloads your teams from manual day-to-day database management so you can focus on building applications and running the platform.

## Core capabilities

Here is what the Operator brings to your infrastructure:

### High availability and failover

**MongoDB’s built-in high availability** — Replica sets and sharding give you data redundancy and automatic failover at the database layer. A [replica set](architecture.md#replica-set-and-sharded-cluster) uses elections to promote a new primary when the current one fails, with no manual intervention. With [sharding](sharding.md), data is distributed across shards (each shard is a replica set), and mongos routes traffic. Both topologies are designed for availability and scale.

**What the Operator adds** — The Operator runs these topologies reliably in Kubernetes:

* **Pod distribution** — Use [anti-affinity rules](constraints.md) to spread replica set members (and optionally arbiters) across nodes so a single node failure does not take down multiple members.
* **Health and rescheduling** — If a node or Pod fails, Kubernetes reschedules the workload; the replica set reconnects and continues serving traffic.
* **Rolling upgrades** — [Upgrade the Operator](update-operator.md) and [Percona Server for MongoDB](update-db.md) with minimal or no downtime.
* **Multi-cluster and multi-region** — Use [multi-cluster or multi-region deployments](replication.md) (including [Multi-cluster Services (MCS)](replication-mcs.md) where supported) for disaster recovery, cross-site replication, and migration. You can replicate data across clusters or regions so that if one site fails, another can serve traffic.

### Automated backup and restore flows

Protect your data with [Percona Backup for MongoDB (PBM)](backups.md), which runs as a sidecar in your database Pods:

* **Scheduled backups** — [Configure scheduled backups](backups-scheduled.md) with [remote storage](backups-storage.md) (S3, GCS, Azure, MinIO, or a file server) and retention policies.
* **On-demand backups** — [Create a backup](backups-ondemand.md) at any time for critical operations.
* **Logical and physical backups** — Use logical backups for portability or physical backups (including [physical incremental](backups.md#backup-types)) for faster restore on large datasets.
* **Point-in-time recovery** — [Store oplog and restore to a point in time](backups-pitr.md).
* **Restore** — [Restore on the same cluster or a new cluster](backups-restore.md); [replica set name remapping](backups-restore-replset-remapping.md) is supported when needed.

### Automated scaling and resource management

Scale your database infrastructure as demand grows:

* **Horizontal scaling** — [Add replica set members](scaling.md) or scale [shards and mongos](sharding.md) when sharding is enabled.
* **Vertical scaling** — Adjust CPU and memory limits in the PerconaServerMongoDB custom resource.
* **Storage expansion** — Expand PersistentVolumeClaims for database volumes when your storage class supports it.
* **Pod placement** — Use [affinity and anti-affinity](constraints.md) to control which nodes run MongoDB Pods, arbiters, or mongos.

### Security and compliance

Keep your data and backups secure with built-in options:

* **Transport encryption** — [Enable TLS](TLS.md) for client and server; use [cert-manager](tls-cert-manager.md) or [manual certificates](tls-manual.md).
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

## How the Operator works

The Operator extends Kubernetes with a custom resource that represents your MongoDB cluster’s desired state.

Here is what happens under the hood:

1. You define your cluster in a **PerconaServerMongoDB** custom resource (replica set or sharded cluster, size, storage, backups, and so on).
2. The Operator watches for changes and **reconciles** the actual state with your desired state.
3. Kubernetes resources are created and updated automatically: StatefulSets, Services, Secrets, PersistentVolumeClaims, and PBM configuration.
4. The cluster **self-heals** when Pods or nodes fail: Kubernetes reschedules Pods, and the replica set holds elections to choose a new primary.
5. **Updates and scaling** happen when you change the custom resource; the Operator applies the changes in a controlled way.

This declarative approach means you describe what you want, and the Operator handles the orchestration so your database cluster matches your specification.

[Explore the architecture](architecture.md){.md-button}
[Comparison with other solutions](compare.md){.md-button}

## What's next?

* [Get started](quickstart.md) — Get up and running in minutes, whether you build and application or need to deploy and operate the database
* [Single- and multi-namespace deployment](single-namespace-and-multi-namespace-deployment.md) — Understand your required deployment mode
* [Backups and restores](backups.md) — Protect your data with automated backups
* [Monitor with PMM](monitoring.md) — Gain visibility into database performance
* [TLS and security](TLS.md) — Secure client and server communications
