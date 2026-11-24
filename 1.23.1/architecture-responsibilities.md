> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Who owns what

When something happens in the cluster, the question is which layer reacts: the Operator, Percona Server for MongoDB, Kubernetes, or you. This page answers it at a glance. For the detail of what you do and what the Operator does in each area, and for what never to change by hand, see [Operator responsibilities by area](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator-boundaries.html). For an overview of the layers, see [Design and architecture](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture.html#the-four-layers).

Two rules explain most of the behavior:

- **You change the cluster only through the [Custom Resource](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html#custom-resource) and the user Secrets.** The Operator turns them into Kubernetes objects and into the replica set configuration, and reverts manual changes to the fields it manages.
- **Each layer keeps its own part alive.** Kubernetes keeps Pods running, MongoDB keeps a primary and replicates the data, and the Operator keeps the objects, the replica set membership and the day-2 tasks matching the Custom Resource.

## Who reacts when something happens

The table lists failures from the smallest to the largest scope first, then changes, then events that come with time and capacity. The bold text at the start of each answer names who acts.

| Event                                                           | Who reacts                                                                                                                                                                                         | Where it is explained                                                                                                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A container crashes or fails its liveness probe                 | **Kubernetes.** The kubelet restarts the container                                                                                                                                                 | [Health checks and probes](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-probes.html)                                       |
| A Pod is deleted or evicted                                     | **Kubernetes.** The StatefulSet controller recreates it, and the member rejoins the replica set with the same host name. The Operator isn’t involved                                               | [Replica set membership](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-workflows.html#replica-set-membership)               |
| A `mongos` Pod fails                                            | **Kubernetes.** It restarts the Pod, and the `my-cluster-name-mongos` Service sends new connections to the other `mongos` Pods. The Operator isn’t involved                                        | [Health checks and probes](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-probes.html#mongos-pods)                           |
| A Kubernetes node fails                                         | **Kubernetes, then you.** Kubernetes recreates a StatefulSet Pod elsewhere only after the Node object is removed or the stuck Pod is force-deleted, which is up to you or your platform            | [Kubernetes](#kubernetes)                                                                                                                               |
| A member falls behind or starts with an empty volume            | **MongoDB.** The member catches up from the oplog of another member, or runs an initial sync                                                                                                       | [Percona Server for MongoDB](#percona-server-for-mongodb)                                                                                               |
| The primary becomes unavailable                                 | **MongoDB.** The voting members elect a new primary, usually within seconds                                                                                                                        | [Primary failover](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-workflows.html#primary-failover)                           |
| The config server replica set loses its primary                 | **MongoDB.** The config server replica set elects a new primary like any replica set. Until it does, the cluster metadata can’t change                                                             | [Primary failover](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-workflows.html#primary-failover)                           |
| A replica set has no primary and can’t elect one                | **MongoDB, then the Operator.** Without a majority of voting members, MongoDB can’t elect a primary. The Operator rewrites the replica set configuration from a ready member                       | [Replica set without a primary](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-workflows.html#replica-set-without-a-primary) |
| You edit the Custom Resource                                    | **The Operator.** It reconciles the change                                                                                                                                                         | [How the Operator reacts to changes](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-reconciliation.html)                     |
| A Pod is added or removed, for example when you change the size | **The Operator.** It adds or removes the member in the replica set configuration, and adjusts the votes                                                                                            | [Replica set membership](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-workflows.html#replica-set-membership)               |
| You remove a shard from the CR                                  | **You, then the Operator.** You move or drop the databases on the shard first. The Operator checks that the shard holds no user databases, drains it through `mongos`, and deletes its StatefulSet | [Shards and the balancer](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-workflows.html#shards-and-the-balancer)             |
| Someone edits an object the Operator manages                    | **The Operator.** It reverts the fields it manages                                                                                                                                                 | [Change the cluster through the Custom Resource](#change-the-cluster-through-the-custom-resource)                                                       |
| A scheduled backup is due                                       | **The Operator.** It creates the backup object, and a PBM agent makes the backup                                                                                                                   | [Scheduled backups](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-workflows.html#scheduled-backups)                         |
| A TLS certificate gets close to its expiry date                 | **cert-manager, or you.** cert-manager renews the certificates it issued. You renew the certificates you supplied. Operator-generated certificates are valid until the year 9999                   | [Manage certificates](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator-boundaries.html#manage-certificates)                        |
| A disk fills up                                                 | **You, or the Operator.** You resize the storage. With storage autoscaling on, the Operator grows the volume                                                                                       | [Resize storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling-storage-resize.html#automatic-storage-resizing)                   |

When something fails and you don’t know which layer to start with, see [Which layer is it?](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug.html#which-layer-is-it) in Initial troubleshooting.

## Change the cluster through the Custom Resource

A [Custom Resource](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) (CR) is the Kubernetes object that describes the cluster you want. It is a blueprint that the Operator uses to deploy and manage your cluster.

**The Custom Resource is the source of truth. Change the cluster by editing the CR.**

The Operator compares the CR against what is running about every five seconds and corrects any difference it finds. A change you make directly to a [StatefulSet](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html#statefulset), a Service, a Pod, a managed Secret or the replica set configuration is drift. The Operator overwrites it, usually within seconds. If a change survives, the Operator doesn’t manage that field yet. This doesn’t mean the change was accepted.

- **Edits to the fields the Operator manages do not persist.** The Operator reverts them and doesn’t raise an event.
- **Edits outside the CR can still cause damage before they are reverted.** For example, a member you remove with `rs.remove()` is added back on the next pass, and a vote or priority you change with `rs.reconfig()` is set back.

## Review responsibilities at a glance

The following table shows what the Operator handles and what stays with you. Select an area for the details and the list of manual actions to avoid.

| Area                                                                                                                                                           | Operator                                                                                                                                                                 | You                                                                                        | Don’t do manually                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| [Cluster lifecycle](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator-boundaries.html#cluster-lifecycle)                                   | - Creates and heals StatefulSets, Services and PodDisruptionBudgets. - Initializes replica sets and manages their membership. - Rolls out changes with ordered restarts. | - Choose the topology and sizes. - Decide when to pause. - Plan maintenance windows.       | - Scale or edit the StatefulSets. - Reconfigure the replica set with `rs.reconfig()`. - Remove finalizers. |
| [Backups](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator-boundaries.html#back-up-the-database)                                          | - Creates scheduled backups and applies retention. - Runs one backup at a time. - Waits for a healthy cluster before it starts a backup.                                 | - Verify that backups restore. - Set retention. - Keep copies outside the cluster storage. | - Run `pbm` commands against the cluster. - Delete backup files from storage by hand.                      |
| [Restore and point-in-time recovery](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator-boundaries.html#restore-and-point-in-time-recovery) | - Prepares the cluster, starts the restore through PBM, and brings the cluster back. - Turns off oplog uploads during a restore.                                         | - Pick the restore target. - Take a new full backup after the restore.                     | - Edit the cluster CR during a restore. - Start a restore with the PBM CLI.                                |
| [TLS](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator-boundaries.html#manage-certificates)                                               | - Issues certificates. - Lets cert-manager renew them when cert-manager is installed. - Restarts Pods to apply changed certificates.                                     | - Renew certificates you supplied. - Choose the certificate management policy.             | - Edit the TLS Secrets in place without the documented procedure.                                          |
| [Users and Secrets](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator-boundaries.html#users-and-secrets)                                   | - Creates the system users. - Applies the passwords you change in the users Secret. - Creates application users declared in the CR.                                      | - Set passwords in the users Secret. - Delete application users you no longer need.        | - Change a system user password with `db.changeUserPassword()`. - Edit the `internal-` Secret.             |
| [Storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator-boundaries.html#storage)                                                       | - Grows PVCs when the CR asks, and automatically when autoscaling is on. - Starting with version 1.24.0, shrinks PVCs by replacing them when shrinking is enabled.       | - Pick a StorageClass that supports expansion. - Watch capacity.                           | - Resize or delete PVCs by hand.                                                                           |
| [Multi-cluster deployments](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator-boundaries.html#multi-cluster-deployments)                   | - Adds external members you list in the CR to the replica set configuration.                                                                                             | - Run the Replica sites as unmanaged clusters. - Fail over between sites.                  | - Mix manual `rs.add()` calls with `externalNodes`.                                                        |
| [Upgrades](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator-boundaries.html#database-upgrades)                                            | - Upgrades the database member by member with Smart Update. - Sets the feature compatibility version when you ask it to.                                                 | - Decide when to upgrade. - Upgrade the Operator and CRDs first.                           | - Edit image tags to skip a major version.                                                                 |

## The Operator

The Operator keeps the cluster matching the Custom Resource with its [reconcile loop](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture.html#what-the-operator-is). Beyond creating and updating Kubernetes objects, it runs these day-2 tasks:

- Replica set initialization and membership: it adds and removes members, sets their votes, and adds shards to a sharded cluster. See [Replica set membership](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-workflows.html#replica-set-membership).
- Ordered restarts with [Smart Update](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-reconciliation.html#update-strategies).
- System user passwords, application users and roles, certificates, storage resizing, backup schedules and retention, restores, and the PBM configuration.
- Sharding operations: it adds and removes shards, keeps the balancer on or off as `sharding.balancer.enabled` says, and stops the balancer during a config server restart.

**The Operator does not:**

- Run elections or replication. MongoDB chooses the primary and replicates the data. The Operator only writes the replica set configuration and asks the primary to step down before it restarts it.
- Handle Kubernetes node failures. It doesn’t force-delete Pods stuck on a failed node or react to node taints. Kubernetes recreates a Pod from an unreachable node elsewhere only after the Node object is removed or the stuck Pod is force-deleted.
- Validate MongoDB options. The `configuration` sections of the CR go into ConfigMaps as they are. The one exception is the TLS mode: the Operator rejects it in `configuration` and expects it in `tls.mode`.
- Install or upgrade CRDs and RBAC.
- Drop database users that you remove from `spec.users`.
- Make or move backup data itself. The PBM agents do this.
- Fail over between sites in a multi-cluster deployment.
- Report problems as Kubernetes events. The cluster controller emits no events. Problems show in the Operator logs and in the Custom Resource status. The backup, restore and ClusterSync controllers emit events only when a ClusterSync blocks them or fails over.

For each area in detail, see [Operator responsibilities by area](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator-boundaries.html). For the objects the Operator creates, see [Objects the Operator creates](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/objects-created.html) and [Services and ports](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/services.html).

## Percona Server for MongoDB

**MongoDB does:**

- Elect a primary among the voting members, and elect a new one when the primary is lost. A candidate needs a majority of the votes.
- Replicate writes from the primary’s oplog to the secondaries.
- Bring a member up to date: from the oplog of another member if it is still there, or with a full [initial sync](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html#initial-sync) otherwise, for example when the member starts with an empty volume.
- Acknowledge writes according to the write concern. The `defaultRWConcern` section of the CR sets the cluster-wide default.
- In a sharded cluster, route queries through `mongos` and balance chunks between shards.

**What the Operator sets up for MongoDB:**

- The replica set configuration: members, host names, [split horizons](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/expose.html#exposing-replica-set-with-split-horizon-dns), and member votes and priorities. At most 7 members vote. If the number of voting members would be even, the Operator takes the vote away from one member, starting with hidden members. The exception is a two-member replica set with an arbiter, which you allow with `unsafeFlags.replsetSize`. Starting with version 1.24.0, it changes the vote of only one member per reconfiguration, and never takes the vote from the primary.
- The `mongod` and `mongos` configuration from the CR, merged with the options the Operator needs, such as TLS and the keyfile or certificate for internal authentication.
- The system users that the Operator, the probes and the PBM agents use. See [System users](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/system-users.html).
- The shards of a sharded cluster, and the default read and write concern when you set `defaultRWConcern`.

**Health as the Pod probes see it:**

- A `mongod` Pod is *ready* when its member is `PRIMARY`, `SECONDARY` or `ARBITER`. A member in `STARTUP2`, `RECOVERING` or `ROLLBACK` is not ready.
- The liveness probe tolerates a member that is recovering, rolling back or running an initial sync. It fails when the member is `DOWN`, `REMOVED` or unknown, or when the probe can’t connect to `mongod`.
- See [Health checks and probes](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-probes.html) for what the probes check and who acts on their result.

**What this means in practice:**

- A Pod that is `Running` but not `Ready` usually means the member is still catching up: it runs an initial sync, or it is `RECOVERING` because it fell too far behind.
- A member that fell behind the oldest entry in the other members’ oplogs stays `RECOVERING` until it gets a full copy of the data. See [Exec into the containers](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug-shell.html) to inspect it.
- A bad option in `configuration` shows up as `mongod` failing to start, in the `mongod` container logs.

## Kubernetes

**Kubernetes does:**

- **Schedule Pods.** The Operator only writes the affinity rules, node selectors, tolerations, priority class and topology spread constraints you specify. The default anti-affinity is *required* on `kubernetes.io/hostname`: three members of a replica set need three schedulable nodes. Otherwise a Pod stays `Pending`, and after about a minute the Custom Resource status shows the scheduler’s message.
- **Provide storage.** The CSI driver and StorageClass provision volumes, bind them to zones, and expand file systems. A ReadWriteOnce volume ties the Pod to the node or zone where the volume can attach.
- **Run the network and DNS.** Drivers find the replica set members through the DNS records of the [headless Services](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html#headless-service), and members reach each other by these names. If DNS is broken, members can’t reach each other, elections fail, and clients can’t resolve the members.
- **Provision load balancers.** For `LoadBalancer` Services, the cloud provider creates the load balancer. Firewalls and source ranges are yours and the provider’s to manage.
- **Manage the Pod lifecycle.** Run probes, restart failed containers, and enforce [PodDisruptionBudgets](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html#pdb) during node drains.
- **Collect garbage.** Delete objects owned by the Custom Resource when you delete it.

**Kubernetes does not:**

- Know anything about MongoDB beyond the [probes](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-probes.html). A native StatefulSet rolling update waits for each Pod to become ready, but it doesn’t restart the primary last, doesn’t ask it to step down, and doesn’t pause for a running backup.
- Expand a volume whose StorageClass doesn’t allow it, or beyond your storage quota.

## You, the user

The Operator keeps the cluster matching the Custom Resource. Everything it cannot create or decide for you stays with you:

- Install and upgrade the CRDs and RBAC, which the Operator never applies. See [Upgrade the Operator and CRD](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-operator.html).
- Provide capacity: enough schedulable nodes for the anti-affinity rules, and a StorageClass that allows volume expansion. See [Cluster lifecycle](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator-boundaries.html#cluster-lifecycle) and [Storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator-boundaries.html#storage).
- Provide credentials: the passwords in the users Secret, the backup storage credentials, and the PMM token. See [Users and Secrets](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator-boundaries.html#users-and-secrets).
- Renew certificates you supplied yourself. See [Manage certificates](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator-boundaries.html#manage-certificates).
- Verify that backups restore, set retention, and keep copies outside the cluster storage. See [Back up the database](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator-boundaries.html#back-up-the-database).
- Run and fail over multi-cluster deployments. See [Multi-cluster deployments](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator-boundaries.html#multi-cluster-deployments).
- Decide when to pause, upgrade, and restore. See [Database upgrades](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator-boundaries.html#database-upgrades) and [Restore and point-in-time recovery](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator-boundaries.html#restore-and-point-in-time-recovery).

## Unsafe configurations

The Operator refuses configurations that put availability or data at risk, such as a replica set with fewer than three members, an even number of members without an arbiter, or a cluster without TLS. See [Stay inside safe operating limits](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator-boundaries.html#stay-inside-safe-operating-limits). To use one anyway, you opt in with a flag in the `spec.unsafeFlags` subsection. See [Override a safety check](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator-boundaries.html#override-a-safety-check).

## Next steps

[Operator responsibilities by area](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator-boundaries.html)

## See also

- [Objects the Operator creates](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/objects-created.html)
- [Services and ports](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/services.html)
- [Initial troubleshooting](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug.html)
