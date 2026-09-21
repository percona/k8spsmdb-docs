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

## Verify the connection string

Test the URI before you put it in your application, so a failure later is your
code and not the connection. The cluster encrypts connections with TLS by
default. `mongosh` needs the CA and a client certificate, not only the URI. These are stored in the
`<cluster-name>-ssl` Secret.

This is a one-shot ping. For an interactive `mongosh` session, see
[Open an interactive shell with mongosh](connection-secrets.md#open-an-interactive-shell-with-mongosh).
If you already created the `percona-client` Pod from that page, skip to step 2.

1. Create a client Pod that mounts the TLS Secret and reads the URI from the
   connection Secret. Replace the namespace, Secret name and key if you use an application
   user or a replica set URI:

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
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: <cluster-name>-databaseadmin-conn-str
              key: databaseAdmin_mongos_connectionString
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

2. Ping the database:

    ```bash
    kubectl exec -n <namespace> percona-client -- bash -lc '
      cat /etc/mongodb-ssl/tls.crt /etc/mongodb-ssl/tls.key > /tmp/client.pem
      mongosh "$MONGODB_URI" \
        --tlsCertificateKeyFile /tmp/client.pem \
        --tlsCAFile /etc/mongodb-ssl/ca.crt \
        --quiet --eval "db.runCommand({ping:1})"
    '
    ```

??? example "Sample output"

    ```json
    {
      "ok": 1,
      "$clusterTime": {
        "clusterTime": {
          "t": 1789634289,
          "i": 4
        },
        "signature": {
          "hash": "tT2rlKLrcnikMA3duZv3LiYty60=",
          "keyId": 7686417581959282709
        }
      },
      "operationTime": {
        "t": 1789634289,
        "i": 4
      }
    }
    ```

`{ ok: 1 }` means the URI, the credentials, the TLS material, and the network
path all work.

If the ping fails:

* Authentication error — the user or password is wrong, or the URI points at
  the wrong `authSource`.
* Timeout — the host is not reachable from inside the cluster. If your app runs
  outside Kubernetes, see
  [Connect from your laptop or CI](connect-from-outside.md).
* `self-signed certificate in certificate chain` — `mongosh` does not trust the
  Operator CA. Confirm the Pod mounts `<cluster-name>-ssl` and that you pass
  `--tlsCAFile`.
* `No certificate provided by peer` — the connection uses TLS but the client
  did not present a certificate. Pass `--tlsCertificateKeyFile`.

See [Troubleshoot connection issues](troubleshoot-connection.md) for other
symptoms.

When you are done, delete the Pod:

```bash
kubectl delete pod percona-client -n <namespace>
```

## Use the URI in your application

Pass the decoded URI to your MongoDB driver as the connection string. Example shape (values come from the Secret; do not hardcode passwords):

```
mongodb://user:password@host:27017/?authSource=admin
```

If the cluster has [TLS enabled](TLS.md), the Operator includes the TLS parameters in the generated URI. Use an `_connectionStringExposed` key when your app connects from outside the cluster through an [exposed](expose.md) Service.

## Next steps

[Get credentials for your app](app-credentials.md){.md-button}
[Connection examples (Node, Python, Go)](connection-examples.md){.md-button}
