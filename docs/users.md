# Users

MongoDB user accounts within the cluster can be divided into two different groups:

* **Application-level users**: unprivileged user accounts for applications
* **System-level users**: privileged accounts needed to automate cluster deployment and management tasks, such as MongoDB health checks

These two groups serve different purposes. Read the following sections to learn more.

## Application-level (unprivileged) users

The Operator doesn't create application-level (unprivileged) user accounts by default.

You can create these unprivileged users in the following ways:

* [Automatically via Custom Resource](#create-users-via-custom-resource). This ability is available with the Operator versions 1.17.0 and newer
* [Manually in Percona Server for MongoDB](#create-users-manually)

Regardless of how you create users, their usernames must be unique.

### Create users via Custom Resource

Starting from Operator version 1.17.0, you can create users in Percona Server for MongoDB via the `users` subsection in the Custom Resource. This is called declarative user management.
{.power-number}

You can modify the `users` section in the `deploy/cr.yaml` configuration file either at cluster creation time or adjust it over time.

For every new user in the `deploy/cr.yaml` configuration file, specify the following:

* A username and the database where the user will be created. The username must be unique for every user
* Roles on databases in MongoDB that you want to grant to this user

Here's the example configuration:

```yaml
...
users:
  - name: my-user
    db: admin
    passwordSecretRef: 
      name: my-user-password
      key: password
    roles:
      - name: clusterAdmin
        db: admin
      - name: userAdminAnyDatabase
        db: admin
```

After you apply the configuration, the Operator creates a Secret named `<cluster-name>-custom-user-secret`, generates a password for the user, and sets it by the key named after the user name.

#### Generate user passwords manually

If you don't want the Operator to generate a user password automatically, you can create a Secret resource that contains the user password. Then specify a reference to this Secret resource in the `passwordSecretRef` key. You can find a detailed description of the corresponding options in the [Custom Resource reference](operator.md#operator-users-section).

Here's how to do it:

1. Create a Secret configuration file: 

    ```yaml title="my-secret.yaml"
    apiVersion: v1
    kind: Secret
    metadata:
      name: my-user-password
    type: Opaque
    stringData:
      password: mypassword
    ```

2. Create a Secret object:

    ```{.bash data-prompt="$"}
    $ kubectl apply -f my-secret.yaml
    ```

3. Reference this Secret in the Custom Resource

    ```yaml title="deploy/cr.yaml"
    ...
    users:
      - name: my-user
        db: admin
        passwordSecretRef: 
          name: my-user-password
          key: password
        roles:
          - name: clusterAdmin
            db: admin
          - name: userAdminAnyDatabase
            db: admin
    ```

4. Apply the configuration to create users:

    ```{.bash data-prompt="$"}
    $ kubectl apply -f deploy/cr.yaml
    ```

!!! note "External database users"

    The Operator doesn't generate passwords for users created in the **`$external`** database. You can't set the `passwordSecretRef` for these users either.

    Such users are used for authentication via an external authentication source, such as an LDAP server. The user credentials are stored in an external authentication source, and their usernames are mapped to those in the `$external` database during authentication.

The Operator tracks password changes in the Secret object and updates the user password in the database. This applies to [manually created users](#create-users-manually) as well: if a user was created manually in the database before creating the user via Custom Resource, the existing user is updated.

However, manual password updates in the database are not tracked: the Operator doesn't overwrite changed passwords with the old ones from the users Secret.

### Custom MongoDB roles

[Custom MongoDB roles :octicons-link-external-16:](https://www.mongodb.com/docs/manual/core/security-user-defined-roles/) allow providing fine-grained access control over your MongoDB deployment.

You can define custom MongoDB roles declaratively via the `roles` subsection in the Custom Resource.


This subsection contains an array of roles, each with:

* A defined custom name (`roles.name`)
* The database in which you want to store the user-defined role (`roles.db`)
* The `roles.privileges.actions` list of custom role actions that users granted this role can perform. For a list of accepted values, see [Privilege Actions :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/privilege-actions/#database-management-actions) in the manual of the corresponding MongoDB version.

Here's what you can do with actions: 
   
* You can grant actions either to the whole cluster (if `roles.privileges.resource.cluster` is set to true) or to a specific database or collection. 
* You can inherit privileges from existing roles by adding existing role and database names to the `roles.roles` subsection,
* You can apply authentication restrictions for your custom role based on IP address ranges for the client and server. 
   
The following example shows how the `roles` subsection may look:

```yaml 
roles:
    - role: my-role
      db: admin
      privileges:
        - resource:
            db: ''
            collection: ''
          actions:
            - find
      authenticationRestrictions:
        - clientSource:
            - 127.0.0.1
          serverAddress:
            - 127.0.0.1
      roles:
        - role: read
          db: admin
        - role: readWrite
          db: admin
```

Find more information about available options and their accepted values in the [roles subsection of the Custom Resource reference](operator.md#roles-section).

### Create users manually

You can create application-level users manually. Run the commands below, substituting the `<namespace name>` placeholder with the real namespace of your database cluster:
{.power-number}

=== "If sharding is enabled"

    1. Connect to Percona Server for MongoDB:
    
        ``` {.bash data-prompt="$"}
        $ kubectl run -i --rm --tty percona-client --image=percona/percona-server-mongodb:{{ mongodb80recommended }} --restart=Never -- bash -il
        ```

        ??? example "Sample output"

            ```{.text .no-copy}
            mongodb@percona-client:/$
            ```

    2. Start the `mongosh` session and create a user:
        
        ``` {.bash data-prompt="$"}
        $ mongosh "mongodb://userAdmin:userAdmin123456@my-cluster-name--mongos.<namespace name>.svc.cluster.local/admin?ssl=false"
        rs0:PRIMARY> db.createUser({
            user: "myApp",
            pwd: "myAppPassword",
            roles: [
              { db: "myApp", role: "readWrite" }
            ],
            mechanisms: [
               "SCRAM-SHA-1"
            ]
        })
        ```

    3. Test the newly created user:

        ```
        rs0:PRIMARY> use myApp
        rs0:PRIMARY> db.test.insert({ x: 1 })
        rs0:PRIMARY> db.test.findOne()
        ```

=== "If sharding is disabled"

    1. Connect to Percona Server for MongoDB:
    
        ``` {.bash data-prompt="$"}
        $ kubectl run -i --rm --tty percona-client --image=percona/percona-server-mongodb:{{ mongodb80recommended }} --restart=Never -- bash -il
        ```

        ??? example "Sample output"

            ```{.text .no-copy}
            mongodb@percona-client:/$
            ```

    2. Start the `mongosh` session and create a user:

        ``` {.bash data-prompt="$"}
        $ mongosh "mongodb+srv://userAdmin:userAdmin123456@my-cluster-name-rs0.<namespace name>.svc.cluster.local/admin?replicaSet=rs0&ssl=false"
        rs0:PRIMARY> db.createUser({
            user: "myApp",
            pwd: "myAppPassword",
            roles: [
              { db: "myApp", role: "readWrite" }
            ],
            mechanisms: [
               "SCRAM-SHA-1"
            ]
        })
        ```

    3. Test the newly created user:

        ```
        rs0:PRIMARY> use myApp
        rs0:PRIMARY> db.test.insert({ x: 1 })
        rs0:PRIMARY> db.test.findOne()
        ```

## System users

To automate the deployment and management of cluster components, the Operator requires system-level MongoDB users.

Credentials for these users are stored as a [Kubernetes Secrets :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/) object. The Operator requires a Kubernetes Secret before the database cluster is started. It uses an existing Secret, if it already exists. Otherwise, the Operator creates a new Secret with randomly generated passwords.

The name of the required Secret should be set in the `spec.secrets.users` option of the `deploy/cr.yaml` configuration file.

*Default Secret name:* `my-cluster-name-secrets`

*Secret name field:* `spec.secrets.users`

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

### YAML object format

The default name of the Secrets object for the system users is `my-cluster-name-secrets`. You can create your own Secret and reference it in the CR for your cluster in `spec.secrets.users` key.

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

        ``` {.bash data-prompt="$" }
        $ kubectl patch secret/my-cluster-name-secrets -p '{"data":{"MONGODB_DATABASE_ADMIN_PASSWORD": "'$(echo -n new_password | base64 --wrap=0)'"}}'
        ```

    === "in macOS"

        ``` {.bash data-prompt="$" }
        $ kubectl patch secret/my-cluster-name-secrets -p '{"data":{"MONGODB_DATABASE_ADMIN_PASSWORD": "'$(echo -n new_password | base64)'"}}'
        ```

### Internal Secret and its usage

The Operator creates and updates an additional Secrets object which is named based on the cluster name, like `internal-my-cluster-name-users`. This Secrets object is used only by the Operator. Users must not change it.
    
This object contains secrets with the same passwords as the one specified in `spec.secrets.users` (e.g., `my-cluster-name-secrets`). When the user updates the `my-cluster-name-secrets` Secret, the Operator propagates these changes to the internal `internal-my-cluster-name-users` Secrets object.

### Password rotation policies and timing

When there is a change in user secrets, the Operator creates the necessary transaction to change passwords. This rotation happens almost instantly (the delay can be up to a few seconds), and you don't need to take any action beyond changing the password.

!!! note

    Please don't change the `secrets.users` option in the CR. Make changes inside the secrets object itself.

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



## MongoDB internal authentication key (optional)

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
