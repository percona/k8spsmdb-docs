> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Use backups to move an external database to Kubernetes

The Operator can restore a backup not only on the Kubernetes cluster where it was made, but on any Kubernetes-based environment running the Operator. Both sides use [Percona Backup for MongoDB (PBM)](https://github.com/percona/percona-backup-mongodb) , so a backup taken on an external MongoDB cluster can be restored into Kubernetes - which makes it a way to *move* that cluster in.

This path requires downtime for the cutover, because the destination is restored from a backup taken at a point in time.

Note

There are other ways to migrate. For near-zero downtime, use [Percona ClusterSync for MongoDB](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/clustersync.html), which replicates changes continuously instead of restoring a snapshot. A migration based on regular MongoDB replication is described in [this blog post](https://www.percona.com/blog/migrating-mongodb-to-kubernetes) .

The backup must live on storage both clusters can reach, so use remote storage - Amazon S3 or S3-compatible, Google Cloud Storage, or Azure Blob Storage. A backup written to local disk on the source cluster is not reachable from the destination.

## Before you begin

- PBM packages are installed on the replica set nodes of the *source* cluster, following the [official installation instructions](https://docs.percona.com/percona-backup-mongodb/installation.html) , and `pbm-agent` authentication [is configured](https://docs.percona.com/percona-backup-mongodb/install/configure-authentication.html) so it can access your database.
- The Operator and the *destination* cluster are [installed](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/quickstart.html) in your Kubernetes environment.
- Ideally the *source* and *destination* have the same topology. If they do not, PBM supports [replica set remapping](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore.html#with-different-replica-set-names).

## 1. Configure backup storage on the source cluster

Follow the [PBM storage configuration guide](https://docs.percona.com/percona-backup-mongodb/details/storage-configuration.html) . For Amazon S3, the config file looks like this:

pbm_config.yaml

```
storage:
  type: s3
  s3:
    region: us-west-2
    bucket: pbm-test-bucket
    credentials:
      access-key-id: <your-access-key-id-here>
      secret-access-key: <your-secret-key-here>
```

Important

The `s3` block sits under a top-level `storage:` key. Without it, PBM does not pick up the storage configuration.

Fill in your own bucket, region, and credentials, then apply the file to `pbm-agent` on all nodes:

```
pbm config --file pbm_config.yaml
```

## 2. Start pbm-agent

```
sudo systemctl start pbm-agent
```

## 3. Take a backup on the source cluster

```
pbm backup --wait
```

The output contains the *backup name*, which you need for the restore:

```
Starting backup '2022-06-15T08:18:44Z'....
Waiting for '2022-06-15T08:18:44Z' backup.......... done
```

Confirm the backup is on the storage you configured:

```
pbm status -s backups
```

```
Backups:
========
S3 us-west-2/pbm-test-bucket
  Snapshots:
    2022-06-15T08:18:44Z 28.23KB <logical> [complete: 2022-06-15T08:18:49Z]
```

If the storage line shows something other than the bucket you configured, `pbm config` did not take effect - check the `storage:` key in the config file.

## 4. Restore into the Kubernetes cluster

The remaining work happens on the *destination* cluster and is described in [Restore from a backup to a new Kubernetes-based environment](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore.html#restore-on-a-new-cluster). Use the backup name from the previous step and the storage parameters you configured on the source, so the destination reads from the same bucket.

## Verify the migration

Export the *destination* cluster’s namespace, replacing `<namespace>` with your value:

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

Then confirm the data itself arrived: connect to the destination cluster and compare database and collection names, and document counts for your largest collections, with the source. A restore that reports success still needs this check, because a backup taken from a partially configured source can restore cleanly and be incomplete.

## See also

- [Percona ClusterSync for MongoDB](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/clustersync.html) - migrate with near-zero downtime instead
- [Restore to a new cluster with different replica set names](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore.html#with-different-replica-set-names)
- [Disaster recovery and multi-site](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/replication.html)
