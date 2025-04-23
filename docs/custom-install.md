# Install Percona Server for MongoDB with customized parameters

You can customize the configuration of Percona Server for MongoDB and install it with customized parameters.

To check available configuration options, see [`deploy/cr.yaml`  :octicons-link-external-16:](https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v{{ release }}/deploy/cr.yaml) and [Custom Resource Options](operator.md).

=== "`kubectl`"

    To customize the configuration, do the following:

    1. Clone the repository with all manifests and source code by executing the following command:

        ```{.bash data-prompt="$" }
        $ git clone -b v{{ release }} https://github.com/percona/percona-server-mongodb-operator
        ```

    2. Edit the required options and apply the modified `deploy/cr.yaml` file as follows:

        ```{.bash data-prompt="$" }
        $ kubectl apply -f deploy/cr.yaml
        ```

=== "Helm"

    To install Percona Server for MongoDB with custom parameters, use the following command:
    
    ```{.bash data-prompt="$" }
    $ helm install --set key=value
    ```

    You can pass any of the Operator’s [Custom Resource options  :octicons-link-external-16:](https://github.com/percona/percona-helm-charts/tree/main/charts/psmdb-db#installing-the-chart) as a
    `--set key=value[,key=value]` argument.

    The following example deploys a Percona Server for MongoDB Cluster in the
    `psmdb` namespace, with disabled backups and 20 Gi storage:

    === "Command line"

        ``` {.bash data-prompt="$" }
        $ helm install my-db percona/psmdb-db --version {{ release }} --namespace psmdb \
          --set "replsets.rs0.name=rs0" --set "replsets.rs0.size=3" \
          --set "replsets.rs0.volumeSpec.pvc.resources.requests.storage=20Gi" \
          --set backup.enabled=false --set sharding.enabled=false
        ``` 

    === "YAML file"

        You can specify customized options in a YAML file instead of using separate command line parameters. The resulting
        file similar to the following example looks as follows:        

        ``` yaml title="values.yaml"
        allowUnsafeConfigurations: true
        sharding:
          enabled: false
        replsets:
        - name: rs0
          size: 3
          volumeSpec:
            pvc:
              resources:
                requests:
                  storage: 2Gi
        backup:
          enabled: false
        ```        

        Apply the resulting YAML file as follows:        

        ``` {.bash data-prompt="$" }
        $ helm install my-db percona/psmdb-db --namespace psmdb -f values.yaml
        ```

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

        ``` {.bash data-prompt="$" }
        $ kubectl apply -f deploy/cr.yaml
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
        configsvrReplSet:
          size: 3
          configuration: |
            net:
              port: 27019
        mongos:
          size: 3
          configuration: |
            net:
              port: 27017
        ```

    2. Install Percona Server for MongoDB with the specified configuration:

        ```{.bash data-prompt="$" }
        $ helm install my-db percona/psmdb-db --namespace psmdb -f values.yaml
        ```






 
