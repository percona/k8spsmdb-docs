# Data at rest encryption

[Data at rest encryption in Percona Server for MongoDB](https://docs.percona.com/percona-server-for-mongodb/latest/data-at-rest-encryption.html)
is supported by the Operator since version 1.1.0.

!!! note

    [Data at rest](https://en.wikipedia.org/wiki/Data_at_rest) means inactive data stored as files, database records, etc.

## Turning encryption on

Following options in the `deploy/cr.yaml` file should be edited to turn data at
rest encryption on:

1. The `security.enableEncryption` key should be set to `true` (the default
    value).

2. The `security.encryptionCipherMode` key should specify proper cipher mode
    for decryption. The value can be one of the following two variants:
    * `AES256-CBC` (the default one for the Operator and Percona Server for
        MongoDB)
    * `AES256-GCM`

3. The `secrets.encryptionKey` key should specify a secret object with the
    encryption key:

    ```yaml
    secrets:
      ...
      encryptionKey: my-cluster-name-mongodb-encryption-key
    ```

Encryption key secret will be created automatically if it doesn’t exist.
If you would like to create it yourself, take into account that
[the key must be a 32 character string encoded in base64](https://docs.mongodb.com/manual/tutorial/configure-encryption/#local-key-management).

## <a name="using-vault"></a>Using HashiCorp Vault storage for encryption keys

Starting from the version 1.13.0 the Operator supports using [HashiCorp Vault](https://www.vaultproject.io/) storage for encryption keys - a universal, secure and reliable way to store and distribute secrets without depending on the operating system, platform or cloud provider.

The Operator is triggered to use Vault if the `deploy/cr.yaml` configuration
file contains the following parts:

* a `secrets.vault` key equal to the name of a specially created secret,
* a `security.vault` subsection with a number of Vault-specific options.

The Operator itself neither installs Vault, nor configures it; both operations 
should be done manually, as described in the following parts.

### Installing Vault

The following steps will deploy Vault on Kubernetes with the [Helm 3 package manager](https://helm.sh/). Other Vault installation methods should also work, so the instruction placed here is not obligatory and is for illustration purposes. Read more about installation in Vault’s [documentation](https://www.vaultproject.io/docs/platform/k8s).

1. Add helm repo and install:

    ```bash
    $ helm repo add hashicorp https://helm.releases.hashicorp.com
    "hashicorp" has been added to your repositories

    $ helm install vault hashicorp/vault
    ```

2. After installation, Vault should be first initialized and then *unsealed*.
    Initializing Vault is done with the following commands:

    ```bash
    $ kubectl exec -it pod/vault-0 -- vault operator init -key-shares=1 -key-threshold=1 -format=json > /tmp/vault-init
    $ unsealKey=$(jq -r ".unseal_keys_b64[]" < /tmp/vault-init)
    ```

    To unseal Vault, execute the following command **for each Pod** of Vault
    running:

    ```bash
    $ kubectl exec -it pod/vault-0 -- vault operator unseal "$unsealKey"
    ```

### Configuring Vault

1. First, you should enable secrets within Vault. For this you will need a [Vault token](https://www.vaultproject.io/docs/concepts/tokens).
    Percona Server for MongoDB can use any regular token which allows all operations
    inside the secrets mount point. In the following example we are using the
    *root token* to be sure the permissions requirement is met, but actually
    there is no need in root permissions. We don’t recommend using the root token
    on the production system.

    ```bash
    $ cat /tmp/vault-init | jq -r ".root_token"
    ```

    The output will show you the token:

    ```text
    s.VgQvaXl8xGFO1RUxAPbPbsfN
    ```

    Now login to Vault with this token and enable the key-value secret engine:

    ```bash
    $ kubectl exec -it vault-0 -- /bin/sh
    $ vault login s.VgQvaXl8xGFO1RUxAPbPbsfN
    $ vault secrets enable -version=2 kv
    ```

    !!! note

        You can also enable audit, which is not mandatory, but useful:

        ```bash
        $ vault audit enable file file_path=/vault/vault-audit.log
        ```

2. Now generate Secret with the Vault root token using `kubectl command` (don't
    forget to substitute the token from this example with your real root token):

    ```bash
    $ kubectl create secret generic vault-secret --from-literal=token="s.VgQvaXl8xGFO1RUxAPbPbsfN"
    ```

3. Modify your `deploy/cr.yaml` putting this Secret into the `secrets.encryptionKey` key, and adding Vault-specific options under the `security.vault` subsection (don't forget to substitute the `<cluster name>` placeholder with your real cluster name):

    ```yaml
    ...
    secrets:
      vault: vault-secret
      ...
      mongod:
        security:
          enableEncryption: true
          vault:
            serverName: vault
            port: 8200
            tokenFile: /etc/mongodb-vault/token
            secret: secret/data/dc/<cluster name>/cfg
    ```

    Apply your modified configuration as usual:
    
    ```bash
    $ kubectl deploy -f deploy/cr.yaml
    ```

4. You can check that data-at-rest encryption with the following log filtering command, substituting the `<cluster name>` and `<namespace>` placeholders with your real cluster name and namespace:

    ```bash
    $ kubectl logs <cluster name>-rs0-0 -c mongod -n <namespace> | grep -i "Encryption keys DB is initialized successfully"
    ```


More details on how to install and configure Vault can be found [in the official documentation](https://learn.hashicorp.com/vault?track=getting-started-k8s#getting-started-k8s).

