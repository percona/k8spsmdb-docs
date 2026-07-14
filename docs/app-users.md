# Application-level (unprivileged) users

The Operator doesn't create application-level (unprivileged) user accounts by default.

You can create these unprivileged users in the following ways:

* [Automatically via Custom Resource](#create-users-via-custom-resource). This ability is available with the Operator versions 1.17.0 and newer
* [Manually in Percona Server for MongoDB](#create-users-manually)

Regardless of how you create users, their usernames must be unique.

## Create users via Custom Resource

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

### Generate user passwords manually

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

    ```bash
    kubectl apply -f my-secret.yaml
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

    ```bash
    kubectl apply -f deploy/cr.yaml
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

## Create users manually

You can create application-level users manually. Run the commands below, substituting the `<namespace name>` placeholder with the real namespace of your database cluster:
{.power-number}

=== "If sharding is enabled"

    1. Connect to Percona Server for MongoDB:
    
        ```bash
        kubectl run -i --rm --tty percona-client --image=percona/percona-server-mongodb:{{ mongodb80recommended }} --restart=Never -- bash -il
        ```

        ??? example "Sample output"

            ```{.text .no-copy}
            mongodb@percona-client:/$
            ```

    2. Start the `mongosh` session and create a user:
        
        ```bash
        mongosh "mongodb://userAdmin:userAdmin123456@my-cluster-name--mongos.<namespace name>.svc.cluster.local/admin?ssl=false"
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
    
        ```bash
        kubectl run -i --rm --tty percona-client --image=percona/percona-server-mongodb:{{ mongodb80recommended }} --restart=Never -- bash -il
        ```

        ??? example "Sample output"

            ```{.text .no-copy}
            mongodb@percona-client:/$
            ```

    2. Start the `mongosh` session and create a user:

        ```bash
        mongosh "mongodb+srv://userAdmin:userAdmin123456@my-cluster-name-rs0.<namespace name>.svc.cluster.local/admin?replicaSet=rs0&ssl=false"
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
