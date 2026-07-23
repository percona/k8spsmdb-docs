# Install Percona Operator for MongoDB in multi-namespace (cluster-wide) mode

## Difference between single-namespace and multi-namespace Operator deployment

By default, Percona Operator for MongoDB functions in a specific Kubernetes
namespace. You can create one during installation (like it is shown in the
[installation instructions](kubernetes.md)) or just use the
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

## Installing the Operator in cluster-wide mode

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

    ```bash
    git clone -b v{{ release }} https://github.com/percona/percona-server-mongodb-operator
    cd percona-server-mongodb-operator
    ```

2. Let’s suppose that Operator’s namespace should be the `psmdb-operator` one.
    Create it as follows:

    ```bash
    kubectl create namespace psmdb-operator
    ```

    Namespaces to be watched by the Operator should be created in the same way
    if not exist. Let’s say the Operator should watch the `psmdb` namespace:

    ```bash
    kubectl create namespace psmdb
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

4. [Apply :octicons-link-external-16:](https://kubernetes.io/docs/reference/using-api/server-side-apply/) the `deploy/cw-bundle.yaml` file with the following command:

    ```bash
    kubectl apply -f deploy/cw-bundle.yaml --server-side -n psmdb-operator
    ```

5. After the Operator is started, Percona Server for MongoDB can be created at
    any time by applying the `deploy/cr.yaml` configuration file, like in the
    case of normal installation:

    ```bash
    kubectl apply -f deploy/cr.yaml -n psmdb
    ```

    The creation process may take some time. When the process is over your
    cluster will obtain the `ready` status. You can check it by quering the
    `PerconaServerMongoDB` Custom Resource (it has handy `psmdb` shortname
    also) with the following command:

    ```bash
    kubectl get psmdb -n psmdb
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

1. You will need a connection string to access the cluster. Starting with Operator version 1.23.0, retrieve it from the `<cluster-name>-databaseadmin-conn-str` Secret:

    === "if sharding is on"

        ```bash
        kubectl get secret my-cluster-name-databaseadmin-conn-str -n psmdb \
          -o jsonpath='{.data.databaseAdmin_mongos_connectionString}' | base64 --decode && echo
        ```

    === "if sharding is off"

        ```bash
        kubectl get secret my-cluster-name-databaseadmin-conn-str -n psmdb \
          -o jsonpath='{.data.databaseAdmin_rs0_connectionStringSrv}' | base64 --decode && echo
        ```

    See [Connection secrets](connection-secrets.md) for other key names.

    Alternatively, retrieve the login and password for the admin user from the `my-cluster-name-secrets` Secret using `kubectl get secrets` and `kubectl get secret my-cluster-name-secrets -o yaml`. Decode base64-encoded values as described in [System users](system-users.md).

2. Run a container with a MongoDB client and connect its console output to your
    terminal. The following command will do this, naming the new Pod
    `percona-client`:

    ```bash
    kubectl run -i --rm --tty percona-client --image=percona/percona-server-mongodb:{{ mongodb60recommended }} --restart=Never --env="POD_NAMESPACE=psmdb" -- bash -il
    ```

    Executing it may require some time to deploy the correspondent Pod.

3. Connect using the connection string from step 1:

    ```bash
    mongosh "<connection-string>"
    ```
