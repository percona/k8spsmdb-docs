
# Verify the cluster operation

Give the cluster a few minutes to initialize. Once `kubectl get psmdb -n <namespace>` shows the status as `ready`, you can connect.

To connect to Percona Server for MongoDB you need to construct the MongoDB connection URI string. It includes the credentials of the admin user, which are stored in the Secrets object.

1. List the Secrets objects:

    ```bash
    kubectl get secrets -n <namespace>
    ```

    The Secrets object we target is named as `<cluster_name>-secrets`. The `<cluster_name>` value is the name of your Percona Server for MongoDB cluster. The default name is:

    === "via kubectl"

        `my-cluster-name-secrets`

    === "via Helm"

        `cluster1-psmdb-db-secrets`

2. Retrieve admin credentials:

    ```bash
    kubectl get secret my-cluster-name-secrets -n psmdb -o yaml
    ```

    Look for these base64-encoded entries:

    ```yaml
    data:
      MONGODB_DATABASE_ADMIN_USER: ZGF0YWJhc2VBZG1pbg==
      MONGODB_DATABASE_ADMIN_PASSWORD: aDAzQ0pCY3NSWEZ2ZUIzS1I=
    ```

    Decode with:

    ```bash
    echo '<username>' | base64 --decode
    echo '<password>' | base64 --decode
    ```

3. Connect with a MongoDB client. The following command deploys a new Pod `percona-client` and connects its console output to your terminal:

    ```bash
    kubectl run -i --rm --tty percona-client --image=percona/percona-server-mongodb:{{ mongodb80recommended }} --restart=Never --env="POD_NAMESPACE=psmdb" -- bash -il
    ```

4. Connect to Percona Server for MongoDB using `mongosh`. If you deployed a sharded cluster, you need to use the `mongos` service as the host. If you deployed a replica set, you need to use the replica set service and include the replica set name.

    Replace `<username>` and `<password>` with the decoded values from the Secret. Replace `<cluster-name>` with the name of your cluster and `<namespace>` with the namespace where you deployed the cluster.

    - **If sharding is enabled (default):**

        ```bash
        mongosh "mongodb://<username>:<password>@<cluster-name>-mongos.<namespace>.svc.cluster.local/admin?ssl=false"
        ```

    - **If sharding is disabled:**

        ```bash
        mongosh "mongodb+srv://<username>:<password>@<cluster-name>-rs0.<namespace>.svc.cluster.local/admin?replicaSet=rs0&ssl=false"
        ```
