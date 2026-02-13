# Connect your application

You can use the same MongoDB connection URI in your application that you use with `mongosh`. Any [MongoDB driver](https://www.mongodb.com/docs/drivers/) accepts this URI, so your app connects to Percona Server for MongoDB the same way whether it runs inside the cluster or outside it.

## Connection string format

The format depends on whether the cluster is **sharded** (default) or a **replica set only**.

=== "Sharded cluster (default)"

    Use the `mongos` service as the host:

    ```
    mongodb://<username>:<password>@<cluster-name>-mongos.<namespace>.svc.cluster.local/admin?ssl=false
    ```

    Replace `<cluster-name>` with your cluster name and `<namespace>` with the Kubernetes namespace. Get the cluster name with `kubectl get psmdb`.

=== "Replica set (sharding off)"

    Use the replica set service and include the replica set name:

    ```
    mongodb://<username>:<password>@<cluster-name>-rs0.<namespace>.svc.cluster.local/admin?replicaSet=rs0&ssl=false
    ```

Use the same URI in your application code. If TLS is enabled in your cluster, change `ssl=false` to `ssl=true` and ensure your client uses the correct CA; see [Transport encryption (TLS/SSL)](TLS.md).

## Where to get the URI parts

| Part | How to get it |
|------|----------------|
| **Username and password** | From the cluster Secret (admin user) or from an [application user](app-credentials.md) you created. See [Connect to Percona Server for MongoDB](connect.md) for the `kubectl` commands to read the admin credentials from the Secret. |
| **Cluster name** | Run `kubectl get psmdb -n <namespace>`. The name is in the `NAME` column. |
| **Namespace** | The namespace where you installed the Operator and database (for example `default` or `mongodb-operator`). |

## Next steps

* To use a dedicated user for your app (instead of the admin user), see [Get credentials for your app](app-credentials.md).
* If your application runs **outside** the cluster (for example on your laptop or in CI), see [Connect from your laptop or CI](connect-from-outside.md).
* For minimal code examples in Node.js, Python, and Go, see [Connection examples](connection-examples.md).
