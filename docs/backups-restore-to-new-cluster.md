# Restore from a backup to a new Kubernetes-based environment

This page covers restoring a backup into a **different** Kubernetes environment than the one
it was taken in. To restore onto the cluster that made the backup, see
[Restore on the same cluster](backups-restore.md); when the target's replica set names
differ, see [Restore to a new cluster with different replica set names](backups-restore-replset-remapping.md).
The options are compared in [Backup and restore](backups.md#restore-options).

To restore from a backup, you create a Restore object using a special restore configuration file. The
example of such file is [deploy/backup/restore.yaml :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/v{{ release }}/deploy/backup/restore.yaml).

You can check available options in the [restore options reference](restore-options.md).

## Restore scenarios

This document covers the following restore scenarios:

* [Restore from a backup](#restore-from-a-backup) - restore from a full backup  without point-in-time
* [Restore to a point in time](backups-pitr-restore.md#restore-on-a-new-cluster) — restore to a specific time or to the latest restorable transaction. This requires that you [enable oplog collection](backups-pitr.md).

## Before you begin

--8<-- [start:backup-new-env-preconditions]

1. When restoring to a new Kubernetes-based environment, make sure it has a Secrets object with the same user passwords as in the original cluster. 

2. To restore from a physical backup, set the corresponding encryption key of the target cluster. Find more details about encryption in [Data-at-rest encryption](encryption.md). The name of the required Secrets object can be found out from the `spec.secrets` key in the `deploy/cr.yaml` (`my-cluster-name-secrets` by default). 

--8<-- [end:backup-new-env-preconditions]

--8<-- "backups-restore.md:backup-prepare"

## Restore from a backup

To make a restore, PBM must know where to take the backup from and have access to that storage.

You can define the backup storage in two ways: within the restore object configuration or pre-configure it on the target cluster's `cr.yaml` file.

### Approach 1: Define storage configuration in the restore object

If you haven't defined storage in the target cluster's `cr.yaml` file, you can configure it directly in the restore object:

1. Set appropriate keys in the [deploy/backup/restore.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/v{{ release }}/deploy/backup/restore.yaml) file:

    * set `spec.clusterName` key to the name of the target cluster to restore the backup on
    * configure the `spec.backupSource` subsection to point to the cloud storage where the backup is stored. This subsection should include:

        * the [backup type](backups.md#backup-types) - `logical`, `physical`,
          `incremental`, or `external`. When you omit it, the Operator assumes `logical`.
        * a `destination` key. Take it from the output of the `kubectl get psmdb-backup` command.
        * the [necessary storage configuration keys](backups-storage.md), just like in the `deploy/cr.yaml` file of the source cluster.

        ```yaml
        ...
        backupSource:
          type: logical
          destination: s3://S3-BUCKET-NAME/BACKUP-NAME
          s3:
            credentialsSecret: my-cluster-name-backup-s3
            region: us-west-2
            endpointUrl: https://URL-OF-THE-S3-COMPATIBLE-STORAGE
        ```

        The `destination` key is composed of three parts in case of S3-compatible storage: the `s3://` prefix, the s3 bucket name, and the actual backup name. For Azure Blob storage, you don't put the prefix, and use your container name as an equivalent of a bucket.

2. Apply the configuration to start the restore:

    ```bash
    kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
    ```

    You do not need to resync PBM by hand - the Operator does it as part of the sequence
    below.

    During the restore process, the Operator:

    1. Takes the storage configuration from the Restore object
    2. Configures PBM using this configuration
    3. Resyncs metadata to update it on the target cluster
    4. Performs the restore operation
    5. Reverts the PBM configuration back to the one defined in the `cr.yaml` file (if any)

3. As the post-restore step, configure the [main storage](multi-storage.md#define-the-main-storage) within the target cluster's `cr.yaml` to be able to make subsequent backups. 
        
### Approach 2: The storage is defined on target

You can [already define](backups-storage.md) the storage where the backup is stored in the `backup.storages` subsection of your target cluster's `deploy/cr.yaml` file. In this case, reference it by name within the restore configuration.

1. Set appropriate keys in the [deploy/backup/restore.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/v{{ release }}/deploy/backup/restore.yaml) file:

    * set `spec.clusterName` key to the name of the target cluster to restore the backup on
    * specify the storage name in the `storageName` key. The name must match the name in the `backup.storages` subsection of the `deploy/cr.yaml` file.
    * configure the `spec.backupSource` subsection with the backup destination

        ```yaml
        ...
        storageName: s3-us-west
        backupSource:
          destination: s3://S3-BUCKET-NAME/BACKUP-NAME
        ```

2. After configuring the restore object, start the restoration process:

    ```bash
    kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
    ```

## Point-in-time recovery

To restore to a specific date and time on a new cluster, see [Restore to a point in time](backups-pitr-restore.md#restore-on-a-new-cluster).

## Restore from a backup with a prefix in a bucket path

If you defined a prefix (a folder) in a bucket where you store backups, you must specify this prefix in the `spec.backupSource` subsection of the restore configuration.

To illustrate, let's say you defined a prefix `my-prefix` for your AWS s3 bucket `my-example-bucket`. You wish to restore a logical backup `2025-05-19T07:23:46Z`. The pull path to this backup is `"s3://my-example-bucket/my-prefix/2025-05-19T07:23:46Z"`. In this case, your restore configuration looks like this:

=== "Storage defined in a Restore object" 

    ```yaml
    apiVersion: psmdb.percona.com/v1
    kind: PerconaServerMongoDBRestore
    metadata:
      name: restore-prefix
    spec:
      clusterName: my-cluster-name
      backupSource:
        type: logical
        destination: "s3://my-example-bucket/my-prefix/2025-05-19T07:23:46Z"
        s3:
          credentialsSecret: my-cluster-name-backup-s3
          region: us-east-1
          bucket: backup-testing
          prefix: my-prefix
    ```

=== "Storage defined on target"

    Make sure the Custom Resource of the target cluster includes the storage configuration and the defined prefix. Then you reference this storage by name in the restore configuration.

    ```yaml
    apiVersion: psmdb.percona.com/v1
    kind: PerconaServerMongoDBRestore
    metadata:
      name: restore-prefix
    spec:
      clusterName: my-cluster-name
      storageName: us-east-1
      backupSource:
        type: logical
        destination: "s3://my-example-bucket/my-prefix/2025-05-19T07:23:46Z"
    ```

Apply the configuration to start a restore:

```bash
kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
```

## Verify the restore

Watch the Restore object until it finishes:

```bash
kubectl get psmdb-restore -n $NAMESPACE
```

The restore must reach the `ready` state. `rejected` means the Operator refused the request
before starting - check `status.error` on the object. `error` means the restore began and
failed; for physical restores read
[If a physical restore fails](backups-restore.md#if-a-physical-restore-fails) before
retrying, because a failed physical restore is not rolled back.

Then connect to the cluster and confirm the data is there: compare database and collection
names, and document counts for your largest collections, against what you expect.
