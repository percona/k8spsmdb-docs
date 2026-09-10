Storage problems surface as failed backups, not as errors when you apply the Custom
Resource. Confirm the configuration by taking a backup and watching it finish.

Set `spec.storageName` to the storage name you defined under `backup.storages` (and
`spec.clusterName` to your cluster):

```yaml title="deploy/backup/backup.yaml"
apiVersion: psmdb.percona.com/v1
kind: PerconaServerMongoDBBackup
metadata:
  name: backup1
spec:
  clusterName: my-cluster-name
  storageName: <storage-name>
```

Apply it and watch the backup:

```bash
kubectl apply -f deploy/backup/backup.yaml -n $NAMESPACE
kubectl get psmdb-backup -n $NAMESPACE
```

The backup must reach the `ready` state. A backup that lands in `error`, or stays in
`running` or `waiting`, usually means the bucket, the endpoint, the region, or the
credentials are wrong. Check the backup object's status message and the `pbm-agent` logs,
and see [Troubleshoot backups and restores](debug-backup-restore.md).
