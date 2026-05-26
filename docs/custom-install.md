# Install Percona Operator for MongoDB with customized parameters

You can customize the configuration of Percona Server for MongoDB and install it with customized parameters.

To check available configuration options, see [`deploy/cr.yaml`  :octicons-link-external-16:](https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v{{ release }}/deploy/cr.yaml) and [Custom Resource Options](operator.md).

=== "`kubectl`"

    To customize the configuration, do the following:

    1. Clone the repository with all manifests and source code by executing the following command:

        ```bash
        git clone -b v{{ release }} https://github.com/percona/percona-server-mongodb-operator
        ```

    2. Edit the required options and apply the modified `deploy/cr.yaml` file as follows:

        ```bash
        kubectl apply -f deploy/cr.yaml
        ```

=== "Helm"

    You can install the Operator deployment and Percona Server for MongoDB clusters with custom parameters using Helm. You can review the available configuration options for the [Operator chart :octicons-link-external-16:](https://github.com/percona/percona-helm-charts/tree/main/charts/psmdb-operator#installing-the-chart) and the [Database chart :octicons-link-external-16:](https://github.com/percona/percona-helm-charts/tree/main/charts/psmdb-db#installing-the-chart).

    You can provide custom parameters to Helm using either the `--set` flag or a `values.yaml` file. The `--set` flag is suitable for overriding a small number of parameters directly from the command line, while a `values.yaml` file is ideal when you want to manage many custom settings together. Both methods are fully supported by Helm and can be used as preferred for your deployment.
    
    **Using `--set` flags**

    To pass a custom parameter to Helm, use the `--set key=value` flag with the `helm install` command.

    For example, to enable [Percona Monitoring and Management (PMM) :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/3/index.html) for the database cluster, run:

    ```bash
    helm install my-db percona/psmdb-db --version {{ release }} --namespace my-namespace \
      --set pmm.enabled=true
    ```

    **Using a `values.yaml` file**

    Create a `values.yaml` file with your custom parameters and pass it to `helm install` with the `-f` or `--values` flag:

    ```bash
    helm install my-db percona/psmdb-db --version {{ release }} --namespace my-namespace -f values.yaml
    ```

    Example `values.yaml`:

    ```yaml
    pmm:
    enabled: false
    image:
      repository: percona/pmm-client
      tag: {{pmm3recommended}}
    ```

    ## Naming conventions for Helm resources

    When you install a chart, Helm creates a release and uses the release name and chart name to generate resource names. By default, resources are named `release-name-chart-name`.

    You can override the default naming with the `nameOverride` or `fullnameOverride` options. Pass them using the `--set` flag or in your `values.yaml` file.

    | Option | Effect | Example |
    | ------ | ------ | ------- |
    | `nameOverride` | Replaces the chart name but keeps the release name in the generated name | `release-name-name-override` |
    | `fullnameOverride` | Replaces the entire generated name with the specified value | `fullname-override` |

    *Using `nameOverride`* — replaces the chart name but keeps the release name:

    ```bash
    helm install my-operator percona/psmdb-operator --namespace my-namespace \
      --set nameOverride=mongo-operator
    ```

    Deployment name: `my-operator-mongo-operator`.

    ```bash
    helm install cluster1 percona/psmdb-db -n my-namespace \
      --set nameOverride=mongodb
    ```

    Cluster name: `cluster1-mongodb`.

    *Using `fullnameOverride`* — replaces the full resource name:

    ```bash
    helm install my-operator percona/psmdb-operator --namespace my-namespace \
      --set fullnameOverride=percona-mongodb-operator
    ```

    Deployment name: `percona-mongodb-operator`.

    ```bash
    helm install cluster1 percona/psmdb-db -n my-namespace \
      --set fullnameOverride=my-db
    ```

    Cluster name: `my-db`.

    !!! note "Cluster name length"

        For the pg-db chart, the cluster name is limited to 21 characters, must consist of lowercase alphanumeric characters, '-' or '.', and must start and end with an alphanumeric character. Keep this in mind when using `fullnameOverride` or long release names.

    ## Common Helm values reference

    The following table lists commonly used values for the Operator and database charts. For the full list of options, see the chart values files.

    | Value | Charts | Description |
    | ----- | ------ | ----------- |
    | `nameOverride` | [psmdb-operator](https://github.com/percona/percona-helm-charts/blob/main/charts/psmdb-operator/values.yaml), [psmdb-db](https://github.com/percona/percona-helm-charts/blob/main/charts/psmdb-db/values.yaml) | Replaces the chart name in generated resource names |
    | `fullnameOverride` | [psmdb-operator](https://github.com/percona/percona-helm-charts/blob/main/charts/psmdb-operator/values.yaml), [psmdb-db](https://github.com/percona/percona-helm-charts/blob/main/charts/psmdb-db/values.yaml) | Replaces the entire generated resource name |
    | `watchAllNamespaces` | [psmdb-operator](https://github.com/percona/percona-helm-charts/blob/main/charts/psmdb-operator/values.yaml) | Deploy the Operator in cluster-wide mode to watch all namespaces |
    | `disableTelemetry` | [psmdb-operator](https://github.com/percona/percona-helm-charts/blob/main/charts/psmdb-operator/values.yaml) | Disable telemetry collection. See [Telemetry](telemetry.md) for details |

## Configure ports for MongoDB cluster components

By default, the Operator starts Percona Server for MongoDB with the default port `27017` for all cluster components: `mongod`, `mongos` and `configsvrReplSet` Pods. Starting with version 1.20.0, you can start a new cluster with custom ports for all components or for a specific one. 

Here's how to do it.

=== "kubectl"

    1. Edit the `deploy/cr.yaml` file and specify the following configuration:    

        ```yaml
        spec: 
          ...
          replsets:
            - name: rs0
              configuration: |
                net:
                  port: 27018
          sharding:
            configsvrReplSet:
              configuration: |
                net:
                  port: 27019
            mongos:
              configuration: |
                net:
                  port: 27017
        ```    

    2. Apply the `deploy/cr.yaml` to deploy Percona Server for MongoDB:    

        ```bash
        kubectl apply -f deploy/cr.yaml
        ```

=== "Helm"

    1. Create a yaml file with the desired configuration. For example, `values.yaml`:

        ```yaml title="values.yaml"
        replsets:
          rs0:
            name: rs0
            configuration: |
              net:
                port: 27018
        sharding:
          configsvrReplSet:
            configuration: |
              net:
                port: 27019
          mongos:
            configuration: |
              net:
                port: 27017
        ```

    2. Install Percona Server for MongoDB with the specified configuration:

        ```bash
        helm install my-db percona/psmdb-db --namespace psmdb -f values.yaml
        ```






 
