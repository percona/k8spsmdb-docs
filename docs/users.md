# Users

MongoDB user accounts within the Cluster can be divided into two different groups:

* *application-level users*: the unprivileged user accounts,
* *system-level users*: the accounts needed to automate the cluster deployment
    and management tasks, such as MongoDB Health checks.

As these two groups of user accounts serve different purposes, they are
considered separately in the following sections.

## Unprivileged users

There are no unprivileged (general purpose) user accounts created by
default.

Starting from the Operator version 1.17.0 declarative creation of custom MongoDB users is supported via the `users` subsection in the Custom Resource. With previous versions custom users [had to be created manually](users_create_manually.md).

Users can be customized in `spec.users` section in the Custom Resource. Section can be changed at the cluster creation time and adjusted over time. Note the following:

- If `spec.users` is set during the cluster creation, the Operator will not create any default users. If you want additional databases, you will need to specify them.
- For each user added in `spec.users`, the Operator will create a Secret of the `<clusterName>-pguser-<userName>` format (such default Secret naming can be altered for the user with the `spec.users.secretName` option). This Secret will contain the user credentials.
- If no databases are specified, `dbname` and `uri` will not be present in the Secret.
- If at least one option under the `spec.users.databases` is specified, the first database in the list will be populated into the connection credentials.
- The Operator does not automatically drop users in case of removed Custom Resource options to prevent accidental data loss.
- Similarly, to prevent accidental data loss Operator does not automatically drop databases (see how to actually drop a database [here](users.md#deleting-users-and-databases)).
- Role attributes are not automatically dropped if you remove them. You need to set the inverse attribute to actually drop them (e.g. `NOSUPERUSER`).
- The special `postgres` user can be added as one of the custom users; however, the privileges of this user cannot be adjusted.

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
    
        ``` {.bash data-prompt="$"}
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

    ``` {.bash data-prompt="$"}
    $ kubectl patch secret/my-cluster-name-secrets -p '{"data":{"MONGODB_DATABASE_ADMIN_PASSWORD": "'$(echo -n new_password | base64 --wrap=0)'"}}'
    ```

=== "in macOS"

    ``` {.bash data-prompt="$"}
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
| PMM_SERVER_API_KEY               | apikey               |
| PMM_SERVER_USER                  | admin                |
| PMM_SERVER_PASSWORD              | admin                |

!!! warning

    Do not use the default MongoDB Users and/or default PMM API key in production!

## MongoDB Internal Authentication Key (optional)

*Default Secret name:* `my-cluster-name-mongodb-key`

*Secret name field:* `spec.secrets.key`

By default, the operator will create a random, 1024-byte key for
[MongoDB Internal Authentication  :octicons-link-external-16:](https://docs.mongodb.com/manual/core/security-internal-authentication/)
if it does not already exist. If you would like to deploy a different
key, create the secret manually before starting the operator.
