# Get credentials for your app

For production and for most applications, you should use a dedicated **application-level (unprivileged) user** instead of the database admin account. The Operator can create this user for you and store the credentials in a Kubernetes Secret that your app can read.

## Create one application user via Custom Resource

You define the user in the Percona Server for MongoDB Custom Resource. The Operator creates the user in the database and a Secret with the password.

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

3. The Operator creates a Secret named `<cluster-name>-custom-user-secret`. The password is stored under a key with the same name as the user (for example `my-app-user`). To read the password:

    ```bash
    kubectl get secret <cluster-name>-custom-user-secret -n <namespace> -o jsonpath='{.data.my-app-user}' | base64 --decode
    ```

    Use this username and password in your application connection string. The URI format is the same as in [Connect your application](connect-from-app.md); only the username and password change.

## Use the credentials in your app

* **Inside Kubernetes:** Mount the Secret as environment variables or a file in your app's Pod, and build the connection URI from those values. For example, set `MONGODB_USER` and `MONGODB_PASSWORD` from the Secret and use them in the URI.
* **Outside Kubernetes:** Read the Secret with `kubectl` (as above). Then pass the credentials into your app via config or environment variables.

!!! note "More options"

    For manually created passwords, multiple users, custom roles, and other options, see [Application-level (unprivileged) users](app-users.md).
