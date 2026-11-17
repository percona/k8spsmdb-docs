# Operator responsibilities by area

For each area, this page lists what the Operator does, what you still do, and which manual actions can damage a running cluster. For the layers, the events that trigger each one, and a table of all areas, see [Who owns what](architecture-responsibilities.md).

The Custom Resource is the source of truth: change the cluster only by editing it. See [Change the cluster through the Custom Resource](architecture-responsibilities.md#change-the-cluster-through-the-custom-resource).

## Cluster lifecycle

Change the topology, sizes, pause state and deletion through the CR. Direct edits to the StatefulSets or to the replica set configuration fight the next reconcile.

**What the Operator does:**

* Creates and reconciles a StatefulSet for each replica set, for the config server replica set, for `mongos`, and for arbiter, non-voting and hidden members. It also creates their Services and a PodDisruptionBudget for each StatefulSet.
* Initializes each replica set, adds new Pods to the replica set configuration, removes members whose Pods are gone, and sets member votes. See [Replica set membership](architecture-workflows.md#replica-set-membership).
* In a sharded cluster, adds each replica set as a shard, removes a shard you delete from the CR if it holds no user databases, and keeps the balancer as `sharding.balancer.enabled` says. See [Shards and the balancer](architecture-workflows.md#shards-and-the-balancer).
* Scales a replica set down by one Pod per pass, and removes the members whose Pods are gone from the replica set configuration.
* Leaves restarting failed Pods and containers to Kubernetes, and elections and initial sync to MongoDB.
* Shuts the cluster down in order when you set `spec.pause: true`, and brings it back when you set it to `false`. Data is retained. See [What happens during a pause](pause.md#what-happens-during-a-pause).
* Deletes Pods in a safe order on cluster deletion, using finalizers. See [Delete the database cluster](delete.md#delete-the-database-cluster).

**What you still do:**

* Choose the topology and the sizes. Stay inside the limits in [Stay inside safe operating limits](#stay-inside-safe-operating-limits).
* Decide when to pause a cluster, and for how long.
* Plan capacity, node size and maintenance windows for any change that restarts Pods. Provide enough schedulable nodes for the Pod anti-affinity rules: by default, three members of a replica set need three nodes. See [Control Pod scheduling](constraints.md).
* Check and tune MongoDB options before you put them in a `configuration` section. The Operator doesn't validate them.
* Before you remove a shard, move or drop the databases on it. The Operator refuses to remove a shard that holds user databases.
* Decide whether to set the `percona.com/delete-psmdb-pvc` finalizer. Without it, PVCs and Secrets remain after you delete the cluster, and you delete them yourself. See [Clean up resources](delete.md#clean-up-resources).

**Never do this manually:**

| Do not | What goes wrong | Do this instead |
| --- | --- | --- |
| Run `kubectl scale` or `kubectl edit` on a StatefulSet | The next reconcile reverts the change. If it takes effect first, several members can go away at once, and the replica set can lose the majority it needs to elect a primary | Change `size` in the CR. The Operator removes one Pod per pass |
| Run `rs.add()`, `rs.remove()` or `rs.reconfig()` | The Operator rewrites the members, host names, votes and priorities on its next pass. A configuration that fights the Operator can trigger extra elections | Change the CR. For priorities, use `replsetOverrides` or `primaryPreferTagSelector`. For external members, use `externalNodes` |
| Run `removeShard`, `sh.stopBalancer()` or `sh.startBalancer()` through `mongos` | The Operator still has the shard in its replica set list, and sets the balancer back to the CR value on the next pass | Remove the replica set from `replsets`. Set `sharding.balancer.enabled` |
| Remove a finalizer to finish a stuck delete | Finalizers shut down the Pods in order and clean up PVCs, Secrets and oplog chunks. The `percona.com/delete-backup` finalizer on a backup removes the backup files from storage. Removing a finalizer abandons that cleanup and can orphan data or backup files | Find out why the finalizer is blocked. See [Objects the Operator creates](objects-created.md#finalizers) for every finalizer and what it does |
| Run `kubectl delete psmdb` to reset a misbehaving cluster | With the `percona.com/delete-psmdb-pvc` finalizer set, this deletes the PVCs, the data on them and the users Secret | Pause the cluster and investigate |

## Back up the database

Create backups through a schedule in the cluster CR or through a `PerconaServerMongoDBBackup` resource. See [Backup and restore](backups.md).

**What the Operator does:**

* Creates scheduled backups from `backup.tasks`, and passes on-demand backups from `PerconaServerMongoDBBackup` resources to PBM.
* Starting with version 1.24.0, creates one catch-up backup when it starts and finds that a scheduled run was missed while it was stopped. See [Scheduled backups](architecture-workflows.md#scheduled-backups).
* Applies retention policy to scheduled backups. With `retention` set, it deletes the oldest backups of the task beyond the configured count. Retention counts incremental base backups but ignores subsequent increments. When retention deletes a base backup from storage, PBM also deletes its dependent increments.
* **Runs one backup at a time.** It holds a lock for each running backup. Other backups wait in the `waiting` state.
* **Waits for a healthy cluster.** A backup doesn't start until the cluster is `ready`, unless you set `unsafeFlags.backupIfUnhealthy`. With `startingDeadlineSeconds` set, a backup that doesn't start in time fails.
* Writes the PBM configuration from the `backup` section of the CR, and keeps it in sync.
* Uploads the oplog for point-in-time recovery when `backup.pitr.enabled` is `true`. See [Enable point-in-time recovery](backups-pitr.md).

**What you still do:**

* **Verify that your backups restore.** The Operator confirms that PBM completed a backup. It doesn't confirm that the backup is usable. Test restores on a schedule. See [Restore from a backup](backups-restore.md).
* Set retention, and keep copies outside the cluster storage target.
* Manage credentials and lifecycle policies on the bucket, and provide the storage credentials in Secrets or through an IAM role.
* Take a new full backup after a restore, so that point-in-time recovery has a base to start from.
* Decide whether a backup during a degraded window is worth the risk.

**Never do this manually:**

| Do not | What goes wrong | Do this instead |
| --- | --- | --- |
| Run `pbm backup`, `pbm restore` or `pbm config` in a `backup-agent` container | The Operator doesn't know about the operation. A manual backup or restore can overlap with an Operator one. A manual configuration change is overwritten on the next pass | Create a `PerconaServerMongoDBBackup` or `PerconaServerMongoDBRestore` resource, and change the `backup` section of the CR |
| Set `unsafeFlags.backupIfUnhealthy` to get a backup from a broken cluster | A backup from a cluster that is not healthy may be inconsistent and may not restore | Repair the cluster, then back up. If you must take the backup, treat the result as best effort only |
| Delete objects from the backup storage by hand | The point-in-time recovery chain between a full backup and its oplog breaks. An incremental chain breaks, too | Delete the `PerconaServerMongoDBBackup` resource and let the finalizer clean up. See [Delete the unneeded backup](backups-delete.md) |

## Restore and point-in-time recovery

**What the Operator does:**

* Waits until no backup or other restore runs, and checks that PBM knows the backup. If PBM doesn't have the backup in its metadata, the Operator asks PBM to resync the storage.
* Prepares the cluster: it stops `mongos`, and for physical and snapshot restores, it also stops the arbiters and runs PBM inside the `mongod` containers. Then it starts the restore through PBM and brings the cluster back to its normal configuration. See [How backup and restore work](backups.md#how-backup-and-restore-work).
* Turns off oplog uploads for point-in-time recovery right before the restore, and keeps them off while the restore runs.
* Restores to a point in time, and restores selected namespaces from a logical backup.

**What you still do:**

* Choose the restore target, and accept the loss of the data written after it.
* Plan the maintenance window. A sharded cluster is unavailable for clients while `mongos` is stopped, and a physical restore restarts every member.
* Take a new full backup after the restore.

**Never do this manually:**

| Do not | What goes wrong | Do this instead |
| --- | --- | --- |
| Edit the cluster CR while a restore is running | A physical restore changes the StatefulSets and restarts the members several times. An edit in that window is applied to a cluster that doesn't match the restore's expected state | Wait until the restore is finished |
| Start a second restore because the first looks stuck | The Operator queues it in the `waiting` state. It doesn't speed up the first one | Check the first restore. See [Troubleshoot backups and restores](debug-backup-restore.md) |
| Delete the restore resource mid-flight | The Operator stops tracking the restore, and the cluster can stay in the restore configuration | Let the restore finish, then delete the resource |

## Manage certificates

How certificates are renewed depends on who created them. See [Transport Layer Security (TLS)](TLS.md).

**What the Operator does:**

* Issues certificates when the cluster is created, if the TLS Secrets don't exist: through cert-manager when it is installed, and self-signed otherwise. With backups enabled, it also issues the PBM client certificate starting with version 1.24.0.
* Lets cert-manager renew the certificates it manages.
* Watches the contents of the TLS Secrets and restarts the Pods with Smart Update when they change.
* With `tls.certManagementPolicy: userProvidedOnly`, doesn't create missing certificates and reports the `TLSSecretsReady` condition instead. See [Configure the TLS certificate management policy](tls-cert-management-policy.md).

**What you still do:**

* **Renew certificates you supplied yourself.** The Operator doesn't renew them. Self-signed certificates the Operator generated are long-term. Renew them yourself if you need.
* Choose the certificate management policy that fits your workflow.

**Never do this manually:**

| Do not | What goes wrong | Do this instead |
| --- | --- | --- |
| Replace the CA in a TLS Secret in one step | Members that have the old CA and members that have the new one stop trusting each other, and replication breaks | Follow [Update certificates](tls-update.md) |
| Delete a TLS Secret to get new certificates | With the default policy, the Operator creates a new CA. All Pods restart, and clients that trust the old CA can't connect | Follow [Update certificates](tls-update.md) |

## Users and Secrets

**What the Operator does:**

* Creates the users Secret with random passwords if it doesn't exist, and creates the system users in MongoDB. See [System users](system-users.md).
* **Applies password changes.** When you change a password in the users Secret, the Operator changes it in MongoDB and then copies the Secret to the internal Secret `internal-<cluster-name>-users`. It restarts only the containers that use the changed credentials: the `backup-agent` containers for the backup user, and the `pmm-client` containers for the PMM token.
* Creates and updates the application users and roles declared in `spec.users` and `spec.roles`, once the cluster is `ready`. See [Application-level users](app-users.md).
* Keeps the [connection Secrets](connection-secrets.md) up to date.

**What you still do:**

* Set and rotate passwords in the users Secret.
* Delete application users that you remove from `spec.users`. The Operator doesn't drop them. See [Delete users and roles](app-users.md#delete-users-and-roles).
* Keep application users separate from system users.

**Never do this manually:**

| Do not | What goes wrong | Do this instead |
| --- | --- | --- |
| Change a system user password with `db.changeUserPassword()` | The Secret and the database disagree. The probes and the Operator use the `clusterMonitor` and `clusterAdmin` users: if they can't log in, the liveness probe fails on every member and the Operator can't manage the replica set | Change the password in the users Secret |
| Edit or delete the `internal-<cluster-name>-users` Secret | The Operator compares the users Secret with this one to detect changes. An edit can hide a change or trigger an unneeded one | Leave it to the Operator |
| Drop or lock a system user | The probes, the backups or the Operator stop working, depending on the user | Keep the system users. Create separate users for applications |

## Storage

**What the Operator does:**

* Grows the PVCs when you raise the storage size in the CR, if `storageScaling.enableVolumeScaling` is `true`. With `storageScaling.autoscaling`, it grows them automatically when they fill up. See [Resize storage](scaling-storage-resize.md).
* Starting with version 1.24.0, shrinks the PVCs when you lower the storage size and `storageScaling.enableVolumeShrink` is `true`. It replaces each PVC with a smaller one, one member at a time, and the member gets its data back through an initial sync.
* Keeps the cluster in `initializing` while a resize runs, and delays Smart Update until it finishes.

**What you still do:**

* Pick a StorageClass that supports volume expansion.
* Watch capacity, and set limits for autoscaling.

**Never do this manually:**

| Do not | What goes wrong | Do this instead |
| --- | --- | --- |
| Resize a PVC with `kubectl edit pvc` | The StatefulSet and the CR still ask for the old size. The Operator and the next StatefulSet update don't know about the change | Change the size in the CR |
| Delete a PVC to free space | The member loses its data and needs a full initial sync. If more members lose data at once, the replica set can lose the majority | Use storage shrinking, or contact [Percona Support](get-help.md) |

## Multi-cluster deployments

In a [multi-cluster deployment](replication.md), one replica set spans several Kubernetes clusters. The Main site runs a managed cluster. The Replica sites run clusters with `unmanaged: true`.

**What the Operator does:**

* On the Main site, adds the members you list in `externalNodes` to the replica set configuration with the votes and priorities you define.
* On a Replica site, creates the Pods and Services, but doesn't initialize the replica set or change its configuration. It also doesn't create the users Secret: it expects the one you copied from the Main site.
* With [Multi-Cluster Services](replication-mcs.md) enabled, creates the ServiceExport objects and waits until the Services are imported.

**What you still do:**

* Copy the Secrets and certificates from the Main site to the Replica sites, and make the members reachable across sites.
* Fail over between sites. If the Main site is lost, you turn a Replica site into the new Main site. See [Fail over services to the Replica site](replication-failover.md).
* Monitor replication across sites.

**Never do this manually:**

| Do not | What goes wrong | Do this instead |
| --- | --- | --- |
| Add the Replica site members with `rs.add()` | The Operator on the Main site removes members that are neither its own Pods nor listed in `externalNodes` | List them in `externalNodes` |
| Run two clusters as managed for the same replica set | Both Operators rewrite the replica set configuration | Keep exactly one managed site |

## Database upgrades

**What the Operator does:**

* Upgrades the database member by member with Smart Update (default strategy): secondaries first, the primary last after a step-down. In a sharded cluster, it upgrades the config server replica set first, then the shards, then `mongos`. See [How Smart Update works](architecture-reconciliation.md#how-smart-update-works).
* With `upgradeOptions.apply`, checks the Version Service on the `upgradeOptions.schedule` and applies new images. The check runs only when the cluster is `ready`. See [Automatic minor upgrade](update-minor-automatic.md).
* With `upgradeOptions.setFCV: true`, sets the feature compatibility version to the new major version after every Pod runs the new image.

**What you still do:**

* Decide when to upgrade, and test the upgrade on a staging cluster first.
* Upgrade the Operator and the CRDs before you raise `spec.crVersion`. See [Upgrade the Operator and CRD](update-operator.md).
* Upgrade one major version at a time. See [Major version upgrades](update-major.md).

**Never do this manually:**

| Do not | What goes wrong | Do this instead |
| --- | --- | --- |
| Edit image tags to skip a major version | MongoDB supports upgrades only from the previous major version. Members can fail to start on the data files | Upgrade one major version at a time |
| Set the feature compatibility version before every member runs the new version | Older members can't apply the changes, and you lose the option to downgrade | Let the Operator set it with `upgradeOptions.setFCV`, or set it after the upgrade finishes |
| Use `updateStrategy: RollingUpdate` and expect a MongoDB-aware rollout | Kubernetes restarts the Pods in reverse order without a step-down, and doesn't wait for running backups | Keep `SmartUpdate` |

## Stay inside safe operating limits

The Operator rejects a CR that breaks these limits. The cluster goes to the `error` state, and the status message names the check.

| Setting | Safe limit | Why |
| --- | --- | --- |
| `replsets[].size` without an arbiter | At least 3, and an odd number | A replica set needs a majority of voting members to elect a primary. Three members tolerate the loss of one |
| `replsets[].size` with an arbiter | An even number, at least 4, with `arbiter.size: 1` | The arbiter makes the number of voting members odd |
| `tls.mode` | Anything but `disabled` | Replication and client traffic are otherwise unencrypted |
| `terminationGracePeriodSeconds` | At least 30 | `mongod` needs time to shut down cleanly |

You can turn each check off individually under `spec.unsafeFlags`. See [Override a safety check](#override-a-safety-check). Do not turn a check off to clear an error message.

## Override a safety check

`spec.unsafeFlags` turns off individual safety checks. Each check exists because turning it off can lose data or availability. Field details are in the [Unsafe flags section](operator.md#operator-unsafeflags-section).

| Flag | Enables | What you give up |
| --- | --- | --- |
| `unsafeFlags.replsetSize` | Replica sets with one or two members, an even number of members without an arbiter, or other arbiter layouts | Election guarantees. A replica set with one or two members is not highly available |
| `unsafeFlags.tls` | Running without TLS | Encryption of replication and client traffic |
| `unsafeFlags.terminationGracePeriod` | A termination grace period shorter than 30 seconds | A clean shutdown. `mongod` can be killed while it writes |
| `unsafeFlags.backupIfUnhealthy` | Backups from a cluster that is not `ready` | Confidence that the backup is consistent and restorable |

The older `allowUnsafeConfigurations` option turns on all the flags at once.

Use these flags for a development cluster, a local test, or a deliberate single-member setup for continuous integration. On a production cluster, an Operator rejection describes a real risk in the configuration you asked for.

## Check before you intervene

When a manual change looks necessary, do the following:

1. Check whether the CR already exposes what you want. Most requests for manual changes are covered by a field.
2. Reproduce the change on a non-production cluster first.
3. Capture the Operator logs and the resource status before you change anything. See [Check the logs](debug-logs.md).
4. Contact [Percona Support](get-help.md) when in doubt before you act on a production cluster.

Manual intervention on a running database cluster is recoverable far less often than it looks from the outside.

## Next steps

[How the Operator reacts to changes](architecture-reconciliation.md){.md-button}

## See also

* [Who owns what](architecture-responsibilities.md)
* [Initial troubleshooting](debug.md#where-to-look-first)
