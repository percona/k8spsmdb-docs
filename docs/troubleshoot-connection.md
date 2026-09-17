# Troubleshoot connection issues

Use this page when your application cannot connect to Percona Server for MongoDB. For cluster or Operator issues (pods not starting, backups failing, and so on), see [Troubleshooting](debug.md).

## Connection refused

**Symptom:** The driver reports "connection refused" or "ECONNREFUSED."

**Common causes:**

* **Your app runs outside the cluster** and you are using the internal hostname (for example `my-cluster-mongos.default.svc.cluster.local`). That hostname works only inside Kubernetes. Use [port-forward](connect-from-outside.md#option-1-port-forward-local-development) for local dev or [expose the cluster](connect-from-outside.md#option-2-expose-the-cluster-nodeport-or-loadbalancer) (NodePort or LoadBalancer) and use the external host and port in your URI.
* **Port-forward is not running.** If you use port-forward, keep the `kubectl port-forward` command running while you connect.
* **Wrong port.** Default MongoDB port is 27017. If you use NodePort, use the NodePort number in your URI.

## Authentication failed

**Symptom:** "Authentication failed" or "auth failed."

**Common causes:**

* **Wrong username or password.** Get the credentials from the correct Secret. For the admin user, see [Connect to Percona Server for MongoDB](connect.md). For an application user, see [Get credentials for your app](app-credentials.md). Ensure there are no extra spaces when reading from the Secret (for example when using `base64 --decode`).
* **Wrong database in the URI.** The user may be defined on the `admin` database; use `/admin` in the URI path (for example `mongodb://user:pass@host/admin?ssl=false`).
* **User does not exist yet.** If you added a user in the Custom Resource, apply the change and wait for the Operator to create the user and Secret.

## Wrong replica set name or hostname

**Symptom:** "No primary found" or "replica set name does not match."

**Common causes:**

* **Replica set name missing or wrong.** For a non-sharded cluster, the URI must include `replicaSet=rs0` (for example `.../admin?replicaSet=rs0&ssl=false`). See [Connect your application](connect-from-app.md#connection-string-format).
* **Sharded vs replica set.** If the cluster is sharded (default), connect to the **mongos** host (`<cluster-name>-mongos.<namespace>.svc.cluster.local`), not the replica set host. If sharding is off, use the **rs0** host and `replicaSet=rs0`.

## Cannot resolve hostname

**Symptom:** "getaddrinfo ENOTFOUND" or "no such host."

**Common causes:**

* **App runs outside the cluster.** Internal DNS names (`.svc.cluster.local`) resolve only inside the cluster. Use [Connect from your laptop or CI](connect-from-outside.md): port-forward (then use `localhost` in the URI) or expose the cluster and use the external hostname or IP.
* **Typo in cluster name or namespace.** Check with `kubectl get psmdb -A`. Use the exact cluster name and namespace in the URI.

## TLS/SSL errors

**Symptom:** SSL handshake or certificate errors.

**Common causes:**

* **TLS is enabled** on the cluster but your URI has `ssl=false`, or the reverse. Match the URI to the cluster: if the cluster uses TLS, use `ssl=true` and ensure the client trusts the CA. See [Transport encryption (TLS/SSL)](TLS.md).
* **Wrong CA or certificate.** For production, use the correct CA certificate or system trust store.

---

## More help

* [Connect your application](connect-from-app.md) — URI format and where to get each part.
* [Connect from your laptop or CI](connect-from-outside.md) — Port-forward and external access.
* [Troubleshooting](debug.md) — Operator and cluster-level debugging.
