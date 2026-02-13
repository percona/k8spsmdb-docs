# Data-at-rest encryption

!!! admonition "Version added: [1.1.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.1.0.md)"


Data-at-rest encryption ensures that data stored on disk remains protected even if the underlying storage is compromised. This process is transparent to your applications, meaning you don't need to change the application's code. If an unauthorized user gains access to the storage, they can't read the data files.

To learn more about data-at-rest-encryption in Percona Server for MongoDB, see the [Data-at-rest encryption :octicons-link-external-16:](https://docs.percona.com/percona-server-for-mongodb/latest/data-at-rest-encryption.html) documentation.

Data-at-rest encryption is turned on by default. The Operator implements it in one of the following ways:

* [uses an encryption key stored in a Secret](#use-an-encryption-key-secret)
* [gets encryption key from the HashiCorp Vault key storage](#use-hashicorp-vault-to-store-and-manage-encryption-keys). 

## Use an encryption key Secret

You can configure data-at-rest encryption in Percona Server for MongoDB using an encryption key stored in a Kubernetes Secret. This is the default approach when you are not using an external key management store such as HashiCorp Vault.

How it works:

The Operator uses a single encryption key to protect MongoDB data files on disk. You tell the Operator which Secret holds that key by setting the `secrets.encryptionKey` option in the cluster Custom Resource.

The Operator creates a Secret with the specified name and generates a random 32-byte key (base64-encoded), if such a Secret doesn't already exist. You can also use your own key and create a Secret object with it; the key must be a [32-character string encoded in base64](https://www.mongodb.com/docs/manual/tutorial/configure-encryption/#local-key-management). Reference your Secret in the Custom Resource for the Operator to use it.

Next, enable encryption and choose the cipher mode in the MongoDB configuration for all Pods where you want to encrypt data: regular replica set members (primary and secondary) as well as non-voting replica set members, and config servers if you use sharding. The Operator mounts the key from the Secret into the MongoDB pods so the database can encrypt and decrypt data at rest.

Once configured, encryption is transparent to your applications; no code changes are required.

## Use HashiCorp Vault to store and manage encryption keys

!!! admonition "Version added: [1.13.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.13.0.md)"

You can configure the Operator to use [HashiCorp Vault](https://www.vaultproject.io/) - a universal, secure and reliable way to store and distribute secrets without depending on the operating system, platform or cloud provider. 

Using Vault for data-at-rest encryption you benefit from:

* **Centralized key management** – Keys live in a dedicated secrets store instead of Kubernetes Secrets. You can enforce different access policies to better comply with your organization's security requirements.
* **Audit and compliance** – Vault can log and audit access to the encryption key, which helps with compliance and security reviews.
* **Flexibility** – You can run Vault on-premises, in the cloud, or as a managed service, independent of the Kubernetes cluster.
    
    The Operator does not install or configure Vault; you run and manage Vault yourself and then reference it in the cluster Custom Resource.

How it works:

You create a Kubernetes Secret that holds the token that the Operator uses to authenticate to Vault. In the Custom Resource you set `secrets.vault` to that Secret’s name and add Vault-related options to the MongoDB configuration (server address, secret path, token mount path, and optionally TLS). The Operator reads the encryption key from Vault and makes it available to the `mongod` pods. Percona Server for MongoDB uses that key to encrypt and decrypt data on disk, the same as with [an encryption key stored in a Kubernetes Secret](#use-an-encryption-key-secret). Encryption remains transparent to your applications.

### Supported secrets engine

The Operator expects the encryption key to be stored in Vault’s **KV (Key-Value) secrets engine**. Percona Server for MongoDB supports the **KV version 2** (`kv-v2`) with versioning enabled. You enable the secrets engine at a path (for example `secret/`). This is where the encryption keys are stored. The Custom Resource configuration must reference that path so the Operator can read the key. Other Vault secrets engines (for example Transit or KMIP) are not used for this integration.

## Configuration guides

Choose a setup guide based on your security requirements:

* [Configure data-at-rest encryption using an encryption key Secret](encryption-keyfile.md)
* [Configure data-at-rest encryption using HashiCorp Vault without TLS](encryption-vault.md)
* [Configure data-at-rest encryption using HashiCorp Vault with TLS](encryption-vault-tls.md)
