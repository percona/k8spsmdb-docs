> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Configure encryption using an encryption key Secret

Data-at-rest encryption using a Kubernetes Secret allows you to securely store the encryption key used by Percona Server for MongoDB directly in your cluster, without relying on an external key management service. This guide explains how to configure the Operator to use a Secret for managing your MongoDB encryption key.

Export your namespace so the commands below can use it. Replace `<namespace>` with your value:

```
export NAMESPACE=<namespace>
```

## Configuration steps

1. Set the encryption key Secret name.

   In your Custom Resource file, set `secrets.encryptionKey` to the name of the Secret that will hold the encryption key. The default Secret name is `my-cluster-name-mongodb-encryption-key`. If you use your own key and Secret, reference that Secret name here:

   ```
   secrets:
     ...
     encryptionKey: my-cluster-name-mongodb-encryption-key
   ```

1. Enable encryption and set the cipher mode in the configuration passed to MongoDB. Set these options in every relevant `configuration` block:

   - `replsets.configuration`,
   - `replsets.nonvoting.configuration` if you use [non-voting members](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/arbiter.html#non-voting-nodes),
   - `replsets.hidden.configuration` if you use [hidden members](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/arbiter.html#hidden-nodes),
   - `replsets.arbiter.configuration` if you use [arbiter nodes](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/arbiter.html),
   - `sharding.configsvrReplSet.configuration` if you use sharding.

   Add or update the `security` section in each block with this configuration:

   - `enableEncryption` – Set to `true` to turn on data-at-rest encryption (this is the default).
   - `encryptionCipherMode` – Use `AES256-CBC` (default) or `AES256-GCM`.

   ```
   ...
   configuration: |
     ...
     security:
       enableEncryption: true
       encryptionCipherMode: "AES256-CBC"
       ...
   ```

1. Apply the updated Custom Resource:

   ```
   kubectl apply -f deploy/cr.yaml -n <namespace>
   ```

   The Operator creates or uses the encryption key Secret and rolls out the configuration to the MongoDB pods. This triggers the rolling restart of your database Pods. After the rollout completes, data written by MongoDB will be encrypted at rest.

1. Check that the encryption is enabled. Execute into a Percona Server for MongoDB Pod as as a user with sufficient administrative privileges (`databaseAdmin` or `clusterAdmin`) and run the following command against the `admin` database:

   ```
   db.serverStatus().encryptionAtRest
   ```

   Expected output

   ```
   {
     "encryptionEnabled": true,
     "encryptionCipherMode": "AES256-CBC",
     "encryptionKeyId": "local"
   }
   ```

## Verify encryption is active

The encryption key Secret must exist before the cluster starts, and its name must match `secrets.encryptionKey`:

```
kubectl get secret -n $NAMESPACE | grep encryption-key
kubectl get psmdb -n $NAMESPACE
```

The cluster must reach the `ready` state. If `mongod` cannot read the key, Pods fail to start and the cluster never leaves `initializing` - check the database Pod logs for a keyfile error. Note that changing this Secret on a running cluster does not re-encrypt existing data.
