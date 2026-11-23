> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Monitor database with Percona Monitoring and Management (PMM)

In this section you will learn how to monitor the health of Percona Server for MongoDB with [Percona Monitoring and Management (PMM)](https://docs.percona.com/percona-monitoring-and-management/3/install-pmm/install-pmm-client/connect-database/mongodb.html) .

PMM is a client/server application. It includes the [PMM Server](https://docs.percona.com/percona-monitoring-and-management/3/reference/index.html#pmm-server) and the number of [PMM Clients](https://docs.percona.com/percona-monitoring-and-management/3/reference/index.html#pmm-client) running on each node with the database you wish to monitor.

A PMM Client collects needed metrics and sends gathered data to the PMM Server. As a user, you connect to the PMM Server to see database metrics on a number of dashboards.

PMM Client must be compatible with PMM server. You install them separately. This tutorial uses PMM3.

## Install PMM Server

You must have PMM server up and running. You can run PMM Server as a *Docker image*, a *virtual appliance*, or in Kubernetes. Please refer to the [official PMM documentation](https://docs.percona.com/percona-monitoring-and-management/3/install-pmm/install-pmm-server/index.html) for the installation instructions.

## Install PMM Client

PMM Client is installed as a side-car container in the database Pods in your Kubernetes-based environment. To install PMM Client, do the following:

### Configure authentication

PMM3 uses service accounts to control access to PMM server components and resources. To authenticate in PMM server, generate a service account token. [Generate a service account and token](https://docs.percona.com/percona-monitoring-and-management/3/api/authentication.html#generate-a-service-account-and-token) . Specify the Admin role for the service account.

Warning

When you create a service account token, you can select its lifetime: it can be either a permanent token that never expires or the one with the expiration date. PMM server cannot rotate service account tokens after they expire. So you must take care of reconfiguring PMM Client in this case.

### Understand the credentials

The Secret referenced by `spec.secrets.users` contains two independent sets of credentials:

- `MONGODB_CLUSTER_MONITOR_USER` and `MONGODB_CLUSTER_MONITOR_PASSWORD` authenticate the PMM Client to MongoDB. The Operator passes them to the PMM Client as `DB_USER` and `DB_PASSWORD`.
- `PMM_SERVER_TOKEN` authenticates the PMM Client to PMM Server. This token is separate from the MongoDB monitoring user.

The Operator signs in to PMM Server with the username `service_token` and the value of `PMM_SERVER_TOKEN`.

### Create a secret

Now you must pass the credentials to the Operator. To do so, create a Secret object.

1. Create a Secret configuration file. You can use the [deploy/secrets.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/v1.23.1/deploy/secrets.yaml) secrets file. Specify the service account token as the `PMM_SERVER_TOKEN` value:

   ```
   apiVersion: v1
   kind: Secret
   metadata:
     name: my-cluster-name-secrets
   type: Opaque
   stringData:
     MONGODB_CLUSTER_MONITOR_USER: clusterMonitor
     MONGODB_CLUSTER_MONITOR_PASSWORD: clusterMonitor123456
     PMM_SERVER_TOKEN: ""
   ```

   The example shows only the credentials relevant to monitoring. Include the other required MongoDB system-user credentials in the same Secret.

1. Create the Secrets object using the `deploy/secrets.yaml` file.

   ```
   kubectl apply -f deploy/secrets.yaml -n <namespace>
   ```

   Expected output

   ```
   secret/my-cluster-name-secrets created
   ```

### Deploy the PMM Client

1. Update the `pmm` section in the [deploy/cr.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/v1.23.1/deploy/cr.yaml) file:

   - Set `pmm.enabled`=`true`.
   - Specify your PMM Server hostname / an IP address for the `pmm.serverHost` option. The PMM Server IP address should be resolvable and reachable from within your cluster.
   - Check that the name of the Secret object that you created earlier is specified in the `secrets.users` field.

   ```
   secrets:
     users: my-cluster-name-secrets
   pmm:
     enabled: true
     image: percona/pmm-client:3.9.1
     serverHost: monitoring-service
   ```

1. Apply the changes:

   ```
   kubectl apply -f deploy/cr.yaml -n <namespace>
   ```

1. Check that corresponding Pods are not in a cycle of stopping and restarting. This cycle occurs if there are errors on the previous steps:

   ```
   kubectl get pods -n <namespace>
   kubectl logs <cluster-name>-rs0-0 -c pmm-client -n <namespace>
   ```

If the PMM Client cannot connect, verify the following:

- `pmm.serverHost` resolves and is reachable from the database Pods.
- `MONGODB_CLUSTER_MONITOR_USER` and `MONGODB_CLUSTER_MONITOR_PASSWORD` are present and valid.
- `PMM_SERVER_TOKEN` is present and matches a PMM3 service account token.
- The PMM Client image is a PMM3 image.

Do not print the complete Secret or container environment while troubleshooting because these values contain credentials.

## Check the metrics

Let’s see how the collected data is visualized in PMM.

1. Log in to PMM server.
1. Click **MongoDB** from the left-hand navigation menu. You land on the **Instances Overview** page.
1. Select your cluster from the **Clusters** drop-down menu and the desired time range on the top of the page. You should see the metrics.
1. Click **MongoDB** → **Other dashboards** to see the list of available dashboards that allow you to drill down to the metrics you are interested in.

## Configure Query Analytics

To analyze query execution on the [PMM Query Analytics (QAN)](https://docs.percona.com/percona-monitoring-and-management/3/use/qan/index.html) dashboard, you must configure how PMM collects query data. Starting with Operator version 1.23.0, use the [`pmm.querySource`](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#pmmquerysource) option to choose the collection method:

- `profiler` (default) — PMM reads query performance data from each database’s `system.profile` collection. This method requires you to [enable profiling](https://docs.percona.com/percona-monitoring-and-management/3/install-pmm/install-pmm-client/connect-database/mongodb.html#compare-query-source-methods) explicitly.
- `mongolog` — PMM reads slow-query data directly from mongod log files. This method has minimal impact on the database and scales better in clusters with many databases. It requires [PMM 3.3.0 or newer](https://docs.percona.com/percona-monitoring-and-management/3/install-pmm/install-pmm-client/connect-database/mongodb.html#compare-query-source-methods) and the [log collector](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/persistent-logging.html) enabled so that logs are written to `/data/db/logs/`.

See the [PMM documentation on query source methods](https://docs.percona.com/percona-monitoring-and-management/3/install-pmm/install-pmm-client/connect-database/mongodb.html#compare-query-source-methods) for a detailed comparison.

### Configure the profiler query source

To use the default `profiler` query source, do the following:

- [enable profiling in PMM](https://docs.percona.com/percona-monitoring-and-management/3/install-pmm/install-pmm-client/connect-database/mongodb.html#compare-query-source-methods)
- Configure the Operator:
- set the `pmm.querySource` option to `profiler`
- enable profiling in the Percona Server for MongoDB, so PMM can collect query data. You can pass MongoDB options in several ways: edit the Custom Resource, via the ConfigMap or a Secret. Read more about [changing MongoDB options](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/options.html).

This example shows how to configure `profiler` and pass the configuration via the `configuration` subsection of the `deploy/cr.yaml` manifest:

```
spec:
  pmm:
    enabled: true
    querySource: profiler
  replsets:
    - name: rs0
      size: 3
      configuration: |
        operationProfiling:
          slowOpThresholdMs: 200
          mode: slowOp
          rateLimit: 100
```

Apply the configuration:

```
kubectl apply -f deploy/cr.yaml -n <namespace>
```

### Configure the mongolog query source

Version added: [1.23.0](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/RN/Kubernetes-Operator-for-PSMONGODB-RN1.23.0.html)

To use `mongolog`, do the following:

- Enable [log collector](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/persistent-logging.html) so that mongod logs are available at `/data/db/logs/` for the PMM Client

When using mongolog, configure [log rotation](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/logrotate.html) carefully. Avoid moving or renaming active log files during rotation, as this can interrupt mongolog collection.

- Set `pmm.querySource` to `mongolog`
- Configure MongoDB to write slow operations to the mongod log.

Here’s the example configuration:

```
spec:
  pmm:
    enabled: true
    querySource: mongolog
  logcollector:
    enabled: true
  replsets:
    - name: rs0
      size: 3
      configuration: |
        operationProfiling:
          mode: off
          slowOpThresholdMs: 200
```

Apply the configuration:

```
kubectl apply -f deploy/cr.yaml -n <namespace>
```

### Additional PMM Client parameters

Optionally, you can specify additional parameters for the [`pmm-admin add mongodb`](https://docs.percona.com/percona-monitoring-and-management/3/use/commands/pmm-admin.html?h=pmm+admin#__tabbed_1_1) command in the `pmm.mongodParams` and `pmm.mongosParams` keys for `mongod` and `mongos` Pods respectively.

Warning

Do not pass username, password, service name, host, or query source in `pmm.mongodParams` or `pmm.mongosParams`. The Operator automatically manages these settings for you. Overriding them can break PMM monitoring.

When done, apply the edited `deploy/cr.yaml` file:

```
kubectl apply -f deploy/cr.yaml
```

## Update the secrets file

The `deploy/secrets.yaml` file contains all values for each key/value pair in a convenient plain text format. But the resulting Secrets Objects contains passwords stored as base64-encoded strings. If you want to *update* the password field, you need to encode the new password into the base64 format and pass it to the Secrets Object.

To encode a password or any other parameter, run the following command:

**on Linux**

```
echo -n "password" | base64 --wrap=0
```

**on macOS**

```
echo -n "password" | base64
```

For example, to set the new PMM Server token in the `my-cluster-name-secrets` object, do the following:

**on Linux**

```
kubectl patch secret/my-cluster-name-secrets -p '{"data":{"PMM_SERVER_TOKEN": '$(echo -n <new-token> | base64 --wrap=0)'}}'
```

**on macOS**

```
kubectl patch secret/my-cluster-name-secrets -p '{"data":{"PMM_SERVER_TOKEN": '$(echo -n <new-token> | base64)'}}'
```
