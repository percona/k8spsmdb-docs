--8<-- "monitor-db.md"


## Enable profiling

Starting from the Operator version 1.12.0, MongoDB operation profiling is
disabled by default. To analyze query execution on the [PMM Query Analytics  :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/get-started/query-analytics.html) dashboard, you
[should enable profiling  :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/setting-up/client/mongodb.html#set-profiling-in-the-configuration-file) explicitly. You can pass options to MongoDB [in several ways](options.md#operator-configmaps).

For example, update the `configuration` subsection of the `deploy/cr.yaml`:

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

Optionally, you can specify additional parameters for the [`pmm-admin add mongodb`  :octicons-link-external-16:](https://www.percona.com/doc/percona-monitoring-and-management/2.x/setting-up/client/mongodb.html#adding-mongodb-service-monitoring) command in the  `pmm.mongodParams` and `pmm.mongosParams` keys for `mongod` and `mongos` Pods respectively.

<i info>:material-information: Info: </i> Please take into account that the Operator automatically manages common [MongoDB Service Monitoring parameters  :octicons-link-external-16:](https://www.percona.com/doc/percona-monitoring-and-management/2.x/setting-up/client/mongodb.html#adding-mongodb-service-monitoring), such as username, password, service-name, host, etc. Assigning values to these parameters is not recommended and can negatively affect the functionality of the PMM setup carried out by the Operator.

When done, apply the edited `deploy/cr.yaml` file:

```{.bash data-prompt="$"}
$ kubectl apply -f deploy/cr.yaml
```

## Update the secrets file

The `deploy/secrets.yaml` file contains all values for each key/value pair in a convenient plain text format. But the resulting Secrets Objects contains passwords stored as base64-encoded strings. If you want to *update* the password field, you need to encode the new password into the base64 format and pass it to the Secrets Object.

To encode a password or any other parameter, run the following command:

=== "on Linux" 

    ```{.bash data-prompt="$"} 
    $ echo -n "password" | base64 --wrap=0
    ``` 

=== "on macOS" 

    ```{.bash data-prompt="$"} 
    $ echo -n "password" | base64
    ```

For example, to set the new PMM API key in the `my-cluster-name-secrets` object, do the following:

=== "in Linux"

    ```{.bash data-prompt="$"}
    $ kubectl patch secret/my-cluster-name-secrets -p '{"data":{"PMM_SERVER_API_KEY": '$(echo -n new_key | base64 --wrap=0)'}}'
    ```

=== "on macOS"

    ```{.bash data-prompt="$"}
    $ kubectl patch secret/my-cluster-name-secrets -p '{"data":{"PMM_SERVER_API_KEY": '$(echo -n new_key | base64)'}}'
    ```
