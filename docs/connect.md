# 2. Connect to Percona Server for MongoDB

In this tutorial, you will connect to the Percona Server for MongoDB cluster you deployed previously.

To connect to Percona Server for MongoDB you need to construct the MongoDB connection URI string. It includes the credentials of the admin user, which are stored in the Secrets object. 

Here's how to do it:
{.power-number}

1. List the Secrets objects

    ```bash
    kubectl get secrets -n <namespace>
    ```

    The Secrets object we target is named as
    `<cluster_name>-secrets`. The `<cluster_name>` value is
    the [name of your Percona Distribution for MongoDB](operator.md#metadata). The default variant is:

    === "via kubectl" 

        `my-cluster-name-secrets`

    === "via Helm"

        `cluster1-psmdb-db-secrets`

2. Retrieve the admin user credentials. Replace the `secret-name` and `namespace` with your values in the following commands:

    * Retrieve the login 

       ```bash
       kubectl get secret <secret-name> -n <namespace> -o yaml -o jsonpath='{.data.MONGODB_DATABASE_ADMIN_USER}' | base64 --decode | tr '\n' ' ' && echo " "
       ``` 

       The default value is `databaseAdmin` 

    * Retrieve the password 

       ```bash
       kubectl get secret <secret-name> -n <namespace> -o yaml -o jsonpath='{.data.MONGODB_DATABASE_ADMIN_PASSWORD}' | base64 --decode | tr '\n' ' ' && echo " "
       ```

3. Run a container with a MongoDB client and connect its console output to your terminal. The following command does this, naming the new Pod `percona-client`:

    ```bash
    kubectl -n <namespace> run -i --rm --tty percona-client --image=percona/percona-server-mongodb:{{ mongodb80recommended }} --restart=Never -- bash -il
    ```

4. Connect to Percona Server for MongoDB. The format of the MongoDB connection URI string is the following: 

    === "sharding is on"

        ```
        mongosh "mongodb://<databaseAdminUser>:<databaseAdminPassword>@<cluster-name>-mongos.<namespace>.svc.cluster.local/admin?ssl=false"
        ```

    === "sharding is off"

        ```
        mongosh  "mongodb://<databaseAdminUser>:<databaseAdminPassword>@<cluster-name>-rs0.<namespace>.svc.cluster.local/admin?replicaSet=rs0&ssl=false"
        ```

    If you run MongoDB 5.0 and earlier, use the old `mongo` client instead of `mongosh`.

    ??? example

        The following example connects to the `admin` database of Percona Server for MongoDB 6.0 sharded cluster with the name `my-cluster-name`. The cluster runs in the namespace `mongodb-operator`:

        ```
        mongosh "mongodb://databaseAdmin:databaseAdminPassword@my-cluster-name-mongos.mongodb-operator.svc.cluster.local/admin?ssl=false"
        ```

Congratulations! You have connected to Percona Server for MongoDB. 

## Next steps

[Insert sample data :material-arrow-right:](data-insert.md){.md-button}
