# PVC snapshots

Starting with version 1.23.0, you can back up and restore using Kubernetes volume snapshots. A snapshot is a point-in-time copy of a Persistent Volume Claim created through the [Volume Snapshot API :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volume-snapshots/). Data stays on the storage backend instead of uploading to object storage.

For how snapshots compare to logical and physical backups, and what they do not support, see [Backup types](backups.md#backup-types). This page lists what you need before you configure them.

If you already know you want snapshots, go to [Configure PVC snapshots](backups-pvc-setup.md). On Amazon EKS, start with [Set up PVC snapshots on EKS](backups-pvc-setup.md#add-a-volumesnapshotclass-on-eks).

## Requirements

1. Your Kubernetes cluster must have a CSI driver that supports the `VolumeSnapshot` API. Examples: `pd.csi.storage.gke.io` on GKE, `ebs.csi.aws.com` on EKS.

2. The `VolumeSnapshot` CRDs must be installed. Check with:

    ```bash
    kubectl get crd | grep volumesnapshot
    ```

    ??? example "Expected output"

        ```text
        volumesnapshotclasses.snapshot.storage.k8s.iovolumesnapshotcontents.snapshot.storage.k8s.io volumesnapshots.snapshot.storage.k8s.io
        ```

3. At least one `VolumeSnapshotClass` must exist and match the storage class used by your data volumes:

    ```bash
    kubectl get volumesnapshotclasses
    ```

    Refer to the [Add a VolumeSnapshotClass](backups-pvc-setup.md#add-a-volumesnapshotclass) for the steps.

4. The cluster Custom Resource must include at least one [backup storage](backups-storage.md) entry. PBM stores snapshot **metadata** there. It does not upload database files for `external` backups.

## Limitations

* Point-in-time recovery and selective restore are not available for `external` backups.

## Backup and restore flow

PBM treats snapshot backups as type `external`. For what the Operator and PBM do during backup and restore, see [How backup and restore work](backups.md#from-pvc-snapshot-external-backup).

Track restore progress in the Restore resource `status.conditions` field. See [PVC snapshot restore conditions](cr-statuses.md#pvc-snapshot-restore-conditions).

## Restore flow

See [How backup and restore work](backups.md#from-pvc-snapshot-external-backup) for the restore sequence.

## Next steps

[Configure PVC snapshots](backups-pvc-setup.md){.md-button}
