> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Set up and use Percona ClusterSync for MongoDB

This tutorial shows how to configure [Percona ClusterSync for MongoDB (PCSM)](https://docs.percona.com/percona-clustersync-for-mongodb/) with the Operator, start replication from a source MongoDB deployment to an Operator-managed target cluster, and manage the replication lifecycle.

For concepts, architecture, modes, and limitations, see [Real-time replication and near-zero downtime migration with PCSM](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/clustersync.html).

## Prerequisites

Before you start, make sure that:

- You run Percona Operator for MongoDB **1.23.0** or later.
- The source and target clusters use the **same major MongoDB version**. Minimum supported versions are listed in [Supported MongoDB deployments](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/clustersync.html#supported-mongodb-deployments).
- The source and target topologies are compatible for your scenario (replica set to replica set, or sharded cluster to sharded cluster).
- The PCSM Pod can reach the source cluster endpoint over the network.
- You understand the [limitations](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/clustersync.html#limitations), including that users and roles are not synchronized and initial sync is not resumable after a hard failure.

This tutorial demonstrates how to set up PCSM with both the source and target clusters deployed as sharded clusters in Kubernetes within the same namespace. This configuration is useful for testing or demonstration purposes. In production environments, source and target clusters are typically deployed in separate environments or networks. In such scenarios, ensure that the PCSM Deployment managed by the Operator has network connectivity to the source cluster.

Names used in this tutorial are:

| Resource                            | Example name             |
| ----------------------------------- | ------------------------ |
| Source cluster                      | `my-source-cluster`      |
| Target cluster                      | `my-target-cluster`      |
| ClusterSync CR                      | `my-cluster-sync`        |
| Sync credentials Secret from source | `my-cluster-sync-source` |
| Namespace                           | `psmdb-operator`         |

Replace them with your values, if needed.

Percona ClusterSync for MongoDB (PCSM) image and version used in this tutorial are:

```
percona/percona-clustersync-mongodb:0.9.0
```

## Configuration

### 1. Prepare the environment

1. Clone the Percona Operator repository to get access to sample manifests and configuration files:

   ```
   git clone -b v1.23.1 https://github.com/percona/percona-server-mongodb-operator.git
   cd percona-server-mongodb-operator
   ```

1. Set namespace as environment variable:

   ```
   export NAMESPACE="psmdb-operator"
   ```

### 2. Deploy the Operator

Since source and target clusters are in the same namespace, deploy the Operator in the cluster-wide mode:

```
kubectl apply --server-side -f deploy/cw-bundle.yaml
```

Refer to the [Install the Operator in the cluster-wide mode](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/cluster-wide.html#install-percona-operator-for-mongodb-in-multi-namespace-cluster-wide-mode) for how to install the Operator in another namespace.

### 3. Deploy the source cluster

1. Deploy the source cluster. Edit the `deploy/cr.yaml` and change the `metadata.name` to `my-source-cluster`. You can keep the default settings. Rename the file to `cr-source.yaml`

1. Apply the configuration:

   ```
   kubectl apply -f deploy/cr-source.yaml -n $NAMESPACE
   ```

1. Wait for the cluster to report the `Ready` state

   ```
   kubectl get psmdb -n $NAMESPACE
   ```

### 4. Prepare the source cluster for replication

You manage the source cluster regardless how it is deployed. Create a MongoDB user for PCSM and store its credentials in a Kubernetes Secret that the Operator can read.

1. Find the Secret name referenced in your source cluster’s CR under `spec.secrets.users` and export it as environment variable. Run this command to check your cluster’s configuration:

   ```
   export SOURCESECRET="$(kubectl get psmdb my-source-cluster -n $NAMESPACE -o jsonpath='{.spec.secrets.users}')"
   echo "$SOURCESECRET"
   ```

   Sample output

   ```
   my-source-cluster-secrets
   ```

1. Connect to the `mongos` Primary Pod as the `databaseAdmin` user:

   ```
   kubectl exec -n $NAMESPACE -it my-source-cluster-mongos-0 -c mongos -- \
   mongosh admin -u databaseAdmin -p "$(kubectl get secret $SOURCESECRET -n $NAMESPACE -o jsonpath='{.data.MONGODB_DATABASE_ADMIN_PASSWORD}' | base64 --decode | tr -d '\n')"
   ```

   Tip

   For replica set deployments, connect to the primary `mongod` instance.

1. Create the source user with these roles: `backup`, `clusterMonitor`, and `readAnyDatabase`.

   ```
   db.getSiblingDB("admin").createUser({
     user: "pcsmSource",
     pwd: "s3cretPassw0rd",
     roles: ["backup", "clusterMonitor", "readAnyDatabase"]
   })
   ```

   For more details, see [Configure authentication in PCSM documentation](https://docs.percona.com/percona-clustersync-for-mongodb/install/docker.html) .

1. Create the source credentials Secret in the **same namespace** as the target cluster and the ClusterSync CR. Use the `username` and `password` keys.

   Here’s the example file:

   source-credentials.yaml

   ```
   apiVersion: v1
   kind: Secret
   metadata:
     name: my-cluster-sync-source
   type: Opaque
   stringData:
     username: pcsmSource
     password: s3cretPassw0rd
   ```

   Apply it:

   ```
   kubectl apply -f source-credentials.yaml -n $NAMESPACE
   ```

   Note

   Do not put credentials in `spec.source.uri`. The Operator injects them from this Secret at runtime.

1. Retrieve the endpoint to your source cluster:

   - **For a sharded cluster**, use the `mongos` service as the endpoint. Run the following command to check the endpoint:

     ```
     kubectl get svc -n $NAMESPACE | grep mongos
     ```

     Sample output

     ```
     my-source-cluster-mongos.psmdb-operator.svc.cluster.local:27017
     ```

   - **For a replica set**, the endpoint must include each replica set member’s Pod name in the format `<pod>.<rs-service-name>.<namespace>.svc.cluster.local:port` for each replica set member, separated by commas. For example:

     ```
     my-source-cluster-rs0-0.psmdb-operator.svc.cluster.local:27017,
     my-source-cluster-rs0-1.psmdb-operator.svc.cluster.local:27017,
     my-source-cluster-rs0-2.psmdb-operator.svc.cluster.local:27017
     ```

     Replace the service and namespace with your actual values.

### 5. Deploy the target cluster

Deploy an Operator-managed Percona Server for MongoDB cluster that will receive the replicated data. Edit the `deploy/cr.yaml` file and change the `metadata.name` to `my-target-cluster`. Rename the file to differentiate the configurations.

cr-target.yaml

```
apiVersion: psmdb.percona.com/v1
kind: PerconaServerMongoDB
metadata:
  name: my-target-cluster
spec:
  crVersion: "1.23.1"
  image: percona/percona-server-mongodb:8.3.13-4
  replsets:
    - name: rs0
      size: 3
      resources:
        limits:
          cpu: "600m"
          memory: "1Gi"
        requests:
          cpu: "300m"
          memory: "1Gi"
      volumeSpec:
        persistentVolumeClaim:
          resources:
            requests:
              storage: 3Gi
  sharding:
    enabled: true
    configsvrReplSet:
      size: 3
      affinity:
        antiAffinityTopologyKey: "kubernetes.io/hostname"
      podDisruptionBudget:
        maxUnavailable: 1
      resources:
        limits:
          cpu: "600m"
          memory: "1Gi"
        requests:
          cpu: "300m"
          memory: "1Gi"
      volumeSpec:
        persistentVolumeClaim:
          resources:
            requests:
              storage: 3Gi
    mongos:
      size: 3
      affinity:
        antiAffinityTopologyKey: "kubernetes.io/hostname"
      resources:
        limits:
          cpu: "600m"
          memory: "1Gi"
        requests:
          cpu: "300m"
          memory: "1Gi"
```

Apply the manifest and wait until the cluster is ready:

```
kubectl apply -f deploy/cr-target.yaml -n $NAMESPACE
kubectl get psmdb my-target-cluster -n $NAMESPACE -w
```

The cluster status must be `ready` before you create the Percona ClusterSync for MongoDB Custom Resource.

### 6. Set up Percona ClusterSync for MongoDB

Create a `PerconaServerMongoDBClusterSync` Custom Resource. Edit the `deploy/clustersync.yaml` configuration file. Specify the following keys:

- `spec.clusterName` - specify the name of the target cluster
- `spec.source.uri` - specify the endpoint to the source cluster.
- `spec.source.credentialsSecret` - reference the Secret that stores the credentials of the PCSM user from the source cluster.
- `spec.mode` defaults to `running`, so replication starts when the PCSM Pod is ready.

**Replica set**

Use a replica set connection string for the source. List replica set members, the replica set name and authentication database. If you use TLS, include TLS options too.

clustersync-rs.yaml

```
apiVersion: psmdb.percona.com/v1
kind: PerconaServerMongoDBClusterSync
metadata:
  name: my-cluster-sync
spec:
  clusterName: my-target-cluster
  image: percona/percona-clustersync-mongodb:1.1.0
  mode: running
  source:
    uri: mongodb://my-source-cluster-rs0-0.psmdb-operator.svc.cluster.local:27017,my-source-cluster-rs0-1.psmdb-operator.svc.cluster.local:27017/admin?replicaSet=rs0
    credentialsSecret: my-cluster-sync-source
```

**Sharded cluster**

For sharded clusters, specify the `mongos` Service name for the source URI. Sharded replication is in tech preview. See [Sharding support in PCSM](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/clustersync.html#sharding-support-in-pcsm-tech-preview).

clustersync-sharded.yaml

```
apiVersion: psmdb.percona.com/v1
kind: PerconaServerMongoDBClusterSync
metadata:
  name: my-cluster-sync
spec:
  clusterName: my-target-cluster
  image: percona/percona-clustersync-mongodb:1.1.0
  mode: running
  source:
    uri: mongodb://my-source-cluster-mongos.psmdb-operator.svc.cluster.local:27017/admin
    credentialsSecret: my-cluster-sync-source
```

Create the `PerconaServerMongoDBClusterSync` Custom Resource:

```
kubectl apply -f clustersync-rs.yaml -n $NAMESPACE
```

### 7. Check PCSM status

To check the status of your Percona ClusterSync (PCSM), use the following command:

```
kubectl get psmdb-clustersync -n $NAMESPACE
```

This displays a summary table including the `MODE`, `STATE`, and replication lag time.

Sample output

```
NAME              CLUSTER             MODE      STATE     LAG(S)   AGE
my-cluster-sync   my-target-cluster   running   running            39m
```

To get detailed information about a ClusterSync resource and see the replication status, use:

```
kubectl describe psmdb-clustersync <cluster-sync-name> -n $NAMESPACE
```

Key fields to observe for replication status include:

- `status.mode`: The desired state (`running`, `paused`, etc.)
- `status.state`: The current state of the sync process
- `status.lagTimeSeconds`: Current replication lag in seconds
- `status.error`: Any error messages if replication fails

Monitor these fields to verify active and healthy replication.

## Usage

### Verify the replication

1. Insert some data into the source cluster:

   ```
   use test
   for (let i = 1; i <= 50; i++) {
     db.test.insertOne({ x: i });
   }
   ```

   This inserts 50 documents to the `test` collection in the `test` database.

1. Verify that data is replicated on the target. Connect to MongoDB on the target cluster and run:

   ```
   use test
   db.test.countDocuments()
   ```

### Pause replication

To pause replication, change the replication mode to `paused` in the Custom Resource. Since it is a running deployment, a recommended way is to patch it.

```
kubectl patch psmdb-clustersync my-cluster-sync -n $NAMESPACE \
  --type=merge -p '{"spec":{"mode":"paused"}}'
```

### Resume replication

To resume replication, change the replication mode to `running`.

```
kubectl patch psmdb-clustersync my-cluster-sync -n $NAMESPACE \
  --type=merge -p '{"spec":{"mode":"running"}}'
```

### Finalize the replication

To finalize replication, change the replication mode to `finalized`.

1. Check the replication lag:

   ```
   kubectl get psmdb-clustersync -n $NAMESPACE
   ```

1. When the `LAG(S)` value is acceptable and you are ready to complete the migration, run:

   ```
   kubectl patch psmdb-clustersync my-cluster-sync -n $NAMESPACE \
    --type=merge -p '{"spec":{"mode":"finalized"}}'
   ```

1. PCSM finalizes the replication, creates indexes on the target and stops. Check PCSM status for `state: finalized`.

   Warning

   This is a one-time operation. If you update the PerconaServerMongoDBClusterSync resource again and change the mode to `running`, this has no effect.

   To start over, you need to delete the `PerconaServerMongoDBClusterSync` object and recreate it. PCSM starts from the initial data sync.

1. Point your applications to the target cluster using its connection Secret - see [Connection secrets](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/connection-secrets.html#use-in-an-application-deployment).

### Clean up

When you no longer need the ClusterSync record, remove it:

```
kubectl delete psmdb-clustersync my-cluster-sync -n $NAMESPACE
```

This removes the PCSM Deployment and Operator-owned Secrets. The source credentials Secret and the MongoDB sync user on the target are not deleted automatically.

## Troubleshooting

### PCSM Pod is not ready

Check the Deployment and Pod:

```
kubectl get deploy,pods -l app.kubernetes.io/component=clustersync -n $NAMESPACE
kubectl describe deploy my-cluster-sync-pcsm -n $NAMESPACE
kubectl logs deploy/my-cluster-sync-pcsm -n $NAMESPACE
```

Common causes:

- Source URI is unreachable from the cluster network
- Source credentials Secret is missing or has wrong keys (`username` / `password`)
- Target cluster is not `ready`
- Source and target major MongoDB versions differ

### Status shows `failed`

Inspect the error:

```
kubectl get psmdb-clustersync my-cluster-sync -n $NAMESPACE \
  -o jsonpath='{.status.state}{"\n"}{.status.error}{"\n"}'
```

If `spec.mode` is `running`, the Operator retries with `pcsm resume --from-failure` for recoverable failures after initial sync.

If the failure keeps recurring:

1. Pause replication to stop retries:

   ```
   kubectl patch psmdb-clustersync my-cluster-sync -n $NAMESPACE \
     --type=merge -p '{"spec":{"mode":"paused"}}'
   ```

1. Fix the root cause on the source or network side.

1. Resume with `mode: running`, or delete and recreate the ClusterSync CR to start a fresh initial sync.

Initial sync cannot be resumed after a hard failure. Recreate the ClusterSync CR to start over. See [Limitations](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/clustersync.html#limitations).

### Inspect PCSM from inside the Pod

For advanced troubleshooting:

```
kubectl exec -it deploy/my-cluster-sync-pcsm -n $NAMESPACE -- pcsm status
```

Use manual `pcsm` commands only when you need details beyond the Custom Resource status.
