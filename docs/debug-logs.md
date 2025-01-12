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

    ``` {.bash data-prompt="$" }
    $ kubectl logs my-cluster-name-rs0-0 -c mongod
    ```

* Check logs of the `pmm-client` container:

    ``` {.bash data-prompt="$" }
    $ kubectl logs my-cluster-name-rs0-0 -c pmm-client
    ```

* Filter logs of the `mongod` container which are not older than 600 seconds:

    ``` {.bash data-prompt="$" }
    $ kubectl logs my-cluster-name-rs0-0 -c mongod --since=600s
    ```

* Check logs of a previous instantiation of the `mongod` container, if any:

    ``` {.bash data-prompt="$" }
    $ kubectl logs my-cluster-name-rs0-0 -c mongod --previous
    ```

* Check logs of the `mongod` container, parsing the output with [jq JSON processor  :octicons-link-external-16:](https://stedolan.github.io/jq/):

    ``` {.bash data-prompt="$" }
    $ kubectl logs my-cluster-name-rs0-0 -c mongod -f | jq -R 'fromjson?'
    ```

## Changing logs representation

You can also change the representation of logs: either use structured representation, which produces a parsing-friendly JSON, or use traditional console-frienldy logging with specific level. Changing representation of logs is possible by editing the `deploy/operator.yml` file, which sets the following environment variables with self-speaking names and values:

```yaml
env:
    ...
    name: LOG_STRUCTURED
    value: 'false'
    name: LOG_LEVEL
    value: INFO
    ...
```
