# Data at rest encryption

!!! admonition "Version added: [1.1.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.1.0.md)"


Data-at-rest encryption ensures that data stored on disk remains protected even if the underlying storage is compromised. This process is transparent to your applications, meaning you don't need to change the application's code. If an unauthorized user gains access to the storage, they can't read the data files.

To learn more about data-at-rest-encryption in Percona Server for MongoDB, see the [Data-at-rest encryption :octicons-link-external-16:](https://docs.percona.com/percona-server-for-mongodb/latest/data-at-rest-encryption.html) documentation.

Data-at-rest encryption is turned on by default. The Operator implements it in one of the following ways:

* [uses an encryption key stored in a Secret](#using-encryption-key-secret)
* [gets encryption key from the HashiCorp Vault key storage](#using-hashicorp-vault-storage-for-encryption-keys)

## Using encryption key Secret

1. The `secrets.encryptionKey` key in the `deploy/cr.yaml` file should specify
    the name of the encryption key Secret:

    ```yaml
    secrets:
      ...
      encryptionKey: my-cluster-name-mongodb-encryption-key
    ```

    Encryption key Secret will be created automatically by the Operator if it
    doesn’t exist. If you would like to create it yourself, ensure
    that [the key must be a 32 character string encoded in base64  :octicons-link-external-16:](https://docs.mongodb.com/manual/tutorial/configure-encryption/#local-key-management).

2. The `replsets.configuration`, `replsets.nonvoting.configuration`, and
    `sharding.configsvrReplSet.configuration` keys should include the following
    two MongoDB encryption-specific options:

    ```yaml
    ...
    configuration: |
      ...
      security:
        enableEncryption: true
        encryptionCipherMode: "AES256-CBC"
        ...
    ```

    The `enableEncryption` option should be set to `true` (the default value).
    The `security.encryptionCipherMode` option should specify a proper cipher
    mode for decryption: either `AES256-CBC` (the default value) or
    `AES256-GCM`.

Don't forget to apply the modified `cr.yaml` configuration file as usual:

``` {.bash data-prompt="$" }
$ kubectl deploy -f deploy/cr.yaml
```

## Using HashiCorp Vault storage for encryption keys

!!! admonition "Version added: [1.13.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.13.0.md)"

The Operator supports using [HashiCorp Vault  :octicons-link-external-16:](https://www.vaultproject.io/) storage for encryption keys - a universal, secure and reliable way to store and distribute secrets without depending on the operating system, platform or cloud provider.

The Operator will use Vault if the `deploy/cr.yaml` configuration file contains
the following items:

* a `secrets.vault` key equal to the name of a specially created Secret,
* `configuration` keys for mongod and config servers with a number of
    Vault-specific options.

The Operator itself neither installs Vault, nor configures it; both operations 
should be done manually, as described in the following parts.

### Installing Vault

The following steps will deploy Vault on Kubernetes with the [Helm 3 package manager  :octicons-link-external-16:](https://helm.sh/). Other Vault installation methods should also work, so the instruction placed here is not obligatory and is for illustration purposes. Read more about installation in Vault’s [documentation  :octicons-link-external-16:](https://www.vaultproject.io/docs/platform/k8s).

1. Add helm repo and install:

    ``` {.bash data-prompt="$" }
    $ helm repo add hashicorp https://helm.releases.hashicorp.com
    "hashicorp" has been added to your repositories

    $ helm install vault hashicorp/vault
    ```

2. After installation, Vault should be first initialized and then *unsealed*.
    Initializing Vault is done with the following commands:

    ``` {.bash data-prompt="$" }
    $ kubectl exec -it pod/vault-0 -- vault operator init -key-shares=1 -key-threshold=1 -format=json > /tmp/vault-init
    $ unsealKey=$(jq -r ".unseal_keys_b64[]" < /tmp/vault-init)
    ```

    To unseal Vault, execute the following command **for each Pod** of Vault
    running:

    ``` {.bash data-prompt="$" }
    $ kubectl exec -it pod/vault-0 -- vault operator unseal "$unsealKey"
    ```

### Configuring Vault

1. First, you should enable secrets within Vault. For this you will need a [Vault token  :octicons-link-external-16:](https://www.vaultproject.io/docs/concepts/tokens).
    Percona Server for MongoDB can use any regular token which allows all operations
    inside the secrets mount point. In the following example we are using the
    *root token* to be sure the permissions requirement is met, but actually
    there is no need in root permissions. We don’t recommend using the root token
    on the production system.

    ``` {.bash data-prompt="$" }
    $ cat /tmp/vault-init | jq -r ".root_token"
    ```

    The output will show you the token:

    ``` {.text .no-copy}
    s.VgQvaXl8xGFO1RUxAPbPbsfN
    ```

    Now login to Vault with this token to enable the key-value secret engine:

    ``` {.bash data-prompt="$" }
    $ kubectl exec -it vault-0 -- /bin/sh
    $ vault login s.VgQvaXl8xGFO1RUxAPbPbsfN
    ```
    
    ??? example "Expected output"

        ``` {.text .no-copy}
        Success! You are now authenticated. The token information displayed below
        is already stored in the token helper. You do NOT need to run "vault login"
        again. Future Vault requests will automatically use this token.

        Key                  Value
        ---                  -----
        token                s.VgQvaXl8xGFO1RUxAPbPbsfN
        token_accessor       iMGp477aReYkPBWrR42Z3L6R
        token_duration       ∞
        token_renewable      false
        token_policies       ["root"]
        identity_policies    []
        policies             ["root"]`
        ```
    
    Now enable the key-value secret engine with the following command:
    
    ``` {.bash data-prompt="$" }
    $ vault secrets enable -path secret kv-v2
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        Success! Enabled the kv-v2 secrets engine at: secret/
        ```

    !!! note

        You can also enable audit, which is not mandatory, but useful:

        ``` {.bash data-prompt="$" }
        $ vault audit enable file file_path=/vault/vault-audit.log
        ```
        
        ??? example "Expected output"

            ``` {.text .no-copy}
            Success! Enabled the file audit device at: file/
            ```
        
2. Now generate Secret with the Vault root token using `kubectl command` (don't
    forget to substitute the token from the example with your real root token)
    and add necessary options to `configuration` keys in your `deploy/cr.yaml`:
    
    === "without TLS, to access the Vault server via HTTP"
        Generate Secret:
        ``` {.bash data-prompt="$" }
        $ kubectl create secret generic vault-secret --from-literal=token="s.VgQvaXl8xGFO1RUxAPbPbsfN"
        ```
        
        Now modify your `deploy/cr.yaml`:

        First set the `secrets.encryptionKey` key to the name of your Secret created on
        the previous step. Then Add Vault-specific options to the
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
              disableTLSForTesting: true
            ...
        ```

    === "with TLS, to access the Vault server via HTTPS"
        Generate Secret, using the path to your `ca.crt` certificate instead of the `<path to CA>` placeholder (see [the Operator TLS guide](TLS.md), if needed):
        ``` {.bash data-prompt="$" }
        kubectl create secret generic vault-secret --from-literal=token="s.VgQvaXl8xGFO1RUxAPbPbsfN" --from-file=ca.crt=<path to CA>/ca.crt
        ```
        
        Now modify your `deploy/cr.yaml`:

        First set the `secrets.encryptionKey` key to the name of your Secret created on
        the previous step. Then Add Vault-specific options to the
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
    
    Finally, apply your modified `cr.yaml` as usual:
    
    ``` {.bash data-prompt="$" }
    $ kubectl deploy -f deploy/cr.yaml
    ```

3. To verify that everything was configured properly, use the following log
    filtering command (substitute the `<cluster name>` and `<namespace>`
    placeholders with your real cluster name and namespace):

    ``` {.bash data-prompt="$" }
    $ kubectl logs <cluster name>-rs0-0 -c mongod -n <namespace> | grep -i "Encryption keys DB is initialized successfully"
    ```

More details on how to install and configure Vault can be found [in the official documentation  :octicons-link-external-16:](https://learn.hashicorp.com/vault?track=getting-started-k8s#getting-started-k8s).

