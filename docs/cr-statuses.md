# Custom resource statuses

Status fields show the current state of a Custom Resource (CR). The Operator sets these fields in the `.status` section of a Custom Resource. You do not edit the status.

Use status values to confirm progress, detect failures, and decide when it is safe to run the next action (for example, start a restore after a backup is ready).

## How to view custom resource statuses

To check the status of your Percona custom resources, use the `kubectl get <resource-name>` or `kubectl describe <resource-name>` commands. See how to use them to get the quick overview, in-depth details and targeted queries.

### Get a quick overview

List your resources and check their high-level STATUS:

```bash
kubectl get psmdb -n <namespace>
kubectl get psmdb-backup -n <namespace>
kubectl get psmdb-restore -n <namespace>
kubectl get psmdb-clustersync -n <namespace>
```

??? example "Sample output for PerconaServerMongoDB"

    ```{.text .no-copy}
    NAME        ENDPOINT                  STATUS   AGE
    some-name   some-name-mongos.pitr-physical-backup-source-29217.svc.cluster.local:27017   ready    27m
    ```

### View full details

See all status details as well as conditions and events:

```bash
kubectl get psmdb <cluster-name> -n <namespace> -o yaml
kubectl describe psmdb <cluster-name> -n <namespace>
```

Check for the `.status` field in the output to find the current state, readiness, messages, and conditions.

### Query a status field directly

You can extract specific status fields using `jsonpath`.

**Example 1. View the status of the PBM configuration:**

```bash
kubectl get psmdb <cluster-name> -n <namespace> \
  -o jsonpath='{range .items[0].status.conditions[?(@.type=="PBMReady")]}{.lastTransitionTime}{"\n"}{.reason}{"\n"}{.status}{"\n"}{.type}{"\n"}{end}'
```

??? example "Sample output"

    ```{.text .no-copy}
    2026-01-27T11:34:35Z
    PBMConfigurationIsUpToDate
    True
    PBMReady
    ```

**Example 2. Get the latest restorable backup time:**

```bash
kubectl get psmdb-backup <backup-name> -n <namespace> \
  -o jsonpath='{.items[0].status.latestRestorableTime}'
```

??? example "Sample output"

    ```{.text .no-copy}
    2026-01-27T12:22:17Z
    ```

## PerconaServerMongoDB status

The main cluster state is recorded in the `status.state` section. For component-level states, see the `status.replsets` and `status.mongos` sections.

Common fields:

- `status.state` – overall cluster state
- `status.ready` / `status.size` – number of ready pods and the size of the database cluster
- `status.host` – connection endpoint
- `status.conditions` – detailed condition list with reason and message

### Cluster state values

`status.state` values are:

| Value | Meaning |
| --- | --- |
| `""` | The Operator has not set a state yet. |
| `initializing` | The Operator is creating or reconciling the cluster. |
| `stopping` | The Operator is stopping or scaling down cluster components. |
| `paused` | The cluster is paused. |
| `ready` | The cluster is up and healthy. |
| `error` | The Operator detected an error; check conditions and events. |

### Conditions 

Conditions show more detail about cluster state changes. You can see them in `status.conditions[]`.

Common condition fields:

- `type` – condition type
- `status` – condition status
- `reason` – short reason string
- `message` – human-readable details

`status.conditions[].type` values:

| Value | Meaning |
| --- | --- |
| `initializing` | The cluster or a component is starting up. |
| `stopping` | The cluster or a component is stopping. |
| `paused` | The cluster or a component is paused. |
| `ready` | The cluster or a component is ready. |
| `error` | The Operator detected an error. |
| `sharding` | Sharding changes are in progress. |
| `PBMReady` | PBM agents and storage are ready. |
| `pendingSmartUpdate` | A smart update is pending but has not started. |

`status.conditions[].status` values:

| Value | Meaning |
| --- | --- |
| `True` | The condition is currently true. |
| `False` | The condition is currently false. |

The Operator sets `reason` and `message` values as free-form strings. Common reasons include `ErrorReconcile`, `RSReady`, `RSStopping`, `RSPaused`, `MongosReady`, `MongosStopping`, `MongosPaused`, `PBMConfigurationIsUpToDate`, `PBMConfigurationIsChanged`.

## PerconaServerMongoDBBackup status

Backup progress and results are in `status.state`. You also get destination and timing details that help you validate backups and Point-in-time recovery time ranges.

Common fields:

- `status.state` – backup job state
- `status.type` – backup type (`logical`, `physical`, `incremental`, `incremental-base`)
- `status.destination` – backup path or URL
- `status.size` – backup size
- `status.start` / `status.completed` – start and completion timestamps
- `status.latestRestorableTime` – latest point for point-in-time recovery from this backup
- `status.error` – error details when the backup fails

### Backup state values

`status.state` values are:

| Value | Meaning |
| --- | --- |
| `""` | Backup is created but not processed yet. |
| `waiting` | Backup is queued or waiting for resources. |
| `requested` | The Operator accepted the backup request. |
| `running` | Backup is in progress. |
| `ready` | Backup completed successfully. |
| `error` | Backup failed. |

## PerconaServerMongoDBRestore status

Restore progress and results are in `status.state`. Use these fields to confirm when a restore starts, finishes, or fails.

Common fields:

- `status.state` – restore job state
- `status.pbmName` – PBM restore identifier
- `status.pitrTarget` – PITR target time (if set)
- `status.completed` – completion timestamp
- `status.error` – error details when the restore is in the `error` state

### Restore state values

`status.state` values are:

| Value | Meaning |
| --- | --- |
| `""` | Restore is created but not processed yet. |
| `waiting` | Restore is queued or waiting for resources. |
| `requested` | The Operator accepted the restore request. |
| `rejected` | The Operator rejected the restore request. |
| `running` | Restore is in progress. |
| `ready` | Restore completed successfully. |
| `error` | The restore cannot proceed yet. Check `status.error`, fix the Restore CR if needed, and wait for the Operator to reconcile again. |

### `error` vs `failed`

The Restore Custom Resource uses `error`, not `failed`.

* **`error`** – Recoverable. The Operator sets this state when restore field validation fails (for example, missing `clusterName`, missing both `backupName` and `backupSource`, invalid `backupSource` storage settings, invalid PITR settings, or using `selective.nsFrom` / `selective.nsTo` with a non-logical backup). The Operator keeps reconciling the Restore object, so you can correct the CR and unblock the restore without creating a new one. The same state is also used when a restore operation itself fails; check `status.error` for details.
* **`failed`** – Not used for restores. On other resources (for example, [PerconaServerMongoDBClusterSync](#perconaservermongodbclustersync-status)), `failed` is a terminal failure: the Operator does not treat it as a fix-and-retry path, and you typically need a new object or an explicit recovery action.

When a restore is in `error`, inspect the message:

```bash
kubectl get psmdb-restore <restore-name> -n <namespace> \
  -o jsonpath='{.status.state}{"\n"}{.status.error}{"\n"}'
```

Fix the Restore CR (for example, add the missing field or correct `backupSource`), then confirm that `status.state` moves out of `error` after the next reconcile.

## PerconaServerMongoDBClusterSync status

Percona ClusterSync for MongoDB (PCSM) progress and results are on the `PerconaServerMongoDBClusterSync` Custom Resource. Use these fields to track replication intent, runtime state, lag, and failures.

`spec.mode` is your lifecycle intent. `status.state` is what PCSM is doing. For configuration options, see [ClusterSync Resource options](clustersync-options.md). For concepts, see [Real-time replication with PCSM](clustersync.md).

Common fields:

- `status.mode` – last lifecycle intent the Operator successfully applied (`running`, `paused`, `finalized`)
- `status.state` – PCSM-reported runtime state
- `status.lagTimeSeconds` – replication lag in seconds
- `status.error` – error details from PCSM or the Operator (for example, missing Secret or cluster busy)
- `status.startedAt` – timestamp of the first time PCSM reported `running`
- `status.conditions` – condition list with reason and message

### ClusterSync mode values

`status.mode` mirrors `spec.mode` after the Operator applies the matching PCSM command:

| Value | Meaning |
| --- | --- |
| `running` | The Operator started or resumed replication. |
| `paused` | The Operator paused replication. |
| `finalized` | The Operator finalized replication. Further `spec.mode` changes are ignored. |

### ClusterSync state values

`status.state` values are:

| Value | Meaning |
| --- | --- |
| `idle` | PCSM is deployed but has not started replication yet. |
| `running` | PCSM is performing initial sync or real-time replication. PCSM does not distinguish these phases in this field. Use `lagTimeSeconds` to judge catch-up. |
| `paused` | Replication is paused. |
| `finalizing` | PCSM is completing finalization. |
| `finalized` | Replication is complete. Indexes are finalized and the cluster lease is released. |
| `failed` | Replication failed. Check `status.error`. When `spec.mode` is `running`, the Operator retries recoverable failures with `pcsm resume --from-failure`. |

### Conditions

Conditions show more detail about ClusterSync state changes in `status.conditions[]`.

`status.conditions[].type` values:

| Value | Meaning |
| --- | --- |
| `Running` | `True` while `status.state` is `running`; otherwise `False` with reason such as `PCSMNotRunning`. |
| `Finalized` | `True` once `status.state` is `finalized`. Remains set afterwards. |

### Example status

```yaml
status:
  mode: running
  state: running
  lagTimeSeconds: 72
  startedAt: "2026-07-01T12:00:00Z"
  conditions:
    - type: Running
      status: "True"
      reason: PCSMReplicating
      message: PCSM is applying changes from source
```

On failure:

```yaml
status:
  mode: running
  state: failed
  error: "clone: copy: mydb.mycoll: connection refused"
  conditions:
    - type: Running
      status: "False"
      reason: PCSMNotRunning
```
