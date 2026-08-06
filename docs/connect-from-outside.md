# Connect from your laptop or CI

If your application runs **outside** the Kubernetes cluster (for example on your laptop, in a CI pipeline, or in another cluster), it cannot use the internal DNS names like `<cluster-name>-mongos.<namespace>.svc.cluster.local`. You need to make the database reachable from outside the cluster, then use a connection string from the Operator’s [connection Secrets](connection-secrets.md).

## Option 1: Port-forward (local development)

For quick local testing, forward a port from your machine to the MongoDB service inside the cluster. No changes to the Custom Resource are required.

**Sharded cluster (mongos):**

```bash
kubectl port-forward svc/<cluster-name>-mongos -n <namespace> 27017:27017
```

**Replica set (sharding off):**

```bash
kubectl port-forward svc/<cluster-name>-rs0 -n <namespace> 27017:27017
```

Keep the port-forward running while you use the database.

1. Retrieve a connection string from the Secret (for example for `databaseAdmin` on a sharded cluster):

    ```bash
    kubectl get secret <cluster-name>-databaseadmin-conn-str -n <namespace> \
      -o jsonpath='{.data.databaseAdmin_mongos_connectionString}' | base64 --decode && echo
    ```

    For an application user, use that user’s `*-conn-str` Secret instead. See [Connect your application](connect-from-app.md).

2. Connect with `mongosh` (or your driver) using the username, password, and `authSource` from that URI, but with host `localhost:27017` because of the port-forward. Example shape:

    ```bash
    mongosh "mongodb://<user>:<password>@localhost:27017/?authSource=admin"
    ```

This option is suitable for one developer at a time. For shared dev or staging, use NodePort or LoadBalancer.

## Option 2: Expose the cluster (NodePort or LoadBalancer)

To allow multiple developers, CI, or other services to reach the database without running `kubectl port-forward`, expose the cluster using a NodePort or LoadBalancer Service in the Custom Resource (for example `deploy/cr.yaml`).

* **NodePort:** The database is reachable at `<node-ip>:<node-port>`.
* **LoadBalancer:** The cloud provider (or your environment) assigns a hostname or IP.

For Custom Resource options (`expose.enabled`, `expose.type`, and where to set them for mongos vs replica set), see [Configure external access](expose.md#connecting-from-outside-kubernetes).

After the Service is exposed, the Operator updates the connection Secrets with `_connectionStringExposed` keys. Retrieve that URI and use it as-is:

=== "Sharded cluster"

    ```bash
    kubectl get secret <cluster-name>-databaseadmin-conn-str -n <namespace> \
      -o jsonpath='{.data.databaseAdmin_mongos_connectionStringExposed}' | base64 --decode && echo
    ```

=== "Replica set (sharding off)"

    ```bash
    kubectl get secret <cluster-name>-databaseadmin-conn-str -n <namespace> \
      -o jsonpath='{.data.databaseAdmin_rs0_connectionStringExposed}' | base64 --decode && echo
    ```

For application users, use the matching `_connectionStringExposed` key in that user’s connection Secret. See [Connection secrets](connection-secrets.md).

## Summary

| Scenario | Use |
|----------|-----|
| Quick local test, one developer | Port-forward to `localhost:27017`, reuse credentials from the connection Secret URI |
| Shared dev/staging, or CI | Expose with NodePort or LoadBalancer, then use the `_connectionStringExposed` URI from the connection Secret |

Use the URI in your app or in [Connection examples](connection-examples.md).
