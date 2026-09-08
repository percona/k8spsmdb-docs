# 6. Monitor database with Percona Monitoring and Management (PMM)

Monitoring database health and performance helps you catch problems early — before they turn into
outages. You also see how the cluster is performing. This tutorials guides you through the setup of monitoring with  [Percona Monitoring and Management (PMM) :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/3/index.html) so you can view metrics
and dashboards.

## Considerations and prerequisites

You need a PMM Server already up and running - as a Docker image, a virtual appliance, or
in Kubernetes. See the [official PMM documentation :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/3/install-pmm/install-pmm-server/index.html) for installation instructions.

## Configure authentication

PMM3 uses service accounts to control access to PMM server components and resources. To
authenticate in PMM server, you need a service account token.
[Generate a service account and token :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/3/api/authentication.html?h=authe#generate-a-service-account-and-token).
Specify the **Admin** role for the service account.

!!! warning

    When you create a service account token, you can select its lifetime: it can be either
    a permanent token that never expires or the one with the expiration date. PMM server
    cannot rotate service account tokens after they expire. So you must take care of
    reconfiguring PMM Client in this case.

## Create a secret

Now you must pass the credentials to the Operator. To do so, create a Secret object.
{.power-number}

1. Create a Secret configuration file. You can use the [deploy/secrets.yaml :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/v{{release}}/deploy/secrets.yaml) secrets file. Specify the service account token as the `PMM_SERVER_TOKEN` value:

    ```yaml
    apiVersion: v1
    kind: Secret
    metadata:
      name: my-cluster-name-secrets
    type: Opaque
    stringData:
      ....
      PMM_SERVER_TOKEN: ""
    ```

2. Create the Secrets object using the `deploy/secrets.yaml` file:

    ```bash
    kubectl apply -f deploy/secrets.yaml -n <namespace>
    ```

    ??? example "Expected output"

        ```{.text .no-copy}
        secret/my-cluster-name-secrets created
        ```

## Deploy the PMM Client
{.power-number}

1. Update the `pmm` section in the [deploy/cr.yaml :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/v{{release}}/deploy/cr.yaml) file:

    * Set `pmm.enabled` to `true`.
    * Specify your PMM Server hostname / an IP address for the `pmm.serverHost` option. The PMM Server IP address should be resolvable and reachable from within your cluster.
    * Check that the name of the Secret object that you created earlier is specified in the `secrets.users` field.

    ```yaml
    secrets:
      users: my-cluster-name-secrets
    pmm:
      enabled: true
      image: percona/pmm-client:{{pmm3recommended}}
      serverHost: monitoring-service
    ```

2. Apply the changes:

    ```bash
    kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

3. Check that corresponding Pods are not in a cycle of stopping and restarting. This cycle
    occurs if there are errors on the previous steps:

    ```bash
    kubectl get pods -n <namespace>
    kubectl logs <cluster-name>-rs0-0 -c pmm-client -n <namespace>
    ```

## Check the metrics

Let's see how the collected data is visualized in PMM.
{.power-number}

1. Log in to PMM server.
2. Click :simple-mongodb: **MongoDB** from the left-hand navigation menu. You land on the **Instances Overview** page.
3. Select your cluster from the **Clusters** drop-down menu and the desired time range on the top of the page. You should see the metrics.
4. Click :simple-mongodb: **MongoDB** → **Other dashboards** to see the list of available dashboards that allow you to drill down to the metrics you are interested in.

Congratulations! You have connected your cluster to PMM. For [Query
Analytics](monitoring.md#configure-query-analytics), and [additional PMM Client
parameters](monitoring.md#additional-pmm-client-parameters), see [Monitor with Percona
Monitoring and Management (PMM)](monitoring.md).

## Next steps

[What's next :material-arrow-right:](what-next-operations.md){.md-button}
