> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Objects the Operator creates

This page lists what the Operator creates in your Kubernetes cluster for Percona Server for MongoDB, and which containers run in each Pod. Use it to size quotas, plan RBAC and storage, and to find an object when you troubleshoot.

## Kubernetes objects

For a cluster named `my-cluster-name` with a replica set named `rs0`, the Operator creates and manages the following Kubernetes objects. Some exist only when the related feature is turned on.

| Kind                       | Name                                                                                                           | Purpose                                                                                                                                                                                     |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| StatefulSet                | `my-cluster-name-rs0`, one for each replica set                                                                | Data-bearing members                                                                                                                                                                        |
| StatefulSet                | `my-cluster-name-rs0-arbiter`, `my-cluster-name-rs0-nv`, `my-cluster-name-rs0-hidden`                          | [Arbiter, non-voting and hidden members](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/arbiter.html), when you turn them on                                                  |
| StatefulSet                | `my-cluster-name-cfg`                                                                                          | Config server replica set, when sharding is on                                                                                                                                              |
| StatefulSet                | `my-cluster-name-mongos`                                                                                       | `mongos` query routers, when sharding is on                                                                                                                                                 |
| StatefulSet                | `my-cluster-name-rs0-search`                                                                                   | `mongot` for [search](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/search-overview.html), when search is on                                                                 |
| Service                    | `my-cluster-name-rs0`, `my-cluster-name-mongos`, and more                                                      | Headless Services for the members, client entry points, and optional per-Pod Services. See [Services and ports](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/services.html) |
| Secret                     | The name in `secrets.users`. The example manifest uses `my-cluster-name-secrets`                               | Passwords of the system users. The Operator creates it with random passwords if it doesn’t exist. Edit it to change passwords                                                               |
| Secret                     | `internal-my-cluster-name-users`                                                                               | Passwords the Operator has actually applied to the database. Do not edit it                                                                                                                 |
| Secret                     | `my-cluster-name-databaseadmin-conn-str`, and one for each application user Secret                             | Ready-to-use connection strings. See [Connection secrets](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/connection-secrets.html)                                             |
| Secret                     | `my-cluster-name-ssl`, `my-cluster-name-ssl-internal`                                                          | TLS certificates for client and internal traffic                                                                                                                                            |
| Secret                     | `my-cluster-name-pbm`                                                                                          | TLS client certificate of the PBM agents. Starting with version 1.24.0, when backups are enabled                                                                                            |
| Secret                     | `my-cluster-name-mongodb-keyfile`                                                                              | Key for internal authentication between members, when the cluster uses a keyfile                                                                                                            |
| Secret                     | `my-cluster-name-mongodb-encryption-key`                                                                       | Key for [data-at-rest encryption](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/encryption.html), when you don’t use HashiCorp Vault                                         |
| ConfigMap                  | `my-cluster-name-rs0-mongod`, `my-cluster-name-rs0-nv`, `my-cluster-name-rs0-hidden`, `my-cluster-name-mongos` | Your custom configuration from the `configuration` sections of the CR                                                                                                                       |
| ConfigMap                  | Configuration of the log collector and of `logrotate`, of backup hook scripts, and of `mongot`                 | Created when the related feature is on                                                                                                                                                      |
| PodDisruptionBudget        | One for each StatefulSet                                                                                       | Limits voluntary disruptions, such as node drains, to one Pod of the StatefulSet at a time by default                                                                                       |
| PersistentVolumeClaim      | `mongod-data-my-cluster-name-rs0-N`, `mongod-data-my-cluster-name-cfg-N`                                       | Data volumes, created by the StatefulSets. Arbiters keep no data and use no PVC                                                                                                             |
| PersistentVolumeClaim      | `mongos-logs-my-cluster-name-mongos-N`                                                                         | `mongos` logs, when [persistent logging](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/persistent-logging.html#for-mongos-pods) for `mongos` is on                           |
| PersistentVolumeClaim      | `mongot-data-my-cluster-name-rs0-search-N`                                                                     | Search indexes, when search is on                                                                                                                                                           |
| Lease                      | `psmdb-my-cluster-name-backup-lock`                                                                            | Makes backups run one at a time                                                                                                                                                             |
| PerconaServerMongoDBBackup | `cron-my-cluster-name-<timestamp>-<suffix>`                                                                    | One backup object for each scheduled run. See [Scheduled backups](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-workflows.html#scheduled-backups)               |
| VolumeSnapshot             | One for each data PVC                                                                                          | Created for each [PVC snapshot backup](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pvc-snapshots.html)                                                             |
| ServiceExport              | One for each Service                                                                                           | Created when [Multi-Cluster Services](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/replication-mcs.html) are enabled                                                        |

If cert-manager is installed, the Operator also creates cert-manager Issuers and Certificates that produce the TLS Secrets. When you create a `PerconaServerMongoDBClusterSync` object, the Operator creates the Deployment that runs [PCSM](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/clustersync.html) and the `psmdb-my-cluster-name-clustersync-lock` Lease.

Note

The Operator creates no Kubernetes Jobs or CronJobs. The PBM agents make backups and restores, and the Operator keeps the backup schedules itself. See [Scheduled backups](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-workflows.html#scheduled-backups).

Objects that survive cluster deletion

PVCs and Secrets are not owned by the Custom Resource, so deleting the CR does not delete them. This lets you recreate the cluster with its data and credentials. To delete them together with the cluster, set the `percona.com/delete-psmdb-pvc` finalizer. See [Delete the database cluster](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/delete.html#delete-the-database-cluster).

## Finalizers

A [finalizer](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html#finalizer) makes Kubernetes wait for a cleanup step before it deletes an object.

| Finalizer                                | Set on                                     | What it does before deletion                                                                                                                                                                                      |
| ---------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `percona.com/delete-psmdb-pods-in-order` | Cluster. On by default in `deploy/cr.yaml` | Stops `mongos`, then scales each replica set down one Pod at a time, so that the first Pod is the last one to stop                                                                                                |
| `percona.com/delete-psmdb-pvc`           | Cluster. Off by default                    | Deletes the StatefulSets, all PVCs of the cluster, the users Secret, the internal users Secret and the encryption key Secret. While it is set, the Operator also deletes the PVCs of Pods removed by a scale-down |
| `percona.com/delete-pitr-chunks`         | Cluster. Off by default                    | Deletes the oplog chunks saved for point-in-time recovery from the backup storage                                                                                                                                 |
| `percona.com/delete-backup`              | Backup                                     | Deletes the backup files from the storage, or the VolumeSnapshots of a PVC snapshot backup. For an `incremental` backup, it does nothing: its files are deleted together with the base backup of the chain        |
| `internal.percona.com/release-lock`      | Backup                                     | Releases the backup lock if a running backup is deleted. The Operator adds and removes it itself                                                                                                                  |

Don’t remove a finalizer to finish a stuck deletion. Find out why the cleanup is blocked instead. See [Cluster lifecycle](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator-boundaries.html#cluster-lifecycle).

## Containers in each Pod

**Replica set and config server Pods** (`my-cluster-name-rs0-N`, `my-cluster-name-cfg-N`):

- `mongo-init`, an init container, copies the Operator’s entrypoint, the `mongodb-healthcheck` tool and other helper files into a shared volume.
- `mongod` runs the database. It listens on port 27017.
- `backup-agent` runs the PBM agent, when backups are enabled.
- Optional sidecars: `pmm-client` for [monitoring](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/monitoring.html), `logs` and `logrotate` for [log collection](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/persistent-logging.html), and your own [sidecar containers](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/sidecar.html).

**Arbiter, non-voting and hidden member Pods** have the same layout. The main container is named `mongod-arbiter`, `mongod-nv` or `mongod-hidden`. The arbiter has no data volume and no `backup-agent` container.

**`mongos` Pods** (`my-cluster-name-mongos-N`):

- `mongo-init`, an init container, as in the replica set Pods.
- `mongos` routes client queries. It listens on port 27017.
- Optional sidecars: `pmm-client`, `logs` and `logrotate`, and your own sidecar containers.

**Search Pods** (`my-cluster-name-rs0-search-N`):

- `mongot` serves full-text and vector search queries for `mongod` and `mongos`.

## See also

- [Services and ports](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/services.html) for every Service, its ports and when it exists
- [Design and architecture](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture.html) for how these objects work together
- [Operator responsibilities by area](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator-boundaries.html) for what the Operator does and doesn’t do with them
