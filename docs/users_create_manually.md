# How to create custom users for Percona Server for MongoDB manually

Starting from the version 1.17.0 Percona Operator for MongoDB supports
[declarative creation](users.md#unprivileged-users) of custom MongoDB users via the [`users` subsection in the Custom Resource] (operator.md#usersitemspropertiesdbtype).

Still there may be use cases when automatic creation of custom users for Percona
Server for MongoDB is not an option (for example, you may be using the Operator
version 1.16.2 or earlier, and you need general purpose users (which are not
created by default). You can do it as follows.

Please run commands below, substituting the `<namespace name>` placeholder with the real namespace
of your database cluster:

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
