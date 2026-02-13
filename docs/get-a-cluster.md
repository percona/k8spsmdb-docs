# Get a cluster

You need a running Percona Server for MongoDB cluster before you can connect your application. Choose one of the options below.

## Option 1: Quick install (you run Kubernetes)

If you have a Kubernetes cluster (Minikube, kind, or a cloud provider), you can install the Operator and database in a few minutes.

* **[Install with kubectl](kubectl.md)** — Apply the Operator and database manifests. Best if you prefer standard Kubernetes workflows.
* **[Install with Helm](helm.md)** — Use Helm charts for the same result.

After installation, get the cluster name and namespace (for example with `kubectl get psmdb -n <namespace>`). You will need them for the [connection string](connect-from-app.md).

## Option 2: Your team already has a cluster

If your platform or SRE team runs Percona Operator for MongoDB, ask them for:

* The **connection string** or the **cluster name** and **namespace**
* **Credentials** (username and password) for an application user, or the Secret name to read them from.

Then go to [Connect your application](connect-from-app.md) and [Get credentials for your app](app-credentials.md) if you need to create or use an app user.


## Next step

[Connect your application :material-arrow-right:](connect-from-app.md){.md-button}
