# Install Percona Server for MongoDB in multi-namespace (cluster-wide) mode

By default, Percona Operator for MongoDB functions in a specific Kubernetes
namespace. You can create one during installation (like it is shown in the
[installation instructions](kubernetes.md#install-kubernetes)) or just use the
`default` namespace. This approach allows several Operators to co-exist in one
Kubernetes-based environment, being separated in different namespaces:

![image](assets/images/cluster-wide-1.svg)

Still, sometimes it is more convenient to have one Operator watching for
Percona Server for MongoDB Custom Resources in several namespaces.

We recommend running Percona Operator for MongoDB in a traditional way,
limited to a specific namespace. But it is possible to run it in so-called
*cluster-wide* mode, one Operator watching several namespaces, if needed:

![image](assets/images/cluster-wide-2.svg)

!!! note

    Please take into account that if several Operators are configured to
    watch the same namespace, it is entirely unpredictable which one will get
    ownership of the Custom Resource in it, so this situation should be avoided.

To use the Operator in such *cluster-wide* mode, you should install it with a
different set of configuration YAML files, which are available in the `deploy`
folder and have filenames with a special `cw-` prefix: e.g.
`deploy/cw-bundle.yaml`.

While using this cluster-wide versions of configuration files, you should set
the following information there:

* `subjects.namespace` option should contain the namespace which will host
    the Operator,
* `WATCH_NAMESPACE` key-value pair in the `env` section should have
    `value` equal to a  comma-separated list of the namespaces to be watched by
    the Operator, *and* the namespace in which the Operator resides (or just a
    blank string to make the Operator deal with *all namespaces* in a Kubernetes
    cluster).

The following simple example shows how to install Operator cluster-wide on
Kubernetes.

1. First of all, clone the percona-server-mongodb-operator repository:

    ``` {.bash data-prompt="$" }
    $ git clone -b v{{ release }} https://github.com/percona/percona-server-mongodb-operator
    $ cd percona-server-mongodb-operator
    ```

2. Let’s suppose that Operator’s namespace should be the `psmdb-operator` one.
    Create it as follows:

    ``` {.bash data-prompt="$" }
    $ kubectl create namespace psmdb-operator
    ```

    Namespaces to be watched by the Operator should be created in the same way
    if not exist. Let’s say the Operator should watch the `psmdb` namespace:

    ``` {.bash data-prompt="$" }
    $ kubectl create namespace psmdb
    ```

3. Edit the ``deploy/cw-bundle.yaml`` configuration file to set proper
    namespaces:

    ```yaml
    ...
    subjects:
    - kind: ServiceAccount
      name: percona-server-mongodb-operator
      namespace: "psmdb-operator"
    ...
    env:
             - name: WATCH_NAMESPACE
               value: "psmdb"
    ...
    ```

4. Apply the `deploy/cw-bundle.yaml` file with the following command:

    ``` {.bash data-prompt="$" }
    $ kubectl apply -f deploy/cw-bundle.yaml -n psmdb-operator
    ```

5. After the Operator is started, Percona Server for MongoDB can be created at
    any time by applying the `deploy/cr.yaml` configuration file, like in the
    case of normal installation:

    ``` {.bash data-prompt="$" }
    $ kubectl apply -f deploy/cr.yaml -n psmdb
    ```

    The creation process may take some time. When the process is over your
    cluster will obtain the `ready` status. You can check it with the following
    command:

    ``` {.bash data-prompt="$" }
    $ kubectl get psmdb
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        NAME              ENDPOINT                                         STATUS   AGE
        my-cluster-name   my-cluster-name-mongos.psmdb.svc.cluster.local   ready    5m26s
        ```

## Verifying the cluster operation

It may take ten minutes to get the cluster started. When `kubectl get psmdb`
command finally shows you the cluster status as `ready`, you can try to connect
to the cluster.

1. You will need the login and password for the admin user to access the
    cluster. Use `kubectl get secrets` command to see the list of Secrets
    objects (by default the Secrets object you are interested in has
    `my-cluster-name-secrets` name). Then
    `kubectl get secret my-cluster-name-secrets -o yaml` command will return
    the YAML file with generated Secrets, including the `MONGODB_DATABASE_ADMIN`
    and `MONGODB_DATABASE_ADMIN_PASSWORD` strings, which should look as follows:

    ```yaml
    ...
    data:
      ...
      MONGODB_DATABASE_ADMIN_PASSWORD: aDAzQ0pCY3NSWEZ2ZUIzS1I=
      MONGODB_DATABASE_ADMIN_USER: ZGF0YWJhc2VBZG1pbg==
    ```

    Here the actual login name and password are base64-encoded. Use 
    `echo 'aDAzQ0pCY3NSWEZ2ZUIzS1I=' | base64 --decode` command to bring it
    back to a human-readable form.

2. Run a container with a MongoDB client and connect its console output to your
    terminal. The following command will do this, naming the new Pod
    `percona-client`:

    ``` {.bash data-prompt="$" }
    $ kubectl run -i --rm --tty percona-client --image=percona/percona-server-mongodb:{{ mongodb50recommended }} --restart=Never --env="POD_NAMESPACE=psmdb" -- bash -il
    ```

    Executing it may require some time to deploy the correspondent Pod.

3. Now run `mongo` tool in the percona-client command shell using the login
    (which is normally `databaseAdmin`) and a proper password obtained from the
    Secret. The command will look different depending on whether sharding
    is on (the default behavior) or off:

    === "if sharding is on"
        ``` {.bash data-prompt="$" }
        $ mongo "mongodb://databaseAdmin:databaseAdminPassword@my-cluster-name-mongos.psmdb.svc.cluster.local/admin?ssl=false"
        ```

    === "if sharding is off"
        ``` {.bash data-prompt="$" }
        $ mongo "mongodb+srv://databaseAdmin:databaseAdminPassword@my-cluster-name-rs0.psmdb.svc.cluster.local/admin?replicaSet=rs0&ssl=false"
        ```
