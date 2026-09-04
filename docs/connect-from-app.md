# Connect your application


The Operator creates Kubernetes Secrets with ready-to-use MongoDB connection strings. Use those URIs in your application instead of building the connection string by hand. Any [MongoDB driver](https://www.mongodb.com/docs/drivers/) accepts the URI, so your app connects the same way whether it runs inside the cluster or outside it.

For Secret names, key layout, and exposed endpoints, see [Connection secrets](connection-secrets.md).

## Get a connection string

1. List Secrets in your namespace:

    ```bash
    kubectl get secrets -n <namespace>
    ```

2. Retrieve the URI for the user your app should use.

    === "`databaseAdmin` (sharded cluster)"

        Secret: `<cluster-name>-databaseadmin-conn-str`

        ```bash
        kubectl get secret <cluster-name>-databaseadmin-conn-str -n <namespace> \
          -o jsonpath='{.data.databaseAdmin_mongos_connectionString}' | base64 --decode && echo
        ```

    === "`databaseAdmin` (replica set, sharding off)"

        Secret: `<cluster-name>-databaseadmin-conn-str`

        ```bash
        kubectl get secret <cluster-name>-databaseadmin-conn-str -n <namespace> \
          -o jsonpath='{.data.databaseAdmin_rs0_connectionStringSrv}' | base64 --decode && echo
        ```

    === "Application user"

        For an Operator-managed application user, use that user’s connection string Secret (for example `<cluster-name>-custom-user-secret-conn-str`, or `<passwordSecretRef.name>-conn-str` when you supply the password Secret).

        Keys follow `<username>_mongos_connectionString` on sharded clusters. See [Connection secrets](connection-secrets.md#secret-names) for naming details.

        ```bash
        kubectl get secret <connection-secret-name> -n <namespace> \
          -o jsonpath='{.data.<username>_mongos_connectionString}' | base64 --decode && echo
        ```

For testing you can use `databaseAdmin`. For production, create a dedicated [application user](app-credentials.md) and use its connection string Secret.

## Use the URI in your application

Pass the decoded URI to your MongoDB driver as the connection string. Example shape (values come from the Secret; do not hardcode passwords):

```
mongodb://user:password@host:27017/?authSource=admin
```

If the cluster has [TLS enabled](TLS.md), the Operator includes the TLS parameters in the generated URI. Use an `_connectionStringExposed` key when your app connects from outside the cluster through an [exposed](expose.md) Service.

## Next steps

[Get credentials for your app](app-credentials.md){.md-button}
[Connection examples (Node, Python, Go)](connection-examples.md){.md-button}
