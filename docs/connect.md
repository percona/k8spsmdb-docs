# 2. Connect to Percona Server for MongoDB

In this tutorial, you will connect to the Percona Server for MongoDB cluster you deployed previously.

The Operator creates a Secret with a ready-to-use connection string for the `databaseAdmin` user. Use it to connect to the database.

Here's how to do it:
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

3. The database cluster encrypts connections with TLS by default, and MongoDB requires a TLS
    client to present a certificate - not just a username and password. The Operator
    already created one for you in the `<cluster-name>-ssl` Secret, so run a container
    with a MongoDB client that mounts it:

    ```bash
    kubectl apply -n <namespace> -f - <<EOF
    apiVersion: v1
    kind: Pod
    metadata:
      name: percona-client
    spec:
      restartPolicy: Never
      containers:
      - name: percona-client
        image: percona/percona-server-mongodb:{{ mongodb80recommended }}
        command: ["sleep", "3600"]
        volumeMounts:
        - name: ssl
          mountPath: /etc/mongodb-ssl
          readOnly: true
      volumes:
      - name: ssl
        secret:
          secretName: <cluster-name>-ssl
    EOF
    ```

4. Open a shell inside that Pod:

    ```bash
    kubectl exec -it percona-client -n <namespace> -- bash -il
    ```

5. The rest of the commands run inside this shell. Combine the mounted certificate and key
    into the single file `mongosh` expects:

    ```bash
    cat /etc/mongodb-ssl/tls.crt /etc/mongodb-ssl/tls.key > /tmp/client.pem
    ```

6. Connect to Percona Server for MongoDB, using the connection string from step 2, the
    certificate file you just created, and the mounted CA certificate so `mongosh` trusts
    the server:

    ```bash
    mongosh "<connection-string>" --tlsCertificateKeyFile /tmp/client.pem --tlsCAFile /etc/mongodb-ssl/ca.crt
    ```

    ??? example

        The following example connects to the `admin` database of a Percona Server for MongoDB 8.0 sharded cluster named `my-cluster-name` in the `mongodb-operator` namespace:

        ```bash
        mongosh "mongodb://databaseAdmin:databaseAdminPassword@my-cluster-name-mongos.mongodb-operator.svc.cluster.local/admin?authSource=admin" --tlsCertificateKeyFile /tmp/client.pem --tlsCAFile /etc/mongodb-ssl/ca.crt
        ```

        The exact URI depends on your cluster configuration. Use the value retrieved from the connection string Secret.

Congratulations! You have connected to Percona Server for MongoDB.

Keep this shell open - the next tutorial page continues in the same `mongosh` session.

To connect from your own application (connection string, credentials, code examples), see [Get started](get-a-cluster.md) (developer path) or [Connect your application](connect-from-app.md).

## Next steps

[Insert sample data :material-arrow-right:](data-insert.md){.md-button}
