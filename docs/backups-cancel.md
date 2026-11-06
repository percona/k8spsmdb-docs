# Cancel a running backup

!!! note "Version added: [1.24.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.24.0.md)"

You can cancel a backup that is still in progress. For example, cancel it to free the cluster for maintenance or to stop a backup you started with the wrong storage or type. To cancel a backup, add the `percona.com/cancel-backup: "true"` annotation to the Backup object. The Operator asks Percona Backup for MongoDB (PBM) to stop the backup and shows the progress in the Backup status.

You cancel on-demand and scheduled backups in the same way. Read [How cancellation works](#how-cancellation-works) to learn more.

## Considerations

* You can't undo a cancellation. Once the status is `canceling`, removing the annotation doesn't stop it.
* You can't restore from a canceled backup.
* For a [PVC snapshot backup](backups-pvc-snapshots.md), the Operator deletes the `VolumeSnapshot` objects it created for this backup.
* Deleting a running Backup object also cancels the backup. Keep this in mind if a GitOps tool prunes Backup objects.
* A canceled backup can leave partially uploaded files on the storage. Deleting the Backup object doesn't remove them. See [Clean up a canceled backup](#clean-up-a-canceled-backup).

## Before you start

* The Operator is version 1.24.0 or later.
* The backup isn't finished. Its status is empty, `waiting`, `requested` or `running`. The annotation has no effect on a `ready`, `error` or `canceled` backup.

Export your namespace. Replace `<namespace>` with your value:

```bash
export NAMESPACE=<namespace>
```

## Cancel a backup {.power-number}

1. Find the name of the running backup:

    ```bash
    kubectl get psmdb-backup -n $NAMESPACE
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        NAME      CLUSTER           STORAGE      DESTINATION                           TYPE       SIZE   STATUS    COMPLETED   AGE
        backup1   my-cluster-name   s3-us-west   s3://my-bucket/2026-11-06T10:34:59Z   physical          running               2m
        ```

2. Add the `percona.com/cancel-backup` annotation with the value `true`:

    ```bash
    kubectl annotate psmdb-backup backup1 percona.com/cancel-backup=true -n $NAMESPACE
    ```

## Verify {.power-number}

1. Watch the Backup status change to `canceled`. A backup that PBM has already started goes through `canceling` first:

    ```bash
    kubectl get psmdb-backup backup1 -n $NAMESPACE -w
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        NAME      CLUSTER           STORAGE      DESTINATION                           TYPE       SIZE   STATUS      COMPLETED   AGE
        backup1   my-cluster-name   s3-us-west   s3://my-bucket/2026-11-06T10:34:59Z   physical          canceling               3m
        backup1   my-cluster-name   s3-us-west   s3://my-bucket/2026-11-06T10:34:59Z   physical          canceled                3m
        ```

2. Optionally, check the status in PBM. Get the PBM backup name from the Backup object, then describe the backup from any database Pod of this cluster. Replace `my-cluster-name` with your cluster name:

    ```bash
    PBM_NAME=$(kubectl get psmdb-backup backup1 -n $NAMESPACE -o jsonpath='{.status.pbmName}')
    kubectl exec my-cluster-name-rs0-0 -c backup-agent -n $NAMESPACE -- pbm describe-backup $PBM_NAME
    ```

    The `status` field is `canceled`. The `error` field shows why PBM stopped the backup, for example `context canceled`. This is expected.

## Clean up a canceled backup

PBM tries to remove the files that a canceled backup uploaded. A file that was uploading at the moment of the cancellation can remain on the storage. This can happen with physical and incremental backups, and with logical backups on sharded clusters. PBM also keeps a record of the canceled backup.

The Operator removes storage files only when you delete a `ready` backup. For a canceled backup, it deletes only the Backup object. To remove the leftover files and the PBM record, delete the backup in PBM first, then delete the Backup object. Replace `my-cluster-name` with your cluster name:

```bash
PBM_NAME=$(kubectl get psmdb-backup backup1 -n $NAMESPACE -o jsonpath='{.status.pbmName}')
kubectl exec my-cluster-name-rs0-0 -c backup-agent -n $NAMESPACE -- pbm delete-backup -y $PBM_NAME
kubectl delete psmdb-backup backup1 -n $NAMESPACE
```

`pbm list` doesn't show canceled backups. To see them, run `pbm status` in the `backup-agent` container.

## How cancellation works

* If the Operator hasn't sent the backup to PBM yet, for example while the backup waits for another one to finish, the Operator sets the status to `canceled` right away.
* Otherwise, it sets the status to `canceling` and sends the cancel command to PBM.
* For a PVC snapshot backup, the Operator waits until the `VolumeSnapshot` objects are deleted and clears `status.snapshots`. Some storage drivers delete a snapshot only after it finishes, so the backup can stay in `canceling` for a minute or more.
* When PBM reports the backup as canceled, the Operator sets the status to `canceled` and releases the backup lock. Until then, other backups on this cluster wait.
* Until the status is `canceled`, the Operator treats the backup as running. Pausing the cluster and Smart Update wait for the cancellation to finish.
* If the `pbm-agent` stops responding during the cancellation, the Operator waits for `backup.startingDeadlineSeconds` from the cluster Custom Resource, 120 seconds by default. This deadline is counted from the last PBM heartbeat. It also waits until PBM releases its backup lock, which adds about 30 seconds. Then it sets the status to `error`.
* When you delete a running Backup object, the Operator finishes the cancellation first and then deletes the object. It doesn't delete the files the canceled backup left on the storage.
* A restore from a canceled backup fails with the `backup is in canceled state` error.
* The [retention policy](backups-delete.md#configure-backup-retention) deletes only `ready` backups. Canceled Backup objects stay until you [delete them manually](backups-delete.md#delete-manually).

## Troubleshooting

### The backup stays in `canceling`

**Symptom:** the status doesn't change from `canceling`.

**Cause:** PBM is still stopping the backup. For a PVC snapshot backup, a `VolumeSnapshot` can't be deleted yet, for example because of a finalizer or a snapshot that is still in progress. The Operator doesn't time out while a `VolumeSnapshot` remains or a `pbm-agent` still holds the backup lock.

**Fix:**

1. Check the `backup-agent` logs of the Pods that ran the backup. The `status.pbmPods` field maps replica set names to the host and port of the `mongod` nodes that PBM used; the first part of each hostname is the Pod name. See [Troubleshoot backups and restores](debug-backup-restore.md#find-the-pod-that-ran-the-backup).
2. For a PVC snapshot backup, check which snapshots remain and why they aren't deleted:

    ```bash
    kubectl get volumesnapshot -n $NAMESPACE
    kubectl describe volumesnapshot <snapshot-name> -n $NAMESPACE
    ```

3. If the output shows a `Deletion Timestamp` and a finalizer that isn't from your CSI snapshot controller, find out which tool added it and remove it.

### The cancellation ends in `error`

**Symptom:** the status is `error`, and `status.error` says one of the following:

* `PBM backup agent stopped responding before cancellation could finish`
* `PBM backup metadata not found during cancellation within the allowed timeout`
* `backup did not progress from 'starting' state within the allowed timeout`

**Cause:** the `pbm-agent` stopped before PBM could finish the cancellation.

**Fix:**

1. Check that the `backup-agent` containers are running and PBM is ready. See [Check PBM readiness on the cluster](debug-backup-restore.md#check-pbm-readiness-on-the-cluster).
2. [Clean up the backup](#clean-up-a-canceled-backup) and make a new one.

When the `pbm-agent` comes back, PBM can still finish the cancellation. Then `pbm describe-backup` shows `canceled` while the Backup object shows `error`. Partial files can also remain on the storage, so remove them as described in [Clean up a canceled backup](#clean-up-a-canceled-backup).

## Next steps

[Delete the unneeded backup](backups-delete.md){.md-button}
