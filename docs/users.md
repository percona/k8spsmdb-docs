# Users

MongoDB user accounts within the Cluster can be divided into two different groups:

* *application-level users*: the unprivileged user accounts,
* *system-level users*: the accounts needed to automate the cluster deployment
    and management tasks, such as MongoDB Health checks.

As these two groups of user accounts serve different purposes, they are
considered separately in the following sections.

## Unprivileged users

The Operator does not create unprivileged (general purpose) user accounts by default.
There are two ways to create general purpose users:

* manual creation of custom MongoDB users,
* automated users creation via Custom Resource (Operator versions 1.17.0 and newer).

### Create users in the Custom Resource

Starting from the Operator version 1.17.0 declarative creation of custom MongoDB users is supported via the `users` subsection in the Custom Resource.

!!! warning

    Declarative user management has technical preview status and is not yet recommended for production environments.

You can change `users` section in the `deploy/cr.yaml` configuration file at the cluster creation time, and adjust it over time.

You can specify a new user in `deploy/cr.yaml` configuration file, setting the user's login name and database, a reference to a key in some Secret resource that contains user's password, as well as MongoDB roles on various databases which should be assigned to this user. You can find detailed description of the corresponding options in the [Custom Resource reference](operator.md#operator-users-section), and here is a self-explanatory example:

``` {.bash data-prompt="$"}
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

The Secret mentioned in the `users.passwordSecretRef.name` option should look as follows:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-user-password
type: Opaque
stringData:
  password: mypassword
```

The Operator tracks password changes in the Secrtet object, and updates the user password in the database, when needed.

Note the following limitations of the current declarative user management implementation:

* The user is not automatically updated after `users.user.roles` are changed,
* The new user is not created when the `users.user.db` is updated,
* If the user created using Custom Resource is manually deleted in the database, it is not recreated (neither automatically, nor after Custom Resource manifest re-apply).
* If the user was created manually in the database before creating user via Custom Resource, the existing user is updated.
* If the user name is changed in the Custom Resource, the new user will be created, and the old one will stay in the database and should be removed manually.

### Create users manually

You can create unprivileged users manually. Please run commands below, substituting the `<namespace name>` placeholder with the real namespace of your database cluster:

=== "if sharding is on"
    ``` {.bash data-prompt="$" data-prompt-second="mongodb@percona-client:/$"}
    $ kubectl run -i --rm --tty percona-client --image=percona/percona-server-mongodb:{{ mongodb70recommended }} --restart=Never -- bash -il
    mongodb@percona-client:/$
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

    Now check the newly created user:

    ``` {.bash data-prompt="$" data-prompt-second="mongodb@percona-client:/$"}
    $ kubectl run -i --rm --tty percona-client --image=percona/percona-server-mongodb:{{ mongodb70recommended }} --restart=Never -- bash -il
    mongodb@percona-client:/$ mongosh "mongodb+srv://myApp:myAppPassword@my-cluster-name-rs0.<namespace name>.svc.cluster.local/admin?replicaSet=rs0&ssl=false"
    rs0:PRIMARY> use myApp
    rs0:PRIMARY> db.test.insert({ x: 1 })
    rs0:PRIMARY> db.test.findOne()
    ```

=== "if sharding is off"
    ``` {.bash data-prompt="$" data-prompt-second="mongodb@percona-client:/$"}
    $ kubectl run -i --rm --tty percona-client --image=percona/percona-server-mongodb:{{ mongodb70recommended }} --restart=Never -- bash -il
    mongodb@percona-client:/$
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

    Now check the newly created user:

    ``` {.bash data-prompt="$" data-prompt-second="mongodb@percona-client:/$"}
    $ kubectl run -i --rm --tty percona-client --image=percona/percona-server-mongodb:{{ mongodb70recommended }} --restart=Never -- bash -il
    mongodb@percona-client:/$ mongosh "mongodb+srv://myApp:myAppPassword@my-cluster-name-rs0.<namespace name>.svc.cluster.local/admin?replicaSet=rs0&ssl=false"
    rs0:PRIMARY> use myApp
    rs0:PRIMARY> db.test.insert({ x: 1 })
    rs0:PRIMARY> db.test.findOne()
    ```

## System Users

To automate the deployment and management of the cluster components, 
the Operator requires system-level MongoDB users.

Credentials for these users are stored as a [Kubernetes Secrets  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/) object.
The Operator requires Kubernetes Secret before the database cluster is
started. It will either use existing Secret or create a new Secret with
randomly generated passwords if it didn’t exist.
The name of the required Secret should be set in
the `spec.secrets.users` option of the `deploy/cr.yaml`
configuration file.

*Default Secret name:* `my-cluster-name-secrets`

*Secret name field:* `spec.secrets.users`

!!! warning

    These users should not be used to run an application.

| User Purpose    | Username Secret Key          | Password Secret Key              |
|:----------------|:-----------------------------|:---------------------------------|
| Backup/Restore  | MONGODB_BACKUP_USER          | MONGODB_BACKUP_PASSWORD          |
| Cluster Admin   | MONGODB_CLUSTER_ADMIN_USER   | MONGODB_CLUSTER_ADMIN_PASSWORD   |
| Cluster Monitor | MONGODB_CLUSTER_MONITOR_USER | MONGODB_CLUSTER_MONITOR_PASSWORD |
| Database Admin  | MONGODB_DATABASE_ADMIN_USER  | MONGODB_DATABASE_ADMIN_PASSWORD  |
| User Admin      | MONGODB_USER_ADMIN_USER      | MONGODB_USER_ADMIN_PASSWORD      |
| PMM Server      | PMM_SERVER_USER              | PMM_SERVER_PASSWORD              |

**Password-based authorization method for PMM is deprecated since the Operator 1.13.0**. [Use token-based authorization instead](monitoring.md#operator-monitoring-client-token).

* Backup/Restore - MongoDB Role: [backup  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-backup),
    [restore  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-restore),
    [clusterMonitor  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-clusterMonitor)

* Cluster Admin - MongoDB Roles: [clusterAdmin  :octicons-link-external-16:](https://docs.mongodb.com/manual/reference/built-in-roles/#clusterAdmin)

* Cluster Monitor - MongoDB Role: [clusterMonitor  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-clusterMonitor)

* Database Admin - MongoDB Roles: [readWriteAnyDatabase  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-readWriteAnyDatabase), [readAnyDatabase  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-readAnyDatabase), [dbAdminAnyDatabase  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-dbAdminAnyDatabase), [backup  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-backup),
    [restore  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-restore),
    [clusterMonitor  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-clusterMonitor)

* User Admin - MongoDB Role: [userAdmin  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-userAdmin)

If you change credentials for the `MONGODB_CLUSTER_MONITOR` user, the cluster
Pods will go into restart cycle, and the cluster can be not accessible through
the `mongos` service until this cycle finishes.

!!! note

    In some situations it can be needed to reproduce system users in a bare-bone
    MongoDB. For example, that's a required step in the [migration scenarios  :octicons-link-external-16:](https://www.percona.com/blog/migrating-mongodb-to-kubernetes)
    to move existing on-prem MongoDB database to Kubernetes-based MongoDB
    cluster managed by the Operator. You can use the following example script
    which produces a text file with mongo shell commands to create needed system
    users with appropriate roles:
    
    ??? example "gen_users.sh"
    
        ``` bash
        clusterAdminPass="clusterAdmin"
        userAdminPass="userAdmin"
        clusterMonitorPass="clusterMonitor"
        backupPass="backup"
        
        # mongo shell
        cat <<EOF > user-mongo-shell.txt
        use admin
        db.createRole(
        {
        "roles": [],
        role: "pbmAnyAction",
        "privileges" : [
                        {
                                "resource" : {
                                        "anyResource" : true
                                },
                                "actions" : [
                                        "anyAction"
                                ]
                        }
                ],
        
        })
        
        db.createUser( { user: "clusterMonitor", pwd: "$clusterMonitorPass", roles: [ "clusterMonitor" ] } )
        db.createUser( { user: "userAdmin", pwd: "$userAdminPass", roles: [ "userAdminAnyDatabase" ] } )
        db.createUser( { user: "clusterAdmin", pwd: "$clusterAdminPass", roles: [ "clusterAdmin" ] } )
        db.createUser( { user: "backup", pwd: "$backupPass", roles: [ "readWrite", "backup", "clusterMonitor", "restore", "pbmAnyAction" ] } )
        EOF
        ```

### YAML Object Format

The default name of the Secrets object for these users is 
`my-cluster-name-secrets` and can be set in the CR for your cluster in
`spec.secrets.users` to something different. When you create the object
yourself, the corresponding YAML file should match the following simple format:

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
  PMM_SERVER_PASSWORD: admin
  PMM_SERVER_API_KEY: apikey
```

The example above matches what is shipped in `deploy/secrets.yaml` which 
contains default passwords and default API key. You should NOT use these
in production, but they are present to assist in automated testing or
simple use in a development environment.

As you can see, because we use the `stringData` type when creating the Secrets
object, all values for each key/value pair are stated in plain text format
convenient from the user’s point of view. But the resulting Secrets object
contains passwords stored as `data` - i.e., base64-encoded strings. If you want
to update any field, you’ll need to encode the value into base64 format. To do
this, you can run `echo -n "password" | base64 --wrap=0` (or just
`echo -n "password" | base64` in case of Apple macOS) in your local shell to get
valid values. For example, setting the Database Admin user’s password to
`new_password` in the `my-cluster-name-secrets` object can be done with the
following command:

=== "in Linux"

    ```bash
    $ kubectl patch secret/my-cluster-name-secrets -p '{"data":{"MONGODB_DATABASE_ADMIN_PASSWORD": "'$(echo -n new_password | base64 --wrap=0)'"}}'
    ```

=== "in macOS"

    ```bash
    $ kubectl patch secret/my-cluster-name-secrets -p '{"data":{"MONGODB_DATABASE_ADMIN_PASSWORD": "'$(echo -n new_password | base64)'"}}'
    ```

!!! note

    The operator creates and updates an additional Secrets object named
    based on the cluster name, like `internal-my-cluster-name-users`. It is
    used only by the Operator and should undergo no manual changes by the user.
    This object contains secrets with the same passwords as the one specified
    in `spec.secrets.users` (e.g. `my-cluster-name-secrets`). When the
    user updates `my-cluster-name-secrets`, the Operator propagates these
    changes to the internal `internal-my-cluster-name-users` Secrets object.

### Password Rotation Policies and Timing

When there is a change in user secrets, the Operator creates the necessary
transaction to change passwords. This rotation happens almost instantly (the
delay can be up to a few seconds), and it’s not needed to take any action beyond
changing the password.

!!! note

    Please don’t change `secrets.users` option in CR, make changes
    inside the secrets object itself.

## Development Mode

To make development and testing easier, `deploy/secrets.yaml` secrets file
contains default passwords for MongoDB system users.

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

    Do not use the default MongoDB Users and/or default PMM API key in production!

## MongoDB Internal Authentication Key (optional)

*Default Secret name:* `my-cluster-name-mongodb-key`

*Secret name field:* `spec.secrets.key`

By default, the operator will create a random, 1024-byte key for
[MongoDB Internal Authentication  :octicons-link-external-16:](https://docs.mongodb.com/manual/core/security-internal-authentication/)
if it does not already exist. If you would like to deploy a different
key, create the secret manually before starting the operator.
