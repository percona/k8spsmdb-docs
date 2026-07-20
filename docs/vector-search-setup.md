# Configure vector search

!!! admonition "Version added: [1.23.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.23.0.md)"

!!! warning "Tech preview"

    Vector search is in the tech preview stage. Use it in staging or testing
    environments and share your feedback. 

This guide shows how to enable vector search on a cluster managed by
Percona Operator for MongoDB, insert sample vector data, create a vector search
index, and run a `$vectorSearch` query.

This setup uses the following software versions:

* Percona Operator for MongoDB 1.23.0
* Percona Server for MongoDB 8.3
* mongot {{mongot}}.

To learn how vector search works with the Operator, see
[Vector search](vector-search.md).

## Before you start

1. Make sure you understand [requirements](vector-search.md#availability-and-requirements) and [limitations](vector-search.md#limitations) of using vector search.
2. Clone the repository with all manifests and source code:
  
    ```bash
    git clone -b v{{release}} https://github.com/percona/percona-server-mongodb-operator
    cd percona-server-mongodb-operator
    ```

3. Create the namespace and export it as environment variable. Replace the `<namespace>` placeholder with your value:

    ```bash
    kubectl create namespace <namespace>
    export NAMESPACE=<namespace>
    ```

## Deploy the Operator

Install the Operator by applying the `deploy/bundle.yaml` manifest. This also installs CRDs, Role-based access control (RBAC) and the Operator deployment:
    
```bash
kubectl apply --server-side -f deploy/bundle.yaml
```

As the result you will have the Operator Pod up and running.

## Install Percona Server for MongoDB and enable vector search

1. Edit the `deploy/cr.yaml` Custom Resource. Specify the following keys:

    * Set the database image to Percona Server for MongoDB 8.3 in `spec.image`
    * Set `spec.search.enabled` to `true`
    * Specify the `mongot` image in `spec.search.image`
    * Keep `size: 1` as only one `mongot` pod is allowed per replica set or shard.
    * Configure storage for `mongot` based on your data set. Check [Requirements](vector-search.md#availability-and-requirements) for guidance on estimating storage size.

    Here's the example configuration:

    ```yaml
    apiVersion: psmdb.percona.com/v1
    kind: PerconaServerMongoDB
    metadata:
      name: some-name
      finalizers:
        - percona.com/delete-psmdb-pvc
    spec:
      image: perconalab/percona-server-mongodb:8.3
      search:
        enabled: true
        image: perconalab/percona-search-mongodb:{{mongot}}
        size: 1
        storage:
          persistentVolumeClaim:
            resources:
              requests:
                storage: 10Gi
        resources:
          requests:
            cpu: "2"
            memory: 2Gi
      replsets:
        - name: rs0
          affinity:
            antiAffinityTopologyKey: none
          resources:
            limits:
              cpu: "500m"
              memory: 1G
            requests:
              cpu: "100m"
              memory: 100Mi
          volumeSpec:
            persistentVolumeClaim:
              resources:
                requests:
                  storage: 3Gi
     #The rest of your configuration
    ```

2. Apply the Custom Resource to install Percona Server for MongoDB:

    ```bash
    kubectl apply -f deploy/cr.yaml -n $NAMESPACE
    ```

### Verify that search is ready

Wait until the search pod is running. For a cluster named `my-cluster-name`
with replica set `rs0`, the pod is `my-cluster-name-rs0-search-0`:

```bash
kubectl get pods -n $NAMESPACE | grep search
```

??? example "Expected output"

    ```{.text .no-copy}
    my-cluster-name-rs0-search-0   1/1     Running   0          2m
    ```

You can also check search status on the cluster Custom Resource:

```bash
kubectl get psmdb <cluster-name> -n $NAMESPACE -o jsonpath='{.status.search}' && echo
```

??? example "Expected output"

    ```{.json .no-copy}
    {"rs0":{"ready":1,"size":1,"status":"ready"}}
    ```

When search is ready, `status.search` shows the replica set or shard entry with
`status: ready`.

## Connect to the cluster

Open a MongoDB client session the same way as in
[Connect to Percona Server for MongoDB](connect.md). Use an application user
with `readWrite` and `dbAdmin` (or equivalent) on the database where you will
store vectors — not the Operator's `searchCoordinator` system user.

The examples below use:

* Database: `myApp`
* Collection: `vectors`
* User: `myApp` / `myPass` (create this user if it does not exist yet)

Create the user if needed:

```{.javascript data-prompt="admin>"}
admin> db.getSiblingDB("admin").createUser({
  user: "myApp",
  pwd: "myPass",
  roles: [
    { db: "myApp", role: "readWrite" },
    { db: "myApp", role: "dbAdmin" }
  ]
})
```

Then authenticate as that user, or reconnect with those credentials.

## Insert vector data

Switch to your application database and insert documents that include an
embedding field. Each embedding is an array of numbers. In a real workload you
generate embeddings with an embedding model; here we use small sample vectors
so you can try the feature quickly.

```{.javascript data-prompt="myApp>"}
myApp> use myApp
myApp> db.vectors.insertMany([
  { name: "apple",  embedding: [1.0, 0.0, 0.0] },
  { name: "banana", embedding: [0.8, 0.2, 0.0] },
  { name: "carrot", embedding: [0.6, 0.4, 0.0] },
  { name: "dill",   embedding: [0.2, 0.8, 0.0] },
  { name: "egg",    embedding: [0.0, 1.0, 0.0] }
])
```

Confirm the documents are there:

```{.javascript data-prompt="myApp>"}
myApp> db.vectors.find().pretty()
```

## Create a vector search index

Create a `vectorSearch` index on the `embedding` field. The
`numDimensions` value must match the length of your embedding arrays (here,
`3`). The `similarity` metric can be `cosine`, `euclidean`, or `dotProduct` —
use the same metric your embedding model expects.

```{.javascript data-prompt="myApp>"}
myApp> db.vectors.createSearchIndex(
  "vector_search_index",
  "vectorSearch",
  {
    fields: [
      {
        type: "vector",
        path: "embedding",
        numDimensions: 3,
        similarity: "cosine"
      }
    ]
  }
)
```

Wait until the index is ready to serve queries. An index is queryable when
`queryable` is `true` or `status` is `READY`:

```{.javascript data-prompt="myApp>"}
myApp> db.vectors.getSearchIndexes("vector_search_index")
```

??? example "Sample output when the index is ready"

    ```{.json .no-copy}
    [
      {
        "id": "...",
        "name": "vector_search_index",
        "status": "READY",
        "queryable": true,
        "latestDefinitionVersion": { "version": 0, "createdAt": "2026-07-15T06:57:54.000Z" },
        "latestDefinition": {
          "fields": [
            {
              "type": "vector",
              "path": "embedding",
              "numDimensions": 3,
              "similarity": "cosine"
            }
          ]
        }
      }
       ...
    ]
    ```

If the index is still building, wait a short time and run
`getSearchIndexes` again.

## Run a vector search query

Use the `$vectorSearch` aggregation stage. The `queryVector` must have the same
number of dimensions as the indexed field. This example finds the three nearest
neighbors to `[1.0, 0.0, 0.0]` (closest to `"apple"`):

```{.javascript data-prompt="myApp>"}
myApp> db.vectors.aggregate([
  {
    $vectorSearch: {
      index: "vector_search_index",
      path: "embedding",
      queryVector: [1.0, 0.0, 0.0],
      numCandidates: 5,
      limit: 3
    }
  }
])
```

??? example "Expected nearest neighbors"

    ```{.json .no-copy}
    [
      { _id: ObjectId("..."), name: "apple",  embedding: [1.0, 0.0, 0.0] },
      { _id: ObjectId("..."), name: "banana", embedding: [0.8, 0.2, 0.0] },
      { _id: ObjectId("..."), name: "carrot", embedding: [0.6, 0.4, 0.0] }
    ]
    ```

You can add further aggregation stages after `$vectorSearch` (for example
`$project`) to shape the output.

For more index and query options, see the
[MongoDB Vector Search documentation :octicons-link-external-16:](https://www.mongodb.com/docs/vector-search/).

