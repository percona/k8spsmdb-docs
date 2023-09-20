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

In the following examples we will access containers of the `cluster1-pxc-0` Pod.

* Check logs of the `pxc` container:

    ``` {.bash data-prompt="$" }
    $ kubectl logs cluster1-pxc-0 -c pxc
    ```

* Check logs of the `pmm-client` container:

    ``` {.bash data-prompt="$" }
    $ kubectl logs cluster1-pxc-0 -c pmm-client
    ```

* Filter logs of the `pxc` container which are not older than 600 seconds:

    ``` {.bash data-prompt="$" }
    $ kubectl logs cluster1-pxc-0 -c pxc --since=600s
    ```

* Check logs of a previous instantiation of the `pxc` container, if any:

    ``` {.bash data-prompt="$" }
    $ kubectl logs cluster1-pxc-0 -c pxc --previous
    ```

* Check logs of the `pxc` container, parsing the output with [jq JSON processor](https://stedolan.github.io/jq/):

    ``` {.bash data-prompt="$" }
    $ kubectl logs cluster1-pxc-0 -c pxc -f | jq -R 'fromjson?'
    ```

## Cluster-level logging

Cluster-level logging involves collecting logs from all Percona XtraDB Cluster
Pods in the cluster to some persistent storage. This feature gives the logs a
lifecycle independent of nodes, Pods and containers in which they were
collected. Particularly, it ensures that Pod logs from previous failures are
available for later review.

Log collector is turned on by the `logcollector.enabled` key in the
`deploy/cr.yaml` configuration file (`true` by default).

The Operator collects logs using [Fluent Bit Log Processor](https://fluentbit.io/),
which supports many output plugins and has broad forwarding capabilities.
If necessary, Fluent Bit filtering and advanced features can be configured via
the `logcollector.configuration` key in the `deploy/cr.yaml` configuration
file.

Logs are stored for 7 days and then rotated.

Collected logs can be examined using the following command:

``` {.bash data-prompt="$" }
$ kubectl logs cluster1-pxc-0 -c logs
```

!!! note

    Technically, logs are stored on the same Persistent Volume, which is
    used with the corresponding Percona XtraDB Cluster Pod. Therefore collected
    logs can be found in `DATADIR` (`var/lib/mysql/`). Also, there is an additional
    Secrets object for Fluent Bit passwords and other similar data, e.g. for
    output plugins. The name of this Secrets object can be found in the
    `logCollectorSecretName` option of the Custom Resource (it is set to
    `my-log-collector-secrets` in the `deploy/cr.yaml` configuration file by
    default).
