# Users

MongoDB user accounts within the cluster can be divided into two different groups:

* **Application-level users**: unprivileged user accounts for applications. You can create and manage these users.
* **System-level users**: privileged accounts needed to automate cluster deployment and management tasks, such as MongoDB health checks. The Operator creates these accounts during the cluster creation. 

These two groups serve different purposes. Read the following sections to learn more:

* [Application-level (unprivileged) users](app-users.md)
* [System users](system-users.md)

## Credentials management

The Operator stores user credentials in the Secret objects.

When the Operator creates application-level (unprivileged) users, it uses the username you specify in the Custom Resource (CR). The Operator either generates a password for this user and creates a corresponding Secret, or uses the credentials of a user you have manually created in MongoDB and creates a Secret with that data.

For system users, the Operator creates the required Secret automatically when it creates the cluster. If a Secret with the expected name already exists (as specified in the CR), the Operator will reuse it. Starting with version 1.22.0, you can also [store and manage system user credentials in HashiCorp Vault]. In this case, the Operator retrieves the passwords from Vault and creates or updates the relevant Secrets based on the Vault-stored credentials.

## Authentication 

Authentication is enabled in Percona Server for MongoDB clusters by default. If you need to disable authentication for development, testing, or migration purposes, see [Disable authentication](auth-disable.md).

### MongoDB internal authentication key (optional)

*Default Secret name:* `my-cluster-name-mongodb-keyfile`

*Secret name field:* `spec.secrets.key`

By default, the Operator creates a random, 1024-byte key for [MongoDB Internal Authentication :octicons-link-external-16:](https://docs.mongodb.com/manual/core/security-internal-authentication/) if it does not already exist. If you would like to deploy a different key, create the secret manually before starting the Operator. Example:

```yaml title="deploy/mongodb-keyfile.yaml"
apiVersion: v1
kind: Secret
metadata:
  name: my-cluster-name-mongodb-keyfile
type: Opaque
data:
  mongodb-key: <replace-this-value-with-base-64-encoded-text>
```
