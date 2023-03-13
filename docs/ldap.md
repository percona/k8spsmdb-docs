# How to integrate Percona Operator for MongoDB with OpenLDAP

LDAP services provided by software like OpenLDAP, Microsoft Active Directory,
etc. are widely used by enterprises to control information about users, systems,
networks, services and applications and the corresponding access rights for the
authentication/authorization process in a centralized way.

The following guide covers a simple integration of the already-installed
OpenLDAP server with Percona Distribution for MongoDB and the Operator. You can
know more about LDAP concepts and [LDIF](https://en.wikipedia.org/wiki/LDAP_Data_Interchange_Format)
files used to configure it, and find how to install and configure OpenLDAP in
the official [OpenLDAP](https://www.openldap.org/doc/admin26/) and
[Percona Server for MongoDB](https://docs.percona.com/percona-server-for-mongodb/latest/authentication.html)
documentation.

## The OpenLDAP side

You can add needed OpenLDAP settings will the following [LDIF](https://en.wikipedia.org/wiki/LDAP_Data_Interchange_Format)
portions:

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

Also a read-only user should be created for the database-issued user lookups.
If everything is done correctly, the following command should work, resetting
he percona user password:

``` {.bash data-prompt="$" }
$ ldappasswd -s percona -D "cn=admin,dc=ldap,dc=local" -w password -x "uid=percona,ou=perconadba,dc=ldap,dc=local"
```
!!! note

    If you are not sure about the approach to make references between user and group objects, [OpenDAP overlays](https://www.openldap.org/doc/admin24/overlays.html) provide one of the possible ways to go.

## The MongoDB and Operator side

The following steps will look different depending on whether sharding 
is on (the default behavior) or off.

=== "if sharding is off"
    In order to get MongoDB connected with OpenLDAP in case of a a non-sharded (ReplicaSet) MongoDB cluster we need to configure two things:

    * Mongod
    * Internal mongodb role

    Create configuration Secrets for mongod:

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
      authenticationMechanisms: 'PLAIN,SCRAM-SHA-1'
    ```

    !!! note

        This fragment provides mongod with LDAP-specific parameters, such as FQDN
        of the LDAP server (`server`), explicit lookup user, domain rules, etc.

    Put the snippet on you local machine and create a Kubernetes Secret object
    named based on [your MongoDB cluster name](operator.md#cluster-name):

    ``` {.bash data-prompt="$" }
    $ kubectl create secret generic <your_cluster_name>-rs0-mongod --from-file=mongod.conf=my_mongod.conf
    ```

    Next step is to start the MongoDB cluster up as it’s described in
    [Install Percona server for MongoDB on Kubernetes](kubernetes.md#operator-kubernetes).
    On successful completion of the steps from this doc, we are to proceed with
    setting the roles for the ‘external’ (managed by LDAP) user inside the MongoDB.
    For this, log into MongoDB as administrator:

    ``` {.bash data-prompt="$" }
    $ mongo "mongodb+srv://userAdmin:<userAdmin_password>@<your_cluster_name>-rs0.<your_namespace>.svc.cluster.local/admin?replicaSet=rs0&ssl=false"
    ```

    !!! note

        [LDAP over TLS](https://www.openldap.org/faq/data/cache/185.html) is not yet
        supproted by the Operator.

    When logged in, execute the following:

    ``` {.json data-prompt="mongos>" }
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

        Extra roles listed in the above example are just to show more than one
        possible variant.

    Now the new `percona` user created inside OpenLDAP is able to login to MongoDB
    as administrator. Verify whether the user role has been identified correctly
    with the following command:

    ``` {.bash data-prompt="$" }
    $ mongo --username percona --password 'percona' --authenticationMechanism 'PLAIN' --authenticationDatabase '$external' --host <mongodb-rs-endpoint> --port 27017
    ```

=== "if sharding is on"
    In order to get MongoDB connected with OpenLDAP in this case we need to
    configure three things:

    * Mongod
    * Internal mongodb role
    * Mongos

    Both the routing interface (mongos) and the configuraion ReplicaSet (mongod) have to be
    configured to make the LDAP server a part of the Authentication/Authorization
    chain. 
    
    !!! note

        mongos is just a router between shards and underlying database instances,
        and configuration ReplicaSet is responsible for keeping information
        about database users and roles. Thus, the router can perform only
        authentication, while authorization is the responsibility of the
        configuration ReplicaSet.

    Create configuration Secrets for the router and the configuration
    ReplicaSet respectively.

    Secret for the router should look as follows:
    
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
     authenticationMechanisms: 'PLAIN,SCRAM-SHA-1'
    ```
    
    Put the snippet on you local machine and create a Kubernetes Secret object
    named based on [your MongoDB cluster name](operator.md#cluster-name):

    ``` {.bash data-prompt="$" }
    $ kubectl create secret generic <your_cluster_name>-mongos --from-file=mongos.conf=my_mongos.conf
    ```

    Secret for the configuration ReplicaSet should look as follows:

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
     authenticationMechanisms: 'PLAIN,SCRAM-SHA-1'
    ```
    
    Put the snippet on you local machine and create a Kubernetes Secret object
    named based on [your MongoDB cluster name](operator.md#cluster-name):

    ``` {.bash data-prompt="$" }
    $ kubectl create secret generic <your_cluster_name>-cfg-mongod --from-file=mongod.conf=my_mongod.conf
    ```

    Both files are pretty much the same except the `authz` subsection, which is
    only present for the configuration ReplicaSet.

    Next step is to start the MongoDB cluster up as it’s described in
    [Install Percona server for MongoDB on Kubernetes](kubernetes.md#operator-kubernetes).
    On successful completion of the steps from this doc, we are to proceed with
    setting the roles for the ‘external’ (managed by LDAP) user inside the MongoDB.
    For this, log into MongoDB as administrator:

    ``` {.bash data-prompt="$" }
    $ mongo "mongodb://userAdmin:<userAdmin_password>@<your_cluster_name>-mongos.<your_namespace>.svc.cluster.local/admin?ssl=false"
    ```

    !!! note

        [LDAP over TLS](https://www.openldap.org/faq/data/cache/185.html) is not yet
        supproted by the Operator.

    When logged in, execute the following:

    ``` {.json data-prompt="mongos>" }
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

        Extra roles listed in the above example are just to show more than one
        possible variant.

    Now the new `percona` user created inside OpenLDAP is able to login to MongoDB
    as administrator. Verify whether the user role has been identified correctly
    with the following command:

    ``` {.bash data-prompt="$" }
    $ mongo --username percona --password 'percona' --authenticationMechanism 'PLAIN' --authenticationDatabase '$external' --host <your_cluster_name>-mongos --port 27017
    ```

When logged in, execute the following:

``` {.json data-prompt="mongos>" }
mongos> db.runCommand({connectionStatus:1})
```

The output should be like follows:

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
