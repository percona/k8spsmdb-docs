# How to integrate Percona Operator for MongoDB with OpenLDAP

Enterprises use LDAP services provided by software like OpenLDAP, Microsoft Active Directory, etc. to control information about users, systems, networks, services and applications and manage corresponding access rights for the authentication/authorization process in a centralized way.

The following guide describes the integration of OpenLDAP with Percona Server for MongoDB managed by the Operator. We assume your OpenLDAP server is already installed and running.

To help you understand and perform the integration of OpenLDAP with Percona Server for MongoDB and the Operator, refer to the following resources:

- Learn about LDAP concepts and [LDIF  :octicons-link-external-16:](https://en.wikipedia.org/wiki/LDAP_Data_Interchange_Format) files, which are used for configuration.
- Follow the official [OpenLDAP documentation  :octicons-link-external-16:](https://www.openldap.org/doc/admin26/) for detailed instructions on how to install and configure OpenLDAP.
- Review the [Percona Server for MongoDB documentation  :octicons-link-external-16:](https://docs.percona.com/percona-server-for-mongodb/latest/authentication.html) for guidance on configuring MongoDB to work with LDAP.

## Configure the OpenLDAP server

Add users to your LDAP directory. To do that, use [LDIF  :octicons-link-external-16:](https://en.wikipedia.org/wiki/LDAP_Data_Interchange_Format) (LDAP Data Interchange Format) files. LDIF is a standard plain-text format for representing LDAP entries and operations. You create LDIF files to define new users, groups, or other LDAP directory entries, and then apply them to your directory using LDAP utilities like `ldapadd`. LDIF can describe any LDAP entry or modification, making it essential for managing your LDAP Data Information Tree (DIT).

1. Add the following LDIF portions to your OpenLDAP server.

    ```yaml
    0-percona-ous.ldif: |-
      dn: ou=perconadba,dc=ldap,dc=local
      objectClass: organizationalUnit
      ou: perconadba
    1-percona-users.ldif: |-
      dn: uid=percona,ou=perconadba,dc=ldap,dc=local
      objectClass: top
      objectClass: account
      objectClass: posixAccount
      objectClass: shadowAccount
      cn: percona
      uid: percona
      uidNumber: 1100
      gidNumber: 100
      homeDirectory: /home/percona
      loginShell: /bin/bash
      gecos: percona
      userPassword: {crypt}x
      shadowLastChange: -1
      shadowMax: -1
      shadowWarning: -1 
    2-group-cn.ldif: |-
      dn: cn=admin,ou=perconadba,dc=ldap,dc=local
      cn: admin
      objectClass: groupOfUniqueNames
      objectClass: top
      ou: perconadba
      uniqueMember: uid=percona,ou=perconadba,dc=ldap,dc=local
    ```

2. Create a read-only user for the database-issued user lookups. Use the following command, resetting the percona user password:

    ```bash
    ldappasswd -s percona -D "cn=admin,dc=ldap,dc=local" -w password -x "uid=percona,ou=perconadba,dc=ldap,dc=local"
    ```

!!! note

    If you are not sure about the approach to make references between user and group objects, [OpenLDAP overlays  :octicons-link-external-16:](https://www.openldap.org/doc/admin24/overlays.html) provide one of the possible ways to go.

## Configure the Operator and Percona Server for MongoDB

The following steps will look different depending on your MongoDB topology.

### Replica set

To connect MongoDB to OpenLDAP in a non-sharded (replica set) cluster, you need to configure both:

* `mongod`
* An internal MongoDB role

The steps are the following:

1. Create a configuration Secret for mongod. This fragment provides `mongod` configuration with LDAP-specific parameters, such as the FQDN of the LDAP server (`servers`), the explicit lookup user, domain rules, and more.

    ``` yaml title="my_mongod.conf"
    security:
      authorization: "enabled"
      ldap:
        authz:
          queryTemplate: '{USER}?memberOf?base'
        servers: "openldap"
        transportSecurity: none
        bind:
          queryUser: "cn=readonly,dc=ldap,dc=local"
          queryPassword: "password"
        userToDNMapping:
          '[
              {
                match : "(.+)",
                ldapQuery: "OU=perconadba,DC=ldap,DC=local??sub?(uid={0})"
              }
      ]'
    setParameter:
      authenticationMechanisms: 'PLAIN,SCRAM-SHA-256'
    ```

2. Put the snippet on your local machine and create a Kubernetes Secret object named `<cluster-name>-<replicaset-name>-mongod`. Find the cluster name in the `metadata.name` field and the replica set name in the `spec.replsets.name` field of your Custom Resource. The following command creates a Secret for the cluster named `my-cluster-name` and `rs0` replica set:

    ```bash
    kubectl create secret generic my-cluster-name-rs0-mongod --from-file=mongod.conf=my_mongod.conf
    ```

3. Apply the configuration to create or update the database:
   
    ```bash
    kubectl apply -f deploy/cr.yaml
    ```
    
    
4. Create roles for the ‘external’ user inside the MongoDB. This user is managed by LDAP. For this, log into MongoDB as administrator:

    ```bash
    mongo "mongodb+srv://userAdmin:<userAdmin_password>@<your_cluster_name>-rs0.<your_namespace>.svc.cluster.local/admin?replicaSet=rs0&ssl=false"
    ```

    When logged in, execute the following:

    ``` {.javascript data-prompt="admin>"}
    admin> db.getSiblingDB("admin").createRole(
    {
    role: "cn=admin,ou=perconadba,dc=ldap,dc=local",
    privileges: [],
    roles : [
      {
        "role" : "readAnyDatabase",
        "db" : "admin"
      },
      {
        "role" : "dbAdminAnyDatabase",
        "db" : "admin"
      },
      {
        "role" : "clusterMonitor",
        "db" : "admin"
      },
      {
        "role" : "readWriteAnyDatabase",
        "db" : "admin"
      },
      {
        "role" : "restore",
        "db" : "admin"
      },
      {
        "role" : "backup",
        "db" : "admin"
      }
    ],
    }
    )
    ```

!!! note

    Extra roles listed in the above example are just to show more than one possible variant.

5. Now the new `percona` user created inside OpenLDAP is able to login to MongoDB as administrator. Verify whether the user role has been identified correctly with the following command:

    ```bash
    mongo --username percona --password 'percona' --authenticationMechanism 'PLAIN' --authenticationDatabase '$external' --host <mongodb-rs-endpoint> --port 27017
    ```

    When logged in, execute the following:

    ``` {.javascript data-prompt="admin>"}
    admin> db.runCommand({connectionStatus:1})
    ```

    ??? example "Sample output"

        ```json
        {
        "authInfo" : {
          "authenticatedUsers" : [
            {
              "user" : "percona",
              "db" : "$external"
            }
          ],
          "authenticatedUserRoles" : [
            {
              "role" : "restore",
              "db" : "admin"
            },
            {
              "role" : "readAnyDatabase",
              "db" : "admin"
            },
            {
              "role" : "clusterMonitor",
              "db" : "admin"
            },
            {
              "role" : "dbAdminAnyDatabase",
              "db" : "admin"
            },
            {
              "role" : "backup",
              "db" : "admin"
            },
            {
              "role" : "cn=admin,ou=perconadba,dc=ldap,dc=local",
              "db" : "admin"
            },
            {
              "role" : "readWriteAnyDatabase",
              "db" : "admin"
            }
          ]
        },
        "ok" : 1,
        "$clusterTime" : {
          "clusterTime" : Timestamp(1663067287, 4),
          "signature" : {
            "hash" : BinData(0,"ZaLGSVj4ZwZrngXZSOqXB5rx+oo="),
            "keyId" : NumberLong("7142816031004688408")
          }
        },
        "operationTime" : Timestamp(1663067287, 4)
        }
        ```

### Sharded cluster

To connect MongoDB to OpenLDAP in a sharded cluster, you need to configure the following components:

* `mongod`
* An internal MongoDB role
* `mongos`

You must configure both `mongos` and the configuration server replica set (`mongod`) to make the LDAP server a part of the Authentication/Authorization chain.

`mongos` is a router between shards and underlying database instances, while configuration server replica set is responsible for keeping information about database users and roles. Thus, the router can perform only authentication, while authorization is the responsibility of the configuration server replica set.

1. Create configuration Secrets for the `mongos` and the configuration server replica set respectively.

   Example Secret for `mongos`:

    ```yaml title="my_mongos.conf"
    security:
      ldap:
        servers: "openldap"
        transportSecurity: none
        bind:
          queryUser: "cn=readonly,dc=ldap,dc=local"
          queryPassword: "password"
        userToDNMapping:
          '[
              {
                match : "(.+)",
                ldapQuery: "OU=perconadba,DC=ldap,DC=local??sub?(uid={0})"
              }
        ]'
    setParameter:
      authenticationMechanisms: 'PLAIN,SCRAM-SHA-256'
    ```

    Example Secret for the configuration server replica set:

    ```yaml title="my_mongod.conf"
    security:
      authorization: "enabled"
      ldap:
        authz:
          queryTemplate: '{USER}?memberOf?base'
        servers: "openldap"
        transportSecurity: none
        bind:
          queryUser: "cn=readonly,dc=ldap,dc=local"
          queryPassword: "password"
        userToDNMapping:
          '[
              {
                match : "(.+)",
                ldapQuery: "OU=perconadba,DC=ldap,DC=local??sub?(uid={0})"
              }
        ]'
    setParameter:
      authenticationMechanisms: 'PLAIN,SCRAM-SHA-256'
    ```

    Both files are pretty much the same except the `authz` subsection, which is only present for the configuration server replica set.

2. Put the snippets on your local machine and create Kubernetes Secret objects. The Secret for `mongos` is named `<cluster-name>-mongos`. The Secret for the configuration server replica set is named `<cluster-name>-cfg-mongod`.
   
Find the cluster name in the `metadata.name` field of your Custom Resource. The following commands create Secrets for the cluster named `my-cluster-name`:

    ```bash
    kubectl create secret generic my-cluster-name-mongos --from-file=mongos.conf=my_mongos.conf
    kubectl create secret generic my-cluster-name-cfg-mongod --from-file=mongod.conf=my_mongod.conf
    ```

3. Apply the configuration to create or update the database cluster:
    
    ```bash
    kubectl apply -f deploy/cr.yaml
    ```

4. Create roles for the ‘external’ user inside the MongoDB. This user is managed by LDAP. For this, log into MongoDB as administrator:

      ```bash
      mongo "mongodb://userAdmin:<userAdmin_password>@<your_cluster_name>-mongos.<your_namespace>.svc.cluster.local/admin?ssl=false"
      ```

      When logged in, execute the following:

      ``` {.javascript data-prompt="mongos>" }
      mongos> db.getSiblingDB("admin").createRole(
      {
      role: "cn=admin,ou=perconadba,dc=ldap,dc=local",
      privileges: [],
      roles : [
        {
          "role" : "readAnyDatabase",
          "db" : "admin"
        },
        {
          "role" : "dbAdminAnyDatabase",
          "db" : "admin"
        },
        {
          "role" : "clusterMonitor",
          "db" : "admin"
        },
        {
          "role" : "readWriteAnyDatabase",
          "db" : "admin"
        },
        {
          "role" : "restore",
          "db" : "admin"
        },
        {
          "role" : "backup",
          "db" : "admin"
        }
      ],
      }
      )
      ```

      !!! note

          Extra roles listed in the above example are just to show more than one possible variant.

5. Now the new `percona` user created inside OpenLDAP is able to login to MongoDB as administrator. Verify whether the user role has been identified correctly with the following command:

    ```bash
    mongo --username percona --password 'percona' --authenticationMechanism 'PLAIN' --authenticationDatabase '$external' --host <your_cluster_name>-mongos --port 27017
    ```

    When logged in, execute the following:

    ``` {.javascript data-prompt="mongos>" }
    mongos> db.runCommand({connectionStatus:1})
    ```

    ??? example "Sample output"

        ``` {.json data-prompt="mongos>" }
        {
        "authInfo" : {
          "authenticatedUsers" : [
            {
              "user" : "percona",
              "db" : "$external"
            }
          ],
          "authenticatedUserRoles" : [
            {
              "role" : "restore",
              "db" : "admin"
            },
            {
              "role" : "readAnyDatabase",
              "db" : "admin"
            },
            {
              "role" : "clusterMonitor",
              "db" : "admin"
            },
            {
              "role" : "dbAdminAnyDatabase",
              "db" : "admin"
            },
            {
              "role" : "backup",
              "db" : "admin"
            },
            {
              "role" : "cn=admin,ou=perconadba,dc=ldap,dc=local",
              "db" : "admin"
            },
            {
              "role" : "readWriteAnyDatabase",
              "db" : "admin"
            }
          ]
        },
        "ok" : 1,
        "$clusterTime" : {
          "clusterTime" : Timestamp(1663067287, 4),
          "signature" : {
            "hash" : BinData(0,"ZaLGSVj4ZwZrngXZSOqXB5rx+oo="),
            "keyId" : NumberLong("7142816031004688408")
          }
        },
        "operationTime" : Timestamp(1663067287, 4)
        }
        mongos>
        ```

## OIDC authentication and LDAP authorization

A configuration file provided via a Secret takes precedence over Custom Resource settings (`spec.configuration`).

If you use [OIDC authentication](oidc.md) with LDAP authorization, merge both setups in one place — either in the Secret or in the Custom Resource — so one configuration does not overwrite the other. In this case, also update the authentication mechanisms to include `MONGODB-OIDC`.

## Using LDAP over TLS connection

[LDAP over TLS  :octicons-link-external-16:](https://www.openldap.org/faq/data/cache/185.html) allows you to use Transport Layer Security, encrypting your communication between MongoDB and OpenLDAP server.

Here are the needed modifications to [The MongoDB and Operator side](https://docs.percona.com/percona-operator-for-mongodb/ldap.html#the-mongodb-and-operator-side) subsection which will enable it:

1. First, create a secret that contains the SSL certificate to connect to LDAP. The following example creates it from the file with CA certificate (the one you use in `/etc/openldap/ldap.conf`), naming the new secret `my-ldap-secret`:

    ```bash
    kubectl create secret generic my-ldap-secret --from-file=ca.crt=ldap-ca.pem
    ```

2. Set the `secrets.ldapSecret` Custom Resource option to the name of your newly created secret. Your modified `deploy/cr.yaml` may look as follows:

    ```yaml
    ...
      secrets:
        ...
        ldapSecret: my-ldap-secret
    ```

3. It is also necessary to change the value of transportSecurity to `tls` in mongod and mongos configurations. The configuration is similar to one described at the [The MongoDB and Operator side](https://docs.percona.com/percona-operator-for-mongodb/ldap.html#the-mongodb-and-operator-side) subsection:

    Changed mongod configuration should look as follows:

    ``` yaml title="my_mongod.conf"  hl_lines="7"
    security:
      authorization: "enabled"
      ldap:
        authz:
          queryTemplate: '{USER}?memberOf?base'
        servers: "openldap"
        transportSecurity: tls
        bind:
          queryUser: "cn=readonly,dc=ldap,dc=local"
          queryPassword: "password"
        userToDNMapping:
          '[
              {
                match : "(.+)",
                ldapQuery: "OU=perconadba,DC=ldap,DC=local??sub?(uid={0})"
              }
       ]'
    setParameter:
      authenticationMechanisms: 'PLAIN,SCRAM-SHA-256'
    ```

    If **sharding is on**, you will also need to change mongos configuration:

    ```yaml title="my_mongos.conf" hl_lines="4"
    security:
      ldap:
        servers: "openldap"
        transportSecurity: tls
        bind:
          queryUser: "cn=readonly,dc=ldap,dc=local"
          queryPassword: "password"
        userToDNMapping:
          '[
              {
                match : "(.+)",
                ldapQuery: "OU=perconadba,DC=ldap,DC=local??sub?(uid={0})"
              }
        ]'
    setParameter:
      authenticationMechanisms: 'PLAIN,SCRAM-SHA-256'
    ```

