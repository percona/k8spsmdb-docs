> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Making on-demand backups

An on-demand backup is a backup that you start manually at any time. You create a Backup resource and the Operator uses it to make a backup. A backup can be any of the [supported backup types](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups.html#backup-types).

If you want to run backups automatically, according to the schedule, see [Make scheduled backups](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-scheduled.html) tutorial.

Export your namespace so the commands below can use it. Replace `<namespace>` with your value:

```
export NAMESPACE=<namespace>
```

Here’s what you need to do to run on-demand backups:

## Modify the Custom Resource manifest

1. Edit the `deploy/cr.yaml` configuration file and specify the following configuration:

   - Set the `backup.enabled` key to `true`,
   - Check that you have defined at least one [configured storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage.html) in the `backup.storages` subsection.

1. Apply the changes:

   ```
   kubectl apply -f deploy/cr.yaml -n $NAMESPACE
   ```

## Create a Backup resource

To create a Backup resource, you need a special custom resource manifest. The [deploy/backup/backup.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/backup/backup.yaml) is the example manifest that you can use.

1. Specify the following configuration:

   - `metadata.name` is the name of the backup. You will need this name when you [restore from this backup](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore.html). The default name is `backup1`.
   - `spec.clusterName` is the name of your cluster (prior to the Operator version 1.12.0 this key was named `spec.psmdbCluster`). Run `kubectl get psmdb -n $NAMESPACE` to find out the cluster name.
   - `spec.storageName` is the name of your [already configured storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage.html).
   - `spec.type` is the [backup type](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups.html#backup-types). If you leave it empty, the Operator makes a logical backup by default.
   - `spec.volumeSnapshotClass` is the Kubernetes `VolumeSnapshotClass` name. You must specify it when you [make an on-demand PVC snapshot backup](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pvc-usage.html#make-an-on-demand-backup-from-a-pvc-snapshot).

   **Examples**

   **Logical**

   ```
   apiVersion: psmdb.percona.com/v1
   kind: PerconaServerMongoDBBackup
   metadata:
     finalizers:
     - percona.com/delete-backup
     name: backup1
   spec:
     clusterName: my-cluster-name
     storageName: s3-us-west
     type: logical
   ```

   **Physical**

   ```
   apiVersion: psmdb.percona.com/v1
   kind: PerconaServerMongoDBBackup
   metadata:
     finalizers:
     - percona.com/delete-backup
     name: backup1
   spec:
     clusterName: my-cluster-name
     storageName: s3-us-west
     type: physical
   ```

   **Incremental**

   To make incremental backups, consider the following:

   1. Make the incremental base backup first. The Operator needs the base to start the chain of increments and save only changes from previous backup.
   1. Use the same storage for base backup and increments.
   1. The `percona.com/delete-backup` finalizer is considered for incremental base backup but is ignored for increments. This means that when a base backup is deleted, PBM deletes all increments that derive from it.

   There is the limitation that the Backup resource for the base incremental backup is deleted but the Backup resources for increments remain in the Operator. This is because the Operator doesn’t control their deletion outsourcing this task to PBM. This limitation will be fixed in future releases.

   Here’s the configuration example for the base incremental backup

   ```
   apiVersion: psmdb.percona.com/v1
   kind: PerconaServerMongoDBBackup
   metadata:
     finalizers:
     - percona.com/delete-backup
     name: backup1
   spec:
     clusterName: my-cluster-name
     storageName: s3-us-west
     type: incremental-base
   ```

   This configuration example is for subsequent incremental backups:

   ```
   apiVersion: psmdb.percona.com/v1
   kind: PerconaServerMongoDBBackup
   metadata:
     name: backup1
   spec:
     clusterName: my-cluster-name
     storageName: s3-us-west
     type: incremental
   ```

   **PVC snapshot (external)**

   As a precondition, you must ensure at least one `VolumeSnapshotClass` exists in your Kubernetes cluster and is compatible with the storage class used by your MongoDB data volumes. See [Configure PVC snapshots](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pvc-setup.html) for steps.

   ```
   apiVersion: psmdb.percona.com/v1
   kind: PerconaServerMongoDBBackup
   metadata:
     finalizers:
     - percona.com/delete-backup
     name: my-snapshot-backup
   spec:
     clusterName: my-cluster-name
     type: external
     volumeSnapshotClass: gke-snapshot-class
   ```

   See [Make an on-demand PVC snapshot backup](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pvc-usage.html#make-an-on-demand-backup-from-a-pvc-snapshot) for prerequisites and monitoring.

1. Apply the `backup.yaml` manifest to start a backup:

   ```
   kubectl apply -f deploy/backup/backup.yaml
   ```

1. You can track the backup process with the `PerconaServerMongoDBBackup` Custom Resource as follows:

   ```
   kubectl get psmdb-backup
   ```

   Expected output

   ```
   NAME      CLUSTER           STORAGE      DESTINATION                                  TYPE      SIZE       STATUS   COMPLETED   AGE
   backup1   my-cluster-name   s3-us-west   s3://my-bucket/2025-09-23T10:34:59Z   logical   105.44MB   ready    43m       43m
   ```

   It should show the status as `READY` when the backup process is over.

To stop a backup that is still running, see [Cancel a running backup](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-cancel.html).

## Troubleshooting

If you have any issues with a backup, see [Troubleshoot backups and restores](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug-backup-restore.html).

## Restore to a new Kubernetes environment

To [restore from a backup to a new Kubernetes-based environment](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore.html#restore-on-a-new-cluster), you must create a Secrets object there with the same user passwords as in the original cluster.

Find the Secrets name object on the source cluster in the `spec.secrets` key in the \`deploy/cr.yaml. Use this name to recreate the Secrets on the target cluster.

Find more details about secrets in [System Users](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/system-users.html).
