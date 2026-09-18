# 2. Connect and insert sample data

In this tutorial, you connect to the Percona Server for MongoDB cluster you deployed
previously, then insert some sample data so later steps have something to work with.

## Connect to the database

The Operator creates a Secret with a ready-to-use connection string for the `databaseAdmin`
user. Use it to connect to the database.
{.power-number}

1. List the Secrets objects

    ```bash
    kubectl get secrets -n <namespace>
    ```

    The connection string Secret is named `<cluster_name>-databaseadmin-conn-str`. The `<cluster_name>` value is the [name of your Percona Server for MongoDB](operator.md#metadata). The default variant is:

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

3. Open an interactive `mongosh` shell using that connection string.

    * Run the container with a MongoDB client and connect its console output to your terminal. The following command does this, naming the new Pod `percona-client`:

        ```bash
        kubectl -n <namespace> run -i --rm --tty percona-client --image=percona/percona-server-mongodb:{{ mongodb80recommended }} --restart=Never -- bash -il
        ```

    * Connect to Percona Server for MongoDB using the connection string from step 2:

        ```bash
        mongosh "<connection-string>"
        ```

        ??? example

            The following example connects to the `admin` database of a Percona Server for MongoDB 8.0 sharded cluster named `my-cluster-name` in the `mongodb-operator` namespace:

            ```bash
            mongosh "mongodb://databaseAdmin:databaseAdminPassword@my-cluster-name-mongos.mongodb-operator.svc.cluster.local/admin?authSource=admin"
            ```

            The exact URI depends on your cluster configuration. Use the value retrieved from the connection string Secret.


To connect from your own application (connection string, credentials, code examples) instead,
see [Get started](get-a-cluster.md) (developer path) or [Connect your
application](connect-from-app.md).

Keep this shell open - you'll use it in the next section.

## Insert sample data

MongoDB provides [multiple methods for data insert  :octicons-link-external-16:](https://www.mongodb.com/docs/v7.0/reference/insert-methods/). We will use a `For` loop to insert some sample documents.
{.power-number}

1. Run the following command: 

    ``` {.javascript data-prompt="admin>"}
    admin> for (var i = 1; i <= 50; i++) {
       db.test.insertOne( { x : i } )
    }
    ```

    If there is no `test` collection created, MongoDB creates when inserting documents.

    ??? example "Output"

        ```{.json .no-copy}
        {
          acknowledged: true,
          insertedId: ObjectId("652567e5eedca48f97e1868f")
        }
        ```

2. Query the collection to verify the data insertion

    ``` {.javascript data-prompt="admin>"}
    admin> db.test.find()
    ```

    ??? example "Output"

        ```{.json .no-copy}
        [
          { _id: ObjectId("652567e4eedca48f97e1865e"), x: 1 },
          { _id: ObjectId("652567e4eedca48f97e1865f"), x: 2 },
          { _id: ObjectId("652567e4eedca48f97e18660"), x: 3 },
          { _id: ObjectId("652567e4eedca48f97e18661"), x: 4 },
          { _id: ObjectId("652567e4eedca48f97e18662"), x: 5 },
          { _id: ObjectId("652567e4eedca48f97e18663"), x: 6 },
          { _id: ObjectId("652567e4eedca48f97e18664"), x: 7 },
          { _id: ObjectId("652567e4eedca48f97e18665"), x: 8 },
          { _id: ObjectId("652567e4eedca48f97e18666"), x: 9 },
          { _id: ObjectId("652567e4eedca48f97e18667"), x: 10 },
          { _id: ObjectId("652567e4eedca48f97e18668"), x: 11 },
          { _id: ObjectId("652567e4eedca48f97e18669"), x: 12 },
          { _id: ObjectId("652567e4eedca48f97e1866a"), x: 13 },
          { _id: ObjectId("652567e4eedca48f97e1866b"), x: 14 },
          { _id: ObjectId("652567e4eedca48f97e1866c"), x: 15 },
          { _id: ObjectId("652567e4eedca48f97e1866d"), x: 16 },
          { _id: ObjectId("652567e4eedca48f97e1866e"), x: 17 },
          { _id: ObjectId("652567e4eedca48f97e1866f"), x: 18 },
          { _id: ObjectId("652567e4eedca48f97e18670"), x: 19 },
          { _id: ObjectId("652567e4eedca48f97e18671"), x: 20 }
        ]
        ```

        You will have different `_id` values.

Now your cluster has some data in it.

You're done with the `percona-client` Pod now. Exit `mongosh` and the shell (`exit` or Ctrl+D,
twice), then delete the Pod:

```bash
kubectl delete pod percona-client -n <namespace>
```

Congratulations! You have connected to Percona Server for MongoDB and inserted sample data.

## Next steps

[Take your first backup :material-arrow-right:](backup-tutorial.md){.md-button}
