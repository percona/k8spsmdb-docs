# Monitor database with Percona Monitoring and Management (PMM)

{% include 'assets/fragments/monitor-db.txt' %}

## Configure Query Analytics

To analyze query execution on the [PMM Query Analytics (QAN)  :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/3/use/qan/index.html) dashboard, you must configure how PMM collects query data. Starting with Operator version 1.23.0, use the [`pmm.querySource`](operator.md#pmmquerysource) option to choose the collection method:

* `profiler` (default) — PMM reads query performance data from each database's `system.profile` collection. This method requires you to [enable profiling  :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/3/install-pmm/install-pmm-client/connect-database/mongodb.html#compare-query-source-methods) explicitly.
* `mongolog` — PMM reads slow-query data directly from mongod log files. This method has minimal impact on the database and scales better in clusters with many databases. It requires [PMM 3.3.0 or newer  :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/3/install-pmm/install-pmm-client/connect-database/mongodb.html#compare-query-source-methods) and the [log collector](persistent-logging.md) enabled so that logs are written to `/data/db/logs/`.

See the [PMM documentation on query source methods  :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/3/install-pmm/install-pmm-client/connect-database/mongodb.html#compare-query-source-methods) for a detailed comparison.

### Configure the profiler query source

To use the default `profiler` query source, do the following:

* [enable profiling in PMM :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/3/install-pmm/install-pmm-client/connect-database/mongodb.html#compare-query-source-methods)
* Configure the Operator:

  * set the `pmm.querySource` option to `profiler`
  * enable profiling in the Percona Server for MongoDB, so PMM can collect query data. You can pass MongoDB options in several ways: edit the Custom Resource, via the ConfigMap or a Secret. Read more about [changing MongoDB options](options.md).

This example shows how to configure `profiler` and pass the configuration via the `configuration` subsection of the `deploy/cr.yaml` manifest:

```yaml
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

```bash
kubectl apply -f deploy/cr.yaml -n <namespace>
```

### Configure the mongolog query source

!!! note "Version added: [1.23.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.23.0.md)"

To use `mongolog`, do the following:

* Enable [log collector](persistent-logging.md) so that mongod logs are available at `/data/db/logs/` for the PMM Client

   When using mongolog, configure [log rotation](logrotate.md) carefully. Avoid moving or renaming active log files during rotation, as this can interrupt mongolog collection.

* Set `pmm.querySource` to `mongolog`
* Configure MongoDB to write slow operations to the mongod log.

Here's the example configuration:

```yaml
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

```bash
kubectl apply -f deploy/cr.yaml -n <namespace>
```

### Additional PMM Client parameters

Optionally, you can specify additional parameters for the [`pmm-admin add mongodb`  :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/3/use/commands/pmm-admin.html?h=pmm+admin#__tabbed_1_1) command in the `pmm.mongodParams` and `pmm.mongosParams` keys for `mongod` and `mongos` Pods respectively.

!!! warning

    Do not pass username, password, service name, host, or query source in `pmm.mongodParams` or `pmm.mongosParams`. The Operator automatically manages these settings for you. Overriding them can break PMM monitoring.

When done, apply the edited `deploy/cr.yaml` file:

```bash
kubectl apply -f deploy/cr.yaml
```

## Update the secrets file

The `deploy/secrets.yaml` file contains all values for each key/value pair in a convenient plain text format. But the resulting Secrets Objects contains passwords stored as base64-encoded strings. If you want to *update* the password field, you need to encode the new password into the base64 format and pass it to the Secrets Object.

To encode a password or any other parameter, run the following command:

=== ":simple-linux: on Linux"

    ```bash 
    echo -n "password" | base64 --wrap=0
    ``` 

=== ":simple-apple: on macOS"

    ```bash 
    echo -n "password" | base64
    ```

For example, to set the new PMM Server token in the `my-cluster-name-secrets` object, do the following:

=== ":simple-linux: on Linux"

    ```bash
    kubectl patch secret/my-cluster-name-secrets -p '{"data":{"PMM_SERVER_TOKEN": '$(echo -n <new-token> | base64 --wrap=0)'}}'
    ```

=== ":simple-apple: on macOS"

    ```bash
    kubectl patch secret/my-cluster-name-secrets -p '{"data":{"PMM_SERVER_TOKEN": '$(echo -n <new-token> | base64)'}}'
    ```
