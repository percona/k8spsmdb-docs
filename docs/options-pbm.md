# Change Percona Backup for MongoDB configuration

The Operator configures Percona Backup for MongoDB (PBM) with the set of default parameters that ensure its correct operation. However, you may want to fine-tune PBM configuration to meet your specific needs. For example, [adjust the node priority for backups :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/usage/backup-priority.html) to use a specific node. Or configure the [parallel download from the storage for a physical restore :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/usage/restore-physical.html#parallel-data-download).

To change PBM configuration, edit the `deploy/cr.yaml` Custom Resource manifest and specify the options in the `backup.configuration` subsection. 

## Examples

This example shows how to adjust the node priority for backups:

```yaml
spec:
  backup:
  	...
  	configuration:
      backupOptions:
        priority:
          "cluster1-rs0-0.cluster1-rs0.psmdb.svc.cluster.local:27017": 2.5
          "cluster1-rs0-0.cluster1-rs0.psmdb.svc.cluster.local:27018": 2.5
```

This example shows how to configure the parallel data download for physical restores:

```yaml 
spec:
  backup:
  	...
  	configuration:
      restoreOptions:
        numDownloadWorkers: 4
        maxDownloadBufferMb: 0
        downloadChunkMb: 32
```

Apply the manifest to pass your configuration to the Operator:

```{.bash data-prompt="$"}
$ kubectl apply -f deploy/cr.yaml
```

Refer to the [Custom Resource options](operator.md) for the full list of available options.
