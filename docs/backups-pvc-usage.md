# Use PVC snapshots for backups and restores

Once you [configured a PVC snapshots](backups-pvc-setup.md), you can use them for backups and restore.

## Configure remote backup storage in the cluster

PBM requires access to remote backup storage to store backup metadata and oplog files. Therefore, you must configure at least one backup storage and define it in your cluster resource. Refer to the [storage setup guides](backups-storage.md#storage-setup-guides) to find the corresponding tutorial for your storage service.

Here's the example configuration for the S3 storage:

```yaml
spec:
  backup:
    enabled: true
    storages:
      s3-us-west:
        type: s3
        s3:
          bucket: my-bucket
          credentialsSecret: backup-s3
```

## Make an on-demand backup from a PVC snapshot

1. Configure the `PerconaServerMongoDBBackup` object. Edit the `deploy/backup/backup.yaml` manifest and specify the following keys: 

    * `metadata.name` - the name of the backup
    * `spec.clusterName` - the name of your cluster. Run `kubectl get psmdb -n <namespace>` to find out the cluster name.
    * `spec.type` - is the type. Set it to `external`
    * `spec.volumeSnapshotClass` - Specify the name of the `VolumeSnapshotClass` resource that your cluster has or [you have configured](backups-pvc-setup.md)
    
    Here's the example configuration:

    ```yaml
    apiVersion: psmdb.percona.com/v1
    kind: PerconaServerMongoDBBackup
    metadata:
      name: my-snapshot-backup
    spec:
      type: external
      clusterName: my-cluster
      volumeSnapshotClass: csi-gce-pd-snapshot-class  # The name from kubectl get volumesnapshotclasses
    ```

2. Start the backup:

    ```bash
    kubectl apply -f deploy/backup/backup.yaml -n <namespace>
    ```

3. Monitor the backup progress:

    ```bash
    kubectl get psmdb-backup -n <namespace>
    kubectl describe psmdb-backup my-snapshot-backup -n <namespace>
    ```

    ??? example "Sample output"

    ```{.text .no-copy}
    NAME                 CLUSTER           STORAGE   DESTINATION   TYPE       SIZE   STATUS   COMPLETED   AGE
    my-snapshot-backup   my-cluster-name             external             ready    5m          5m
    ```

    The Backup `status.snapshots` field lists each replica set and snapshot name:

    ```yaml
    status:
      type: external
      state: ready
      pbmName: "2026-05-29T10:15:00Z"
      snapshots:
      - replsetName: rs0
        snapshotName: my-snapshot-backup-rs0-0
      - replsetName: rs0
        snapshotName: my-snapshot-backup-rs0-1
      - replsetName: rs0
        snapshotName: my-snapshot-backup-rs0-2
    ```

4. List created snapshots:

    ```bash
    kubectl get volumesnapshot -n <namespace>
    ```

    ??? example "Sample output"

        ```text
        backup-snapshot-rs0             true         mongod-data-my-cluster-name-rs0-1                           3Gi           gke-snapshot-class   snapcontent-405dfe0c-c90c-4030-9c9a-c2040f8aca4a   4h58m          4h58m
        ```

## Make a scheduled snapshot-based backup

1. Configure the backup schedule in your cluster Custom Resource. Add a task under `backup.tasks`:
    * Set the schedule, 
    * Specify the `type` as `external`
    * Reference the VolumeSnapshot Class for the `volumeSnapshotClass`
    * Configure the [retention policy](backup-resource-options.md#retention)

    ```yaml
    backup:
      enabled: true
      storages:
        s3-us-west:
          type: s3
          s3:
            bucket: my-backup-bucket
            region: us-west-2
            credentialsSecret: my-cluster-name-backup-s3
      tasks:
      - name: daily-snapshot
        enabled: true
        schedule: "0 2 * * *"
        type: external
        volumeSnapshotClass: gke-snapshot-class
        retention:
          count: 7
          type: count
          deleteFromStorage: true
    ```

2. Start the backup:

    ```bash
    kubectl apply -f deploy/backup/backup.yaml -n <namespace>
    ```

The Operator creates a `PerconaServerMongoDBBackup` resource for each scheduled run. Retention with `deleteFromStorage: true` removes old `VolumeSnapshot` objects and PBM metadata when backups age out.

See [Making scheduled backups](backups-scheduled.md) for general scheduling and retention concepts.

## Make an in-place restore from a PVC snapshot backup

An in-place restore is a restore to the same cluster where the backup was taken.

You can only restore the data in the PVC snapshot up to the time when the backup was taken. Point-in-time recovery is not supported.

--8<-- "backups-restore.md:backup-prepare"


To make an in-place restore, do the following:

1. Create a Restore resource. Edit the [deploy/backup/restore.yaml :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/backup/restore.yaml) manifest and specify the following information:
    
    * `metadata.name` -  the name of the restore object
    * `spec.clusterName` - the name of your cluster
    * `spec.backupName` - the name of the external backup to restore from

    ```yaml
    apiVersion: psmdb.percona.com/v1
    kind: PerconaServerMongoDBRestore
    metadata:
      name: my-snapshot-restore
    spec:
      clusterName: my-cluster-name
      backupName: my-snapshot-backup
    ```

2. Apply the restore:

    ```bash
    kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
    ```

3. Monitor the restore state:

    ```bash
    kubectl get psmdb-restore -n $NAMESPACE
    kubectl describe psmdb-restore my-snapshot-restore -n $NAMESPACE
    ```
    
    Typical restore states are:
    
    | State | What happens |
    | --- | --- |
    | `waiting` | Operator prepares PBM config and cluster for physical-style restore |
    | `requested` | `pbm restore --external` started; waiting for **`copyReady`** |
    | `running` | PVCs recreated from snapshots; `pbm-agent restore-finish` and `pbm     restore-finish` run |
    | `ready` | Restore completed |

4. Inspect restore conditions:

    ```bash
    kubectl get psmdb-restore my-snapshot-restore -n $NAMESPACE -o jsonpath='{range .status.conditions[*]}{.type}{"\t"}{.status}{"\t"}{.reason}{"\n"}{end}'
    ```

    Expected conditions when finished include `ReplsetPVCsRestoredFromSnapshot` and `PBMRestoreFinished`.

## Make a restore to a new cluster

You can use a PVC snapshot to restore data to a **different cluster** or when you have `VolumeSnapshot` objects but no `PerconaServerMongoDBBackup` in the target namespace. In this scenario you configure the Restore object using the `spec.backupSource`.

### Preconditions

1. When restoring to a new cluster, make sure it has a Secrets object with the same user passwords as in the original cluster.
2. When using data-at-rest encryption, set the corresponding encryption key of the target cluster. Find more details about encryption in [Data-at-rest encryption](encryption.md). The name of the required Secrets object can be found out from the spec.secrets key in the `deploy/cr.yaml` (`my-cluster-name-secrets` by default).
3. Enable backups and configure the remote backup storage on the target cluster before starting the restore.

To make a restore to a new cluster, do the following:

1. Configure the restore object, Edit the `deploy/backup/restore.yaml` manifest and provide the following details:
    
    * `metadata.name` -  the name of the restore object
    * `spec.clusterName` - the name of the target cluster on which you make a restore
    * For the `spec.backupSource` subsection, specify the following:

        * `type` - set to `external`
        * `spec.backupSource` - define the source of your backup. Fill in these fields:
           
           * `type` - set to `external`.
           * `snapshots` - provide a list including:
               * The name of each snapshot.
               * The replica set (`replsetName`) each snapshot corresponds to.
             
             For sharded clusters, include snapshots for the config server replica set and every shard replica set listed in the source backup.

    Here's the example configuration:

    ```yaml
    apiVersion: psmdb.percona.com/v1
    kind: PerconaServerMongoDBRestore
    metadata:
      name: my-snapshot-restore
    spec:
      clusterName: my-new-cluster
      backupSource:
        type: external
        snapshots:
        - replsetName: rs0
          snapshotName: my-snapshot-backup-rs0-0
        - replsetName: rs0
          snapshotName: my-snapshot-backup-rs0-1
        - replsetName: rs0
          snapshotName: my-snapshot-backup-rs0-2
    ```

2. Apply the configuration to start the restore:

    ```bash
    kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
    ```

3. Monitor the restore state:

    ```bash
    kubectl get psmdb-restore -n $NAMESPACE
    kubectl describe psmdb-restore my-snapshot-restore -n $NAMESPACE
    ```

    Typical restore states are:

    | State | What happens |
    | --- | --- |
    | `waiting` | Operator prepares PBM config and cluster for physical-style restore |
    | `requested` | `pbm restore --external` started; waiting for **`copyReady`** |
    | `running` | PVCs recreated from snapshots; `pbm-agent restore-finish` and `pbm     restore-finish` run |
    | `ready` | Restore completed |

4. Inspect restore conditions:

    ```bash
    kubectl get psmdb-restore my-snapshot-restore -n $NAMESPACE -o jsonpath='{range .status.conditions[*]}{.type}{"\t"}{.status}{"\t"}{.reason}{"\n"}{end}'
    ```

    Expected conditions when finished include `ReplsetPVCsRestoredFromSnapshot` and `PBMRestoreFinished`.
   
## Post-restore steps

1. Verify cluster health:

    ```bash
    kubectl get psmdb -n $NAMESPACE
    kubectl get pods -n $NAMESPACE
    ```

2. Make a **new** base backup (logical, physical, or snapshot) before relying on this cluster for disaster recovery again. 

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Restore stuck in `requested` | PBM restore status: `pbm describe-restore` in a database Pod; nodes must reach `copyReady` |
| Restore stuck in `running` | `kubectl get pvc`; snapshot names in `backupSource` / backup status; `kubectl describe psmdb-restore` conditions |
| PVC not recreated | Source `VolumeSnapshot` exists and is `readyToUse`; name matches `status.snapshots` |
| Encryption errors | For PBM-assisted backups, Operator supplies `db` config; verify encryption settings match the backup source cluster |

For logical and physical restore procedures, see [Restore the cluster from a previously saved backup](backups-restore.md).

