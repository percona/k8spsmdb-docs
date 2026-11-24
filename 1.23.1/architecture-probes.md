> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Health checks and probes

Kubernetes decides whether a container is healthy by running *probes*: small checks it runs on a schedule. It acts on the results without asking the Operator or MongoDB:

- The **readiness probe** decides whether a Pod is *ready*. Only a ready Pod receives traffic through a Service: Kubernetes adds it to the endpoints of the Services that select it and removes it when the probe fails. Ready Pods also count as available and let the next Pod of a [StatefulSet](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html#statefulset) start.
- The **liveness probe** decides whether a container is *alive*. When it fails, the kubelet restarts the container.

What is the kubelet

The kubelet is the Kubernetes agent that runs on every node. It starts and stops the containers of the Pods scheduled to its node, runs their probes, and reports their state to the Kubernetes API. The kubelet acts on probe results locally, without involving the Operator.

For a database, this means Kubernetes keeps its own opinion about which members are healthy, and it restarts `mongod` when that opinion says so. Many behaviors that look surprising, such as a member that restarts in a loop, a node drain that never finishes, or a cluster stuck in `initializing`, come from the probes. This page explains what the probes check and who acts on their result.

The examples use a cluster named `my-cluster-name`.

## What the probes check

The Operator sets the probes for the `mongod` and `mongos` containers. Both run the `mongodb-healthcheck` tool from the Operator image. The tool connects to the local server as the `clusterMonitor` [system user](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/system-users.html) and runs a command.

### `mongod` Pods

**Readiness.** The probe first opens a TCP connection to the `mongod` port. Then it logs in and reads the member state with `replSetGetStatus`. The Pod is ready when the member is:

- `PRIMARY`, `SECONDARY` or `ARBITER`.

The Pod is not ready when the member is `STARTUP`, `STARTUP2`, `RECOVERING`, `ROLLBACK`, `DOWN`, `REMOVED` or in an unknown state.

Two exceptions keep a new cluster from blocking itself. If the probe can open the port but can’t log in, for example before the Operator has created the system users, the Pod counts as ready. The same happens when the replica set configuration is invalid, so that the Operator can fix it.

**Liveness.** The probe connects to `mongod` and reads the member state. It fails when it can’t connect. It passes when the member:

- is `PRIMARY`, `SECONDARY` or `ARBITER`;
- has no replica set configuration yet, which is normal before the Operator initializes the replica set;
- is `RECOVERING` or `ROLLBACK`: the member is busy, and a restart wouldn’t help;
- is `STARTUP` or `STARTUP2` and runs an initial sync, for as long as the sync takes.

A member that is `STARTUP` or `STARTUP2` without an initial sync gets 30 seconds plus 60 seconds for every GB of its oplog. After that, the probe fails. The probe also fails when the member is `DOWN`, `REMOVED` or in an unknown state.

**Special cases.** Two files in the container make both probes pass, whatever the state:

| File                               | Readiness | Liveness | Why                                                                                                                                                                                                                              |
| ---------------------------------- | --------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/opt/percona/restore-in-progress` | Passes    | Passes   | A physical restore stops and starts `mongod` several times. The restore must not be interrupted by restarts                                                                                                                      |
| `/data/db/sleep-forever`           | Passes    | Passes   | Lets you keep the container running without `mongod` for [manual repair](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug-shell.html#avoid-the-restart-on-fail-loop-for-percona-server-for-mongodb-containers) |

Arbiter, non-voting and hidden members use the same checks. The `startupDelaySeconds` option of the liveness probe is deprecated, and the probe ignores it.

### `mongos` Pods

**Readiness.** The probe logs in to `mongos` and runs `listDatabases` for the `admin` database.

**Liveness.** The probe checks that the server answers and reports itself as `mongos`.

### Other containers

The `backup-agent` container has no probes by default. Starting with version 1.23.0, you can set them with `backup.livenessProbe` and `backup.readinessProbe`. The probes of the `pmm-client` and `mongot` containers are described in the [Custom Resource options](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html).

## Default timings

| Container                           | Probe     | First check after | Period | Timeout | Failures before acting | Time to act                                      |
| ----------------------------------- | --------- | ----------------- | ------ | ------- | ---------------------- | ------------------------------------------------ |
| `mongod`, data replica sets         | Readiness | 10 s              | 3 s    | 2 s     | 8                      | about 25 seconds                                 |
| `mongod`, config server replica set | Readiness | 10 s              | 3 s    | 2 s     | 3                      | about 10 seconds                                 |
| `mongod`                            | Liveness  | 90 s              | 10 s   | 5 s     | 12                     | about 2 minutes, counted after the initial delay |
| `mongos`                            | Readiness | 10 s              | 1 s    | 1 s     | 3                      | about 3 seconds                                  |
| `mongos`                            | Liveness  | 90 s              | 10 s   | 5 s     | 12                     | about 2 minutes, counted after the initial delay |

Non-voting and hidden members inherit the settings of their replica set unless you set their own.

## Who acts on readiness

A Pod’s readiness is read by several parties, each for its own purpose:

```
flowchart LR
  probe["readiness probe<br/>PRIMARY, SECONDARY or ARBITER?"] --> ready(["Pod ready"])
  ready --> svc["Headless Service<br/>DNS records of ready Pods"]
  svc --> drv["Drivers using<br/>mongodb+srv"]
  ready --> sts["StatefulSet<br/>start the next Pod"]
  ready --> pdb["PodDisruptionBudget<br/>allow an eviction"]
  ready --> op["Operator<br/>cluster status, Smart Update"]
```

### Services and DNS

The headless Service of a replica set, such as `my-cluster-name-rs0`, publishes DNS records only for ready Pods. A driver that uses a `mongodb+srv` connection string gets its first list of members from these records. After it connects, the driver uses the member list from the replica set configuration.

The `my-cluster-name-mongos` Service sends new connections only to ready `mongos` Pods.

The per-Pod Services that the Operator creates when you [expose the replica set](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/expose.html#accessing-replica-set-pods) publish the address of a Pod whether it is ready or not.

### Ordered start

Pods of a StatefulSet start in order: `my-cluster-name-rs0-1` is created only after `my-cluster-name-rs0-0` is running and ready, and so on. As a result:

- On cluster creation and scale-up, a member that can’t become ready blocks every Pod after it. This is why the readiness probe lets a Pod pass before the replica set exists.
- If `my-cluster-name-rs0-1` stays `RECOVERING`, and `my-cluster-name-rs0-2` is missing, Kubernetes doesn’t recreate `my-cluster-name-rs0-2` until `my-cluster-name-rs0-1` is ready.
- With `updateStrategy: SmartUpdate`, the Operator restarts the next Pod only when the previous one is ready.

### Node drains

The default [PodDisruptionBudget](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html#pdb) of each StatefulSet allows one Pod to be unavailable. A Pod that is not ready counts as unavailable. While one member of a replica set is not ready, for example during a long initial sync, Kubernetes refuses to evict another one of the same StatefulSet: `kubectl drain` keeps retrying, and managed node pool upgrades wait. Some cloud providers evict the Pod anyway after their own timeout.

### The Operator

The Operator reads Pod readiness, too:

- **Cluster status.** The cluster is `ready` only when every Pod has all containers ready. When one Pod becomes not ready, the cluster goes back to `initializing`, and everything that waits for a `ready` cluster waits as well: new backups, the creation of application users, and automatic upgrades. See [What `ready` means](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/cr-statuses.html#what-ready-means).
- **[Smart Update](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html#smart-update).** After it restarts a Pod, the Operator waits until the Pod runs the new revision and its `mongod` container is ready, for up to the liveness probe’s `initialDelaySeconds` in seconds. See [How Smart Update works](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-reconciliation.html#how-smart-update-works).
- **Database connections.** To initialize a replica set, or to rewrite its configuration when there is [no primary](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-workflows.html#replica-set-without-a-primary), the Operator connects to a ready `mongod` Pod.

## Who acts on liveness

Only the kubelet. When the liveness probe fails, the kubelet stops the container, with the termination grace period, and starts it again. After repeated restarts, the Pod goes into `CrashLoopBackOff`, and the kubelet waits longer before each next start, up to 5 minutes.

A restarted member keeps its data and host name. It rejoins the replica set and catches up from the oplog of another member. If it was down for longer than the oplog covers, it stays `RECOVERING`.

## What this means for users

The probes act on their own, and they don’t know what you are doing on the member. Keep them in mind in these situations:

- **A long initial sync.** The liveness probe tolerates an initial sync of any length. The member stays not ready until the sync completes, so it blocks node drains and the Smart Update meanwhile.
- **A member that fell too far behind.** It stays `RECOVERING`. The liveness probe passes, so Kubernetes doesn’t restart it, but it stays not ready. It blocks node drains, the start of the Pods after it, and the Smart Update until it gets a full copy of the data.
- **A network partition.** A member that loses contact with the majority becomes a secondary, which is still ready and alive. Kubernetes doesn’t restart it, and it rejoins when the network comes back.
- **A slow or stalled server.** If `mongod` doesn’t answer the liveness probe within 5 seconds, 12 times in a row, the container is restarted. Common causes are a stalled disk, CPU throttling by the container’s CPU limit, and an overloaded server. Check the Pod events for `Liveness probe failed` before you look for a crash in the `mongod` log.
- **The `clusterMonitor` user.** Every probe logs in as `clusterMonitor`. If you change its password directly in MongoDB instead of in the users Secret, drop it, or lock it, the liveness probe fails on every data-bearing member. The kubelets restart containers independently, potentially at the same time, which can make the replica set unavailable. Change system user passwords only through the Secret. See [System users](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/system-users.html).
- **Manual maintenance on a running member.** If you stop `mongod` or remove the member from the replica set, the liveness probe fails within about 2 minutes and the container restarts. To work on a member without `mongod` running, use the `sleep-forever` file. See [Avoid the restart-on-fail loop](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug-shell.html#avoid-the-restart-on-fail-loop-for-percona-server-for-mongodb-containers).
- **A Pod that stays not ready.** It blocks node drains, the start of the Pods after it, the Smart Update, and everything that waits for a `ready` cluster.

## Tune the probes

Change the probe settings in the [Custom Resource](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html#custom-resource) with the `livenessProbe` and `readinessProbe` subsections of `replsets`, `replsets.nonvoting`, `replsets.hidden`, `sharding.configsvrReplSet` and `sharding.mongos`. See [Custom Resource options](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#replsetslivenessprobefailurethreshold).

- Probe settings are part of the Pod template. Changing them restarts the Pods with your [update strategy](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-reconciliation.html#update-strategies).
- If heavy load makes the liveness probe time out, raise `livenessProbe.timeoutSeconds` or `failureThreshold` rather than turning the probe off.
- `livenessProbe.initialDelaySeconds` also limits how long the Smart Update waits for each restarted Pod. Raise it if your members need more than 90 seconds to start and become ready.

## Where to look if probes fail

- `kubectl describe pod my-cluster-name-rs0-0` shows the probe settings and, under `Events`, the `Readiness probe failed` and `Liveness probe failed` messages with the reason the tool reported.
- `kubectl get pod my-cluster-name-rs0-0` shows the restart count. If the events contain `Container mongod failed liveness probe, will be restarted`, the kubelet restarted the container; it was not a `mongod` crash.
- `kubectl get events --sort-by=.lastTimestamp | grep -i probe` lists probe failures across the cluster.
- `kubectl get endpoints my-cluster-name-rs0` shows which members are ready.
- `kubectl get pdb` shows how many disruptions each PodDisruptionBudget allows right now.
- More symptoms and the layer that owns each: [Initial troubleshooting](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug.html#where-to-look-first).

## Next steps

[Initial troubleshooting](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug.html)

## See also

- [About high availability and topology](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/ha-topology.html)
- [Exec into the containers](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug-shell.html)
- [Who owns what](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-responsibilities.html)
