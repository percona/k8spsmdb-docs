# Configure data-at-rest encryption using an encryption key Secret

Data-at-rest encryption using a Kubernetes Secret allows you to securely store the encryption key used by Percona Server for MongoDB directly in your cluster, without relying on an external key management service. This guide explains how to configure the Operator to use a Secret for managing your MongoDB encryption key.

## Configuration steps

1. Set the encryption key Secret name. 

    In your Custom Resource file, set `secrets.encryptionKey` to the name of the Secret that will hold the encryption key:

    ```yaml
    secrets:
      ...
      encryptionKey: my-cluster-name-mongodb-encryption-key
    ```

2. Enable encryption and set the cipher mode in the configuration passed to MongoDB. Set these options in every relevant `configuration` block: 

    * `replsets.configuration`, 
    * `replsets.nonvoting.configuration` if you use non-voting members, 
    * `sharding.configsvrReplSet.configuration` if you use sharding.

    Add or update the `security` section in each block with this configuration:

    * `enableEncryption` – Set to `true` to turn on data-at-rest encryption (this is the default).

    * `encryptionCipherMode` – Use `AES256-CBC` (default) or `AES256-GCM`. 

    ```yaml
    ...
    configuration: |
      ...
      security:
        enableEncryption: true
        encryptionCipherMode: "AES256-CBC"
        ...
    ```

3. Apply the updated Custom Resource:

    ```bash
    kubectl apply -f deploy/cr.yaml
    ```

    The Operator creates or uses the encryption key Secret and rolls out the configuration to the MongoDB pods. This triggers the rolling restart of your database Pods. After the rollout completes, data written by MongoDB will be encrypted at rest.

4. Check that the encryption is enabled by executing into a Percona Server for MongoDB Pod as the administrative user and running the following command against the `admin` database:

    ```javascript
    db.serverStatus().encryptionAtRest
    ``` 

    ??? example "Expected output"

        ```{.json .no-copy}
        {
          "encryptionEnabled": true,
          "encryptionCipherMode": "AES256-CBC",
          "encryptionKeyId": "local"
        }
        ```
