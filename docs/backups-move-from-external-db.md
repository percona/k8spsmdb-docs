# Use backups to move an external database to Kubernetes

The Operator can restore a backup not only on the Kubernetes cluster where it was made, but
on any Kubernetes-based environment running the Operator. Both sides use
[Percona Backup for MongoDB (PBM)  :octicons-link-external-16:](https://github.com/percona/percona-backup-mongodb),
so a backup taken on an external MongoDB cluster can be restored into Kubernetes - which
makes it a way to *move* that cluster in.

This path requires downtime for the cutover, because the destination is restored from a
backup taken at a point in time.

!!! note

    There are other ways to migrate. For near-zero downtime, use
    [Percona ClusterSync for MongoDB](clustersync.md), which replicates changes continuously
    instead of restoring a snapshot. A migration based on regular MongoDB replication is
    described in [this blog post  :octicons-link-external-16:](https://www.percona.com/blog/migrating-mongodb-to-kubernetes).

The backup must live on storage both clusters can reach, so use remote storage - Amazon S3
or S3-compatible, Google Cloud Storage, or Azure Blob Storage. A backup written to local
disk on the source cluster is not reachable from the destination.

## Before you begin

* PBM packages are installed on the replica set nodes of the *source* cluster, following the
  [official installation instructions  :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/installation.html),
  and `pbm-agent` authentication
  [is configured  :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/initial-setup.html#configure-authentication-in-mongodb)
  so it can access your database.
* The Operator and the *destination* cluster are [installed](quickstart.md) in your
  Kubernetes environment.
* Ideally the *source* and *destination* have the same topology. If they do not, PBM
  supports [replica set remapping](backups-restore.md#with-different-replica-set-names).

## 1. Configure backup storage on the source cluster

Follow the [PBM storage configuration guide  :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/details/storage-configuration.html).
For Amazon S3, the config file looks like this:

``` yaml title="pbm_config.yaml"
storage:
  type: s3
  s3:
    region: us-west-2
    bucket: pbm-test-bucket
    credentials:
      access-key-id: <your-access-key-id-here>
      secret-access-key: <your-secret-key-here>
```

!!! important

    The `s3` block sits under a top-level `storage:` key. Without it, PBM does not pick up
    the storage configuration.

Fill in your own bucket, region, and credentials, then apply the file to `pbm-agent` on all
nodes:

```bash
pbm config --file pbm_config.yaml
```

## 2. Start pbm-agent

```bash
sudo systemctl start pbm-agent
```

## 3. Take a backup on the source cluster

```bash
pbm backup --wait
```

The output contains the *backup name*, which you need for the restore:

```text
Starting backup '2022-06-15T08:18:44Z'....
Waiting for '2022-06-15T08:18:44Z' backup.......... done
```

Confirm the backup is on the storage you configured:

```bash
pbm status -s backups
```

```text
Backups:
========
S3 us-west-2/pbm-test-bucket
  Snapshots:
    2022-06-15T08:18:44Z 28.23KB <logical> [complete: 2022-06-15T08:18:49Z]
```

If the storage line shows something other than the bucket you configured, `pbm config` did
not take effect - check the `storage:` key in the config file.

## 4. Restore into the Kubernetes cluster

The remaining work happens on the *destination* cluster and is described in
[Restore from a backup to a new Kubernetes-based environment](backups-restore.md#restore-on-a-new-cluster).
Use the backup name from the previous step and the storage parameters you configured on the
source, so the destination reads from the same bucket.

## Verify the migration

Export the *destination* cluster's namespace, replacing `<namespace>` with your value:

```bash
export NAMESPACE=<namespace>
```

--8<-- "verify-backup-storage.md"

Then confirm the data itself arrived: connect to the destination cluster and compare
database and collection names, and document counts for your largest collections, with the
source. A restore that reports success still needs this check, because a backup taken from a
partially configured source can restore cleanly and be incomplete.

## See also

* [Percona ClusterSync for MongoDB](clustersync.md) - migrate with near-zero downtime instead
* [Restore to a new cluster with different replica set names](backups-restore.md#with-different-replica-set-names)
* [Disaster recovery and multi-site](replication.md)
