# Monitor database with Percona Monitoring and Management (PMM)

{% include 'assets/fragments/monitor-db.txt' %}

## Enable profiling

Starting from the Operator version 1.12.0, MongoDB operation profiling is
disabled by default. To analyze query execution on the [PMM Query Analytics  :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/3/use/qan/index.html) dashboard, you
[should enable profiling  :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/3/install-pmm/install-pmm-client/connect-database/mongodb.html#compare-query-source-methods) explicitly. You can pass options to MongoDB [in several ways](options.md).

This example shows how to pass the configuration via the `configuration` subsection of the `deploy/cr.yaml` manifest. 

   ```yaml
   spec:
     ...
     replsets:
       - name: rs0
         size: 3
         configuration: |
           operationProfiling:
             slowOpThresholdMs: 200
             mode: slowOp
             rateLimit: 100
   ```

Optionally, you can specify additional parameters for the [`pmm-admin add mongodb`  :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/3/use/commands/pmm-admin.html?h=pmm+admin#__tabbed_1_1) command in the  `pmm.mongodParams` and `pmm.mongosParams` keys for `mongod` and `mongos` Pods respectively.

<i info>:material-information: Info: </i> Note that the Operator automatically manages common MongoDB Service Monitoring parameters such as username, password, service-name, host, etc. Assigning values to these parameters is not recommended and can negatively affect the functionality of the PMM setup carried out by the Operator.

When done, apply the edited `deploy/cr.yaml` file:

```{.bash data-prompt="$"}
$ kubectl apply -f deploy/cr.yaml
```

## Update the secrets file

The `deploy/secrets.yaml` file contains all values for each key/value pair in a convenient plain text format. But the resulting Secrets Objects contains passwords stored as base64-encoded strings. If you want to *update* the password field, you need to encode the new password into the base64 format and pass it to the Secrets Object.

To encode a password or any other parameter, run the following command:

=== ":simple-linux: on Linux"

    ```{.bash data-prompt="$"} 
    $ echo -n "password" | base64 --wrap=0
    ``` 

=== ":simple-apple: on macOS"

    ```{.bash data-prompt="$"} 
    $ echo -n "password" | base64
    ```

For example, to set the new PMM Server token in the `my-cluster-name-secrets` object, do the following:

=== ":simple-linux: on Linux"

    ```{.bash data-prompt="$"}
    $ kubectl patch secret/my-cluster-name-secrets -p '{"data":{"PMM_SERVER_TOKEN": '$(echo -n <new-token> | base64 --wrap=0)'}}'
    ```

=== ":simple-apple: on macOS"

    ```{.bash data-prompt="$"}
    $ kubectl patch secret/my-cluster-name-secrets -p '{"data":{"PMM_SERVER_TOKEN": '$(echo -n <new-token> | base64)'}}'
    ```
