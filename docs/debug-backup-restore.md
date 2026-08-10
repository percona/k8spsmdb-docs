# Troubleshoot backups and restores

You can troubleshoot failed backups or restores by checking the status of backup and restore objects, reviewing Percona Backup for MongoDB (PBM) agent logs, and verifying storage and cluster configuration.

Percona Operator for MongoDB uses PBM as a `backup-agent` sidecar in every database Pod. Backup and restore work through PBM control collections. For an overview of the flow, see [How backup and restore work](backups.md#how-backup-and-restore-work).

The overall troubleshooting workflow looks like this:

1. Check the object status. Use `kubectl get psmdb-backup` or `kubectl get psmdb-restore` to see the current state.
2. Review error details. Use `kubectl describe` or `kubectl get ... -o yaml` and check the `status.error` field.
3. Find which Pod ran the operation. For backups, use the `status.pbmPods` field.
4. Check PBM logs. View logs from the `backup-agent` container (logical backups and restores) or from the `mongod` container and `/data/db/pbm-restore-logs` (physical restores).
5. Verify configuration. Ensure storage settings, credentials, and the cluster `PBMReady` condition are correct.

Refer to the following sections for details. For status field reference, see [Custom resource statuses](cr-statuses.md).

## Backups

### Check backup status

Start by checking the status of your backup objects:

```bash
kubectl get psmdb-backup -n <namespace>
```

This shows you all backup objects with their current state. The `STATUS` column indicates whether a backup succeeded, failed, or is in progress. A successful backup has the `ready` status.

??? example "Example output"

    ```{.text .no-copy}
    NAME      CLUSTER           STORAGE      DESTINATION                         TYPE      SIZE       STATUS   COMPLETED   AGE
    backup1   my-cluster-name   s3-us-west   s3://my-bucket/2025-09-23T10:34:59Z logical   105.44MB   ready    43s         43s
    backup2   my-cluster-name   s3-us-west                                       logical              error               2m
    ```

### Check backup error details

When a backup fails, use `kubectl describe` or inspect the full object to get detailed error information:

```bash
kubectl describe psmdb-backup <backup-name> -n <namespace>
```

```bash
kubectl get psmdb-backup <backup-name> -n <namespace> -o yaml
```

The `Status` section contains the `State` and `Error` fields that explain why the backup failed.

??? example "Example error output"

    ```{.text .no-copy}
    Name:         backup2
    Namespace:    default
    ...
    Status:
      Error:         unable to get storage 'missing-storage'
      State:         error
      Storage Name:  missing-storage
      Type:          logical
    ```

Common error scenarios include:

* **Storage not found**: The storage name specified in the backup doesn’t exist in `spec.backup.storages` of the cluster Custom Resource
* **Authentication failures**: Invalid credentials for accessing cloud storage
* **Network issues**: Problems connecting to the storage service
* **PBM not ready**: PBM agents or storage configuration are not ready yet (check the cluster `PBMReady` condition)

### Check PBM readiness on the cluster

Before you start a backup, confirm that PBM is ready on the cluster:

```bash
kubectl get psmdb <cluster-name> -n <namespace> \
  -o jsonpath='{range .status.conditions[?(@.type=="PBMReady")]}{.type}{"\n"}{.status}{"\n"}{.reason}{"\n"}{.message}{"\n"}{end}'
```

If `PBMReady` is `False`, resolve the reported reason before retrying the backup. See [Custom resource statuses](cr-statuses.md#conditions) for condition details.

### Find the Pod that ran the backup

Each backup object records which Pod ran PBM for the operation. Retrieve the Pod map as follows:

```bash
kubectl get psmdb-backup <backup-name> -n <namespace> -o jsonpath='{.status.pbmPods}'
```

You can also inspect the full status:

```bash
kubectl get psmdb-backup <backup-name> -n <namespace> -o yaml
```

Look for the `pbmPods` field.

### View backup-agent logs

To see detailed logs from the Pod that ran the backup, check the `backup-agent` container:

```bash
kubectl logs pod/<pod-name> -c backup-agent -n <namespace>
```

For example:

```bash
kubectl logs pod/my-cluster-name-rs0-2 -c backup-agent -n <namespace>
```

These logs show PBM backup execution, including storage uploads and any errors that occurred.

You can also run PBM diagnostics inside the container. See [Exec into the container](debug-shell.md) and the [PBM troubleshooting guide :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/troubleshoot/troubleshooting.html).

## Restores

### Check restore status

To check the status of restore operations, run:

```bash
kubectl get psmdb-restore -n <namespace>
```

This shows all restore objects with their current state. A successful restore has the `ready` status.

??? example "Example output"

    ```{.text .no-copy}
    NAME       CLUSTER           STATUS    AGE
    restore1   my-cluster-name   error     5m56s
    restore2   my-cluster-name   ready     5m37s
    ```

### Check restore error details

When a restore fails, use the `kubectl describe` command or inspect the full object:

```bash
kubectl describe psmdb-restore <restore-name> -n <namespace>
```

```bash
kubectl get psmdb-restore <restore-name> -n <namespace> -o yaml
```

The `Status` section contains the `State` and `Error` fields that explain why the restore failed.

??? example "Example error output"

    ```{.text .no-copy}
    Name:         restore1
    Namespace:    default
    ...
    Status:
      Error:  backup not found
      State:  error
    ```

Common restore error scenarios include:

* **Backup not found**: The backup specified in the restore doesn’t exist
* **Storage access issues**: Problems reading from the backup storage location
* **Cluster state conflicts**: The cluster is not in a state that allows restore
* **Insufficient resources**: Not enough disk space or memory to complete the restore

### View restore logs

How you view restore logs depends on the restore type.

#### Logical restore

For a logical restore, PBM runs in the `backup-agent` sidecar. Check logs from a replica set Pod:

```bash
kubectl logs pod/<pod-name> -c backup-agent -n <namespace>
```

#### Physical restore

For a physical restore, the Operator moves PBM into the `mongod` container and removes the `backup-agent` sidecar for the duration of the restore. Check `mongod` logs:

```bash
kubectl logs pod/<pod-name> -c mongod -n <namespace>
```

PBM also stores logs for the latest restore under `/data/db/pbm-restore-logs` inside the data directory. You can inspect them by executing into the `mongod` container:

```bash
kubectl exec -it <pod-name> -c mongod -n <namespace> -- ls -la /data/db/pbm-restore-logs
```

PBM keeps only the latest restore logs because it cleans up the data directory during the process.

### If a physical restore fails

If a physical restore fails, the Operator does not roll back the changes it made when preparing for the restore. You must either retry the restore or delete the StatefulSet yourself to return the cluster to its normal configuration. Deleting the StatefulSet can revert the cluster to its pre-restore configuration, but data loss or corruption is still possible depending on when the failure occurred.

The Operator cannot guarantee data consistency after a failed restore because it does not know at which stage the failure happened. Data can be lost, corrupted, incomplete, or only partially restored.

See also [If a physical restore fails](backups-restore.md#if-a-physical-restore-fails) in the restore guide.

### Physical restore finishes with CrashLoopBackOff

A physical restore can finish successfully, but one of the Pods may end up in the `CrashLoopBackOff` state. This is a known issue in Percona Backup for MongoDB. See [PBM-1554](https://perconadev.atlassian.net/browse/PBM-1554) for details.

To recover the affected Pod, delete its PVC and the Pod so the Operator can recreate them and the member can resync from the other replica set members:

1. Identify the affected Pod and its PVC:

    ```bash
    kubectl get pods -n <namespace>
    kubectl get pvc -n <namespace>
    ```

2. Delete the PVC and the Pod. For example, for the `my-cluster-name-rs0-2` Pod:

    ```bash
    kubectl delete pod/my-cluster-name-rs0-2 pvc/mongod-data-my-cluster-name-rs0-2 -n <namespace>
    ```

The Operator automatically recreates the Pod and PVC after deletion.
