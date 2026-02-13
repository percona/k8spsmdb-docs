# Configure data-at-rest encryption using HashiCorp Vault with TLS

This guide walks you through deploying and configuring HashiCorp Vault to work with Percona Operator for MongoDB to enable [data-at-rest encryption](encryption.md) using HTTPS protocol.

By default, Percona Server for MongoDB and Vault communicate over an unencrypted HTTP protocol. You can enable encrypted HTTPS protocol with TLS as an additional security layer to protect the data transmitted between Vault and your Percona Server for MongoDB nodes. HTTPS ensures that sensitive information, such as encryption keys and secrets, cannot be intercepted or tampered with on the network.

## Assumptions

1. This guide is provided as a best effort and builds upon procedures described in the official Vault documentation. Since Vault's setup steps may change in future releases, this document may become outdated; we cannot guarantee ongoing accuracy or responsibility for such changes. For the most up-to-date and reliable information, please always refer to [the official Vault documentation](https://developer.hashicorp.com/vault/tutorials/kubernetes/kubernetes-minikube-tls#kubernetes-minikube-tls).
2. In the following sections we deploy the Vault server in High Availability (HA) mode on Kubernetes via Helm with TLS enabled. The HA setup uses Raft storage backend and consists of 3 replicas for redundancy. Using Helm is not mandatory. Any supported Vault deployment (on-premises, in the cloud, or a managed Vault service) works as long as the Operator can reach it.
3. This guide uses Vault Helm chart version 0.30.0. You may want to change it to the required version by setting the `VAULT_HELM_VERSION` variable.

## Prerequisites

Before you begin, ensure you have the following tools installed:

* `kubectl`- Kubernetes command-line interface
* `helm` - Helm package manager
* `jq` - JSON processor

## Prepare your environment

1. Export the namespace and other variables as environment variables to simplify further configuration:

    ```bash
    export NAMESPACE="vault"
    export CLUSTER_NAMESPACE="psmdb"
    export VAULT_HELM_VERSION="0.30.0"
    export SERVICE="vault"
    export CSR_NAME="vault-csr"
    export SECRET_NAME_VAULT="vault-secret"
    export POLICY_NAME="psmdb-policy"
    export WORKDIR="/tmp/vault"
    ```

2. Create a working directory for configuration files:

    ```bash
    mkdir -p $WORKDIR
    ```

3. It is a good practice to isolate workloads in Kubernetes using namespaces. Create namespaces with the following command:

    * For Vault server:

       ```bash
       kubectl create namespace vault
       ```

    * For Percona Server for MongoDB cluster:

       ```bash
       kubectl create namespace psmdb
       ```

---8<--- "vault-generate-tls-certs.md"

---8<--- "vault-install-tls.md"

## Configure Vault

---8<--- "vault-enable-kv.md"

4. (Optional) You can also enable audit. This is not mandatory, but useful:

    ```bash
    vault audit enable file file_path=/vault/vault-audit.log
    ```
        
    ??? example "Expected output"

        ``` {.text .no-copy}
        Success! Enabled the file audit device at: file/
        ```

5. Exit the Vault Pod:

    ```bash
    exit
    ```

## Create a non-root token

Using the root token for authentication is not recommended, as it poses significant security risks. Instead, you should create a dedicated, non-root token for the Operator to use when accessing Vault. The permissions for this token are controlled by an access policy. Before you create a token you must first create the access policy.

1. Create a policy for accessing the kv engine path and define the required permissions in the `capabilities` parameter:

    ```bash
    kubectl -n "$NAMESPACE" exec vault-0 -- sh -c "
      vault policy write $POLICY_NAME - <<EOF
    path \"secret/data/*\" {
      capabilities = [\"create\", \"read\", \"update\", \"delete\", \"list\"]
    }
    path \"secret/metadata/*\" {
      capabilities = [\"read\"]
    }
    path \"secret/*\" {
      capabilities = [\"read\"]
    }
    EOF
    "
    ```

2. Now create a token with a policy.

    ```bash
    kubectl -n "${NAMESPACE}" exec pod/vault-0 -- vault token create -policy="${POLICY_NAME}" -format=json > "${WORKDIR}/vault-token.json"
    ```

3. Export the non-root token as an environment variable:

    ```bash
    export NEW_TOKEN=$(jq -r '.auth.client_token' "${WORKDIR}/vault-token.json")
    ```

4. Verify the token:

    ```bash
    echo "New Vault Token: $NEW_TOKEN"
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        hvs.CAESINO******************************************T2Y
        ```

## Create a Secret for Vault

To enable Vault for the Operator, create a Secret object for it using the Vault token and the path to TLS certificates. Note that you must create the Secret in the namespace where the Operator and the database cluster is running.
   
Run the following command:

```bash
kubectl create secret generic my-cluster-name-vault --from-literal=token=$NEW_TOKEN --from-file=ca.crt=${WORKDIR}/vault.ca -n $CLUSTER_NAMESPACE
```
     
## Reference the Secret in your Custom Resource manifest 

Now, reference the Vault Secret in the Operator Custom Resource manifest. You also need the following Vault-related information:

* A Vault server name and port. If Vault is deployed in a separate namespace, use the fully qualified name in the format `<service-name>.<namespace>.svc.cluster.local`.
* Path to the token file. When you apply the new configuration, the Operator creates the required directories and places the token file there. 
* Path to TLS certificates
* Contents of the `ca.cert` certificate file
* The secrets mount path in the format `<mount-path>/data/dc/<cluster name>/<path>`, where:

  * the `<cluster name>` is your real cluster name
  * the `<path>` is where keys are stored. Specify the `rs0` value when you add options to the `replsets.configuration` and `replsets.nonvoting.configuration` sections. Specify the  `cfg` value when you add options to the `sharding.configsvrReplSet.configuration` section.

!!! note

    In a sharded cluster, you must specify the Vault configuration in both `replsets.configuration` and `sharding.configsvrReplSet.configuration` sections.

1. Modify your `deploy/cr.yaml` as follows:

    1. Set the `secrets.vault` key to the name of your Secret created on
        the previous step. 
    2. Add Vault-specific options to the
        `replsets.configuration`, `replsets.nonvoting.configuration`, and
        `sharding.configsvrReplSet.configuration` keys:

        ```yaml
        secrets:
          vault: my-cluster-name-vault
        ...
        replsets:
        - name: rs0
          size: 3
        ...
          configuration: |
             security:
               enableEncryption: true
               vault:
                 serverName: vault.vault.svc.cluster.local
                 port: 8200
                 tokenFile: /etc/mongodb-vault/token
                 secret: secret/data/dc/<cluster name>/rs0
                 serverCAFile: /etc/mongodb-vault/ca.crt
               ...
        sharding:
          configsvrReplSet:
            ...
            configuration: |
              security:
                enableEncryption: true
                vault:
                  serverName: vault.vault.svc.cluster.local
                  port: 8200
                  tokenFile: /etc/mongodb-vault/token
                  secret: secret/data/dc/<cluster name>/cfg
                  serverCAFile: /etc/mongodb-vault/ca.crt
                 ...
        ```
    
2. Apply your modified `cr.yaml` file:
    
    ```bash
    kubectl apply -f deploy/cr.yaml -n $CLUSTER_NAMESPACE
    ```

## Verify encryption

Check that the encryption is enabled by executing into a Percona Server for MongoDB Pod as the administrative user and running the following command against the `admin` database:

```javascript
db.serverStatus().encryptionAtRest
```

??? example "Expected output"

    ```{.json .no-copy}
    {
      encryptionEnabled: true,
      encryptionCipherMode: 'AES256-CBC',
      encryptionKeyId: {
        vault: { path: 'secret/data/dc/my-cluster-name/rs0', version: '4' }
      }
    }
    ```
