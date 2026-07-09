# Set up and use Percona ClusterSync for MongoDB

This tutorial shows how to configure [Percona ClusterSync for MongoDB (PCSM) :octicons-link-external-16:](https://docs.percona.com/percona-clustersync-for-mongodb/) with the Operator, start replication from a source MongoDB deployment to an Operator-managed target cluster, and manage the replication lifecycle.

For concepts, architecture, modes, and limitations, see [Real-time replication and near-zero downtime migration with PCSM](clustersync.md).

## Prerequisites

Before you start, make sure that:

* You run Percona Operator for MongoDB **1.23.0** or later.
* The source and target clusters use the **same major MongoDB version**. Minimum supported versions are listed in [Supported MongoDB deployments](clustersync.md#supported-mongodb-deployments).
* The source and target topologies are compatible for your scenario (replica set to replica set, or sharded cluster to sharded cluster). 
* The PCSM Pod can reach the source cluster endpoint over the network.
* You understand the [limitations](clustersync.md#limitations), including that users and roles are not synchronized and initial sync is not resumable after a hard failure.

This tutorial demonstrates how to set up PCSM with both the source and target clusters deployed as sharded clusters in Kubernetes within the same namespace. This configuration is useful for testing or demonstration purposes. In production environments, source and target clusters—often sharded—are typically deployed in separate environments or networks. In such scenarios, ensure that the PCSM Deployment managed by the Operator has network connectivity to the source cluster.

Names used in this tutorial are:

| Resource | Example name |
|----------|--------------|
| Source cluster | `my-source-cluster` |
| Target cluster | `my-target-cluster` |
| ClusterSync CR | `my-cluster-sync` |
| Sync credentials Secret from source | `my-cluster-sync-source` |
| Namespace | `psmdb-operator` |

Replace them with your values, if needed.

## Configuration

### 1. Prepare the environment

1. Clone the Percona Operator repository to get access to sample manifests and configuration files:

    ```bash
    git clone -b v{{release}} https://github.com/percona/percona-server-mongodb-operator.git
    cd percona-server-mongodb-operator
    ```

2. Set namespace as environment variable:

    ```bash
    export NAMESPACE="psmdb-operator"
    ```

### 2. Deploy the Operator

Since source and target clusters are in the same namespace, deploy the Operator in the cluster-wide mode:

```bash
kubectl apply -server-side -f deploy/cw-bundle.yaml
```

Refer to the [Install the Operator in the cluster-wide mode](cluster-wide.md#install-percona-operator-for-mongodb-in-multi-namespace-cluster-wide-mode) for how to install the Operator in another namespace.

### 3. Deploy the source cluster 

1. Deploy the source cluster. Edit the `deploy/cr.yaml` and change the `metadata.name` to `my-source-cluster`. You can keep the default settings. Rename the file to `cr-source.yaml`
    
2. Apply the configuration:
    
    ```bash
    kubectl apply -f deploy/cr-source -n $NAMESPACE
    ```

3. Wait for the cluster to report the `Ready` state
    
    ```bash
    kubectl get psmdb -n $NAMESPACE
    ```

### 4. Prepare the source cluster for replication

You manage the source cluster regardless how it is deployed. Create a MongoDB user for PCSM and store its credentials in a Kubernetes Secret that the Operator can read.

1. Find the Secret name referenced in your source cluster's CR under `spec.secrets.users` and export it as environment variable. Run this command to check your cluster's configuration:

    ```bash
    export SOURCESECRET="$(kubectl get psmdb my-source-cluster \
     -n $NAMESPACE -o yaml | grep users | awk '{print $2}' \ 
     | tr -d '\n' | xargs)"
    echo $SOURCESECRET
    ```
    
    ??? example "Sample output"

        ```
        my-source-cluster-secrets
        ```

2. Connect to the `mongos` Primary Pod as the `databaseAdmin` user:
    
    ```bash
    kubectl exec -n $NAMESPACE -it my-source-cluster-mongos-0 -c mongos -- \
    mongosh admin -u databaseAdmin -p "$(kubectl get secret $SOURCESECRET -n $NAMESPACE -o jsonpath='{.data.MONGODB_DATABASE_ADMIN_PASSWORD}' | base64 --decode | tr -d '\n')"
    ```

    !!! tip
        
        For replica set deployments, connect to the primary `mongod` instance.

3. Create the source user with these roles: `backup`, `clusterMonitor`, and `readAnyDatabase`.

    ```javascript
    db.getSiblingDB("admin").createUser({
      user: "pcsmSource",
      pwd: "s3cretPassw0rd",
      roles: ["backup", "clusterMonitor", "readAnyDatabase"]
    })
    ```

    For more details, see [Configure authentication in PCSM documentation :octicons-link-external-16:](https://docs.percona.com/percona-clustersync-for-mongodb/install/docker.html).

4. Create the source credentials Secret in the **same namespace** as the target cluster and the ClusterSync CR. Use the `username` and `password` keys.
    
    Here's the example file:

    ```yaml title="source-credentials.yaml"
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

    ```bash
    kubectl apply -f source-credentials.yaml -n $NAMESPACE
    ```

    !!! note

        Do not put credentials in `spec.source.uri`. The Operator injects them from this Secret at runtime.

5. Retrieve the endpoint to your source cluster: 

    - **For a sharded cluster**, use the `mongos` service as the endpoint. Run the following command to check the endpoint:
      
        ```bash
        kubectl get svc -n $NAMESPACE | grep mongos
        ```
        
        ??? example "Sample output"

            ```
            my-source-cluster-mongos.psmdb-operator.svc.cluster.local:27017
            ```

    - **For a replica set**, the endpoint must include each replica set member's Pod name in the format `<pod>.<rs-service-name>.<namespace>.svc.cluster.local:port` for each replica set member, separated by commas. For example:
      
        ```
        my-source-cluster-rs0-0.psmdb-operator.svc.cluster.local:27017,
        my-source-cluster-rs0-1.psmdb-operator.svc.cluster.local:27017,
        my-source-cluster-rs0-2.psmdb-operator.svc.cluster.local:27017
        ```

        Replace the service and namespace with your actual values.

### 5. Deploy the target cluster

Deploy an Operator-managed Percona Server for MongoDB cluster that will receive the replicated data. Edit the `deploy/cr.yaml` file and change the `metadata.name` to `my-target-cluster`. Rename the file to differentiate the configurations.

```yaml title="cr-target.yaml"
apiVersion: psmdb.percona.com/v1
kind: PerconaServerMongoDB
metadata:
  name: my-target-cluster
spec:
  crVersion: "{{ release }}"
  image: percona/percona-server-mongodb:{{ mongodb80recommended }}
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

```bash
kubectl apply -f target-cluster-rs.yaml -n $NAMESPACE
kubectl get psmdb my-target-cluster -n $NAMESPACE -w
```

The cluster status must be `ready` before you create the Percona ClusterSync for MongoDB Custom Resource.

### 6. Set up Percona ClusterSync for MongoDB

Create a `PerconaServerMongoDBClusterSync` Custom Resource. Edit the `deploy/clusterset.yaml` configuration file. Specify the following keys:

* `spec.clusterName` - specify the name of the target cluster
* `spec.source.uri` - specify the endpoint to the source cluster.
* `spec.source.credentialsSecret` - reference the Secret that stores the credentials of the PCSM user from the source cluster.
* `spec.mode` defaults to `running`, so replication starts when the PCSM Pod is ready.

=== "Replica set"

    Use a replica set connection string for the source. List replica set members, the replica set name and authentication database. If you use TLS, include TLS options too.

    ```yaml title="clustersync-rs.yaml"
    apiVersion: psmdb.percona.com/v1
    kind: PerconaServerMongoDBClusterSync
    metadata:
      name: my-cluster-sync
    spec:
      clusterName: my-target-cluster
      image: percona/percona-clustersync-mongodb:{{clustersync}}
      mode: running
      source:
        uri: mongodb://my-source-cluster-rs0-0.psmdb-operator.svc.cluster.local:27017,my-source-cluster-rs0-1.psmdb-operator.svc.cluster.local:27017/admin?replicaSet=rs0
        credentialsSecret: my-cluster-sync-source
    ```

=== "Sharded cluster"

    For sharded clusters, specify the `mongos` Service name for the source URI. Sharded replication is in tech preview. See [Sharding support in PCSM](clustersync.md#sharding-support-in-pcsm-tech-preview).

    ```yaml title="clustersync-sharded.yaml"
    apiVersion: psmdb.percona.com/v1
    kind: PerconaServerMongoDBClusterSync
    metadata:
      name: my-cluster-sync
    spec:
      clusterName: my-target-cluster
      image: percona/percona-clustersync-mongodb:{{clustersync}}
      mode: running
      source:
        uri: mongodb://my-source-cluster-mongos.psmdb-operator.svc.cluster.local:27017/admin
        credentialsSecret: my-cluster-sync-source
    ```

Create the `PerconaServerMongoDBClusterSync` Custom Resource:

```bash
kubectl apply -f clustersync-rs.yaml -n $NAMESPACE
```

### 7. Check PCSM status

To check the status of your Percona ClusterSync (PCSM), use the following command:

```bash
kubectl get psmdb-clustersync -n $NAMESPACE
```

This displays a summary table including the `MODE`, `STATE`, and replication lag time.

??? example "Sample output"

    ```text
    NAME              CLUSTER             MODE      STATE     LAG(S)   AGE
    my-cluster-sync   my-target-cluster   running   running            39m
    ```

To get detailed information about a ClusterSync resource and see the replication status, use:

```bash
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
   
    ```javascript
    use test
    for (let i = 1; i <= 50; i++) {
      db.test.insertOne({ x: i });
    }
    ```

    This inserts 50 documents to the `test` collection in the `test` database.

2. Verify that data is replicated on the target. Connect to MongoDB on the target cluster and run:
    
    ```javascript
    use test
    db.test.countDocuments()
    ```

### Pause replication

To pause replication, change the replication mode to `paused` in the Custom Resource. Since it is a running deployment, a recommended way is to patch it.

```bash
kubectl patch psmdb-clustersync my-cluster-sync -n $NAMESPACE \
  --type=merge -p '{"spec":{"mode":"paused"}}'
```

### Resume replication

To resume replication, change the replication mode to `running`.

```bash
kubectl patch psmdb-clustersync my-cluster-sync -n $NAMESPACE \
  --type=merge -p '{"spec":{"mode":"running"}}'
```

### Finalize the replication

To finalize replication, change the replication mode to `finalized`.
  
1. Check the replication lag:

    ```bash
    kubectl get psmdb-clustersync -n $NAMESPACE
    ```

2. When the `LAG(S)` value is acceptable and you are ready to complete the migration, run:

    ```bash
    kubectl patch psmdb-clustersync my-cluster-sync -n $NAMESPACE \
     --type=merge -p '{"spec":{"mode":"finalized"}}'
    ```

3. PCSM finalizes the replication, creates indexes on the target and stops. Check PCSM status for `state: finalized`.

    !!! warning
    
        This is a one-time operation. If you update PCSM again and change the mode to `running`, nothing happens to prevent accidental resync.

        To start over, you need to reset PSCM by running `pcsm reset` command manually inside the PCSM Pod.
 

4. Point your applications to the target cluster. See [Connect to Percona Server for MongoDB](connect.md).

### Clean up

When you no longer need the ClusterSync record, remove it:

```bash
kubectl delete psmdb-clustersync my-cluster-sync -n $NAMESPACE
```

This removes the PCSM Deployment and Operator-owned Secrets. The source credentials Secret and the MongoDB sync user on the target are not deleted automatically.

## 5. Troubleshooting

### PCSM Pod is not ready

Check the Deployment and Pod:

```bash
kubectl get deploy,pods -l app.kubernetes.io/component=clustersync -n $NAMESPACE
kubectl describe deploy my-cluster-sync-pcsm -n $NAMESPACE
kubectl logs deploy/my-cluster-sync-pcsm -n $NAMESPACE
```

Common causes:

* Source URI is unreachable from the cluster network
* Source credentials Secret is missing or has wrong keys (`username` / `password`)
* Target cluster is not `ready`
* Source and target major MongoDB versions differ

### Status shows `failed`

Inspect the error:

```bash
kubectl get psmdb-clustersync my-cluster-sync -n $NAMESPACE \
  -o jsonpath='{.status.state}{"\n"}{.status.error}{"\n"}'
```

If `spec.mode` is `running`, the Operator retries with `pcsm resume --from-failure` for recoverable failures after initial sync.

If the failure keeps recurring:

1. Pause replication to stop retries:

    ```bash
    kubectl patch psmdb-clustersync my-cluster-sync -n $NAMESPACE \
      --type=merge -p '{"spec":{"mode":"paused"}}'
    ```

2. Fix the root cause on the source or network side.
3. Resume with `mode: running`, or delete and recreate the ClusterSync CR to start a fresh initial sync.

Initial sync cannot be resumed after a hard failure. Recreate the ClusterSync CR to start over. See [Limitations](clustersync.md#limitations).


### Inspect PCSM from inside the Pod

For advanced troubleshooting:

```bash
kubectl exec -it deploy/my-cluster-sync-pcsm -n $NAMESPACE -- pcsm status
```

Use manual `pcsm` commands only when you need details beyond the Custom Resource status.

