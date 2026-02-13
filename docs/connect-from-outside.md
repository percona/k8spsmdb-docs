# Connect from your laptop or CI

If your application runs **outside** the Kubernetes cluster (for example on your laptop, in a CI pipeline, or in another cluster), it cannot use the internal DNS names like `<cluster-name>-mongos.<namespace>.svc.cluster.local`. You need to make the database reachable from outside the cluster.

## Option 1: Port-forward (local development)

For quick local testing, you can forward a port from your machine to the MongoDB service inside the cluster. No changes to the Custom Resource are required.

**Sharded cluster (mongos):**

```bash
kubectl port-forward svc/<cluster-name>-mongos -n <namespace> 27017:27017
```

**Replica set (sharding off):**

```bash
kubectl port-forward svc/<cluster-name>-rs0 -n <namespace> 27017:27017
```

Then connect using `localhost` in your connection string:

* Sharded: `mongodb://<user>:<password>@localhost:27017/admin?ssl=false`
* Replica set: `mongodb://<user>:<password>@localhost:27017/admin?replicaSet=rs0&ssl=false`

Replace `<cluster-name>` and `<namespace>` with your values. Keep the port-forward running while you use the database. This option is suitable for one developer at a time; for shared dev or staging, use NodePort or LoadBalancer.

## Option 2: Expose the cluster (NodePort or LoadBalancer)

To allow multiple developers, CI, or other services to reach the database without running `kubectl port-forward`, expose the cluster using a NodePort or LoadBalancer service. You configure this in the Custom Resource (for example `deploy/cr.yaml`).

* **NodePort:** The database is reachable at `<node-ip>:<node-port>`. You need the IP of a Kubernetes node and the port that the Operator assigned. Good for dev or staging when you have direct access to node IPs.
* **LoadBalancer:** The cloud provider (or your environment) creates a load balancer and gives you a hostname or IP. Use that hostname or IP in your connection string. Convenient on GKE, EKS, AKS, and similar.

For the exact Custom Resource options (`expose.enabled`, `expose.type`, and where to set them for mongos vs replica set), see [Configure external access](expose.md#connecting-from-outside-kubernetes). The connection string format is the same as in [Connect your application](connect-from-app.md); only the host (and port for NodePort) change to the exposed address.

## Summary

| Scenario | Use |
|----------|-----|
| Quick local test, one developer | Port-forward to `localhost:27017` |
| Shared dev/staging, or CI | Expose with NodePort or LoadBalancer and use that host (and port) in the URI |

After you have the host and port, build your URI as in [Connect your application](connect-from-app.md) and use it in your app or in [Connection examples](connection-examples.md).
