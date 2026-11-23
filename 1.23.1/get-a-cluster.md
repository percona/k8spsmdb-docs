> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Get a cluster

You need a running Percona Server for MongoDB cluster before you can connect your application. Choose one of the options below.

## Option 1: Quick install (you run Kubernetes)

If you have a Kubernetes cluster (Minikube, kind, or a cloud provider), you can install the Operator and database in a few minutes.

- **[Install with kubectl](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/kubectl.html)** — Apply the Operator and database manifests. Best if you prefer standard Kubernetes workflows.
- **[Install with Helm](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/helm.html)** — Use Helm charts for the same result.

After installation, get the cluster name and namespace (for example with `kubectl get psmdb -n <namespace>`). You will need them for the [connection string](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/connect-from-app.html).

## Option 2: Your team already has a cluster

If your platform or SRE team runs Percona Operator for MongoDB, ask them for:

- The **connection string** or the **cluster name** and **namespace**
- **Credentials** (username and password) for an application user, or the Secret name to read them from.

Then go to [Connect your application](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/connect-from-app.html) and [Get credentials for your app](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/app-credentials.html) if you need to create or use an app user.

## Next step

[Connect your application](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/connect-from-app.html)
