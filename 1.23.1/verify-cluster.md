> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Verify the cluster operation

Give the cluster a few minutes to initialize. Once `kubectl get psmdb -n <namespace>` shows the status as `ready`, you can connect to the database.

To connect to Percona Server for MongoDB, use the connection string Secret that the Operator creates for the `databaseAdmin` user. This Secret is available starting with Operator version 1.23.0 and newer. For previous versions, refer to the [Connect manually](#connect-manually-alternative) section.

1. List the Secrets objects:

   ```
   kubectl get secrets -n <namespace>
   ```

   The connection string Secret is named `my-cluster-name-databaseadmin-conn-str` by default.

1. Retrieve the connection string

   **Sharding is on**

   ```
   kubectl get secret <clusterName>-databaseadmin-conn-str -n <namespace> \
    -o jsonpath='{.data.databaseAdmin_mongos_connectionString}' | base64 --decode && echo
   ```

   **Sharding is off**

   ```
   kubectl get secret <clusterName>-databaseadmin-conn-str -n <namespace> \
   -o jsonpath='{.data.databaseAdmin_rs0_connectionStringSrv}' | base64 --decode && echo
   ```

   See [Connection secrets](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/connection-secrets.html) for other available keys.

1. Run a container with a MongoDB client and connect its console output to your terminal. The following command does this, naming the new Pod `percona-client`:

   ```
   kubectl run -i --rm --tty percona-client --image=percona/percona-server-mongodb:8.3.13-4 --restart=Never -- bash -il
   ```

   Executing it may require some time to deploy the corresponding Pod.

1. Connect using the connection string from step 2:

   ```
   mongosh "<connection-string>"
   ```

## Connect manually (alternative)

If you need to build a connection URI yourself, retrieve credentials from the user Secret and construct the URI.

1. List the Secrets objects:

   ```
   kubectl get secrets -n <namespace>
   ```

   The Secrets object you are interested in has the `<cluster-name>-secrets` name. (For the cluster `my-cluster-name`, the Secret name is `my-cluster-name-secrets`).

1. Retrieve the admin username and password:

   ```
   kubectl get secret <secret-name> -n <namespace> -o jsonpath='{.data.MONGODB_DATABASE_ADMIN_USER}' | base64 --decode && echo
   kubectl get secret <secret-name> -n <namespace> -o jsonpath='{.data.MONGODB_DATABASE_ADMIN_PASSWORD}' | base64 --decode && echo
   ```

1. Run a container with a MongoDB client and connect its console output to your terminal. The following command does this, naming the new Pod `percona-client`:

   ```
   kubectl -n <namespace> run -i --rm --tty percona-client --image=percona/percona-server-mongodb:8.3.13-4 --restart=Never -- bash -il
   ```

   It may take some time to deploy the corresponding Pod.

1. Now run `mongosh` tool inside the `percona-client` command shell using the admin user credentials you obtained from the Secret, and a proper namespace name instead of the `<namespace name>` placeholder. The command will look different depending on whether sharding is on (the default behavior) or off:

   **sharding is on**

   ```
   mongosh "mongodb://databaseAdmin:databaseAdminPassword@my-cluster-name-mongos.<namespace name>.svc.cluster.local/admin?ssl=false"
   ```

   **sharding is off**

   ```
   mongosh "mongodb+srv://databaseAdmin:databaseAdminPassword@my-cluster-name-rs0.<namespace name>.svc.cluster.local/admin?replicaSet=rs0&ssl=false"
   ```

## Next steps

[What’s next for operators](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/what-next-operations.html)
