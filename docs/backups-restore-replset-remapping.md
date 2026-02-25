# Restore to a new cluster with different replica set names

!!! admonition "Version added: [1.22.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.22.0.md)"

You can restore from a backup to a cluster that has different replica set names. The number of shards in the target cluster depends on the restore type:

* For *logical* restores, the target cluster can have the same number of shards as the source where the backup was taken, or more.
* For *physical* and *incremental* restores, the number of shards in the target cluster **must be exactly the same** as in the source cluster.

--8<-- "backups-restore-to-new-cluster.md:backup-new-env-precondition"

--8<-- "backups-restore.md:backup-prepare"

To restore data to the cluster with different replica set names, configure the name mapping for the `replsetRemapping` subsection in the restore configuration file. Specify each source replica set name as a key, and set the target replica set name as the value

Here's the example configuration:

```yaml
...
metadata:
  name: restore1
spec:
  clusterName: my-cluster-name
  backupName: backup1
  replsetRemapping:
    sourceRs0: targetRs0
    sourceRs1: targetRs1
```

Apply the configuration to start the restore:

```bash
kubectl apply -f deploy/backup/restore.yaml
```

With this ability you extend the list of environments suitable for the restore lifting the limitation for the target cluster to have the same configuration.
