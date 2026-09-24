# Persistent logging

In a distributed Kubernetes environment, it's often difficult to debug issues because logs are tied to the lifecycle of individual Pods and containers. If a Pod fails and restarts, its logs are lost, making it hard to identify the root cause of an issue.

Percona Operator for MongoDB addresses this challenge with **persistent logging**, ensuring logs are stored persistently, independent of the Pods. This approach helps ensure that logs are available for review even after a Pod restarts.

The Operator uses [Fluent Bit :octicons-link-external-16:](https://fluentbit.io/), a lightweight log processor with versatile output plugins and forwarding features, to collect logs. Fluent Bit runs as a `logs` sidecar container alongside the database container in a Pod, adds metadata to the collected logs, and saves them in a single log file in the `/data/db/logs/` directory. When this directory is backed by a Persistent Volume Claim (PVC), logs persist across Pod restarts and remain available for later debugging.

See [What gets collected](#what-gets-collected) below — this works differently depending on the Pod type.

Logs are also streamed to standard output, making them accessible via the `kubectl logs` command for quick troubleshooting. For example, to view MongoDB logs, run:

```bash
kubectl logs my-cluster-name-rs0-0 -c logs
```

A `logrotate` sidecar container runs next to the `logs` container and rotates the collected log file. By default, logs are rotated daily, stored for 7 days and are deleted afterwards. See [Log rotation](logrotate.md) for details.

Logs of all other containers in the Pods are ephemeral, meaning they will not persist after a Pod restart.

## What gets collected

### For replica set and config server Pods

Fluent Bit gathers logs from the `mongod` container and saves them to the `/data/db/logs/mongod.full.log` file. The file is stored on the same PVC as the MongoDB data, so logs persist across Pod restarts without any additional configuration.

### For mongos Pods

!!! note "Version added: 1.23.1"

!!! important

    Enabling log collection alone does not persist `mongos` logs. You must configure the storage for the `mongos` Pod in the `sharding.mongos.logs.persistentVolumeClaim` subsection of the Custom Resource. Otherwise, the Operator stores `mongos` logs on an `emptyDir` volume and they are lost when the Pod restarts.

In a sharded cluster, the Operator also adds the `logs` and `logrotate` sidecar containers to `mongos` Pods when log collection is enabled. Fluent Bit gathers logs from the `mongos` container and saves them to the `/data/db/logs/mongos.full.log` file.

`mongos` Pods don't store data, so they have no PVC by default. To keep `mongos` logs across Pod restarts, configure a dedicated PVC for them in the `sharding.mongos.logs.persistentVolumeClaim` subsection of the Custom Resource. For example:

```yaml
spec:
  logcollector:
    enabled: true
  sharding:
    mongos:
      logs:
        persistentVolumeClaim:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 1Gi
```

The `resources.requests.storage` option is required. See the [Custom Resource reference](operator.md#shardingmongoslogspersistentvolumeclaimresourcesrequestsstorage) for all available options.

The Operator creates one PVC per `mongos` Pod. PVCs are named `mongos-logs-<cluster-name>-mongos-<ordinal>`, for example, `mongos-logs-my-cluster-name-mongos-0`. Check them with this command:

```bash
kubectl get pvc -l app.kubernetes.io/component=mongos -n <namespace>
```

Adding or removing the `sharding.mongos.logs.persistentVolumeClaim` subsection makes the Operator re-create the `mongos` StatefulSet and restart `mongos` Pods one by one.

To view the collected `mongos` logs, run:

```bash
kubectl logs my-cluster-name-mongos-0 -c logs
```

To increase the size of the `mongos` log PVCs, see [Resize storage](scaling-storage-resize.md#resize-mongos-log-storage).

## Configure log collector

Cluster-level logging is enabled by default and is controlled with the `logcollector.enabled` key in the `deploy/cr.yaml` Custom Resource manifest.

You can additionally configure Fluent Bit using the `logcollector.configuration` subsection in the `deploy/cr.yaml` Custom Resource manifest. This allows you to define custom filters or output plugins to suit your specific logging and monitoring needs.

Note that when you add a new configuration to the `logcollector.configuration`, this triggers a Smart Update.

## Disable log collection

To disable log collection, set `logcollector.enabled` to `false` in the Custom Resource and apply it. The Operator removes the `logs` and `logrotate` sidecar containers from the Pods.

Disabling log collection doesn't delete the `mongos` log PVCs or the logs stored on them. The PVCs and their data remain in the namespace until you delete them. While the `sharding.mongos.logs.persistentVolumeClaim` subsection is set, the PVCs stay attached to `mongos` Pods, but `mongos` logs are no longer written to them.

## See also

* [Log rotation](logrotate.md)
* [Resize storage](scaling-storage-resize.md)
* [Delete the database cluster](delete.md#delete-the-database-cluster)
