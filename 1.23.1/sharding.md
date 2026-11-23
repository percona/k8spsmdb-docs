> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Sharding

## About sharding

[Sharding](https://docs.mongodb.com/manual/reference/glossary/#term-sharding) provides horizontal database scaling, distributing data across multiple MongoDB Pods. It is useful for large data sets when a single machine’s overall processing speed or storage capacity turns out to be not enough.

For what sharding is, its components (shards, `mongos`, config servers), and when to choose it over a single replica set, see [Choose your topology](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/ha-topology.html#choose-your-topology).

## Turning sharding on and off

Sharding is controlled by the `sharding` section of the `deploy/cr.yaml` configuration file and is turned on by default.

**To enable sharding**, set the `sharding.enabled` key to `true`. This will turn existing MongoDB replica set nodes into sharded ones.

**To disable sharding**, set the `sharding.enabled` key to `false`. If backups are disabled (the [`backup.enabled` Custom Resource option set to `false`](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#backupenabled)), the Operator will turn sharded MongoDB instances into unsharded one by one, so the database cluster will operate without downtime. If backups are enabled (the [`backup.enabled` Custom Resource option is `true`](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#backupenabled)), the Operator will pause the cluster (to avoid Percona Backup for MongoDB misconfiguration), update the instances, and then unpause it back.

**To verify the change**, check for `mongos` Pods:

```
export NAMESPACE=<namespace>
kubectl get pods -n $NAMESPACE -l app.kubernetes.io/component=mongos
```

With sharding on, this lists your `mongos` Pods. With sharding off, it returns nothing. Either way, confirm the cluster itself is healthy:

```
kubectl get psmdb -n $NAMESPACE
```

The cluster must show the `ready` state.

## Configuring instances of a sharded cluster

When sharding is turned on, the Operator runs replica sets with config servers and mongos instances. Their number is controlled by `configsvrReplSet.size` and `mongos.size` keys, respectively.

Config servers have `cfg` replica set name by default, which is used by the Operator in StatefulSet and Service names. If this name needs to be customized (for example when migrating MongoDB cluster from barebone installation to Kubernetes), you can override the default `cfg` variant using `replsets.configuration` Custom Resource option in `deploy/cr.yaml` as follows:

```
...
configuration: |
  replication:
    replSetName: customCfgRS
    ...
```

Note

Config servers for now can properly work only with WiredTiger engine, and sharded MongoDB nodes can use either WiredTiger or InMemory one.

By default, the [replsets section](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#operator-replsets-section) in `deploy/cr.yaml` contains one data replica set, `rs0`.

Each additional entry in `replsets` is treated as another **shard**. This works only when sharding is enabled (`sharding.enabled: true`). If `sharding.enabled: false`, the Operator supports a single replica set only.

Note

The Operator can remove a shard only when it contains no application (non-system) collections.

## Checking connectivity to sharded and non-sharded cluster

With sharding turned on, you have `mongos` service as an entry point to access your database. If you do not use sharding, you have to access `mongod` processes of your replica set.

To connect to Percona Server for MongoDB, use the connection string Secret that the Operator creates for the `databaseAdmin` user. This Secret is available starting with Operator version 1.23.0 and newer. For previous versions, refer to the [Connect manually](#connect-manually-alternative) section.

1. List the Secrets objects:

   ```
   kubectl get secrets -n <namespace>
   ```

   The connection string Secret is named `my-cluster-name-databaseadmin-conn-str` by default.

1. Retrieve the connection string

   **Sharding is on**

   ```
   kubectl get secret <clusterName>-databaseadmin-conn-str -n <namespace> \
    -o jsonpath='{.data.databaseAdmin_mongos_connectionString}' | base64 --decode && echo
   ```

   **Sharding is off**

   ```
   kubectl get secret <clusterName>-databaseadmin-conn-str -n <namespace> \
   -o jsonpath='{.data.databaseAdmin_rs0_connectionStringSrv}' | base64 --decode && echo
   ```

   See [Connection secrets](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/connection-secrets.html) for other available keys.

1. Run a container with a MongoDB client and connect its console output to your terminal. The following command does this, naming the new Pod `percona-client`:

   ```
   kubectl run -i --rm --tty percona-client --image=percona/percona-server-mongodb:8.3.13-4 --restart=Never -- bash -il
   ```

   Executing it may require some time to deploy the corresponding Pod.

1. Connect using the connection string from step 2:

   ```
   mongosh "<connection-string>"
   ```

## Connect manually (alternative)

If you need to build a connection URI yourself, retrieve credentials from the user Secret and construct the URI.

1. List the Secrets objects:

   ```
   kubectl get secrets -n <namespace>
   ```

   The Secrets object you are interested in has the `<cluster-name>-secrets` name. (For the cluster `my-cluster-name`, the Secret name is `my-cluster-name-secrets`).

1. Retrieve the admin username and password:

   ```
   kubectl get secret <secret-name> -n <namespace> -o jsonpath='{.data.MONGODB_DATABASE_ADMIN_USER}' | base64 --decode && echo
   kubectl get secret <secret-name> -n <namespace> -o jsonpath='{.data.MONGODB_DATABASE_ADMIN_PASSWORD}' | base64 --decode && echo
   ```

1. Run a container with a MongoDB client and connect its console output to your terminal. The following command does this, naming the new Pod `percona-client`:

   ```
   kubectl -n <namespace> run -i --rm --tty percona-client --image=percona/percona-server-mongodb:8.3.13-4 --restart=Never -- bash -il
   ```

   It may take some time to deploy the corresponding Pod.

1. Now run `mongosh` tool inside the `percona-client` command shell using the admin user credentials you obtained from the Secret, and a proper namespace name instead of the `<namespace name>` placeholder. The command will look different depending on whether sharding is on (the default behavior) or off:

   **sharding is on**

   ```
   mongosh "mongodb://databaseAdmin:databaseAdminPassword@my-cluster-name-mongos.<namespace name>.svc.cluster.local/admin?ssl=false"
   ```

   **sharding is off**

   ```
   mongosh "mongodb+srv://databaseAdmin:databaseAdminPassword@my-cluster-name-rs0.<namespace name>.svc.cluster.local/admin?replicaSet=rs0&ssl=false"
   ```
