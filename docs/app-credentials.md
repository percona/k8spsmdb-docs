# Get credentials for your app

When the Operator creates a database cluster, it creates the Secret with the admin user credentials. This Secret is referenced in the `.spec.secrets.users` option in the Custom Resource. Read more about these users in [System users](system-users.md).

The Operator also creates the [connection Secret](connection-secrets.md) for the `databaseAdmin` user that contains auto-generated connection string URIs. You can use them directly in your app. 

For testing, you can reuse the `databaseAdmin` connection string Secret. See [Connect to Percona Server for MongoDB](connect.md) for the steps.

For production and for most applications, create a dedicated **application-level (unprivileged) user** instead of using `databaseAdmin`. The Operator creates the user, a password Secret, and a connection string Secret that your app can read.

## Create one application user via Custom Resource

You define the user in the Percona Server for MongoDB Custom Resource. The Operator creates the user in the database, a Secret with the password, and a connection string Secret.

1. Edit the Custom Resource (for example `deploy/cr.yaml`). Add a `users` section with your application user:

    ```yaml
    spec:
      # ... other spec fields ...
      users:
        - name: my-app-user
          db: admin
          roles:
            - name: readWrite
              db: mydb
    ```

    Replace `my-app-user` with the username you want, and adjust `roles` and `db` for your app (for example `readWrite` on your application database). You can omit `passwordSecretRef`; the Operator will generate a password and store it in a Secret.

2. Apply the change:

    ```bash
    kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

3. The Operator creates:

    * A password Secret named `<cluster-name>-custom-user-secret` (password key matches the username, for example `my-app-user`)
    * A connection string Secret named `<cluster-name>-custom-user-secret-conn-str`

    Retrieve the ready-to-use URI (sharded cluster example):

    ```bash
    kubectl get secret <cluster-name>-custom-user-secret-conn-str -n <namespace> \
      -o jsonpath='{.data.my-app-user_mongos_connectionString}' | base64 --decode && echo
    ```

    If you set `passwordSecretRef.name`, the connection Secret is named `<passwordSecretRef.name>-conn-str` instead. See [Connection secrets](connection-secrets.md#secret-names) for naming and key patterns (including replica set and exposed endpoints).

## Use the connection string in your app

* **Inside Kubernetes:** Mount the connection string Secret as an environment variable or file in your app’s Pod. Prefer the full URI over separate username/password fields. Example pattern:

    ```yaml
    env:
    - name: MONGODB_URI
      valueFrom:
        secretKeyRef:
          name: my-cluster-name-custom-user-secret-conn-str
          key: my-app-user_mongos_connectionString
    ```

* **Outside Kubernetes:** Decode the URI with `kubectl` (as above), then pass it into your app via config or environment variables. For access from outside the cluster, see [Connect from your laptop or CI](connect-from-outside.md).

!!! note "More options"

    For manually created passwords, multiple users, custom roles, and other options, see [Application-level (unprivileged) users](app-users.md).

## Next steps

[Connect from your laptop or CI](connect-from-outside.md){.md-button}
