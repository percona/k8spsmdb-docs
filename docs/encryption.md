# Data-at-rest encryption

!!! admonition "Version added: [1.1.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.1.0.md)"


Data-at-rest encryption ensures that data stored on disk remains protected even if the underlying storage is compromised. This process is transparent to your applications, meaning you don't need to change the application's code. If an unauthorized user gains access to the storage, they can't read the data files.

To learn more about data-at-rest-encryption in Percona Server for MongoDB, see the [Data-at-rest encryption :octicons-link-external-16:](https://docs.percona.com/percona-server-for-mongodb/latest/data-at-rest-encryption.html) documentation.

Data-at-rest encryption is turned on by default. The Operator implements it in one of the following ways:

* [uses an encryption key stored in a Secret](#use-encryption-key-secret)
* [gets encryption key from the HashiCorp Vault key storage](#use-hashicorp-vault-storage-for-encryption-keys)

## Use encryption key Secret

1. Specify
    the name of the encryption key Secret in the `secrets.encryptionKey` key in the `deploy/cr.yaml` file:

    ```yaml
    secrets:
      ...
      encryptionKey: my-cluster-name-mongodb-encryption-key
    ```

    The Operator creates the encryption key Secret automatically if it
    doesn't exist. If you would like to create it yourself, ensure
    that [the key must be a 32 character string encoded in base64  :octicons-link-external-16:](https://docs.mongodb.com/manual/tutorial/configure-encryption/#local-key-management).

2. Specify the following MongoDB encryption-specific options in the `replsets.configuration`, `replsets.nonvoting.configuration`, and
    `sharding.configsvrReplSet.configuration` keys:

    ```yaml
    ...
    configuration: |
      ...
      security:
        enableEncryption: true
        encryptionCipherMode: "AES256-CBC"
        ...
    ```

    Set the `enableEncryption` option to `true` (the default value).
    Specify a proper cipher
    mode for decryption in the `security.encryptionCipherMode` option. It should be either `AES256-CBC` (the default value) or `AES256-GCM`.

Apply the modified `cr.yaml` configuration file:

``` {.bash data-prompt="$" }
$ kubectl deploy -f deploy/cr.yaml
```

## Use HashiCorp Vault storage for encryption keys

!!! admonition "Version added: [1.13.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.13.0.md)"

You can configure the Operator to use [HashiCorp Vault  :octicons-link-external-16:](https://www.vaultproject.io/) storage for encryption keys - a universal, secure and reliable way to store and distribute secrets without depending on the operating system, platform or cloud provider.

The Operator will use Vault if the `deploy/cr.yaml` configuration file contains
the following items:

* a `secrets.vault` key equal to the name of a specially created Secret,
* `configuration` keys for `mongod` and config servers with a number of
    Vault-specific options.

The Operator itself neither installs Vault, nor configures it. You must do both operations manually. Refer to the following sections for steps.

### Create the namespace

It is a good practice to isolate workloads in Kubernetes using namespaces. Create a namespace with the following command:

```{.bash .data-prompt="$"}
$ kubectl create namespace vault
```

Export the namespace as an environment variable to simplify further configuration and management

```bash
NAMESPACE="vault"
```

### Install Vault

For this setup, we install Vault in Kubernetes using the [Helm 3 package manager :octicons-link-external-16:](https://helm.sh/). However, Helm is not required — any supported Vault deployment (on-premises, in the cloud, or a managed Vault service) works as long as the Operator can reach it.

Read more about installation in [Vault documentation :octicons-link-external-16:](https://www.vaultproject.io/docs/platform/k8s).

1. Add and update the Vault Helm repository.

    ``` {.bash data-prompt="$" }
    $ helm repo add hashicorp https://helm.releases.hashicorp.com
    $ helm repo update
    ```

2. Install Vault:

    ```{.bash data-prompt="$" }
    $ helm install vault hashicorp/vault --namespace $NAMESPACE
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        NAME: vault
        LAST DEPLOYED: Thu Sep 18 12:11:08 2025
        NAMESPACE: vault
        STATUS: deployed
        REVISION: 1
        NOTES:
        Thank you for installing HashiCorp Vault!

        Now that you have deployed Vault, you should look over the docs on using
        Vault with Kubernetes available here:
        https://developer.hashicorp.com/vault/docs
        ```

3. Retrieve the Pod name where Vault is running:

    ```{.bash data-prompt="$" }
    $ kubectl -n $NAMESPACE get pod -l app.kubernetes.io/name=vault -o jsonpath='{.items[0].metadata.name}'
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        vault-0
        ```
        
4. After Vault is installed, you need to initialize it. Run the following command:

    ``` {.bash data-prompt="$" }
    $ kubectl exec -it pod/vault-0 -n $NAMESPACE -- vault operator init -key-shares=1 -key-threshold=1 -format=json > /tmp/vault-init
    $ unsealKey=$(jq -r ".unseal_keys_b64[]" < /tmp/vault-init)
    ```

    The command does the following:

    * Connects to the Vault Pod
    * Initializes Vault server
    * Creates 1 unseal key share which is required to unseal the server
    * Outputs the init response in JSON format to a local file `/tmp/vault-init`. It includes unseal keys and root token.

5. Vault is started in a sealed state. In this state Vault can access the storage but it cannot decrypt data. In order to use Vault, you need to unseal it.

    Retrieve the unseal key from the file:

    ```{.bash .data-prompt="$"}
    $ unsealKey=$(jq -r ".unseal_keys_b64[]" < /tmp/vault-init)
    ```
    
6. Now, unseal Vault. Run the following command on every Pod where Vault is running:

    ```{.bash .data-prompt="$"}
    $ kubectl exec -it pod/vault-0 -n $NAMESPACE -- vault operator unseal "$unsealKey"
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        Key             Value
        ---             -----
        Seal Type       shamir
        Initialized     true
        Sealed          false
        Total Shares    1
        Threshold       1
        Version         1.20.1
        Build Date      2025-07-24T13:33:51Z
        Storage Type    file
        Cluster Name    vault-cluster-55062a37
        Cluster ID      37d0c2e4-8f47-14f7-ca49-905b66a1804d
        HA Enabled      false
        ```

### Configure Vault

At this step you need to configure Vault and enable secrets within it. To do so you must first authenticate in Vault.

When you started Vault, it generates and starts with a [root token :octicons-link-external-16:](https://developer.hashicorp.com/vault/docs/concepts/tokens) that provides full access to Vault. Use this token to authenticate.

!!! note

    For the purposes of this tutorial we use the root token in further sections. For security considerations, the use of root token is not recommended. Refer to the [Create token :octicons-link-external-16:](https://developer.hashicorp.com/vault/docs/commands/token/create) in Vault documentation how to create user tokens.

1. Extract the Vault root token from the file where you saved the init response output:

    ```{.bash .data-prompt="$"}
    $ cat /tmp/vault-init | jq -r ".root_token"
    ```

    ??? example "Sample output"
    
        ```{.text .no-copy}
        hvs.CvmS......gXWMJg9r
        ```

2. Authenticate in Vault with this token:

    ``` {.bash data-prompt="$" }
    $ kubectl exec -it vault-0 -n $NAMESPACE -- /bin/sh
    $ vault login hvs.CvmS......gXWMJg9r
    ```
    
    ??? example "Expected output"

        ``` {.text .no-copy}
        Success! You are now authenticated. The token information displayed below
        is already stored in the token helper. You do NOT need to run "vault login"
        again. Future Vault requests will automatically use this token.

        Key                  Value
        ---                  -----
        token                hvs.CvmS......gXWMJg9r
        token_accessor       iMGp477aReYkPBWrR42Z3L6R
        token_duration       ∞
        token_renewable      false
        token_policies       ["root"]
        identity_policies    []
        policies             ["root"]`
        ```
    
3. Now enable the key-value secrets engine at the path `secret` with the following command:
    
    ``` {.bash data-prompt="$" }
    $ vault secrets enable -path secret kv-v2
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        Success! Enabled the kv-v2 secrets engine at: secret/
        ```

4. (Optional) You can also enable audit. This is not mandatory, but useful:

    ``` {.bash data-prompt="$" }
    $ vault audit enable file file_path=/vault/vault-audit.log
    ```
        
    ??? example "Expected output"

        ``` {.text .no-copy}
        Success! Enabled the file audit device at: file/
        ```

### Create a Secret for Vault

To enable Vault for the Operator, create a Secret object for it using the Vault token. 
   
=== "HTTP access without TLS"

    ``` {.bash data-prompt="$" }
    $ kubectl create secret generic vault-secret --from-literal=token="hvs.CvmS......gXWMJg9r"
    ```

=== "HTTPS access with TLS"

    If you [deployed Vault with TLS :octicons-link-external-16:](https://developer.hashicorp.com/vault/docs/auth/cert), include the path to TLS certificates when you create a Secret.

    ``` {.bash data-prompt="$" }
    $ kubectl create secret generic vault-secret --from-literal=token="hvs.CvmS......gXWMJg9r" --from-file=ca.crt=<path to CA>/ca.crt
    ```
        
### Reference the Secret in your Custom Resource manifest 

Now, reference the Vault Secret in the Operator Custom Resource manifest. You also need the following Vault-related information:

* A Vault server name and port
* Path to the token file. When you apply the new configuration, the Operator creates the required directories and places the token file there. 
* The secrets mount path in the format `<mount-path>/data/dc/<cluster name>/<path>`. 
* Path to TLS certificates if you [deployed Vault with TLS :octicons-link-external-16:](https://developer.hashicorp.com/vault/docs/auth/cert)
* Contents of the ca.cert certificate file 

=== "HTTP access without TLS"

    Modify your `deploy/cr.yaml` as follows:

    1. Set the `secrets.vault` key to the name of your Secret created on
        the previous step. 
    2. Add Vault-specific options to the
        `replsets.configuration`, `replsets.nonvoting.configuration`, and
        `sharding.configsvrReplSet.configuration` keys, using the following
        template:

        ```yaml
        secrets:
          vault: vault-secret
        ...
        configuration: |
          ...
          security:
            enableEncryption: true
            vault:
              serverName: vault
              port: 8200
              tokenFile: /etc/mongodb-vault/token
              secret: secret/data/dc/<cluster name>/<path>
              disableTLSForTesting: true
            ...
        ```

=== "HTTPS access with TLS"
        
    1. Set the `secrets.vault` key to the name of your Secret created on
        the previous step. 
    2. Add Vault-specific options to the
        `replsets.configuration`, `replsets.nonvoting.configuration`, and
        `sharding.configsvrReplSet.configuration` keys, using the following
        template:

        ```yaml
        ...
        configuration: |
          ...
          security:
            enableEncryption: true
            vault:
              serverName: vault
              port: 8200
              tokenFile: /etc/mongodb-vault/token
              secret: secret/data/dc/<cluster name>/<path>
              serverCAFile: /etc/mongodb-vault/ca.crt
            ...
        ```

    While adding options, modify this template as follows:

    * substitute the `<cluster name>` placeholder with your real cluster name,
    * substitute the <path> placeholder with `rs0` when adding options to
        `replsets.configuration` and `replsets.nonvoting.configuration`,
    * substitute the <path> placeholder with `cfg` when adding options to
    `sharding.configsvrReplSet.configuration`.
    
2. Apply your modified `cr.yaml` file:
    
    ``` {.bash data-prompt="$" }
    $ kubectl deploy -f deploy/cr.yaml
    ```

3. To verify that everything was configured properly, use the following log
    filtering command (substitute the `<cluster name>` and `<namespace>`
    placeholders with your real cluster name and namespace):

    ``` {.bash data-prompt="$" }
    $ kubectl logs <cluster name>-rs0-0 -c mongod -n <namespace> | grep -i "Encryption keys DB is initialized successfully"
    ```

Find more details on how to install and configure Vault [in Vault documentation  :octicons-link-external-16:](https://learn.hashicorp.com/vault?track=getting-started-k8s#getting-started-k8s).

