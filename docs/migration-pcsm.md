# Migrate with Percona ClusterSync for MongoDB

This guide moves a MongoDB deployment into a Percona Server for MongoDB cluster managed by the Operator with [Percona ClusterSync for MongoDB (PCSM)](clustersync.md). PCSM copies your data and then replicates every change from the source until you cut over, so applications only stop for the cutover itself.

Use this method for MongoDB Atlas M10 or higher, for self-hosted MongoDB Community, MongoDB Enterprise Advanced and Percona Server for MongoDB, and for another cluster that runs the Operator. It's also the method to use when the topology or the MongoDB major version changes during the move. To compare methods, see [Migrate to the Operator](migration.md). If you haven't used PCSM before, try it on test data first with the [tutorial: try PCSM within one Kubernetes cluster](clustersync-setup.md).

## Before you start

Check that:

* The Operator 1.24.0 or later runs in the target Kubernetes cluster. It uses PCSM {{clustersync}}.
* You've made the checks listed in the [Migrate to the Operator](migration.md#before-you-start) section.
* The source runs MongoDB 6.0.17 or later. The target runs the same major version or higher: 6.0 to 6.0, 7.0 or 8.0, 7.0 to 7.0 or 8.0, 8.0 to 8.0 and 8.3 to 8.3. PCSM rejects a downgrade.
* The target Feature Compatibility Version (FCV) is the same as the source FCV or higher. PCSM doesn't check it.
* For MongoDB Atlas, the cluster is M10 or higher. M0 and Flex clusters don't support the `appendOplogNote` command that PCSM needs.
* PCSM can connect to the source with a SCRAM user. It can't use LDAP, Kerberos or AWS IAM credentials.
* Your data uses nothing from [PCSM limitations](clustersync.md#limitations), such as timeseries collections or queryable encryption.
* The PCSM Pod can reach the source: every replica set member that can become primary, or `mongos` for a sharded source. You open the access when you [prepare the source](#2-prepare-the-source).
* `kubectl` and `mongosh` are installed on your workstation.

Next, prepare your workstation. Clone the Operator repository to edit the manifests:

```bash
git clone -b v{{ release }} https://github.com/percona/percona-server-mongodb-operator
cd percona-server-mongodb-operator
```

Export the namespace of the target cluster. Replace `<namespace>` with your value:

```bash
export NAMESPACE=<namespace>
```

This guide uses these example names. Replace them with yours:

| Resource | Example name |
|---|---|
| Target cluster | `my-target-cluster` |
| ClusterSync Custom Resource | `my-migration` |
| Secret with the source credentials | `my-migration-source` |

This guide uses MongoDB and Percona Server for MongoDB 8.3.

## 1. Deploy the target cluster

Deploy the cluster that will receive the data. Its MongoDB major version must be the same as the source or higher. Its topology can differ from the source:

* A replica set or sharded source can go to a replica set target. Sharded collections become regular collections.
* A replica set source can go to a sharded target. Collections stay unsharded until you shard them.
* A sharded source can go to a sharded target with a different number of shards.

1. Edit `deploy/cr.yaml`: set `metadata.name` to `my-target-cluster`, set `image` to the Percona Server for MongoDB version you want, and set the topology and resources. Keep `backup.enabled` as you need it: backups wait while the migration runs.
2. Apply the Custom Resource:

    ```bash
    kubectl apply -f deploy/cr.yaml -n $NAMESPACE
    ```

3. Wait until the cluster is `ready`:

    ```bash
    kubectl wait psmdb/my-target-cluster \
      -n $NAMESPACE \
      --for=jsonpath='{.status.state}'=ready \
      --timeout=300s
    ```

## 2. Prepare the source

PCSM reads from the source with a dedicated user that has the built-in `backup`, `clusterMonitor` and `readAnyDatabase` roles on the `admin` database. 

PCSM connects from its Pod in the target namespace. See [How PCSM connects to the source](clustersync.md#how-pcsm-connects-to-the-source) to learn more.

=== "Self-hosted source"

    1. Connect to the source primary, or to `mongos` for a sharded cluster, as a user that can create users. Then create the user:

        ```javascript
        db.getSiblingDB("admin").createUser({
          user: "pcsmSource",
          pwd: "<strong-password>",
          roles: ["backup", "clusterMonitor", "readAnyDatabase"]
        })
        ```

    2. Allow connections from the Kubernetes nodes to the MongoDB port of every source member in your firewall or security groups. For a sharded cluster, allow connections to the MongoDB port of `mongos`.

=== "MongoDB Atlas"

    Atlas manages database users and network access in the project, not in the database, so you can't run `createUser`. Create the user with the Atlas CLI, the Atlas UI or the Atlas Administration API.

    1. Create the database user. With the [Atlas CLI :octicons-link-external-16:](https://www.mongodb.com/docs/atlas/cli/stable/command/atlas-dbusers-create/):

        ```bash
        atlas dbusers create --username pcsmSource --password '<strong-password>' \
          --role readAnyDatabase@admin,backup@admin,clusterMonitor@admin \
          --projectId <atlas-project-id>
        ```

        In the Atlas UI, add a database user with password authentication on the **Database Users** page of your project. Under **Database User Privileges**, add the built-in role **Only read any database**, which is `readAnyDatabase`. Then add the `backup` and `clusterMonitor` [specific privileges :octicons-link-external-16:](https://www.mongodb.com/docs/atlas/security-add-mongodb-roles/) on the `admin` database.

    2. Allow the Kubernetes nodes to connect. Atlas accepts connections only from addresses in the project IP access list or through a private endpoint or network peering. Find the public IP addresses your Kubernetes nodes use for outbound traffic, for example the NAT gateway addresses of your cloud network. Then add each one:

        ```bash
        atlas accessLists create <egress-ip-address> --type ipAddress --projectId <atlas-project-id>
        ```

        If you use a private endpoint or network peering instead, use the matching connection string from the Atlas UI in step 5.

Check the connection in [step 3](#3-store-the-source-credentials-and-check-the-connection).

## 3. Store the source credentials and check the connection

Create a Secret in the target cluster's namespace with the `username` and `password` keys of the source cluster's user.

The following is the example of the Secret configuration file:

```yaml title="migration-source-secret.yaml"
apiVersion: v1
kind: Secret
metadata:
  name: my-migration-source
type: Opaque
stringData:
  username: pcsmSource
  password: <strong-password>
```

Create the Secret:

```bash
kubectl apply -f migration-source-secret.yaml -n $NAMESPACE
```

Keep credentials out of the source connection string. The Operator adds them from this Secret.

Before you start the migration, check from the target namespace that the source accepts the user. The command starts a temporary Pod with `mongosh` and reads the password from the Secret. Replace `<source-uri>` with the connection string of the source without the credentials, and `<psmdb-image>` with the Percona Server for MongoDB image of your target cluster:

```bash
kubectl run pcsm-check -n $NAMESPACE --rm -i --restart=Never --image=<psmdb-image> \
  --env="PCSM_PASSWORD=$(kubectl get secret my-migration-source -n $NAMESPACE -o jsonpath='{.data.password}' | base64 -d)" \
  --command -- sh -c 'mongosh "<source-uri>" --username pcsmSource --password "$PCSM_PASSWORD" --quiet --eval "db.adminCommand({ ping: 1 })"'
```

`ok: 1` in the output means that the network path and the user work. A timeout points to the firewall or the IP access list, and an authentication error to the user or the password.

## 4. Recreate users and roles on the target

PCSM doesn't copy users and roles. Create the roles and users your applications need on the target before the cutover, so applications can connect as soon as you switch them.

* To have the Operator create and manage application users, add them to the `users` section of the Custom Resource. See [Application-level users](app-users.md#create-users-via-custom-resource).
* To create them by hand, connect to the target as the `userAdmin` user. Create custom roles with `db.createRole()` first. Then create the users with the same names, privileges and passwords as on the source with `db.createUser()`. See [Connection secrets](connection-secrets.md#open-an-interactive-shell-with-mongosh) to open a shell on the target.

## 5. Start the migration

Create the `PerconaServerMongoDBClusterSync` Custom Resource. Set `spec.clusterName` to the target cluster and `spec.source.uri` to the source connection string without credentials. Reference the Secret with the source user credentials in the `spec.source.credentialsSecret`.

=== "Replica set source"

    List the replica set members and the replica set name:

    ```yaml title="my-migration.yaml"
    apiVersion: psmdb.percona.com/v1
    kind: PerconaServerMongoDBClusterSync
    metadata:
      name: my-migration
    spec:
      clusterName: my-target-cluster
      image: percona/percona-clustersync-mongodb:{{clustersync}}
      mode: running
      source:
        uri: mongodb://mongo1.example.com:27017,mongo2.example.com:27017,mongo3.example.com:27017/admin?replicaSet=rs0
        credentialsSecret: my-migration-source
    ```

=== "Sharded source"

    Point the URI at `mongos`:

    ```yaml title="my-migration.yaml"
    apiVersion: psmdb.percona.com/v1
    kind: PerconaServerMongoDBClusterSync
    metadata:
      name: my-migration
    spec:
      clusterName: my-target-cluster
      image: percona/percona-clustersync-mongodb:{{clustersync}}
      mode: running
      source:
        uri: mongodb://mongos.example.com:27017/admin
        credentialsSecret: my-migration-source
    ```

=== "MongoDB Atlas"

    Use the `mongodb+srv` connection string from the Atlas UI, without the user name and password:

    ```yaml title="my-migration.yaml"
    apiVersion: psmdb.percona.com/v1
    kind: PerconaServerMongoDBClusterSync
    metadata:
      name: my-migration
    spec:
      clusterName: my-target-cluster
      image: percona/percona-clustersync-mongodb:{{clustersync}}
      mode: running
      source:
        uri: mongodb+srv://cluster0.abcde.mongodb.net/admin
        credentialsSecret: my-migration-source
    ```

    A `mongodb+srv` connection string turns on TLS and sets `authSource=admin` by default. Atlas uses certificates from a public certificate authority, so PCSM needs no extra TLS configuration.

To skip databases or collections, list them in [`spec.excludeNamespaces`](clustersync-options.md#excludenamespaces) before you apply the resource. Changes to this list after the start have no effect.

Apply the resource:

```bash
kubectl apply -f my-migration.yaml -n $NAMESPACE
```

The Operator deploys PCSM, creates a sync user on the target and starts the initial copy.

## 6. Monitor the migration

Check the progress:

```bash
kubectl get psmdb-clustersync my-migration -n $NAMESPACE
```

??? example "Sample output"

    ```{.text .no-copy}
    NAME           CLUSTER             MODE      STATE     LAG(S)   READY   ACTIVE                               AGE
    my-migration   my-target-cluster   running   running   2        1       my-migration-pcsm-6b989fdff4-s88z9   41m
    ```

`STATE` is `running` both while PCSM copies data and while it replicates changes. To see whether the initial copy is done, ask PCSM directly:

```bash
kubectl exec deploy/my-migration-pcsm -n $NAMESPACE -- pcsm status
```

The initial copy is done when `initialSync.completed` is `true`. After that, `LAG(S)` shows how far the target trails the source. The `info` field shows the current phase, for example `Replicating Changes`.

The state can be one of `idle`, `running`, `paused`, `finalizing`, `finalized` and `failed`. If it's `failed`, read the reason:

```bash
kubectl get psmdb-clustersync my-migration -n $NAMESPACE -o jsonpath='{.status.error}'
```

To pause the migration, for example during a load peak on the source, set `spec.mode` to `paused`. Set it back to `running` to resume. While it's paused, changes collect in the source oplog and `LAG(S)` grows, so keep pauses shorter than the oplog window. When you resume, PCSM continues from where it stopped, without a new initial copy.

```bash
kubectl patch psmdb-clustersync my-migration -n $NAMESPACE --type=merge -p '{"spec":{"mode":"paused"}}'
```

## 7. Cut over

1. Confirm that `initialSync.completed` is `true` and the lag is low and stable.
2. Stop writes to the source. Stop or drain the applications that write to it.
3. Wait until `LAG(S)` reaches `0` or stops changing.
4. Finalize the migration:

    ```bash
    kubectl patch psmdb-clustersync my-migration -n $NAMESPACE --type=merge -p '{"spec":{"mode":"finalized"}}'
    ```

5. Wait until `STATE` is `finalized`. `pcsm status` then shows `finalization.completed: true`. PCSM builds the remaining indexes on the target and stops. Finalizing is final: the Operator accepts a change of `spec.mode` back to `running`, but `STATE` stays `finalized`. After finalizing, PCSM no longer replicates, so you can ignore `LAG(S)`.
6. Point your applications at the target cluster. Get the connection string from [Connection secrets](connection-secrets.md#retrieve-a-connection-string).

## Verify

Compare the source and the target before you decommission the source:

1. On both clusters, list databases and collections, and compare document counts for your largest collections. The target also has the `percona_clustersync_mongodb` database, where PCSM keeps its state. You remove it when you [Clean up](#clean-up). Also see how you can [abandon migration](#abandon-the-migration)

    ```javascript
    db.getMongo().getDBNames()
    db.getSiblingDB("<db>").getCollectionNames()
    db.getSiblingDB("<db>").<collection>.countDocuments()
    ```

2. Compare the indexes of your busiest collections:

    ```javascript
    db.getSiblingDB("<db>").<collection>.getIndexes()
    ```

3. Connect as each application user and run a read your application depends on.

## Clean up

1. Delete the ClusterSync resource. This removes the PCSM Deployment and the Secrets the Operator created:

    ```bash
    kubectl delete psmdb-clustersync my-migration -n $NAMESPACE
    ```

2. Delete the source credentials Secret:

    ```bash
    kubectl delete secret my-migration-source -n $NAMESPACE
    ```

3. Drop the `percona_clustersync_mongodb` database on the target as the `databaseAdmin` user:

    ```javascript
    db.getSiblingDB("percona_clustersync_mongodb").dropDatabase()
    ```

4. Drop the `pcsmSource` user on the source, or remove it in the Atlas UI.
5. Configure backups on the target if you haven't yet. A backup that you start during the migration gets the `waiting` state and starts by itself after the migration is finalized. See [Configure backups](backups-configure.md).
6. Decommission the source when you're sure you no longer need it.

## Abandon the migration

Before the cutover, the source is still your live database, so you can stop at any time:

1. Delete the ClusterSync resource and the source credentials Secret, as in [Clean up](#clean-up).
2. Delete the partial data on the target, including the `percona_clustersync_mongodb` database, or delete the target cluster.
3. Drop the `pcsmSource` user on the source.

To start again, create a new ClusterSync resource. PCSM starts with a full initial copy.

## Troubleshooting

### The initial copy stops progressing

**Symptom:** `pcsm status` shows `info: Initial Sync: Cloning Data`, and `clonedSizeBytes` stops growing. `STATE` stays `running` and `status.error` is empty. The PCSM log shows `ERR Failed to copy documents for collection`.

**Cause:** PCSM lost read access to the source during the copy, for example because the source user lost its roles. The copy doesn't resume, even after you fix the cause.

**Fix:**

1. Find the error:

    ```bash
    kubectl logs deploy/my-migration-pcsm -n $NAMESPACE | grep ERR
    ```

2. Fix the cause on the source.
3. Delete the ClusterSync resource. On the target, drop the copied databases and the `percona_clustersync_mongodb` database. Then create the resource again. PCSM starts a new full copy.

### Lag keeps growing but the state is running

**Symptom:** `STATE` stays `running` and `status.error` is empty, but `LAG(S)` keeps growing. The PCSM log shows `Retryable error` lines with `(Unauthorized) not authorized`.

**Cause:** The source no longer accepts the PCSM user, for example because its password or roles changed.

**Fix:**

1. Read the PCSM log:

    ```bash
    kubectl logs deploy/my-migration-pcsm -n $NAMESPACE --tail=30
    ```

2. Restore the user's password and roles on the source, as in [step 2](#2-prepare-the-source).
3. Wait until `LAG(S)` falls. PCSM retries on its own and continues where it stopped, as long as the changes are still in the source oplog.

### The migration doesn't start

**Symptom:** `STATE` stays empty or `idle`, and `status.error` says `backup is in progress on cluster "<cluster-name>" (lease psmdb-<cluster-name>-backup-lock)`.

**Cause:** A backup is running on the target, or another ClusterSync resource already uses this target cluster.

**Fix:** Wait for the backup to finish. The migration then starts by itself. If another ClusterSync resource uses the target, delete it.

### A backup stays in the waiting state

**Symptom:** A backup on the target has the `waiting` status, and `status.waitingReason` is `ClusterSync`. The Operator log shows `Waiting for ClusterSync to release the cluster.`

**Cause:** A migration to this cluster is running. It holds the cluster until it's finalized.

**Fix:** Finalize the migration, or delete the ClusterSync resource to abandon it. The backup then starts by itself.

For other problems, see [Troubleshooting in Set up and use PCSM](clustersync-setup.md#troubleshooting).

## Next steps

[Configure backups](backups-configure.md){.md-button}
