# Install Percona Operator for MongoDB in multi-namespace (cluster-wide) mode

This document walks you through installing the Operator and Percona Server for MongoDB in multi-namespace (luster-wide) mode with default parameters. 

To learn more about available deployment modes, see [](namespace-mode.md).

To install Percona Operator for MongoDB with custom parameters, see [Install Percona Operator for MongoDB with custom parameters](custom-install.md).

To install the Operator cluster-wide, use the YAML files in the `deploy` folder with the `cw-` prefix, such as `deploy/cw-bundle.yaml`.

**Key configuration steps:**

Edit the Operator deployment section of the `deploy/cw-bundle.yaml` and specify the following: 

- Set `subjects.namespace` to the namespace where the Operator will run.
- In the `env` section, set `WATCH_NAMESPACE` to a comma-separated list of namespaces you want the Operator to watch.  
  - To watch *all* namespaces, set `WATCH_NAMESPACE` to an empty string ("").

Below is a streamlined example for cluster-wide setup on Kubernetes:

1. Clone the percona-server-mongodb-operator repository:

    ```bash
    git clone -b v{{ release }} https://github.com/percona/percona-server-mongodb-operator
    cd percona-server-mongodb-operator
    ```

2. Create the namespaces: one for the Operator and another one for the database cluster:

    ```bash
    kubectl create namespace psmdb-operator
    kubectl create namespace psmdb  # Namespace to be watched by the Operator
    ```

3. Edit `deploy/cw-bundle.yaml` and set the namespaces accordingly:

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
    ```

4. Apply the cluster-wide bundle:

    ```bash
    kubectl apply -f deploy/cw-bundle.yaml --server-side -n psmdb-operator
    ```

    This creates Custom Resource Definitions, role-based access control, clusterrolebindings and the Operator Deployment.

5. Verify the Deployment:

    ```bash
    kubectl get deploy -n psmdb-operator
    ```

6. Once the Operator is running, create a MongoDB cluster:

    ```bash
    kubectl apply -f deploy/cr.yaml -n psmdb
    ```

7. Check the cluster’s status:

    ```bash
    kubectl get psmdb -n psmdb
    ```

    ??? example "Expected output"

        ```text
        NAME              ENDPOINT                                         STATUS   AGE
        my-cluster-name   my-cluster-name-mongos.psmdb.svc.cluster.local   ready    5m26s
        ```

## Next steps

[Verify the cluster operation](verify-cluster.md)
