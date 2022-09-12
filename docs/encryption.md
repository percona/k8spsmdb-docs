# Data at rest encryption

[Data at rest encryption in Percona Server for MongoDB](https://docs.percona.com/percona-server-for-mongodb/latest/data-at-rest-encryption.html)
is supported by the Operator since version 1.1.0.

!!! note

    [Data at rest](https://en.wikipedia.org/wiki/Data_at_rest) means inactive data stored as files, database records, etc.

## Turning encryption on

Following options the `mongod` section of the `deploy/cr.yaml` file should be
edited to turn this feature on:

1. The `security.enableEncryption` key should be set to `true` (the default
    value).

2. The `security.encryptionCipherMode` key should specify proper cipher mode
    for decryption. The value can be one of the following two variants:
    * `AES256-CBC` (the default one for the Operator and Percona Server for
        MongoDB)
    * `AES256-GCM`

3. `security.encryptionKeySecret` should specify a secret object with the
    encryption key:

    ```yaml
    mongod:
      ...
      security:
        ...
        encryptionKeySecret: my-cluster-name-mongodb-encryption-key
    ```

Encryption key secret will be created automatically if it doesn’t exist.
If you would like to create it yourself, take into account that
[the key must be a 32 character string encoded in base64](https://docs.mongodb.com/manual/tutorial/configure-encryption/#local-key-management).

## Using HashiCorp Vault storage for encryption keys

To implement these features, the Operator uses `keyring_vault` plugin,
which ships with Percona XtraDB Cluster, and utilizes [HashiCorp Vault](https://www.vaultproject.io/) storage for encryption keys.

### Installing Vault

The following steps will deploy Vault on Kubernetes with the [Helm 3 package manager](https://helm.sh/). Other Vault installation methods should also work, so the instruction placed here is not obligatory and is for illustration purposes. Read more about installation in Vault’s [documentation](https://www.vaultproject.io/docs/platform/k8s).


1. Add helm repo and install:

    ```bash
    $ helm repo add hashicorp https://helm.releases.hashicorp.com
    "hashicorp" has been added to your repositories

    $ helm install vault hashicorp/vault
    ```

2. After the installation, Vault should be first initialized and then unsealed.
    Initializing Vault is done with the following commands:

    ```bash
    $ kubectl exec -it pod/vault-service-0 -- vault operator init -key-shares=1 -key-threshold=1 -format=json > /tmp/vault-init
    $ unsealKey=$(jq -r ".unseal_keys_b64[]" < /tmp/vault-init)
    ```

    To unseal Vault, execute the following command **for each Pod** of Vault
    running:

    ```bash
    $ kubectl exec -it pod/vault-service-0 -- vault operator unseal "$unsealKey"
    ```

### Configuring Vault


1. First, you should enable secrets within Vault. For this you will need a [Vault token](https://www.vaultproject.io/docs/concepts/tokens).
    Percona XtraDB Cluster can use any regular token which allows all operations
    inside the secrets mount point. In the following example we are using the
    *root token* to be sure the permissions requirement is met, but actually
    there is no need in root permissions. We don’t recommend using the root token
    on the production system.

    ```bash
    $ cat /tmp/vault-init | jq -r ".root_token"
    ```

    The output will be like follows:

    ```text
    s.VgQvaXl8xGFO1RUxAPbPbsfN
    ```

    Now login to Vault with this token and enable the “pxc-secret” secrets path:

    ```bash
    $ kubectl exec -it vault-service-0 -- /bin/sh
    $ vault login s.VgQvaXl8xGFO1RUxAPbPbsfN
    $ vault secrets enable --version=1 -path=pxc-secret kv
    ```

    !!! note

        You can also enable audit, which is not mandatory, but useful:

        ```bash
        $ vault audit enable file file_path=/vault/vault-audit.log
        ```


2. To enable Vault secret within Kubernetes, create and apply the YAML file,
    as described further.

    1. To access the Vault server via HTTP, follow the next YAML file example:

        ```yaml
        apiVersion: v1
        kind: Secret
        metadata:
          name: some-name-vault
        type: Opaque
        stringData:
          keyring_vault.conf: |-
             token = s.VgQvaXl8xGFO1RUxAPbPbsfN
             vault_url = vault-service.vault-service.svc.cluster.local
             secret_mount_point = pxc-secret
        ```

        !!! note

            the `name` key in the above file should be equal to the
            `spec.vaultSecretName` key from the `deploy/cr.yaml` configuration
            file.

    2. To turn on TLS and access the Vault server via HTTPS, you should do two more things:

        
            * add one more item to the secret: the contents of the `ca.cert` file
        with your certificate,


            * store the path to this file in the `vault_ca` key.

        ```yaml
        apiVersion: v1
        kind: Secret
        metadata:
          name: some-name-vault
        type: Opaque
        stringData:
          keyring_vault.conf: |-
            token = = s.VgQvaXl8xGFO1RUxAPbPbsfN
            vault_url = https://vault-service.vault-service.svc.cluster.local
            secret_mount_point = pxc-secret
            vault_ca = /etc/mysql/vault-keyring-secret/ca.cert
          ca.cert: |-
            -----BEGIN CERTIFICATE-----
            MIIEczCCA1ugAwIBAgIBADANBgkqhkiG9w0BAQQFAD..AkGA1UEBhMCR0Ix
            EzARBgNVBAgTClNvbWUtU3RhdGUxFDASBgNVBAoTC0..0EgTHRkMTcwNQYD
            7vQMfXdGsRrXNGRGnX+vWDZ3/zWI0joDtCkNnqEpVn..HoX
            -----END CERTIFICATE-----
        ```

        !!! note

            the `name` key in the above file should be equal to the
            `spec.vaultSecretName` key from the `deploy/cr.yaml` configuration
            file.

        !!! note

            For techincal reasons the `vault_ca` key should either exist
            or not exist in the YAML file; commented option like
            `#vault_ca = ...` is not acceptable.

More details on how to install and configure Vault can be found [in the official documentation](https://learn.hashicorp.com/vault?track=getting-started-k8s#getting-started-k8s).

