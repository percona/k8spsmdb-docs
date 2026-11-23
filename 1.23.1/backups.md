> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Backup and restore

The Operator uses [Percona Backup for MongoDB (PBM)](https://github.com/percona/percona-backup-mongodb) to back up and restore Percona Server for MongoDB. PBM runs as a [sidecar](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/sidecar.html) in your database Pods.

Use this page to choose a backup type, storage, restore method, and whether you need point-in-time recovery. When you know what you need, go to [Configure backups](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-configure.html).

## How backup and restore work

The Operator does not copy data itself. It writes a document into the Percona Backup for MongoDB control collections, and a `pbm-agent` beside one of the secondary nodes does the work. You do not need this to configure backups, but it explains what you see in the logs and why a restore behaves the way it does.

Show the backup and restore flows

The Operator configures PBM when it creates a cluster that already has [backup storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage.html), when you add storage later, or when you [restore on a new cluster](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore.html#restore-on-a-new-cluster) and pass storage in `backupSource`.

`pbm-agent` processes in every database Pod watch PBM [control collections](https://docs.percona.com/percona-backup-mongodb/details/control-collections.html) . When a new document appears, one agent is elected among secondaries and starts the backup or restore. See the [PBM agent documentation](https://docs.percona.com/percona-backup-mongodb/details/pbm-agent.html) for the election process.

**Backup flow**

When you create a Backup object, the Operator adds a document to the control collections. An agent on a secondary reads the backup type and copies data:

- **Logical** — reads database data and uploads it to storage.
- **Physical** — copies files from `dbPath` and uploads them.
- **Physical incremental** — the first backup of a chain has the `incremental-base` type and copies all data files; each later `incremental` backup copies only the blocks changed since the previous one. PBM tracks the chain only on the node that took the base backup, so every increment must run on that same node. If that node goes away, the chain cannot continue and a new base is required.
- **External (PVC snapshot)** — prepares the database for a consistent copy; the Operator creates CSI `VolumeSnapshot` objects for each data PVC.

For PVC snapshots, PBM opens a [`$backupCursor`](https://docs.percona.com/percona-backup-mongodb/usage/backup-external.html#procedure) , stores metadata on remote storage, and waits until nodes are `copyReady`. The Operator then snapshots each `mongod-data` PVC. After snapshots are `readyToUse`, PBM closes the cursor and marks the backup complete. The Backup resource `status.snapshots` field lists each replica set and snapshot name.

**Restore flow**

**From logical backup**

1. The Operator writes a restore document to the control collections.
1. It shuts down `mongos` Pods (sharded clusters) so clients cannot use the database during the restore.
1. A `pbm-agent` restores data into the corresponding collections.
1. For a selective restore, PBM restores only the specified namespaces.
1. For point-in-time recovery, PBM replays oplog up to `restore_to_time`.

**From physical backup**

A `pbm-agent` needs access to `mongod` binaries, so the Operator prepares the cluster first:

1. It terminates `mongos` Pods (sharded clusters) and arbiter nodes, moves PBM binaries into the `mongod` container, removes the PBM sidecar (rolling restart), and starts the restore with the PBM CLI.
1. The agent inside the `mongod` container wipes `dbPath`, downloads backup files, copies them into the data directory, and applies oplog from the snapshot for consistency.
1. PBM restarts `mongod` as it moves through restore phases.
1. After a successful restore, the Operator recreates the StatefulSet so PBM runs as a sidecar again, then restarts database, arbiter, and `mongos` Pods.

**From PVC snapshot (`external`) backup**

Snapshot restores use PBM’s [external restore](https://docs.percona.com/percona-backup-mongodb/usage/restore-external-agent-restart.html) workflow. At **`copyReady`**, `mongod` is stopped and data directories are empty, so the Operator recreates PVCs from volume snapshots and runs `pbm-agent restore-finish` before PBM can complete the restore.

1. The Operator terminates `mongos` and arbiter nodes, prepares StatefulSets as for a physical restore, and starts `pbm restore --external`.

1. PBM shuts down `mongod`, wipes `dbPath`, and leaves nodes in **`copyReady`**.

1. The Operator scales StatefulSets to zero and runs `pbm-agent restore-finish` on every node with PBM config, replica set name, node name, and (when needed) MongoDB `db` config for encryption at rest.

1. It recreates each data PVC from the `VolumeSnapshot` for that replica set. Snapshot names come from the backup, or from `backupSource.snapshots`.

   Starting with version 1.24.0, the Operator restores replica sets in parallel. On a sharded cluster, every shard and the config server replica set move forward together. Inside one replica set, PVCs are recreated one at a time, because those members share one snapshot. Data-bearing members are recreated first, then non-voting and hidden members if you use them. A single replica set recreates one PVC at a time.

1. It scales StatefulSets back up and runs `pbm restore-finish` so PBM applies metadata and brings the cluster to a consistent state.

1. After success, it cleans up temporary restore configuration and returns the cluster to normal operation.

For steps, see [Restore from a PVC snapshot](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pvc-usage.html#make-an-in-place-restore-from-a-pvc-snapshot-backup).

**Point-in-time recovery from a physical backup**

1. The Operator follows the same preparation as for a physical restore.
1. It makes sure Pod 0 is primary.
1. PBM restores the backup, then applies oplog to the target time.
1. After success, the Operator recreates the StatefulSet with its regular configuration.

For steps, see [Restore to a point in time](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pitr-restore.html).

## Choose a path

| Goal                                   | Use                                                      | Next step                                                                                                                                                                                                                   |
| -------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nightly or scheduled protection        | Scheduled logical or physical backup                     | [Configure storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage.html), then [scheduled backup](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-scheduled.html)        |
| A one-off copy before a change         | On-demand backup                                         | [Configure storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage.html), then make an [on-demand backup](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-ondemand.html) |
| Large dataset, fast backup and restore | PVC snapshot (`external`)                                | [Configure PVC snapshots](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pvc-setup.html)                                                                                                              |
| Undo a bad write to a specific time    | Point-in-time recovery (PITR) (logical or physical only) | [Enable PITR](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pitr.html), then [restore to a point in time](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pitr-restore.html)    |
| Clone data to another environment      | Restore to a new cluster                                 | [Restore on a new cluster](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore.html#restore-on-a-new-cluster)                                                                                      |
| Restore one database or collection     | Selective restore from a logical backup                  | [Restore on the same cluster](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore.html#selective-restore)                                                                                          |

## Backup types

You can run backups on a schedule or on demand. Starting with version 1.23.0, you can also use Kubernetes volume snapshots.

| Backup type                                                                                                          | Version added                                                                                                             | Status                                                                                                                         | Description                                                                       | Use this when                                                                                                                                    | Important considerations                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Full logical](https://docs.percona.com/percona-backup-mongodb/features/logical.html)                                | Initial                                                                                                                   | GA                                                                                                                             | Queries the database and writes the data to remote storage                        | You want portability or [selective restore](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore.html#selective-restore) | Uses less storage but is slower than physical backups. Supports point-in-time recovery. Incompatible with backups made with Operator versions before 1.9.0 — take a new backup after upgrading. |
| [Full physical](https://docs.percona.com/percona-backup-mongodb/features/physical.html)                              | [1.14.0](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/RN/Kubernetes-Operator-for-PSMONGODB-RN1.14.0.html) | GA ([1.16.0](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/RN/Kubernetes-Operator-for-PSMONGODB-RN1.16.0.html)) | Copies files from MongoDB `dbPath` to remote storage                              | You have a large dataset and need faster restore                                                                                                 | Supports point-in-time recovery since [1.15.0](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/RN/Kubernetes-Operator-for-PSMONGODB-RN1.15.0.html).                                |
| [Physical incremental](https://docs.percona.com/percona-backup-mongodb/features/incremental-backup.html)             | [1.20.0](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/RN/Kubernetes-Operator-for-PSMONGODB-RN1.20.0.html) | Tech preview                                                                                                                   | Copies only data changed after the previous backup                                | You want smaller, faster follow-up backups                                                                                                       | Needs a base incremental backup. Base and increments must be taken from the same node. Take a new base backup if a node is down or after a restore.                                             |
| [PVC snapshot](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pvc-snapshots.html) (`external`) | [1.23.0](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/RN/Kubernetes-Operator-for-PSMONGODB-RN1.23.0.html) | Tech preview                                                                                                                   | PBM prepares the database; the Operator creates CSI volume snapshots of data PVCs | You need the fastest backup and restore for large volumes                                                                                        | No data upload to object storage. No point-in-time recovery or selective restore. Needs the Volume Snapshot API and a `VolumeSnapshotClass`.                                                    |

[Configure backups](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-configure.html)

## Backup storage

Store backups outside the Kubernetes cluster on one of these remote storages:

- [Amazon S3](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage-s3.html)
- [Google Cloud Storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage-gcp.html)
- [MinIO and S3-compatible storages](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage-minio.html)
- [Microsoft Azure Blob storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage-azure.html)
- [Alibaba Cloud OSS](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage-oss.html)
- [Oracle Cloud Infrastructure Object Storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage-oci.html)
- [Remote file server](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage-filesystem.html)

PVC snapshots keep the data on the storage backend. You still need at least one entry in `backup.storages` so PBM can save **backup metadata** (including encryption-related information). Snapshot backups do not upload database files to that storage.

Starting with version 1.20.0, you can define [multiple backup storages](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/multi-storage.html). You can take a backup or restore from any configured storage without waiting for the Operator to reconfigure the cluster. Point-in-time recovery from any storage is supported because PBM keeps oplog on the main storage.

[Configure storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage.html)

## Restore options

You can restore:

- On the [same cluster](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore.html#restore-on-the-same-cluster)
- On a [new cluster](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore.html#restore-on-a-new-cluster)
- On a [new cluster with different replica set names](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore.html#with-different-replica-set-names)
- A [collection under a different name](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore-new-name.html) (logical backups, replica set only)
- Selected namespaces from a full logical backup ([selective restore](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore.html#selective-restore))

Use `backupName` when the Backup object still exists in the cluster. Use `backupSource` when it does not — for example, when you restore to a new cluster.

[Restore from a backup](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore.html)

## Point-in-time recovery

Point-in-time recovery rolls the cluster back to a specific date and time. The Operator restores a full backup, then replays the operations log (oplog) up to that moment.

You can use PITR with logical and physical backups from Operator [1.15.0](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/RN/Kubernetes-Operator-for-PSMONGODB-RN1.15.0.html) onward. PVC snapshot (`external`) backups do **not** support PITR.

You need:

- PITR enabled so the Operator saves oplog (`backup.pitr.enabled`)
- A full backup. Without one, PBM does not upload oplog. Take a full backup for a new cluster and after every restore.

PBM writes oplog to remote storage. With [multiple storages](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/multi-storage.html), oplog goes only to the **main** storage so you can still recover to a point in time from a backup on any storage. For Operator version 1.19.1 and earlier, PITR requires a single storage.

[Enable point-in-time recovery](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pitr.html)

## Limits you should know

See [Known limitations](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/limitations.html#backups-and-restores) for the full list. The ones that change the backup design are:

- No PITR and no selective restore for PVC snapshots.
- Deleting an incremental **base** backup also deletes its increments from storage.
- Restore a collection under a different name works only on replica sets for unsharded collections, and requires a full logical backup.
- After a failed restore, the Operator cannot guarantee data consistency.

## Backup lifecycle

Each backup object has the `delete-backup` finalizer, so deleting the object also removes the backup files from storage. Control how many backups to keep with [backup.tasks.retention](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#backuptasksretentioncount). See [Configure retention policy](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-delete.html#configure-backup-retention).

## Next steps

[Configure backups](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-configure.html)
