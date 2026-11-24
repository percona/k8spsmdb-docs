> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Real-time replication with Percona ClusterSync for MongoDB (PCSM)

Version added: [1.23.0](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/RN/Kubernetes-Operator-for-PSMONGODB-RN1.23.0.html)

[Percona ClusterSync for MongoDB (PCSM)](https://docs.percona.com/percona-clustersync-for-mongodb/) is a data migration and replication tool for MongoDB deployments. It clones existing data from source MongoDB deployment to target one and uses MongoDB change stream events to track the changes on the source and replicate them to the target in real time.

You can use Percona ClusterSync for MongoDB for:

- One-time migration with near-zero downtime
- A live replica of your data for testing purposes or geographically distributed environments

You can replicate the full data set or exclude specific namespaces. In either case, PCSM creates the required indexes on the target.

For more information on PCSM, refer to [PCSM documentation](https://docs.percona.com/percona-clustersync-for-mongodb/index.html#features) .

## How it works with the Operator

The Operator deploys and manages PCSM through a dedicated **`PerconaServerMongoDBClusterSync`** Custom Resource (`psmdb-clustersync`). PCSM runs as a separate Deployment in the same namespace as the target cluster. The Operator uses PCSM API to control the replication flow.

You configure authentication for PCSM in the source cluster and provide the user credentials within the Kubernetes Secret and the cluster endpoint. Then define the source and target clusters and the replication mode in the `PerconaServerMongoDBClusterSync` custom resource. After you apply the configuration, the Operator does the following:

- Deploys the PCSM Deployment
- Provisions a sync user on the target cluster
- Constructs MongoDB connection URIs to both source and target clusters.
- Starts the replication: first it does the initial sync and then replicates the changes from source to target in real time
- Monitors the replication mode changes and pauses, resumes or finalizes the replication depending on your settings
- Surfaces replication state and lag on the `PerconaServerMongoDBClusterSync` Custom Resource
- Coordinates backup and restore operations on the target cluster so they do not interfere with active replication

You can monitor the replication progress. When the replication lag is acceptable for cutover, finalize the replication. Then reconfigure client applications to point to the target cluster.

For step-by-step instructions, see [Set up and use PCSM](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/clustersync-setup.html).

## Architecture

Components of this architecture are:

- **Source cluster** – The cluster you replicate data from. You can run it on premises (MongoDB Enterprise Advanced), in the cloud (MongoDB Atlas) or as another Kubernetes deployment. You manage the source cluster and must prepare it for replication: configure authentication, create a Kubernetes Secret with the PCSM user credentials and provide the cluster endpoint.
- **Target cluster** – The cluster you replicate data to. It is managed by the Operator. The Operator creates the sync user and constructs the connection string automatically based on the cluster topology.
- **PCSM Deployment** – One or more PCSM Pods managed by the Operator. After the initial clone, PCSM saves checkpoints, and the Operator resumes replication from the last checkpoint after a recoverable failure. The initial clone can’t resume: if it’s interrupted, start a new sync. See [Troubleshooting](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/clustersync-setup.html#troubleshooting).

## TLS connections

Version added: [1.24.0](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/RN/Kubernetes-Operator-for-PSMONGODB-RN1.24.0.md)

**To the target cluster.** If the target cluster has TLS turned on and its `crVersion` is 1.24.0 or later, PCSM connects to it over TLS. You don’t need to configure anything:

- The Operator mounts the target cluster’s TLS Secret, set in [`secrets.ssl`](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#secretsssl), into the PCSM Pods.
- PCSM presents the certificate from this Secret and checks the target cluster’s certificate against the Secret’s `ca.crt`.
- PCSM follows the target cluster’s [`tls.allowInvalidCertificates`](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#tlsallowinvalidcertificates) setting.

The Operator restarts the PCSM Pods in these cases:

- When the target cluster’s certificates change, for example when cert-manager renews them or you rotate them.
- When you change `tls.allowInvalidCertificates`.

A restart during the initial clone stops the sync. See [Limitations](#limitations).

With a `crVersion` earlier than 1.24.0, PCSM connects to the target cluster without TLS. This works only if the target accepts connections without TLS, with `tls.mode` set to `preferTLS` or `allowTLS`.

**To the source cluster.** Add TLS options to the connection string in [`source.uri`](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/clustersync-options.html#sourceuri), for example `tls=true`. The Operator doesn’t add certificates for the source connection.

## High availability

Version added: [1.24.0](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/RN/Kubernetes-Operator-for-PSMONGODB-RN1.24.0.md)

A migration or a continuous replica can run for hours. With a single PCSM instance, a Pod failure, node drain or eviction stops replication until Kubernetes restarts the Pod. Run PCSM with high availability to keep replication going through these events without your involvement: a standby instance takes over within seconds and continues from the last checkpoint, so replication doesn’t start over and the lag stays low.

To turn it on, set [`spec.size`](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/clustersync-options.html#size) to `2` or more. One instance is active and replicates, and the others are standbys.

The instances elect the active one through a lease that PCSM keeps on the target cluster, in the `percona_clustersync_mongodb` database. The active instance renews the lease every 3 seconds. If it stops renewing it, the lease expires in 10 seconds by default. Then a standby takes the lease and continues replication from the last saved checkpoint.

When PCSM runs with high availability, the Operator manages the group for you:

- Sends `pause`, `resume` and `finalize` commands to the active instance and stores its Pod name in `status.activeInstance`.
- Records a `PCSMFailover` event each time another instance becomes active.
- Creates the `<clustersync-name>-pcsm` PodDisruptionBudget, which allows one PCSM Pod to be unavailable at a time. To change it, see [`podDisruptionBudget`](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/clustersync-options.html#poddisruptionbudgetmaxunavailable).
- Replaces the Pods one at a time when you change the ClusterSync configuration.

High availability protects replication after the initial clone. For what it doesn’t cover, see [Limitations](#limitations).

By default, PCSM runs as a single instance. If its Pod restarts, PCSM resumes from the last checkpoint after the previous lease expires.

### Change the lease duration

You can set how long the lease lasts with the `PCSM_HA_LEASE_TTL` environment variable in [`spec.env`](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/clustersync-options.html#env), for example `30s`. The minimum and the default are `10s`. A longer lease lets the active instance survive short outages of the target cluster, but a standby takes over later when the active instance fails. See [High availability in the PCSM documentation](https://docs.percona.com/percona-clustersync-for-mongodb/high-availability.html) .

## Supported MongoDB deployments

PCSM supports these topologies:

- Replica set to replica set
- Sharded cluster to sharded cluster
- Sharded cluster to replica set. Sharded collections on the source become regular collections on the target.
- Replica set to sharded cluster. After migration, the collections remain unsharded and you must shard them yourself.

See [Supported MongoDB deployments in the PCSM documentation](https://docs.percona.com/percona-clustersync-for-mongodb/deployment.html) and [Limitations on sharded clusters in the PCSM documentation](https://docs.percona.com/percona-clustersync-for-mongodb/limitations.html#sharded-clusters) for more information.

## Supported MongoDB versions

The source and target run the same major MongoDB version, or the target runs a higher one on a supported path: 6.0 to 7.0, 6.0 to 8.0 or 7.0 to 8.0. Minimum supported MongoDB versions are 6.0.17, 7.0.13 and 8.0.0.

To learn more, see [Version compatibility matrix in PCSM documentation](https://docs.percona.com/percona-clustersync-for-mongodb/version-compatibility.html#version-compatibility-matrix) .

## Replication modes and states

You control the replication flow through the `PerconaServerMongoDBClusterSync` custom resource. Supported modes are:

- `running` – Start or resume replication. On start, PCSM runs initial sync, then replicates changes occurred on the source to the target. On resume, PCSM starts from the last saved checkpoint.
- `paused` – The replication is paused. PCSM saves the checkpoint in the change stream so it can resume replication without re-running the initial sync.
- `finalized` – PCSM completes the replication, creates required indexes on the target, and stops. This is a one-time operation. Setting the replication mode to `running` again has no effect. This is done to prevent accidental data resync. To start over, delete the `PerconaServerMongoDBClusterSync` object and recreate it. PCSM starts from the initial data sync.

PCSM also reports a runtime **state**, which the Operator stores in `status.state`: `idle`, `running`, `paused`, `finalizing`, `finalized`, `failed`.

Find more information about modes, states, and conditions in [Custom resource statuses](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/cr-statuses.html#perconaservermongodbclustersync-status). For all configuration fields, see [ClusterSync Resource options](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/clustersync-options.html).

## Sharding support

PCSM replicates from a sharded source to a sharded cluster or to a replica set. It connects to a sharded cluster through `mongos`.

For a sharded target, PCSM checks the source for sharded collections before the replication and creates matching collections with the same shard keys on the target. The target cluster manages chunk distribution, primary shard names and zones. PCSM replicates **data only**, not sharding metadata, so the source and target can have different numbers of shards.

For a replica set target, sharded collections on the source become regular collections. See [Sharding support in the PCSM documentation](https://docs.percona.com/percona-clustersync-for-mongodb/sharding.html) .

## Backup and restore management

You can run backups and restores on the **source** as usual.

On the **target**, the Operator holds a lease while PCSM is active, so backups and restores wait. After you finalize replication and PCSM reports `finalized`, the Operator releases the lease and you can back up or restore the target again.

## Implementation specifics

- One active `PerconaServerMongoDBClusterSync` Custom Resource per target cluster (enforced by lease).
- Treat `source.uri` and source credentials as **immutable** after start. To change the source, delete and recreate the ClusterSync CR.
- `excludeNamespaces` applies only on `pcsm start`. Later changes do not re-filter an already running sync.
- The target sync user and finalized Deployment/Secrets remain until you delete the `PerconaServerMongoDBClusterSync` CR.

## Limitations

PCSM follows upstream [known issues and limitations](https://docs.percona.com/percona-clustersync-for-mongodb/limitations.html) .

Notable constraints:

- Source and target run the same major MongoDB version, or one of the supported upgrade paths. See [Supported MongoDB deployments](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/clustersync.html#supported-mongodb-deployments).
- Single source / single target pair only.
- Reverse synchronization is not supported.
- The initial clone is **not resumable**, even with high availability. If it’s interrupted, start a new sync. A failover during the clone stops the sync with the error `initial clone interrupted by failover and is not resumable`. See [Status shows `failed`](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/clustersync-setup.html#status-shows-failed).
- With high availability, the Operator replaces the PCSM Pods in no fixed order during an update, so the active role can move more than once.
- PCSM connects to the **primary** only; `directConnection` to secondaries is ignored.
- Users, roles, and `system.*` collections are not synchronized.
- Unsupported types include timeseries, queryable encryption, Percona Memory Engine, and several sharding admin commands during replication.
- External authentication (LDAP, Kerberos, AWS IAM) is not supported for PCSM connections.

## Next steps

[Set up and use PCSM](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/clustersync-setup.html)
