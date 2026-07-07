# 2. Connect to Percona Server for MongoDB

In this tutorial, you will connect to the Percona Server for MongoDB cluster you deployed previously.

Starting with Operator version 1.23.0, the Operator creates a Secret with a ready-to-use connection string for the `databaseAdmin` user. Use it to connect to the database.

Here's how to do it:
{.power-number}

1. List the Secrets objects

    ```bash
    kubectl get secrets -n <namespace>
    ```

    The connection string Secret is named `<cluster_name>-databaseadmin-conn-str`. The `<cluster_name>` value is the [name of your Percona Distribution for MongoDB](operator.md#metadata). The default variant is:

    === "via kubectl" 

        `my-cluster-name-databaseadmin-conn-str`

    === "via Helm"

        `cluster1-databaseadmin-conn-str`

2. Retrieve the connection string. Replace `<cluster-name>` and `<namespace>` with your values:

    === "sharding is on"

        ```bash
        kubectl get secret <cluster-name>-databaseadmin-conn-str -n <namespace> \
          -o jsonpath='{.data.databaseAdmin_mongos_connectionString}' | base64 --decode && echo
        ```

        ??? example "Sample output"

            ```{.text .no-copy}
            mongodb://databaseAdmin:password123456@34.118.227.158:27017/?authSource=admin
            ```

    === "sharding is off"

        ```bash
        kubectl get secret <cluster-name>-databaseadmin-conn-str -n <namespace> \
          -o jsonpath='{.data.databaseAdmin_rs0_connectionStringSrv}' | base64 --decode && echo
        ```

        ??? example "Sample output"

            ```{.text .no-copy}
            mongodb+srv://databaseAdmin:password123456@my-cluster-name-rs0.mongodb-operator.svc.cluster.local/?authSource=admin&replicaSet=rs0
            ```
    See [Connection secrets](connection-secrets.md) for other key names (standard URI, exposed endpoints, custom users).

3. Run a container with a MongoDB client and connect its console output to your terminal. The following command does this, naming the new Pod `percona-client`:

    ```bash
    kubectl -n <namespace> run -i --rm --tty percona-client --image=percona/percona-server-mongodb:{{ mongodb80recommended }} --restart=Never -- bash -il
    ```

4. Connect to Percona Server for MongoDB using the connection string from step 2:

    ```bash
    mongosh "<connection-string>"
    ```

    ??? example

        The following example connects to the `admin` database of a Percona Server for MongoDB 8.0 sharded cluster named `my-cluster-name` in the `mongodb-operator` namespace:

        ```bash
        mongosh "mongodb://databaseAdmin:databaseAdminPassword@my-cluster-name-mongos.mongodb-operator.svc.cluster.local/admin?authSource=admin"
        ```

        The exact URI depends on your cluster configuration. Use the value retrieved from the connection string Secret.


Congratulations! You have connected to Percona Server for MongoDB. 

## Next steps

[Insert sample data :material-arrow-right:](data-insert.md){.md-button}
