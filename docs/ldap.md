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

You can add needed OpenLDAP settings will the following LDIF portions:

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

Also a read-only user should be created for database-issued user lookups.
If everything is done correctly, the following command should work, resetting the percona user password:

```bash
$ ldappasswd -s percona -D "cn=admin,dc=ldap,dc=local" -w password -x "uid=percona,ou=perconadba,dc=ldap,dc=local"
```
## LDAP overlay

A few words about the LDAP overlay feature and its potential influence on our setup. 
Here we propose a decision on how the user privileges (role) are to be looked up in the first place: the participation in a particular user group makes certain privileges available for the user. Technically speaking, `Group DN` will be matched through MongoDB roles list and, if found, MongoDB authorizes role usage by the user logged in.

In order to get such a Group DN from LDAP server as a simple User attribute we may rely on the `memberOf` entity field. Basically it’s a product of the *overlay functionality*. Its particular setup may vary depending on LDAP server internals. In our case, there are a few ldif files, applied during the server startup, to make the `memberOf` available. The essential attributes for creating the reference between the user and the group are `objectClass: groupOfUniqueNames` and `uniqueMember` attributes of the group object.

It may not be true for your case though since the overlay may be ordered to use different `objectClass` for the group object alongside with the `uniqueMember` alternatives.
You have to figure it out and here is one possible way how:

```bash
$ ldapsearch -Y EXTERNAL -H ldapi:/// -b "cn=config" '(objectClass=*)' dn -LLL | grep -i memberof
SASL/EXTERNAL authentication started
SASL username: gidNumber=0+uidNumber=0,cn=peercred,cn=external,cn=auth
SASL SSF: 0
dn: olcOverlay={0}memberof,olcDatabase={1}hdb,cn=config

$ ldapsearch -Y EXTERNAL -H ldapi:/// -b "olcOverlay={0}memberof,olcDatabase={1}hdb,cn=config" '(objectClass=*)' -LLL
SASL/EXTERNAL authentication started
SASL username: gidNumber=0+uidNumber=0,cn=peercred,cn=external,cn=auth
SASL SSF: 0
dn: olcOverlay={0}memberof,olcDatabase={1}hdb,cn=config
objectClass: olcOverlayConfig
objectClass: olcMemberOf
olcOverlay: {0}memberof
olcMemberOfDangling: ignore
olcMemberOfRefInt: TRUE
olcMemberOfGroupOC: groupOfUniqueNames
olcMemberOfMemberAD: uniqueMember
olcMemberOfMemberOfAD: memberOf
```

The output provides us with `olcMemberOfGroupOC` and `olcMemberOfMemberAD` values, which should be put on the group entity. 
`olcMemberOfMemberOfAD` value is a key for picking the group DN from the account object. 

## The MongoDB and Operator side

The following steps will look different depending on whether sharding 
is on (the default behavior) or off.

### If sharding is turned off

Let's consider a non-sharded (ReplicaSet) MongoDB cluster.
In order to get MongoDB connected with OpenLDAP in this case we need to configure two things:

* Mongod
* Internal mongodb role

As for mongod you may use the following code snippet:

```yaml
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

This fragment provides mongod with LDAP-specific parameters, such as FQDN of the
LDAP server (`server`), explicit lookup user, domain rules, etc.

Put the snippet on you local machine and create a Kubernetes Secret object named
based on [your MongoDB cluster name](operator.md#cluster-name).

```bash
$ kubectl create secret generic <your_cluster_name>-rs0-mongod --from-file=mongod.conf=<path-to-mongod-ldap-configuration>
```

!!! note

    [LDAP over TLS](https://www.openldap.org/faq/data/cache/185.html) is not yet
    supproted by the Operator.

Next step is to start the MongoDB cluster up as it’s described in
[Install Percona server for MongoDB on Kubernetes](kubernetes.md#operator-kubernetes).
On successful completion of the steps from this doc, we are to proceed with
setting the LDAP user roles inside the MongoDB. For this, log into MongoDB as
administrator and execute the following:

```bash
var admin = db.getSiblingDB("admin")
admin.createRole(
  {
    role: "cn=admin,ou=perconadba,dc=ldap,dc=local",
    privileges: [],
    roles: [ "userAdminAnyDatabase" ]
  }
)
```

Now the new `percona` user created inside OpenLDAP is able to login to MongoDB
as administrator. Verify whether the user role has been identified correctly
with the following command:

```bash
$ mongo --username percona --password 'percona' --authenticationMechanism 'PLAIN' --authenticationDatabase '$external' --host <mongodb-rs-endpoint> --port 27017
rs0:PRIMARY> db.runCommand({connectionStatus:1})
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
       "role" : "cn=admin,ou=perconadba,dc=ldap,dc=local",
       "db" : "admin"
     },
     {
       "role" : "userAdminAnyDatabase",
       "db" : "admin"
     }
   ]
 },
 "ok" : 1,
 "$clusterTime" : {
   "clusterTime" : Timestamp(1663059720, 597),
   "signature" : {
     "hash" : BinData(0,"yiO9alPB9CSh2hnW40UkFkdHKw4="),
     "keyId" : NumberLong("7142492740226383874")
   }
 },
 "operationTime" : Timestamp(1663059720, 597)
}
rs0:PRIMARY>
```

### If sharding is turned on

Let's consider a sharded MongoDB cluster.
In order to get MongoDB connected with OpenLDAP in this case we need to configure two things:

* Mongod
* Internal mongodb role
* Mongos

Sharding adds a routing interface (mongos) and configuration (mongod) replicaset in addition to the database by itself. Both of them have to be configured in a slightly different manner in order to make the LDAP server a part of the Authentication/Authorization chain. You may wonder why and here is the answer - mongos is just a router between shards and underlying database instances, whereas the configuration replicaset is responsible for keeping information about database users and roles. Thus the router is unable to perform both authentication and authorization, only the first one. The second one is the configuration replicaset responsibility.

Enough of lecturing, let’s dive deeper into setting everything up. We assume that openldap internals remain unchanged. The server is up and running.
As a preparation step create configuration secrets for router and configuration replicaset respectively.

router:
```bash
$ cat mongos.conf
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
 
 
$ kubectl create secret generic <your_cluster_name>-mongos --from-file=mongos.conf=mongos.conf

configuration replicaset
# cat mongod.conf
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
 
# kubectl create secret generic <your_cluster_name>-cfg-mongod --from-file=mongod.conf=mongod.conf
```

Both files are pretty much the same except for the one section authz. It’s only needed by the configuration replicaset.

Now we are ready to spin up our sharded cluster. You are free to use any sharding configuration supported by Percona Operator for MongoDB. Just verify that the cluster name is mentioned correctly inside the Kubernetes secret names. I will be referencing the default cluster CustomResource for the sake of simplicity. BTW, you may create secrets in addition to an already running cluster, secrets will be picked up by the operator anyway.

Once your cluster becomes available please create the role for the ‘external’ (managed by LDAP) user just like we did in the ReplicaSet section above.

```bash
$ mongo "mongodb://userAdmin:<userAdmin_password>@<your_cluster_name>-mongos.<your_namespace>.svc.cluster.local/admin?ssl=false"
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

Don’t be puzzled by some extra roles listed in the output above. We just like to show more than one possible variant.

At this very point the setup may be considered as complete. We can verify the external user just like we did in the ReplicaSet case.

```bash
$ mongo --username percona --password 'percona' --authenticationMechanism 'PLAIN' --authenticationDatabase '$external' --host <your_cluster_name>-mongos --port 27017
mongos> db.runCommand({connectionStatus:1})
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

As you may see, the role matched successfully. Nicely done!

