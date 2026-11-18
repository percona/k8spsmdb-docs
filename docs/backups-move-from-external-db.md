# Migrate with backup and restore

Move a MongoDB deployment into a cluster managed by the Operator by taking a backup of the source and restoring it into the target. This method needs no network path between the sites. Restore into the same MongoDB major version as the source. To compare methods and check your source first, see [Migrate to the Operator](migration.md).

Choose the tool that fits your source:

| Tool | Use it for | Downtime | What it moves |
|---|---|---|---|
| [Percona Backup for MongoDB (PBM)](#migrate-with-percona-backup-for-mongodb) | Self-hosted MongoDB Community, MongoDB Enterprise Advanced and Percona Server for MongoDB, where you can install PBM on the source. Physical and incremental backups need Percona Server for MongoDB | With point-in-time recovery, from the cutover until the restore finishes | Data, indexes, users and roles |
| [`mongodump` and `mongorestore`](#migrate-with-mongodump-and-mongorestore) | MongoDB Atlas, and any source where you can't install PBM | From the dump until the restore finishes | Data and indexes. Users and roles from a self-hosted source in a separate step. From MongoDB Atlas, you recreate users |

For near-zero downtime, use [Percona ClusterSync for MongoDB](migration-pcsm.md) instead.

## Migrate with Percona Backup for MongoDB

The Operator restores backups with [Percona Backup for MongoDB (PBM) :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/), so a backup that PBM takes on your source can be restored into a cluster that the Operator runs. With [point-in-time recovery :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/features/point-in-time-recovery.html), PBM also uploads the source oplog after the backup. Applications keep writing to the source until the cutover, and the restore replays every change up to the moment writes stopped.

The source and the target never connect to each other. Both read and write the same remote storage: Amazon S3 or S3-compatible storage, Google Cloud Storage or Azure Blob Storage.

### Before you start

* PBM is [installed :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/installation.html) on every member of the source, `pbm-agent` runs on every member, and the PBM user [is created :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/install/configure-authentication.html).
* The Operator and the target cluster are [installed](kubectl.md). The target runs the same MongoDB major version as the source, and its replica set names match the source. If they don't, see [replica set remapping](backups-restore.md#with-different-replica-set-names).
* Remote storage that both the source and the target can reach, and a Secret with its credentials in the target namespace. See [Configure storage for backups](backups-storage.md).
* For physical and incremental backups:

    * The source runs Percona Server for MongoDB. PBM takes physical backups with the backup cursor of Percona Server for MongoDB.
    * Each `pbm-agent` has read access to the data directory of its member. If you run PBM in a container, mount the data volume and run the container as the same user as `mongod`.
    * The target has data-at-rest encryption turned off, because a physical backup of an unencrypted source can't start on encrypted members. Add this to every replica set in the target Custom Resource before you restore:

        ```yaml
        replsets:
        - name: rs0
          configuration: |
            security:
              enableEncryption: false
        ```

* You've made the checks in [Migrate to the Operator](migration.md#before-you-start).

Export the namespace of the target cluster. Replace `<namespace>` with your value:

```bash
export NAMESPACE=<namespace>
```

### 1. Create the Operator's system users on the source

A PBM restore replaces the users and roles on the target with the ones in the backup. The Operator connects to the cluster with its own system users, so these users must be in the backup, with the passwords from the target's users Secret. Otherwise the Operator can't connect after the restore, and the cluster goes to the `error` state.

1. Get the passwords from the target's users Secret. Its name is in `spec.secrets.users` of the target Custom Resource, `my-cluster-name-secrets` in `deploy/cr.yaml`:

    ```bash
    for k in BACKUP DATABASE_ADMIN CLUSTER_ADMIN CLUSTER_MONITOR USER_ADMIN; do
      echo "$k: $(kubectl get secret my-cluster-name-secrets -n $NAMESPACE -o jsonpath="{.data.MONGODB_${k}_PASSWORD}" | base64 --decode)"
    done
    ```

2. Connect to the source primary as a user that can create users and roles, and create them with these passwords. Skip `pbmAnyAction` if your PBM setup already created it:

    ```javascript
    use admin

    db.createRole({
      role: "explainRole",
      privileges: [
        { resource: { db: "", collection: "" }, actions: ["listIndexes", "listCollections", "dbStats", "dbHash", "collStats", "find"] },
        { resource: { db: "", collection: "system.profile" }, actions: ["indexStats", "dbStats", "collStats"] },
        { resource: { db: "admin", collection: "system.version" }, actions: ["find"] }
      ],
      roles: []
    })

    db.createRole({
      role: "pbmAnyAction",
      privileges: [ { resource: { anyResource: true }, actions: ["anyAction"] } ],
      roles: []
    })

    db.createUser({ user: "userAdmin", pwd: "<userAdmin-password>", roles: ["userAdminAnyDatabase"] })
    db.createUser({ user: "clusterAdmin", pwd: "<clusterAdmin-password>", roles: ["clusterAdmin", "directShardOperations"] })
    db.createUser({ user: "clusterMonitor", pwd: "<clusterMonitor-password>", roles: ["clusterMonitor", "explainRole", { role: "read", db: "local" }, "directShardOperations"] })
    db.createUser({ user: "backup", pwd: "<backup-password>", roles: ["backup", "readWrite", "clusterMonitor", "restore", "pbmAnyAction"] })
    db.createUser({ user: "databaseAdmin", pwd: "<databaseAdmin-password>", roles: ["readWriteAnyDatabase", "readAnyDatabase", "restore", "backup", "dbAdminAnyDatabase", "clusterMonitor"] })
    ```

    This guide uses MongoDB and Percona Server for MongoDB 8.0. On MongoDB 6.0 and 7.0, leave out the `directShardOperations` role. It exists from MongoDB 8.0.

Create the users before you take the base backup in step 3.

### 2. Configure storage and point-in-time recovery on the source

1. Create the PBM configuration file. Use the same bucket and prefix that you'll give the target in step 5. For Amazon S3:

    ```yaml title="pbm_config.yaml"
    storage:
      type: s3
      s3:
        region: us-east-1
        bucket: my-bucket
        prefix: my-prefix
        credentials:
          access-key-id: <your-access-key-id>
          secret-access-key: <your-secret-access-key>
    ```

    The `s3` block sits under the top-level `storage:` key. Without it, PBM doesn't pick up the storage configuration. For other storage types, see the [PBM storage configuration guide :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/details/storage-configuration.html).

2. Apply the configuration and turn on point-in-time recovery:

    ```bash
    pbm config --file pbm_config.yaml
    pbm config --set pitr.enabled=true
    ```

3. Check that every agent is `OK` and the storage path is the one you configured:

    ```bash
    pbm status
    ```

### 3. Take a base backup

Applications keep writing to the source.

=== "Logical"

    ```bash
    pbm backup --wait
    ```

=== "Physical"

    ```bash
    pbm backup --type physical --wait
    ```

=== "Incremental"

    Take the base of the chain, then increments as often as you need. The last increment before the cutover is the one you restore:

    ```bash
    pbm backup --type incremental --base --wait
    pbm backup --type incremental --wait
    ```

The output contains the backup name, for example `2026-11-12T09:10:50Z`. You need it in step 5.

After a few minutes, `pbm status` lists the backup and a `PITR chunks` time range that keeps growing:

```{.text .no-copy}
Snapshots:
  NAME                      SIZE        TYPE          ...   RESTORE TIME         STATUS
  2026-11-12T09:10:50Z      19.65MB     logical       ...   2026-11-12T09:11:02  done
PITR chunks [237.30KB]:
  2026-11-12T09:11:03 - 2026-11-12T09:15:33
```

### 4. Stop writes and pick the restore time

1. Stop the applications that write to the source.
2. Find the time of the last write in UTC, for example from your application logs or from the newest document of a busy collection.
3. Wait until the end of the `PITR chunks` range in `pbm status` is later than the last write. By default, PBM uploads the oplog every 10 minutes.

The restore time is the next full second after the last write. For example, for a last write at `09:56:09.942`, restore to `09:56:10`. The restore only replays changes up to the full second you set, so a write later in that second would be lost.

### 5. Restore into the target cluster

Create a Restore object. Set `backupSource.type` to the type of your base backup, `logical`, `physical` or `incremental`. For an incremental backup, `destination` names the last increment, not the base. `destination` is the full path to the backup, including the prefix:

```yaml title="restore.yaml"
apiVersion: psmdb.percona.com/v1
kind: PerconaServerMongoDBRestore
metadata:
  name: migration-restore
spec:
  clusterName: my-cluster-name
  pitr:
    type: date
    date: "2026-11-12 09:56:10"
  backupSource:
    type: logical
    destination: s3://my-bucket/my-prefix/2026-11-12T09:10:50Z
    s3:
      credentialsSecret: my-cluster-name-backup-s3
      region: us-east-1
      bucket: my-bucket
      prefix: my-prefix
```

Apply it and wait until the restore is `ready`:

```bash
kubectl apply -f restore.yaml -n $NAMESPACE
kubectl get psmdb-restore migration-restore -n $NAMESPACE -w
```

A physical or incremental restore stops `mongod` on every member, replaces the data files and restarts the Pods, so it takes longer.

### 6. Finish the cutover

1. Point your applications at the target cluster. The connection strings are in [Connection secrets](connection-secrets.md#retrieve-a-connection-string).
2. Configure backup storage on the target with a different prefix from the source backups. If both clusters use the same prefix, their PBM metadata mixes. See [Configure storage for backups](backups-storage.md).
3. Take a full backup on the target, then turn on point-in-time recovery. See [Make an on-demand backup](backups-ondemand.md) and [Enable point-in-time recovery](backups-pitr.md).

### Verify

1. Check that the cluster is `ready` and that the Operator logs no authentication errors:

    ```bash
    kubectl get psmdb my-cluster-name -n $NAMESPACE
    kubectl logs deploy/percona-server-mongodb-operator -n $NAMESPACE --since=10m | grep -c AuthenticationFailed
    ```

    The count must be `0`.

2. Compare database names, collection names and document counts for your largest collections with the source. The newest document of a busy collection must match the last write you found in step 4.
3. Connect as one of your application users and run a read your application depends on.

### Troubleshooting

#### The cluster is in the error state after the restore

**Symptom:** After the restore, the cluster is in the `error` state and the Operator log shows `AuthenticationFailed` on every reconcile.

**Cause:** The backup didn't contain the Operator's system users with the target's passwords, so the restore removed them. Only the `backup` user, which PBM uses on the target, is kept.

**Fix:**

1. Connect to the target as a user from the source with the `root` or `userAdminAnyDatabase` role. The restore brought these users to the target.
2. Create the missing system users and the `explainRole` role as in [step 1](#1-create-the-operators-system-users-on-the-source), with the passwords from the target's users Secret.
3. Wait a minute. The Operator connects again and the cluster returns to `ready`.

#### A physical restore fails with a WiredTiger error

**Symptom:** The restore is in the `error` state. `status.error` contains `prepare data: connect to mongo: mongo failed with [E] WiredTiger error message`, and the `mongod` log shows `WiredTiger metadata corruption detected` and `Fatal assertion`.

**Cause:** The target has data-at-rest encryption turned on, and the backup comes from an unencrypted source.

**Fix:** A failed physical restore isn't rolled back. Deploy a target cluster with `security.enableEncryption: false` as in [Before you start](#before-you-start) and restore into it. Then delete the failed cluster and its PersistentVolumeClaims.

## Migrate with mongodump and mongorestore

Use the MongoDB Database Tools to export the data from the source and import it into the target. This is the only offline method for MongoDB Atlas, which doesn't allow PBM or physical backups.

### Before you start

* The target cluster is deployed and `ready`. Its MongoDB major version is the same as the source. See [Install the Operator](kubectl.md).
* [MongoDB Database Tools :octicons-link-external-16:](https://www.mongodb.com/docs/database-tools/installation/) are installed on a host that can reach the source and has `kubectl` access to the target. The host needs enough disk space for the dump. Use the same Database Tools version for `mongodump` and `mongorestore`.
* A source user with the `backup` role, or `readAnyDatabase` on MongoDB Atlas.

Export the target namespace. Replace `<namespace>` with your value:

```bash
export NAMESPACE=<namespace>
```

### 1. Stop writes and dump the source

1. Stop the applications that write to the source.
2. Dump all databases. `mongodump` has no option to leave out the `admin` database. You choose what to restore in the next step:

    === "Self-hosted source"

        ```bash
        mongodump --uri "mongodb://<user>:<password>@mongo1.example.com:27017,mongo2.example.com:27017/?replicaSet=rs0&authSource=admin" \
          --out ./dump
        ```

    === "MongoDB Atlas"

        ```bash
        mongodump --uri "mongodb+srv://<user>:<password>@cluster0.abcde.mongodb.net/" \
          --out ./dump
        ```

### 2. Restore the data into the target

1. Get the `databaseAdmin` password of the target cluster. The users Secret name is in `spec.secrets.users` of the target Custom Resource, `my-cluster-name-secrets` in `deploy/cr.yaml`:

    ```bash
    export ADMIN_PASSWORD=$(kubectl get secret my-cluster-name-secrets -n $NAMESPACE -o jsonpath='{.data.MONGODB_DATABASE_ADMIN_PASSWORD}' | base64 --decode)
    ```

2. Open a connection to the target from your host:

    === "Replica set target"

        Find the primary Pod, then forward its port. The Pod name is the part of the host name before the first dot, for example `my-cluster-name-rs0-0`:

        ```bash
        kubectl exec my-cluster-name-rs0-0 -n $NAMESPACE -c mongod -- \
          mongosh -u databaseAdmin -p "$ADMIN_PASSWORD" --quiet --eval 'db.hello().primary'
        kubectl port-forward pod/<primary-pod-name> 27017:27017 -n $NAMESPACE
        ```

    === "Sharded target"

        ```bash
        kubectl port-forward svc/my-cluster-name-mongos 27017:27017 -n $NAMESPACE
        ```

3. In another terminal, restore everything except the `admin` and `config` databases:

    ```bash
    mongorestore --uri "mongodb://databaseAdmin:$ADMIN_PASSWORD@localhost:27017/?authSource=admin&directConnection=true" \
      --nsExclude="admin.*" --nsExclude="config.*" ./dump
    ```

    `mongorestore` rebuilds the indexes after it loads each collection.

### 3. Restore or recreate users and roles

=== "Self-hosted source"

    Restore the users and roles from the dump. `mongorestore` needs the three collections in this command. It adds the source users and keeps the target users with the same names, including the Operator's system users:

    ```bash
    mongorestore --uri "mongodb://databaseAdmin:$ADMIN_PASSWORD@localhost:27017/?authSource=admin&directConnection=true" \
      --nsInclude="admin.system.users" --nsInclude="admin.system.roles" --nsInclude="admin.system.version" ./dump
    ```

    The output reports `0 document(s) restored`, because users and roles aren't counted as documents.

    !!! warning

        Don't add `--drop`, and don't restore the whole `admin` database. The `admin` database of the source can also hold PBM control collections and other data that doesn't belong on the target.

=== "MongoDB Atlas"

    Create the users your applications need on the target. See [Application-level users](app-users.md).

### 4. Cut over

1. Point your applications at the target. The connection strings are in [Connection secrets](connection-secrets.md#retrieve-a-connection-string).
2. Configure backups on the target. See [Configure backups](backups-configure.md).

### Verify

1. Compare database names, collection names, document counts and indexes for your largest collections between the source and the target.
2. Check that the cluster is `ready`:

    ```bash
    kubectl get psmdb my-cluster-name -n $NAMESPACE
    ```

3. Connect as an application user and run a read your application depends on.

## See also

* [Migrate with Percona ClusterSync for MongoDB](migration-pcsm.md) to migrate with near-zero downtime instead
* [Restore to a new cluster with different replica set names](backups-restore.md#with-different-replica-set-names)
* [Migrate to the Operator](migration.md) to compare all migration methods
