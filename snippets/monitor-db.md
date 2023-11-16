# Monitor database with Percona Monitoring and Management (PMM)

In this section you will learn how to monitor Percona Server for MongoDB with [Percona Monitoring and Management (PMM)](https://www.percona.com/doc/percona-monitoring-and-management/2.x/index.html).

!!! note

    Only PMM 2.x versions are supported by the Operator.

PMM is a client/server application. It includes the [PMM Server](https://www.percona.com/doc/percona-monitoring-and-management/2.x/details/architecture.html#pmm-server) and the number of [PMM Clients](https://www.percona.com/doc/percona-monitoring-and-management/2.x/details/architecture.html#pmm-client) running on each node with the database you wish to monitor.

A PMM Client collects needed metrics and sends gathered data to the PMM Server.
 As a user, you connect to the PMM Server to see database metrics on
[a number of dashboards](https://docs.percona.com/percona-monitoring-and-management/details/dashboards/dashboard-mongodb-experimental_collection_overview.html).

PMM Server and PMM Client are installed separately.

## Install PMM Server

You must have PMM server up and running. You can run PMM Server as a *Docker image*, a *virtual appliance*, or on an *AWS instance*.
Please refer to the [official PMM documentation](https://www.percona.com/doc/percona-monitoring-and-management/2.x/setting-up/server/index.html)
for the installation instructions.

## Install PMM Client

To install PMM Client as a side-car container in your Kubernetes-based environment, do the following:
{.power-number}

1. Authorize PMM Client within PMM Server. 

    === "Token-based authorization (recommended)"

        <a name="operator-monitoring-client-token"></a>
        1. [Generate the PMM Server API Key](https://docs.percona.com/percona-monitoring-and-management/details/api.html#api-keys-and-authentication). Specify the Admin role when getting the API Key. 

        <i warning>:material-alert: Warning:</i> The API key is not rotated automatically.

        2. Edit the [deploy/secrets.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/secrets.yaml) secrets file and specify the PMM API key for the ``PMM_SERVER_API_KEY`` option.
        3. Apply the configuration for the changes to take effect.

            ``` {.bash data-prompt="$" }
            $ kubectl apply -f deploy/secrets.yaml -n <namespace>
            ```
    
    === "Password-based authorization (deprecated since version 1.13.0)"

        1. Edit the [deploy/secrets.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/secrets.yaml) secrets file and specify the following:

           * The user name of your PMM Server (`admin` by default) in the `PMM_SERVER_USER` key 
           * The password you set for the PMM Server during its installation in the `PMM_SERVER_PASSWORD` key.

        2. Apply the configuration for the changes to take effect.

            ``` {.bash data-prompt="$"}
            $ kubectl apply -f deploy/secrets.yaml -n <namespace>
            ```

2. Update the `pmm` section in the [deploy/cr.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) file:

    * Set `pmm.enabled`=`true`.
    * Specify your PMM Server hostname / an IP address for the `pmm.serverHost` option. The PMM Server IP address should be resolvable and reachable from within your cluster.

     ```yaml
       pmm:
         enabled: true
         image: percona/pmm-client:{{pmm2recommended}}
         serverHost: monitoring-service
     ``` 
3. Apply the changes:

    ``` {.bash data-prompt="$"}
    $ kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

4. Check that corresponding Pods are not in a cycle of stopping and restarting.
    This cycle occurs if there are errors on the previous steps:

    ```{.bash data-prompt="$"}
    $ kubectl get pods -n <namespace>
    $ kubectl logs <cluster-name>-rs0-0 -c pmm-client -n <namespace>
    ```

## Check the metrics

Let's see how the collected data is visualized in PMM.
{.power-number}

1. Log in to PMM server.
2. Click :simple-mongodb: **MongoDB** from the left-hand navigation menu. You land on the **Instances Overview** page. 
3. Select your cluster from the **Clusters** drop-down menu and the desired time range on the top of the page. You should see the metrics.
4. Click :simple-mongodb: **MongoDB**  →  **Other dashboards** to see the list of available dashboards that allow you to drill down to the metrics you are interested in. 