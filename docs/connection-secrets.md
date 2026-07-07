# Connection Secrets

!!! note "Version added: [1.23.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.23.0.md)"

The Operator creates and maintains Kubernetes Secrets that contain ready-to-use MongoDB connection strings your applications need. This gives your developers and administrators a single, reliable source of connection information without manual configuration.

The Operator updates connection Secrets when cluster topology, external access settings, or user passwords change. If you try to manually update a connection Secret, the Operator overwrites your changes with the next reconciliation.

## Secret names

The Operator creates connection Secrets for the following users:

* The **`databaseAdmin`** system user. 
* **Operator-managed application-level users** declared in the Custom Resource. 

| User type | Password Secret | Connection string Secret |
|:----------|:----------------|:-------------------------|
| `databaseAdmin` | `<cluster-name>-secrets` (by default) | `<cluster-name>-databaseadmin-conn-str` |
| Custom user (auto-generated password) | `<cluster-name>-custom-user-secret` | `<cluster-name>-custom-user-secret-conn-str` |
| Custom user (manual password) | Name from `passwordSecretRef.name` | `<passwordSecretRef.name>-conn-str` |

The `<cluster-name>` value is the `metadata.name` of your `PerconaServerMongoDB` Custom Resource.
  
### `databaseAdmin` connection Secret

The Operator creates a dedicated connection Secret for the `databaseAdmin` system user, named `<cluster-name>-databaseadmin-conn-str`. Credentials for `databaseAdmin` and all other system users such as `userAdmin`, `clusterAdmin`, `backup`, and so on, are included in the password Secret `<cluster-name>-secrets`.

### Connection Secret for application users

For application users that you define in the cluster Custom Resource, the Operator creates one connection Secret per password Secret. If several application users share the same password Secret, the Operator stores connection strings for all of them in a single connection Secret. Each user has its own set of keys inside that Secret.

The Operator does **not** create connection Secrets for users in the **`$external`** database — the ones you create for LDAP and other external authentication methods.

## Secret structure

A connection Secret is a standard Kubernetes `Secret`. Its `data` map holds one base64-encoded MongoDB URI per key. Each key name tells you which user, target, and connection type the URI is for.

Keys follow the pattern `<user>_<target>_<suffix>`:

* The `<user>` part matches the Percona Server for MongoDB username. For example, `databaseAdmin`. Characters that are not allowed in Kubernetes Secret keys are replaced with underscores.
* The `<target>` part is the name of each replica set. For sharded clusters, `<target>` matches the name of each shard,  config server replica set and `mongos`. 
* The `<suffix>` part defines the connection type. Available types are:

  * `_connectionString` - for internal connection using internal replica-set addresses.
  * `_connectionStringSrv` - for connection using the replica set Service hostname 
  * `_connectionStringSrvExposed` - for external access when a replica set or `mongos` Service is [exposed](expose.md) and its exposed endpoint differs from its internal URI.

The following is the example of the `data` map for the sharded cluster:

=== "`<cluster-name>-databaseadmin-conn-str` Secret"

    ```yaml
    data:
      databaseAdmin_cfg_connectionString: <base64>           # config server — internal Pod addresses
      databaseAdmin_cfg_connectionStringSrv: <base64>        # config server — via Service DNS (mongodb+srv)
      databaseAdmin_cfr_connectionStringExposed: <base64>  # shard config server — external endpoints (when exposed)
      databaseAdmin_rs0_connectionString: <base64>           # shard rs0 — internal Pod addresses
      databaseAdmin_rs0_connectionStringSrv: <base64>        # shard rs0 — via Service DNS (mongodb+srv)
      databaseAdmin_rs0_connectionStringExposed: <base64>  # shard rs0 — external endpoints (when exposed)
      databaseAdmin_mongos_connectionString: <base64>        # mongos router — internal access
      databaseAdmin_mongos_connectionStringExposed: <base64>        # mongos router — external endpoints (when service per Pod is enabled)
    ```

=== "`<appl-user>-conn-str` Secret"
    
    For custom users on sharded clusters, only `mongos` keys are present.
    
    ```yaml
    data:
      <username>_mongos_connectionString: <base64> # mongos router — internal access 
      <username>_mongos_connectionStringExposed: <base64> # mongos router — external endpoints (when service per Pod is enabled)
    ```

## URI format

Generated URIs include:

* URL-encoded username and password
* `authSource` — `admin` for the `databaseAdmin` user, or the user's database for custom users
* `replicaSet` — for replica set connection strings
* `tls=true` — when [TLS is enabled](TLS.md) for the cluster

When TLS is disabled, the URI does not include TLS parameters.

## Retrieve a connection string

Replace `<cluster-name>`, `<namespace>`, and the key name with your values.

=== "Sharded cluster (via mongos)"

    ```bash
    kubectl get secret <cluster-name>-databaseadmin-conn-str -n <namespace> \
      -o jsonpath='{.data.databaseAdmin_mongos_connectionString}' | base64 --decode && echo
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        mongodb://databaseAdmin:databaseAdmin123456@34.118.227.158:27017/?authSource=admin&tls=true
        ```

=== "Replica set (standard URI)"

    ```bash
    kubectl get secret <cluster-name>-databaseadmin-conn-str -n <namespace> \
      -o jsonpath='{.data.databaseAdmin_rs0_connectionString}' | base64 --decode && echo
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        mongodb://databaseAdmin:databaseAdmin123456@my-cluster-name-rs0-0.my-cluster-name-rs0.mongodb-operator.svc.cluster.local:27017,my-cluster-name-rs0-1.my-cluster-name-rs0.mongodb-operator.svc.cluster.local:27017,my-cluster-name-rs0-2.my-cluster-name-rs0.mongodb-operator.svc.cluster.local:27017/?authSource=admin&replicaSet=rs0&tls=true
        ```

=== "Replica set (SRV URI)"

    ```bash
    kubectl get secret <cluster-name>-databaseadmin-conn-str -n <namespace> \
      -o jsonpath='{.data.databaseAdmin_rs0_connectionStringSrv}' | base64 --decode && echo
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        mongodb+srv://databaseAdmin:databaseAdmin123456@my-cluster-name-rs0.mongodb-operator.svc.cluster.local/?authSource=admin&replicaSet=rs0
        ```

=== "Exposed replica set"

    ```bash
    kubectl get secret <cluster-name>-databaseadmin-conn-str -n <namespace> \
      -o jsonpath='{.data.databaseAdmin_rs0_connectionStringExposed}' | base64 --decode && echo
    ```

    ??? example "Sample output"
        
        ```{.text .no-copy}
        mongodb://databaseAdmin:databaseAdmin123456@35.254.99.120:27017,34.132.106.13:27017,136.64.169.49:27017/?authSource=admin&replicaSet=rs0&tls=true
        ```

To inspect all available keys:

```bash
kubectl get secret <cluster-name>-databaseadmin-conn-str -n <namespace> -o jsonpath='{.data}' | jq 'keys'
```

## Use in an application Deployment

Reference the connection string Secret in your application manifest:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    spec:
      containers:
      - name: app
        image: my-app:latest
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: my-cluster-name-custom-user-secret-conn-str
              key: my-user_mongos_connectionString
```

For the `databaseAdmin` user, use `<cluster-name>-databaseadmin-conn-str` as the Secret name. Prefer [application-level users](app-users.md) for application workloads instead of system users.

