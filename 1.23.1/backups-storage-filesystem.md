> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Remote file server

You can use the `filesystem` backup storage type to mount a *remote file server* to a local directory as a *sidecar volume*, and make Percona Backup for MongoDB use this directory as a storage for backups.

The approach is based on using common [Network File System (NFS) protocol](https://en.wikipedia.org/wiki/Network_File_System) . Particularly, this storage type is useful in network-restricted environments without S3-compatible storage, or in cases with a non-standard storage service that still supports NFS access.

1. Add the remote storage as a [sidecar volume](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#replsetssidecarvolumesname) in the `replset` section of the Custom Resource (and also in `configsvrReplSet` in case of a sharded cluster). You will need to specify the server hostname and some directory on it, as in the following example:

   ```
   replsets:
   - name: rs0
     ...
     sidecarVolumes:
     - name: backup-nfs-vol
       nfs:
         server: "nfs-service.storage.svc.cluster.local"
         path: "/psmdb-my-cluster-name-rs0"
     ...
   ```

   The `backup-nfs-vol` name specified above will be used to refer this sidecar volume in the backup section.

1. Now put the mount point (the local directory path to which the remote storage will be mounted) and the name of your sidecar volume into the `backup.volumeMounts` subsection of the Custom Resource:

   ```
   backup:
     ...
     volumeMounts:
     - mountPath: /mnt/nfs/
       name: backup-nfs-vol
     ...
   ```

1. Finally, storage of the `filesystem` type needs to be configured in the `backup.storages` subsection. It needs only the mount point:

   ```
   backup:
     enabled: true
     ...
     storages:
       backup-nfs:
         type: filesystem
         filesystem:
           path: /mnt/nfs/
   ```

## Verify the storage works

Export your namespace first, replacing `<namespace>` with your value:

```
export NAMESPACE=<namespace>
```

Storage problems surface as failed backups, not as errors when you apply the Custom Resource. Confirm the configuration by taking a backup and watching it finish.

Set `spec.storageName` to the storage name you defined under `backup.storages` (and `spec.clusterName` to your cluster):

deploy/backup/backup.yaml

```
apiVersion: psmdb.percona.com/v1
kind: PerconaServerMongoDBBackup
metadata:
  name: backup1
spec:
  clusterName: my-cluster-name
  storageName: <storage-name>
```

Apply it and watch the backup:

```
kubectl apply -f deploy/backup/backup.yaml -n $NAMESPACE
kubectl get psmdb-backup -n $NAMESPACE
```

The backup must reach the `ready` state. A backup that lands in `error`, or stays in `running` or `waiting`, usually means the bucket, the endpoint, the region, or the credentials are wrong. Check the backup object’s status message and the `pbm-agent` logs, and see [Troubleshoot backups and restores](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug-backup-restore.html).
