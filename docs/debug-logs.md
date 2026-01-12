# Check the Logs

Logs provide valuable information. It makes sense to check the logs of the
database Pods and the Operator Pod. Following flags are helpful for checking the
logs with the `kubectl logs` command:

| Flag                          | Description                                                               |
| ----------------------------- | ------------------------------------------------------------------------- |
| `--container=<container-name>`| Print log of a specific container in case of multiple containers in a Pod |
| `--follow`                    | Follows the logs for a live output                                        |
| `--since=<time>`              | Print logs newer than the specified time, for example: `--since="10s"`    |
| `--timestamps`                | Print timestamp in the logs (timezone is taken from the container)        |
| `--previous`                  | Print previous instantiation of a container. This is extremely useful in case of container restart, where there is a need to check the logs on why the container restarted. Logs of previous instantiation might not be available in all the cases. |

In the following examples we will access containers of the `my-cluster-name-rs0-0` Pod.

* Check logs of the `mongod` container:

    ```bash
    kubectl logs my-cluster-name-rs0-0 -c mongod
    ```

* Check logs of the `pmm-client` container:

    ```bash
    kubectl logs my-cluster-name-rs0-0 -c pmm-client
    ```

* Filter logs of the `mongod` container which are not older than 600 seconds:

    ```bash
    kubectl logs my-cluster-name-rs0-0 -c mongod --since=600s
    ```

* Check logs of a previous instantiation of the `mongod` container, if any:

    ```bash
    kubectl logs my-cluster-name-rs0-0 -c mongod --previous
    ```

* Check logs of the `mongod` container, parsing the output with [jq JSON processor  :octicons-link-external-16:](https://stedolan.github.io/jq/):

    ```bash
    kubectl logs my-cluster-name-rs0-0 -c mongod -f | jq -R 'fromjson?'
    ```

## Changing logs representation

You can also change the representation of logs: either use structured representation, which produces a parsing-friendly JSON, or use traditional console-friendly logging with specific level. Changing representation of logs is possible by editing the `deploy/operator.yml` file, which sets the following environment variables with self-speaking names and values:

```yaml
env:
    ...
    name: LOG_STRUCTURED
    value: 'false'
    name: LOG_LEVEL
    value: INFO
    ...
```

## Cluster-level logging

In a distributed Kubernetes environment, it's often difficult to debug issues because logs are tied to the lifecycle of individual Pods and containers. If a Pod fails and restarts, its logs are lost, making it hard to identify the root cause of an issue.

Percona Operator for MongoDB addresses this challenge with **cluster-level logging**, ensuring logs are stored persistently, independent of the Pods. This approach helps ensure that logs are available for review even after a Pod restarts.

The Operator collects logs using [Fluent Bit :octicons-link-external-16:](https://fluentbit.io/) - a lightweight log processor, which supports many output plugins and has broad forwarding capabilities. Fluent Bit runs as a sidecar container within each database Pod. It collects logs from the primary `mongod` container, adds metadata, and stores them in a single file in a dedicated log-specific Persistent Volume Claim (PVC) at `/data/db/logs/`. This allows logs to survive Pod restarts and be accessed for later debugging.

Logs are also streamed to standard output, making them accessible via the `kubectl logs` command for quick troubleshooting:

```bash
kubectl logs my-cluster-name-rs0-0 -c logs
```

Currently, logs are collected only for the `mongod` instance. All other logs are ephemeral, meaning they will not persist after a Pod restart. Logs are stored for 7 days and are rotated afterwards.

### Configure log collector

Cluster-level logging is enabled by default and is controlled with the `logcollector.enabled` key in the `deploy/cr.yaml` Custom Resource manifest.

You can additionally configure Fluent Bit using the `logcollector.configuration` subsection in 
the `deploy/cr.yaml` Custom Resource manifest. This allows you to define custom filters and output plugins to suit your specific logging and monitoring needs.

Note that when you add a new configuration to the `logcollector.configuration`, this triggers a Smart Update. 
