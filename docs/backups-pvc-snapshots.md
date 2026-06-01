# PVC snapshots

Starting with version 1.23.0, you can make **PVC snapshot backups and restores** using the Operator. 

This document provides an overview of PVC snapshots. If you are familiar with the concept and want to try it out, jump to the Configure and use PVC snapshots tutorial. If you run on Amazon EKS, start with Set up PVC snapshots on EKS.

A PVC snapshot is a point-in-time copy of a Persistent Volume Claim (PVC) created by your storage provider through the Kubernetes [Volume Snapshot API :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volume-snapshots/). The storage layer captures volume contents at a specific moment without streaming data block by block to remote object storage.

Compared with logical or physical backups that upload data to S3, Azure, or [another supported remote storage](backups-storage.md#storage-setup-guides), PVC snapshots are typically much faster for large datasets because data stays on the storage backend.

However, PBM still requires access to the remote backup storage to store **backup metadata**, including encryption-related information, and oplogs. Therefore, your cluster configuration must include at least one entry in `backup.storages` so PBM agents can run and persist metadata. Snapshot backups do not upload database files to that storage.

## How PVC snapshots differ from other backup types

| Aspect | Logical / physical / incremental | PVC snapshot (`external`) |
| --- | --- | --- |
| Data location | Remote backup storage (S3, Azure, etc.) | CSI `VolumeSnapshot` objects in the cluster |
| `storageName` on Backup / scheduled task | Required | Not required |
| `volumeSnapshotClass` | Not used | Required  |
| Point-in-time recovery | Supported | Not supported |
| Selective restore | Supported for logical backups | Not supported |

## Why to use PVC snapshots

PVC snapshots speed up backups and restores, which is especially beneficial for large data sets. With this feature, you get:

* Much faster backups – Snapshot creation is typically seconds to minutes, regardless of database size. Time it takes to run traditional full backups increases as the size of your database grows.
* Fully compatible with data-at-rest encryption and TLS, allowing you to use PVC snapshots when encryption and secure connections are enabled.
* Much faster restores – Restoring from a snapshot is significantly faster than restoring from cloud storage. Both in-place restores and restores to a new cluster are supported.
* Lower resource usage – Snapshots avoid the CPU and network overhead of streaming data to a remote storage.


## Workflows

PBM supports snapshot-based backups and restores as `external` type. The Operator integrates this feature and uses the same type. 

### Backup flow

When a backup object with the type `external` is created either by you on demand or by the Operator according to the schedule, the Operator and PBM work together as follows:

1. The Operator uses PBM to **prepare the database**. PBM opens a [`$backupCursor` :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/usage/backup-external.html#procedure), prepares files for copying, stores backup metadata on the remote storage, and waits until nodes reach the **`copyReady`** status.
2. For each replica set member that is `copyReady`, the Operator creates a `VolumeSnapshot` of the `mongod-data` PVC.
3. After all snapshots are `readyToUse`, the Operator uses PBM to finalize the backup. PBM closes the `$backupCursor` and marks the backup complete.

The Backup resource `status.snapshots` field lists each replica set and the corresponding `VolumeSnapshot` name.

### Restore flow

Restore from a PVC snapshot backup also uses PBM’s [external restore :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/usage/restore-external-agent-restart.html) workflow. The Operator automates steps that you would otherwise run manually or using a custom script with the PBM CLI.

When you create a restore object with the type `external`, the Operator and PBM perform the following steps:

1. The Operator instructs PBM to **prepare the database**. PBM shuts down `mongos` nodes in sharded clusters, stops `mongod` nodes, wipes the data directory, leaves nodes in the `copyReady` stage waiting for data files, and exits.
2. The Operator scales database StatefulSets to zero and restarts the `pbm-agent` on every node with the information it requires:
    
    * PBM configuration file for the access to the remote storage, 
    * replica set name, 
    * node name, 
    * (when needed) MongoDB `db` config for encryption at rest. 
  
3. The Operator recreates each data PVC from the `VolumeSnapshot` either recorded in the backup or provided in the `backupSource` configuration, one PVC at a time.
4. After PVCs are restored and agents are waiting, the Operator instructs PBM to finish the restore. PBM applies metadata and brings the cluster back to a consistent state.

Track progress in the Restore resource `status.conditions` field. See [PVC snapshot restore conditions](cr-statuses.md#pvc-snapshot-restore-conditions) for the list of condition types and meanings.

## Requirements

1. Your Kubernetes cluster must have the CSI driver that supports `VolumeSnapshot` API. An example of such driver for GKE is `pd.csi.storage.gke.io`, for EKS - `ebs.csi.aws.com`.
2. Your Kubernetes cluster must have the `VolumeSnapshot` CRDs installed. Verify if they are installed with this command:
    
    ```bash
    kubectl get crd volumesnapshots.snapshot.storage.k8s.io
    ```
    
    ??? example "Expected output"

        ```text
        volumesnapshotclasses.snapshot.storage.k8s.iovolumesnapshotcontents.snapshot.storage.k8s.io volumesnapshots.snapshot.storage.k8s.io
        ```

3. At least one `VolumeSnapshotClass` must exist and be compatible with the storage class used by your Percona Server for MongoDB data volumes. Check it with:
    
    ```bash
    kubectl get volumesnapshotclasses
    ```

See how to add it in the [Add a VolumeSnapshotClass]() section.


## Limitations

* Point-in-time recovery and selective restore are not available for `external` backups.

## Next steps

[Add a VolumeSnapshotClass](backups-pvc-setup.md){.md-button}
