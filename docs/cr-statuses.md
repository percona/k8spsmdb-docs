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
| `sharding` | Sharding changes are in progress. |

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
- `status.error` – error details when the restore fails

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
| `error` | Restore failed. |
