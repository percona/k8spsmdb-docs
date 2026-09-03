Storage problems surface as failed backups, not as errors when you apply the Custom
Resource. Confirm the configuration by taking a backup and watching it finish:

```bash
kubectl apply -f deploy/backup/backup.yaml -n $NAMESPACE
kubectl get psmdb-backup -n $NAMESPACE
```

The backup must reach the `ready` state. A backup that lands in `error`, or stays in
`running` or `waiting`, usually means the bucket, the endpoint, the region, or the
credentials are wrong. Check the backup object's status message and the `pbm-agent` logs,
and see [Troubleshoot backups and restores](debug-backup-restore.md).
