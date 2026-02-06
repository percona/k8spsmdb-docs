# System users

To automate the deployment and management of cluster components, the Operator requires system-level MongoDB users.

Credentials for these users are stored in a [Kubernetes Secrets :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/) object. The Operator first checks if a Secret already exists with the name specified in the `spec.secrets.users` field of your `deploy/cr.yaml` configuration file and reuses it if found. If no matching Secret exists, the Operator automatically creates a new Secret with randomly generated passwords during cluster creation.

## System users Secrets

The default name of the Secrets object for the system users is `my-cluster-name-secrets`. It is referenced in the `spec.secrets.users` field of the Custom Resource.

Aside from this Secret, the Operator creates an internal secret for its own internal purposes. See [Internal Secret and its usage](#internal-secret-and-its-usage) to learn more.

!!! warning

    Don't use system users to run applications.

| User Purpose    | Username Secret Key          | Password Secret Key              | 
|:----------------|:-----------------------------|:---------------------------------|
| Backup/Restore  | MONGODB_BACKUP_USER          | MONGODB_BACKUP_PASSWORD          |
| Cluster Admin   | MONGODB_CLUSTER_ADMIN_USER   | MONGODB_CLUSTER_ADMIN_PASSWORD   |
| Cluster Monitor | MONGODB_CLUSTER_MONITOR_USER | MONGODB_CLUSTER_MONITOR_PASSWORD |
| Database Admin  | MONGODB_DATABASE_ADMIN_USER  | MONGODB_DATABASE_ADMIN_PASSWORD  |
| User Admin      | MONGODB_USER_ADMIN_USER      | MONGODB_USER_ADMIN_PASSWORD      |
| PMM Server      | PMM_SERVER_USER              | PMM_SERVER_TOKEN                 |


### System users and MongoDB roles

The following table maps MongoDB roles to system users:

| User Purpose | MongoDB Roles |
|--------------|---------------|
| **Backup/Restore** | [backup :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-backup), [restore :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-restore), [clusterMonitor :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-clusterMonitor), [readWrite :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-readWrite), [pbmAnyAction :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/install/configure-authentication.html) |
| **Cluster Admin** | [clusterAdmin :octicons-link-external-16:](https://docs.mongodb.com/manual/reference/built-in-roles/#clusterAdmin) |
| **Cluster Monitor** | [clusterMonitor :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-clusterMonitor), [read (on the `local` database) :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-read), [explainRole :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/2/setting-up/client/mongodb.html#create-pmm-account-and-set-permissions) |
| **Database Admin** | [readWriteAnyDatabase :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-readWriteAnyDatabase), [readAnyDatabase :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-readAnyDatabase), [dbAdminAnyDatabase :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-dbAdminAnyDatabase), [backup :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-backup), [restore :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-restore), [clusterMonitor :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-clusterMonitor) |
| **User Admin** | [userAdminAnyDatabase :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-userAdminAnyDatabase) |
| **PMM Server** | See [PMM documentation](https://docs.percona.com/percona-monitoring-and-management/3/install-pmm/install-pmm-client/connect-database/mongodb.html) |

If you change credentials for the `MONGODB_CLUSTER_MONITOR` user, the cluster Pods will go into a restart cycle, and the cluster may not be accessible through the `mongos` service until this cycle finishes.

### YAML object format

You can create your own Secret and reference it in the CR for your cluster in `spec.secrets.users` key.

When you create the Secret object yourself, your YAML file should match the following simple format:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-cluster-name-secrets
type: Opaque
stringData:
  MONGODB_BACKUP_USER: backup
  MONGODB_BACKUP_PASSWORD: backup123456
  MONGODB_DATABASE_ADMIN_USER: databaseAdmin
  MONGODB_DATABASE_ADMIN_PASSWORD: databaseAdmin123456
  MONGODB_CLUSTER_ADMIN_USER: clusterAdmin
  MONGODB_CLUSTER_ADMIN_PASSWORD: clusterAdmin123456
  MONGODB_CLUSTER_MONITOR_USER: clusterMonitor
  MONGODB_CLUSTER_MONITOR_PASSWORD: clusterMonitor123456
  MONGODB_USER_ADMIN_USER: userAdmin
  MONGODB_USER_ADMIN_PASSWORD: userAdmin123456
  PMM_SERVER_USER: admin
  #PMM_SERVER_PASSWORD: admin
  #PMM_SERVER_API_KEY: apikey
  PMM_SERVER_TOKEN: token
```

The example above matches the default `deploy/secrets.yaml` file, which includes sample passwords and PMM Server credentials. These are intended only for development or automated testing. **Don't use them in production**.

### Update the Secret

When you create the Secrets object, you use the `stringData` type and specify all values for each key/value in plain text format. However, the resulting Secrets object contains passwords stored as base64-encoded strings in the `data` type.

To update any field, you'll need to encode the value into base64 format. 

Here's how to do it:
{.power-number}

1. Run the following command in your local shell to encode the new value. Replace the `new_password` with your value:

    === "Linux"
        
        ```bash
        echo -n "new_password" | base64 --wrap=0
        ```

    === "in macOS"

        ```bash
        echo -n "new_password" | base64
        ```

2. Update the Secrets object. For example, the following command updates the Database Admin user's password to `new_password` in the `my-cluster-name-secrets` object can be done with the following command:

    === "in Linux"

        ```bash
        kubectl patch secret/my-cluster-name-secrets -p '{"data":{"MONGODB_DATABASE_ADMIN_PASSWORD": "'$(echo -n new_password | base64 --wrap=0)'"}}'
        ```

    === "in macOS"

        ```bash
        kubectl patch secret/my-cluster-name-secrets -p '{"data":{"MONGODB_DATABASE_ADMIN_PASSWORD": "'$(echo -n new_password | base64)'"}}'
        ```


### Password rotation policies and timing

When there is a change in user secrets, the Operator creates the necessary transaction to change passwords. This rotation happens almost instantly (the delay can be up to a few seconds), and you don't need to take any action beyond changing the password.

!!! note

    Please don't change the `secrets.users` option in the CR. Make changes inside the secrets object itself.

### Reproduce system users for migration

In some situations, you may need to reproduce system users in a bare-bones MongoDB. For example, this is a required step in [migration scenarios :octicons-link-external-16:](https://www.percona.com/blog/migrating-mongodb-to-kubernetes) to move existing on-premises MongoDB databases to Kubernetes-based MongoDB clusters managed by the Operator. You can use the following example script that produces a text file with mongo shell commands to create the needed system users with appropriate roles:

??? example "gen_users.sh"

    ``` bash
    clusterAdminPass="clusterAdmin"
    userAdminPass="userAdmin"
    clusterMonitorPass="clusterMonitor"
    backupPass="backup"
    
    # mongo shell
    cat <<EOF > user-mongo-shell.txt
    use admin
    db.createRole({
        "roles" : [],
        "role" : "pbmAnyAction",
        "privileges" : [
            {
                "resource" : { "anyResource" : true },
                "actions" : [ "anyAction" ]
            }
        ]        
    })
    
    db.createUser( { user: "clusterMonitor", pwd: "$clusterMonitorPass", roles: [ "clusterMonitor" ] } )
    db.createUser( { user: "userAdmin", pwd: "$userAdminPass", roles: [ "userAdminAnyDatabase" ] } )
    db.createUser( { user: "clusterAdmin", pwd: "$clusterAdminPass", roles: [ "clusterAdmin" ] } )
    db.createUser( { user: "backup", pwd: "$backupPass", roles: [ "readWrite", "backup", "clusterMonitor", "restore", "pbmAnyAction" ] } )
    EOF
    ```
    
## Development mode

To make development and testing easier, the `deploy/secrets.yaml` secrets file contains default passwords for MongoDB system users.

These development-mode credentials from `deploy/secrets.yaml` are:

| Secret Key                       | Secret Value         |
|:---------------------------------|:---------------------|
| MONGODB_BACKUP_USER              | backup               |
| MONGODB_BACKUP_PASSWORD          | backup123456         |
| MONGODB_DATABASE_ADMIN_USER      | databaseAdmin        |
| MONGODB_DATABASE_ADMIN_PASSWORD  | databaseAdmin123456  |
| MONGODB_CLUSTER_ADMIN_USER       | clusterAdmin         |
| MONGODB_CLUSTER_ADMIN_PASSWORD   | clusterAdmin123456   |
| MONGODB_CLUSTER_MONITOR_USER     | clusterMonitor       |
| MONGODB_CLUSTER_MONITOR_PASSWORD | clusterMonitor123456 |
| MONGODB_USER_ADMIN_USER          | userAdmin            |
| MONGODB_USER_ADMIN_PASSWORD      | userAdmin123456      |
| PMM_SERVER_USER                  | admin                |
| PMM_SERVER_PASSWORD              | admin                |
| PMM_SERVER_API_KEY               | apikey               |

!!! warning

    Do not use the default MongoDB users and/or default PMM API key in production!

## Internal Secret and its usage

The Operator creates and updates an additional Secrets object which is named based on the cluster name, like `internal-my-cluster-name-users`. This Secrets object is used only by the Operator. Users must not change it.

This object contains secrets with the same passwords as the one specified in `spec.secrets.users` (e.g., `my-cluster-name-secrets`). When the user updates the `my-cluster-name-secrets` Secret, the Operator propagates these changes to the internal `internal-my-cluster-name-users` Secrets object.
