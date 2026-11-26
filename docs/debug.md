# Initial troubleshooting

Use this page when something is wrong and you don't know the cause yet. For example, the cluster doesn't reach the `ready` state, Pods restart or don't start, or clients can't connect. Start with the quick health check, find which layer the problem is in, then use the symptom tables to reach the page with the fix.

## Before you start

* You need `kubectl` access to the namespace of the cluster and to the namespace of the Operator. They are the same namespace unless you run the Operator in the [cluster-wide mode](cluster-wide.md).
* The examples use the cluster name `my-cluster-name`. Replace it and `<namespace>` with your values.

## Quick health check

Run these three checks first. Together they take a minute and show which part of the system needs a closer look.

### Check the cluster status

```bash
kubectl get psmdb -n <namespace>
```

??? example "Expected output"

    ``` {.text .no-copy}
    NAME              ENDPOINT                                           STATUS   AGE
    my-cluster-name   my-cluster-name-mongos.default.svc.cluster.local   ready    5m26s
    ```

A healthy cluster is `ready`. The cluster is `initializing` while it is created and while it applies a change. If it stays there, see [Cluster stays in `initializing`](troubleshoot-operator.md#cluster-stays-in-initializing). For an `error` state, the reason is in the `status.message` field:

```bash
kubectl get psmdb my-cluster-name -n <namespace> -o yaml
```

For what each state means and what the cluster must meet to be `ready`, see [Custom Resource statuses](cr-statuses.md#what-ready-means).

### Check the Pods

```bash
kubectl get pods -n <namespace>
```

???+ example "Expected output"

    --8<-- "cli/kubectl-get-pods-response.md"

In a healthy cluster, every Pod is `Running` and the `READY` column shows all containers ready, such as `2/2`. A database Pod runs the `mongod` container and, depending on your configuration, `backup-agent`, `pmm-client`, `logs` and `logrotate`. See [Containers in each Pod](objects-created.md#containers-in-each-pod).

A growing `RESTARTS` count means a container keeps failing. The `STATUS` column points to where to look next:

| `STATUS` | What it means | Where to look |
| --- | --- | --- |
| `Running`, but `READY` is lower than the number of containers | A container started but isn't ready yet | [Check the logs](debug-logs.md) of the container that isn't ready |
| `Pending` | Kubernetes hasn't placed the Pod on a node | [Troubleshoot Pod scheduling](debug-scheduling.md) |
| `ContainerCreating` | The Pod is on a node, but a volume or an image isn't ready | The `Events` section of `kubectl describe pod <pod-name> -n <namespace>` |
| `ImagePullBackOff`, `ErrImagePull` | The node can't pull the image | Check the image name and registry access. See [Use a private registry](custom-registry.md) |
| `CrashLoopBackOff` | A container starts and exits repeatedly | [Check the logs](debug-logs.md) with `--previous`, and [stop the restart loop](debug-shell.md#avoid-the-restart-on-fail-loop-for-percona-server-for-mongodb-containers) to investigate |
| `OOMKilled`, or `OOMKilled` as the `Last State` reason in `kubectl describe pod` | The container ran out of memory | [Troubleshoot out-of-memory errors](debug-oom.md) |

### Check the Operator

Find the Operator Deployment. Its name depends on how you installed the Operator: `percona-server-mongodb-operator` for a `kubectl` installation, and usually a name that ends with `psmdb-operator` for Helm:

```bash
kubectl get deployments -n <operator-namespace> | grep -E 'percona-server-mongodb-operator|psmdb-operator'
```

Read its recent logs:

```bash
kubectl logs deployment/<operator-deployment> -n <operator-namespace> --since=30m
```

The Operator Pod should be `Running` with no restarts. The logs show what the Operator is doing and what it waits for. Repeated `ERROR` lines for the same cluster point to the problem.

## Which layer is it?

Problems come from four layers: your configuration, the Operator, Kubernetes, or Percona Server for MongoDB itself. See [Who owns what](architecture-responsibilities.md) for what each layer does.

Check these sources in order. Each one narrows down the layer.

1. **Custom Resource status and conditions.** `kubectl get psmdb my-cluster-name -n <namespace> -o yaml` shows the cluster state, the reconcile error message, the state of each replica set and of `mongos`, and scheduling problems. An `error` state with a message about the spec points to your configuration. See [Custom Resource statuses](cr-statuses.md#perconaservermongodb-status).
2. **Events.** Kubernetes problems show up here: scheduling, volume attachment and resize, image pulls, probe failures. The Operator itself adds no events for the cluster. To see the events of one Pod:

    ```bash
    kubectl get events -n <namespace> --sort-by=.lastTimestamp --field-selector involvedObject.name=<pod-name>
    ```

3. **Operator logs.** They show what the Operator is doing or waiting for: a stuck rolling restart, a backup that waits, a change to the replica set configuration. Most Operator problems appear only here. See [Check the Operator](#check-the-operator).
4. **Database logs.** They show MongoDB problems: elections, initial sync, start failures. With the log collector enabled, as in the default `deploy/cr.yaml`, `mongod` writes its log to a file, so read it from the `logs` container: `kubectl logs my-cluster-name-rs0-0 -n <namespace> -c logs`. Without the log collector, use `-c mongod`. For backup and restore problems, read the `backup-agent` logs. See [Check the logs](debug-logs.md).

## Where to look first

Find the symptom, check the place in the second column, and follow the link for the fix.

### Cluster and Pods

| Symptom | Look here first | Usually owned by | What to do |
| --- | --- | --- | --- |
| Cluster status is `error` with a message that starts with `wrong psmdb options`, such as `replset size must be odd` | The `status` section of `kubectl get psmdb my-cluster-name -n <namespace> -o yaml` | **User**: the Custom Resource breaks a safety check | Fix the Custom Resource. See [Stay inside safe operating limits](operator-boundaries.md#stay-inside-safe-operating-limits) |
| The cluster stays in `initializing` | The `replsets` and `mongos` status in the Custom Resource, Operator logs | **Varies**: a pending rollout, a member that isn't ready, PBM agent errors, a PVC resize, a missing endpoint, or a Pod that can't be scheduled | See [Cluster stays in `initializing`](troubleshoot-operator.md#cluster-stays-in-initializing) |
| The cluster doesn't react to changes in the Custom Resource | `kubectl get deployments -A`, Operator logs | **Operator**: its Pod isn't running, or it doesn't watch this namespace | See [Check the Operator](#check-the-operator) and [Troubleshoot the Operator installation](troubleshoot-operator.md) |
| Pod is `Pending` | The `Events` section of `kubectl describe pod <pod-name> -n <namespace>` | **Kubernetes**: not enough resources, nodes or zones for the affinity rules, taints, or a volume that can't bind | See [Troubleshoot Pod scheduling](debug-scheduling.md) |
| A container restarts with `OOMKilled` | `Last State` in `kubectl describe pod <pod-name> -n <namespace>` | **User**: the memory limit is too low for the workload or the cache | See [Troubleshoot out-of-memory errors](debug-oom.md) |
| `mongod` fails to start after a configuration change | `kubectl logs <pod-name> -n <namespace> -c logs`, or `-c mongod --previous` without the log collector | **User**: the Operator doesn't validate the `configuration` section | Fix the option in the Custom Resource. To inspect the Pod meanwhile, [stop the restart loop](debug-shell.md#avoid-the-restart-on-fail-loop-for-percona-server-for-mongodb-containers) |
| `mongod` stops or restarts, and the data volume is full | `kubectl exec <pod-name> -n <namespace> -c mongod -- df -h /data/db` | **User**: the storage is too small for the data and the oplog | Increase the storage size. See [Resize storage](scaling-storage-resize.md) |
| Pod is `Running` but not ready; the member is in `STARTUP2` or `RECOVERING` | `rs.status()`. See [Connect to a member](#connect-to-a-member) | **MongoDB**: the member runs an initial sync or catches up | Wait for the sync to finish. See [Health checks and probes](architecture-probes.md#what-this-means-for-users) |
| `mongod` container restarts; events show `Liveness probe failed` | `kubectl describe pod <pod-name> -n <namespace>` | **Kubernetes**, acting on the probe: the member is `DOWN` or `REMOVED`, or doesn't answer in time | See [Health checks and probes](architecture-probes.md#where-to-look-if-probes-fail) |
| No primary; writes fail; Operator logs show `FULL CLUSTER CRASH` | Operator logs, `rs.status()` on a remaining member | **MongoDB**: the replica set lost its majority. The Operator rewrites the configuration | See [Replica set without a primary](architecture-workflows.md#replica-set-without-a-primary) |
| A rolling restart is stuck | Operator logs | **Operator**: waits for a Pod to become ready, or for a backup or restore to finish | See [How Smart Update works](architecture-reconciliation.md#how-smart-update-works) |
| Sharded cluster: `mongos` Pods are missing or don't get the new version; Operator logs show `StatefulSet is not up to date` | Operator logs, the config server and shard Pods | **Operator**: it creates and updates `mongos` only after every config server and shard StatefulSet runs its current revision, and not during a restore | Fix the replica set that isn't up to date. See [How Smart Update works](architecture-reconciliation.md#how-smart-update-works) |
| The cluster stays in `stopping` after you set `pause: true` | Operator logs: `deleting rs pods` | **Kubernetes** or **MongoDB**: a Pod doesn't terminate, or the first Pod can't become the primary | See [Pause and resume the cluster](pause.md#troubleshooting) |
| Clients can't resolve member host names | Cluster DNS, the replica set configuration | **Kubernetes**: networking and DNS, or the exposure settings | See [Troubleshoot connection issues](troubleshoot-connection.md) |

### Backups and restores

| Symptom | Look here first | Usually owned by | What to do |
| --- | --- | --- | --- |
| A backup has no state or stays `waiting` | `kubectl get psmdb-backup <backup-name> -n <namespace> -o yaml`, Operator logs: `Cluster is not ready for backup`, `Another backup is holding the lock` | **Operator**: waits for a healthy cluster, or for another backup, restore or ClusterSync to finish | Restore cluster health or wait for the other operation. See [On-demand backup](architecture-workflows.md#on-demand-backup) |
| A backup is in the `error` state | `status.error`, the `backup-agent` logs on the Pod named in `status.pbmPods` | **User**: storage credentials or endpoint | See [Troubleshoot backups and restores](debug-backup-restore.md) |
| The cluster stays `initializing` while all Pods are ready; Operator logs show `Agent is not OK` | Operator logs, the `backup-agent` logs | **User**: the backup storage is unreachable | Fix the storage configuration. See [Configure storage for backups](backups-storage.md) |
| A restore is in the `error` state | `status.error` in `kubectl get psmdb-restore <restore-name> -n <namespace> -o yaml` | **Varies**: often the backup source or storage access | See [Restore](architecture-workflows.md#restore) and [Troubleshoot backups and restores](debug-backup-restore.md) |
| A backup object is stuck in `Terminating` | Operator logs | **User**: the backup files can't be deleted from storage, so the `percona.com/delete-backup` finalizer stays | Check storage access. See [Delete the unneeded backup](backups-delete.md) |

### Storage and TLS

| Symptom | Look here first | Usually owned by | What to do |
| --- | --- | --- | --- |
| A storage size change does nothing | The storage size in the Custom Resource compared with the PVC size, PVC events | **User**, if `storageScaling.enableVolumeScaling` is off. **Kubernetes** or the CSI driver, for resize errors in the PVC events | See [Resize storage](scaling-storage-resize.md) and [Troubleshooting storage](debug-storage.md) |
| TLS errors after you replaced a certificate | The `ca.crt` keys of the TLS Secrets | **User**: the CA changed in one step | See [Update certificates](tls-update.md) |
| TLS handshake errors, and the certificates are past their expiry date | The certificate dates. See [Check your certificates for expiration](tls-update.md#check-your-certificates-for-expiration) | **User**, for certificates you manage. cert-manager, if it failed to renew them | See [Update certificates with downtime](tls-update.md#update-certificates-with-downtime) |

## Connect to a member

To check the replica set yourself, open `mongosh` in the `mongod` container. The container already has the `clusterAdmin` credentials in its environment:

```bash
kubectl exec -it my-cluster-name-rs0-0 -n <namespace> -c mongod -- \
  bash -c 'mongosh -u "$MONGODB_CLUSTER_ADMIN_USER" -p "$MONGODB_CLUSTER_ADMIN_PASSWORD"'
```

If `tls.mode` is `requireTLS`, add `--tls --tlsCAFile /etc/mongodb-ssl/ca.crt --tlsCertificateKeyFile /tmp/tls.pem --tlsAllowInvalidHostnames` to the `mongosh` command.

Useful commands:

* `rs.status()` shows each member, its state and its health. The short form is `rs.status().members.map(m => ({name: m.name, state: m.stateStr, health: m.health}))`.
* `rs.printSecondaryReplicationInfo()` shows how far each secondary is behind the primary.
* In a sharded cluster, connect to a `mongos` Pod with `-c mongos`, for example `my-cluster-name-mongos-0`, and run `sh.status()`.

If the container keeps restarting, you can't connect. [Stop the restart loop](debug-shell.md#avoid-the-restart-on-fail-loop-for-percona-server-for-mongodb-containers) first. For more about shell access, see [Exec into the containers](debug-shell.md).

## Collect diagnostics for support

If you need help from Percona, collect the diagnostic data first. [pt-k8s-debug-collector :octicons-link-external-16:](https://docs.percona.com/percona-toolkit/pt-k8s-debug-collector.html) gathers the Custom Resources, Pod descriptions, events, logs and other Kubernetes objects into one archive.

Run the tool on the machine where you run `kubectl`, not inside a Pod. It uses your kubeconfig to read the cluster, so it needs `kubectl` in the `PATH` and read access to the cluster's namespace. The tool is part of [Percona Toolkit :octicons-link-external-16:](https://docs.percona.com/percona-toolkit/installation.html), which also installs `pt-mongodb-summary`, used for the database summary.

```bash
pt-k8s-debug-collector --resource=psmdb --namespace=<namespace> --cluster=my-cluster-name
```

The tool writes a `cluster-dump_<timestamp>.tar.gz` archive to the current directory.

If you can't run the tool, collect at least:

* `kubectl get psmdb my-cluster-name -n <namespace> -o yaml`
* The Operator logs. See [Check the Operator](#check-the-operator)
* `kubectl describe pods -n <namespace>`
* `kubectl get events -n <namespace> --sort-by=.lastTimestamp`
* The logs of the failing containers, with `--previous` if they restarted

Then see [Get help from Percona](get-help.md) for the community forum and support options.

## See also

* [Check the logs](debug-logs.md) explains the `kubectl logs` options and how to change the Operator log format.
* [Troubleshoot the Operator installation](troubleshoot-operator.md) covers an Operator that doesn't start and a cluster that stays in `initializing`.
* [Troubleshoot backups and restores](debug-backup-restore.md) walks through failed backups and restores step by step.
* [Who owns what](architecture-responsibilities.md) explains which layer reacts to which event, so you know where to look next time.
