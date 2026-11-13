# Troubleshoot out-of-memory errors

Use this page when a container restarts with `OOMKilled`, or when the `RESTARTS` count of a Pod keeps growing and you suspect memory.

A container that uses more memory than is defined in its `resources.limits.memory` is killed by the Linux kernel. Kubernetes records the restart, but it doesn't choose or prevent it. The Pod keeps its data and restarts in place. Every kill drops the connections to that container, and if the killed container is `mongod` on the primary, the replica set holds an election.

The fix depends on which container was killed, so find that out first.

## Find the container that was killed

1. List the Pods. A killed container shows `OOMKilled` in the `STATUS` column for a moment, `READY` is lower than the number of containers, and `RESTARTS` grows:

    ```bash
    kubectl get pods -n <namespace>
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        NAME                    READY   STATUS      RESTARTS      AGE
        my-cluster-name-rs0-0   3/3     Running     0             2m54s
        my-cluster-name-rs0-1   2/3     OOMKilled   1 (9s ago)    2m23s
        my-cluster-name-rs0-2   3/3     Running     1 (76s ago)   3m24s
        ```

2. Show the reason for the last restart of every container in the Pod. The columns are the container name, the restart count, the reason and the exit code:

    ```bash
    kubectl get pod <pod-name> -n <namespace> -o jsonpath='{range .status.containerStatuses[*]}{.name}{"\t"}{.restartCount}{"\t"}{.lastState.terminated.reason}{"\t"}{.lastState.terminated.exitCode}{"\n"}{end}'
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        logrotate   0
        logs        0
        mongod      2   OOMKilled   137
        ```

    Kubernetes lists the containers in alphabetical order, not in the order of the Pod spec. In scripts, select a container by name, for example `{.status.containerStatuses[?(@.name=="mongod")].lastState.terminated.reason}`.

3. To see the same information with more detail, describe the Pod and look at `Last State` under the container:

    ```bash
    kubectl describe pod <pod-name> -n <namespace>
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        Last State:     Terminated
          Reason:       OOMKilled
          Exit Code:    137
        ```

Kubernetes doesn't post an `OOMKilled` event, so `kubectl get events` doesn't show the kill. The Operator doesn't flag it either: `kubectl get psmdb` reports `initializing`. After a long crash loop, the status becomes `error` with a message such as `Error: pod my-cluster-name-cfg-0 is in CrashLoopBackOff state`.

An `OOMKilled` reason can also result from node-wide memory exhaustion. Check node/kernel diagnostics and the affected container's cgroup memory counters to distinguish node pressure from a container-limit OOM before increasing limits.

Use the container name to choose the next step:

| What you see | What it means | Go to |
| --- | --- | --- |
| `mongod` in a replica set Pod | The database container was OOM-killed; check its memory limit and node memory pressure | [mongod is killed](#mongod-is-killed) |
| `mongos`, or `mongod` in a config server Pod | A router or config server was OOM-killed; check its memory limit and node memory pressure | [mongos and config server Pods](#mongos-and-config-server-pods) |
| `backup-agent`, `pmm-client`, `logs`, or `logrotate` | A sidecar was OOM-killed; check its memory limit and node memory pressure | [Sidecar containers](#sidecar-containers) |
| The Operator Pod | The Operator was OOM-killed; check its memory limit and node memory pressure | [The Operator is killed](#the-operator-is-killed) |
| Exit code `137` without `OOMKilled` | The process got `SIGKILL` for another reason, such as a failed liveness probe or a node shutdown | Check the Pod events and the node, not the memory limit |
| The Pod is `Evicted` | The node ran short of memory and the kubelet evicted the Pod. This is node pressure, not the container limit | Check `kubectl describe node <node-name>` and the requests of the other Pods on the node |

## mongod is killed

**Meaning.** The memory limit of the `mongod` container has to hold two things: the WiredTiger cache, and everything else. The cache has a fixed size that the Operator calculates from the limit. Everything else is connections, query and aggregation memory, index builds, and memory that the allocator hasn't returned to the system. It isn't capped by the cache size, and it is what usually pushes the container over its limit.

After the restart, the log of the new `mongod` process shows that the previous one didn't shut down cleanly. The killed process writes nothing, because a kernel kill can't be logged. With the log collector enabled (the default), `mongod` writes its log to a file, and the log of the `mongod` container is almost empty. Read the log from the `logs` container instead. See [Check logs](debug-logs.md) for more.

```bash
kubectl logs <pod-name> -n <namespace> -c logs | grep "Detected unclean shutdown"
```

??? example "Sample output"

    ```{.text .no-copy}
    "msg":"Detected unclean shutdown - Lock file is not empty
    ```

### Check the memory settings

Connect directly to the affected `mongod` member with [mongosh](connection-secrets.md#open-an-interactive-shell-with-mongosh). Use a `mongodb://` URI with that Pod's hostname and port as the only host, and add `directConnection=true`, retaining the authentication and TLS settings from the connection guide. Check how much memory `mongod` sees and how large its cache is:

```javascript
db.hostInfo().system.memLimitMB
db.serverStatus().wiredTiger.cache["maximum bytes configured"] / 1024 / 1024
```

`memLimitMB` must match the `resources.limits.memory` of the container. If it shows the memory of the node, the component has no memory limit. In that case, the Operator doesn't set the cache size, and `mongod` sizes the cache from the memory of the whole node, which is more than the Pod's share of it. Set `resources.limits.memory` for the component.

### How the Operator sizes the cache

The Operator starts `mongod` with a WiredTiger cache of `(memory limit − 1 GiB) × cacheSizeRatio`, with a minimum of 256 MiB. The [`cacheSizeRatio`](operator.md#replsetsstoragewiredtigerengineconfigcachesizeratio) option is set for each replica set and defaults to `0.5`. Whatever the cache doesn't take is all the room that `mongod` has for everything else:

| Memory limit | `cacheSizeRatio` | WiredTiger cache | Left for everything else |
| --- | --- | --- | --- |
| 1Gi | 0.5 | 256 MiB (minimum) | about 0.75 GiB |
| 5Gi | 0.5 | 2 GiB | 3 GiB |
| 5Gi | 0.8 | 3.2 GiB | 1.8 GiB |
| 8Gi | 0.5 | 3.5 GiB | 4.5 GiB |
| 8Gi | 0.8 | 5.6 GiB | 2.4 GiB |

A high `cacheSizeRatio` on a small limit leaves little room for connections and queries.

The in-memory engine is different. Its size is `memory limit × `[`inMemorySizeRatio`](operator.md#replsetsstorageinmemoryengineconfiginmemorysizeratio), which defaults to `0.9`, and the Operator doesn't subtract 1 GiB. The data lives in that memory, and with a 1Gi limit only about 100 MiB is left for everything else.

### Find what uses the memory

The configured cache size does not cap the total memory used by `mongod`. An OOM kill alone does not tell you whether cache or non-cache memory grew. Compare the two in `mongosh`, ideally several times while the memory rises:

```javascript
const s = db.serverStatus();
const GiB = x => (Number(x) / 1073741824).toFixed(2);
print("allocated     " + GiB(s.tcmalloc.generic.current_allocated_bytes));
print("wt cache      " + GiB(s.wiredTiger.cache["bytes currently in the cache"]));
print("connections   " + s.connections.current);
print("open cursors  " + s.metrics.cursor.open.total);
```

The `allocated` value minus the `wt cache` value is a rough estimate of live heap allocations outside the cache. It excludes free memory retained by the allocator and other memory charged to the container. Also compare `db.serverStatus().mem.resident` (in MiB) with the container's cgroup memory usage. If live allocations grow while the cache stays flat, look at what the workload is doing. These are the patterns that occur most often:

* **Abandoned cursors.** A client reads one batch and never iterates or closes the cursor. If the query needed an in-memory sort, the cursor holds the sorted result outside the cache. List the idle cursors with:

    ```javascript
    db.getSiblingDB("admin").aggregate([
      { $currentOp: { allUsers: true, idleCursors: true } },
      { $match: { type: "idleCursor" } }
    ])
    ```

* **Blocking sorts and collection scans.** A sort that no index supports, or a `COLLSCAN` in the slow query log, uses memory for each query. Many of them at once add up. Drivers retry reads, so the same query can run again and kill `mongod` right after the restart.
* **Connection spikes.** Each connection uses memory. A jump in `connections.current` that lines up with the kills points at the clients or their connection pools.
* **Change streams.** Many open change streams, especially on the primary, are a common source of growth. A `fullDocument` lookup adds work and memory.

If you don't have PMM, the `diagnostic.data` directory in the data directory of `mongod` records `serverStatus` every second and covers the minutes before the kill.

If the container keeps being killed after you raise the limit, the cause is almost always one of these workload patterns, not the size of the limit.

### Fix the cause

1. Fix the workload first. A larger limit only delays the next kill when the memory outside the cache keeps growing:

    * Make the application exhaust or close its cursors. Use a real `limit(n)` instead of a very large one, and add an index that supports the sort. As a stopgap, kill idle cursors with `killCursors`. This stops the growth, and `mongod` reuses the freed memory, but the memory use that Kubernetes reports may not drop at once.
    * Add indexes for the queries that show `COLLSCAN` or an in-memory sort.
    * Cap the connection pools in the application drivers.
    * Open change streams on as few collections as possible, and avoid `fullDocument` lookups that you don't need.

2. Give `mongod` more room outside the cache. Raise the limit, lower `cacheSizeRatio`, or both. Keep `requests.memory` equal to `limits.memory`, so the scheduler places the Pod only on a node that has that memory:

    ```yaml
    spec:
      replsets:
      - name: rs0
        resources:
          limits:
            memory: "8Gi"
          requests:
            memory: "8Gi"
        storage:
          wiredTiger:
            engineConfig:
              cacheSizeRatio: 0.5
    ```

3. Apply the change:

    ```bash
    kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

    With the default `SmartUpdate` strategy, the Operator restarts the members one at a time: the secondaries first and the primary last, after a step-down. `RollingUpdate` uses the StatefulSet controller's update order; `OnDelete` requires you to delete and recreate each Pod manually. See [Update strategies](update.md#update-strategies) and [Upgrade manually](update-manually.md). Once a member has restarted with the new settings, its cache size follows the new limit. Check the new values with the `mongosh` commands from [Check the memory settings](#check-the-memory-settings).

!!! note

    If a Pod that is crash-looping or `Pending` still has the old resource settings, confirm that the StatefulSet's Pod template has the new settings before deleting that Pod. Delete one Pod at a time and wait for it to become ready before proceeding. If a `Pending` Pod already has the new request and its scheduling events report insufficient memory, add node capacity or revise the requested resources; deleting it won't resolve that capacity shortage.

For the settings of the limits, see [`replsets.resources.limits.memory`](operator.md#replsetsresourceslimitsmemory). For sizing, see [Scaling](scaling.md).

## mongos and config server Pods

**Meaning.** In a sharded cluster, the `mongos` Pods and the config server replica set have their own limits. A limit of a few MiB is too small, and the container is killed or starved under load. That shows up as failures on the shards too. An idle `mongos` used about 40 MiB in a test, before it handled any load. A killed `mongos` shows `CrashLoopBackOff` in `kubectl get pods`, and its message is in `.status.mongos.message`. The other `mongos` Pods keep serving, so the cluster stays available.

**Fix.**

1. Raise the limit of the component that was killed:

    ```yaml
    spec:
      sharding:
        mongos:
          resources:
            limits:
              memory: "1Gi"
            requests:
              memory: "1Gi"
        configsvrReplSet:
          resources:
            limits:
              memory: "1Gi"
            requests:
              memory: "1Gi"
    ```

    Size them like any other `mongod` or router, not to a token value. See [`sharding.mongos.resources.limits.memory`](operator.md#shardingmongosresourceslimitsmemory) and [`sharding.configsvrReplSet.resources.limits.memory`](operator.md#shardingconfigsvrreplsetresourceslimitsmemory).

2. Apply the change with `kubectl apply -f deploy/cr.yaml -n <namespace>`. Delete any Pod that is still crash-looping, one at a time, so that it starts with the new settings.

## Sidecar containers

**Meaning.** Each sidecar has its own limit. When a sidecar is killed, `mongod` in the same Pod keeps running and stays a member of the replica set. Find the key for the container that was killed:

| Container | Limit is set in |
| --- | --- |
| `mongod` | `replsets[].resources` |
| `backup-agent` | [`backup.resources`](operator.md#backupresourceslimitsmemory) |
| `pmm-client` | [`pmm.resources`](operator.md#pmmresourceslimitsmemory) |
| `logs` (the log collector) | `logcollector.resources` |
| `logrotate` | `logcollector.resources` (shared with `logs`) |

A restore needs much more memory in `backup-agent` than a backup does. To find the peak that a sidecar reaches, read the memory counters of its cgroup while a backup or a restore runs. This example is for nodes that use cgroup v2:

```bash
kubectl exec <pod-name> -n <namespace> -c backup-agent -- sh -c 'cat /sys/fs/cgroup/memory.current /sys/fs/cgroup/memory.peak /sys/fs/cgroup/memory.max; grep oom_kill /sys/fs/cgroup/memory.events'
```

??? example "Sample output"

    ```{.text .no-copy}
    17555456
    17887232
    25165824
    oom_kill 0
    ```

The lines are the current use, the peak, and the limit, all in bytes, followed by the number of OOM kills in the cgroup. On nodes that use cgroup v1, the files are `/sys/fs/cgroup/memory/memory.usage_in_bytes` and `/sys/fs/cgroup/memory/memory.limit_in_bytes`.

**Fix.**

1. Set the limit with a margin above the peak that you measured. Removing the limit also stops the kills, but then the sidecar can take memory that the node needs for `mongod`.
2. Apply the change with `kubectl apply -f deploy/cr.yaml -n <namespace>`.
3. Delete the Pods that are still crash-looping, one at a time. A Pod in a crash loop keeps the old limit until the StatefulSet recreates it.

## The Operator is killed

**Meaning.** The default Operator Deployment has no resource requests or limits, and an idle Operator uses about 40 MiB. If you set a limit that the Operator exceeds, its container is killed and restarts.

The database keeps running, but nothing reconciles while the Operator is down: changes to the Custom Resource, Smart Update, backups and status updates all wait. `kubectl get psmdb` keeps showing the last status, `ready`, so a stale status is a sign of a dead Operator. The log of the previous container ends normally, without an error line, because the process was killed.

**Fix.**

1. Check the Operator Pod for restarts and for `OOMKilled`:

    ```bash
    kubectl get pods -n <namespace> -l app.kubernetes.io/name=percona-server-mongodb-operator
    kubectl describe pod <operator-pod-name> -n <namespace>
    ```

2. Raise the memory limit of the Operator container in the Deployment of the Operator, or remove the limit that you set.

## Verify recovery

1. Check that the Pods are running and that the restart count stops growing while the workload runs:

    ```bash
    kubectl get pods -n <namespace>
    ```

2. Check the cluster state. The `STATUS` returns to `ready`:

    ```bash
    kubectl get psmdb -n <namespace>
    ```

3. For `mongod`, check that `memLimitMB` and the cache match the new limit. See [Check the memory settings](#check-the-memory-settings).
4. If the metrics server is installed, watch the memory use of the containers and confirm that it stays below the limit:

    ```bash
    kubectl top pod <pod-name> -n <namespace> --containers
    ```

## See also

* [Scaling](scaling.md)
* [Check logs](debug-logs.md)
* [Troubleshoot the Operator installation issues](troubleshoot-operator.md)
