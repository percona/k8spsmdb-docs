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

**Example 3. View the TLS Secrets readiness condition:**

```bash
kubectl get psmdb <cluster-name> -n <namespace> \
  -o jsonpath='{range .status.conditions[?(@.type=="TLSSecretsReady")]}{.lastTransitionTime}{"\n"}{.reason}{"\n"}{.status}{"\n"}{.message}{"\n"}{end}'
```

??? example "Sample output"

    ```{.text .no-copy}
    2026-06-10T14:22:01Z
    TLSSecretNotFound
    False
    TLS secret my-cluster-name-ssl is missing, certManagementPolicy is userProvidedOnly
    ```

## PerconaServerMongoDB status

The main cluster state is recorded in the `status.state` section. For component-level states, see the [`status.replsets` and `status.mongos`](#replica-set-and-mongos-status) and [`status.search`](#vector-search-status) sections.

Common fields:

- `status.state` – overall cluster state
- `status.ready` / `status.size` – number of ready pods and the size of the database cluster
- `status.host` – connection endpoint
- `status.mongoVersion` / `status.mongoImage` – Percona Server for MongoDB version and image of the cluster. When you change the image in the Custom Resource, the Operator updates these fields after all Pods run the new image and the cluster is `ready`. With [automatic upgrades](update-minor-automatic.md), the Operator sets them to the target version as soon as it starts the upgrade, so check `status.state` and the Pod images instead to confirm the upgrade finished
- `status.backupVersion` / `status.backupImage` – Percona Backup for MongoDB (PBM) version and image. The Operator sets these fields when backups are enabled, after a ready Pod runs `spec.backup.image`. When you change the backup image, the Operator updates these fields after a Pod runs the new image. With [automatic upgrades](update-minor-automatic.md), the Operator sets `status.backupVersion` to the target version as soon as it starts the upgrade. `status.backupImage` updates only after a Pod runs the new image, so check the Pod images to confirm the backup image change finished
- `status.conditions` – detailed condition list with reason and message
- `status.search` – vector search (`mongot`) readiness per replica set or shard. Available when search is enabled.
- `status.storageAutoscaling` – storage size, resize history, and the last error for each PVC. Available when automatic storage resizing is enabled. See [Automatic storage resizing](scaling-storage-resize.md#automatic-storage-resizing) for more information about this feature.
- `status.vaultLastRequestedAt` – time of the last system user credential read from HashiCorp Vault. The Operator sets this field only when [`spec.vault.requestInterval`](operator.md#vaultrequestinterval) is set.

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

When [vector search is enabled](operator.md#searchenabled), the cluster is not marked `ready` until every entry in `status.search` is also `ready`.

### Replica set and mongos status

The Operator reports the state of each replica set in `status.replsets.<rs-name>`. In a sharded cluster, this includes the config server replica set (`cfg`). The Operator reports the state of `mongos` Pods in `status.mongos`.

Common fields under `status.replsets.<rs-name>` and `status.mongos`:

- `size` – desired number of Pods
- `ready` – number of Pods with all containers ready
- `status` – component state. The states are: `initializing`, `ready`, `paused`, `stopping`, `error`
- `message` – optional human-readable details. For example, the reason a container is waiting to start, or why a Pod can't be scheduled

Fields available only under `status.replsets.<rs-name>`:

- `initialized` – `true` after the Operator initiates the replica set
- `added_as_shard` – `true` after the Operator adds the replica set to the sharded cluster as a shard. Available only for shard replica sets in a sharded cluster. The config server replica set doesn't have this field
- `members` – replica set members, keyed by Pod name. Each member has the following fields:

    - `name` – member host and port
    - `state` – member state as a number
    - `stateStr` – member state as a string, for example `PRIMARY` or `SECONDARY`

The `state` and `stateStr` values come from the [`rs.status()` :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/command/replSetGetStatus/) output of MongoDB. See [Replica set member states :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/replica-states/) in MongoDB documentation for the full list. The Operator refreshes `members` during reconciliation, so after a failover the new primary appears in the status within a few seconds.

**Example. View replica set and mongos status:**

```bash
kubectl get psmdb <cluster-name> -n <namespace> -o yaml
```

??? example "Sample output for a sharded cluster"

    ```{.yaml .no-copy}
    status:
      ...
      mongos:
        ready: 3
        size: 3
        status: ready
      ...
      replsets:
        cfg:
          initialized: true
          members:
            my-cluster-name-cfg-0:
              name: my-cluster-name-cfg-0.my-cluster-name-cfg.psmdb.svc.cluster.local:27017
              state: 1
              stateStr: PRIMARY
            my-cluster-name-cfg-1:
              name: my-cluster-name-cfg-1.my-cluster-name-cfg.psmdb.svc.cluster.local:27017
              state: 2
              stateStr: SECONDARY
            my-cluster-name-cfg-2:
              name: my-cluster-name-cfg-2.my-cluster-name-cfg.psmdb.svc.cluster.local:27017
              state: 2
              stateStr: SECONDARY
          ready: 3
          size: 3
          status: ready
        rs0:
          added_as_shard: true
          initialized: true
          members:
            my-cluster-name-rs0-0:
              name: my-cluster-name-rs0-0.my-cluster-name-rs0.psmdb.svc.cluster.local:27017
              state: 1
              stateStr: PRIMARY
            my-cluster-name-rs0-1:
              name: my-cluster-name-rs0-1.my-cluster-name-rs0.psmdb.svc.cluster.local:27017
              state: 2
              stateStr: SECONDARY
            my-cluster-name-rs0-2:
              name: my-cluster-name-rs0-2.my-cluster-name-rs0.psmdb.svc.cluster.local:27017
              state: 2
              stateStr: SECONDARY
          ready: 3
          size: 3
          status: ready
    ```

To find the current primary of a replica set, query the `members` field:

```bash
kubectl get psmdb <cluster-name> -n <namespace> \
  -o jsonpath='{range .status.replsets.rs0.members.*}{.name}{"\t"}{.stateStr}{"\n"}{end}'
```

??? example "Sample output"

    ```{.text .no-copy}
    my-cluster-name-rs0-0.my-cluster-name-rs0.psmdb.svc.cluster.local:27017	SECONDARY
    my-cluster-name-rs0-1.my-cluster-name-rs0.psmdb.svc.cluster.local:27017	PRIMARY
    my-cluster-name-rs0-2.my-cluster-name-rs0.psmdb.svc.cluster.local:27017	SECONDARY
    ```

### Vector search status

!!! note "Version added: [1.23.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.23.0.md)"

If [`spec.search.enabled`](operator.md#searchenabled) is set to `true`, the Operator shows the search status in the `status.search` field. This field lists the status of each replica set or shard in the sharded cluster, except for the config server replica set. If search is turned off, `status.search` is cleared.

Common fields under `status.search.<rs-name>`:

- `size` – desired number of `mongot` pods for that replica set or shard
- `ready` – number of ready `mongot` pods
- `status` – search state. The states are: `initializing`, `ready`, `paused`, `stopping`, `error`
- `message` – optional human-readable details

**Example. View vector search status:**

```bash
kubectl get psmdb <cluster-name> -n <namespace> \
  -o jsonpath='{.status.search}' && echo
```

??? example "Sample output"

    ```{.json .no-copy}
    {"rs0":{"size":1,"ready":1,"status":"ready"}}
    ```

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
| `TLSSecretsReady` | TLS Secrets referenced in the Custom Resource exist and are available to the Operator. Available since Operator 1.23.0. |
| `ImageUpgradeInProgress` | An image change is still in progress, or it has finished and the cluster is not `ready` yet. |

`status.conditions[].status` values:

| Value | Meaning |
| --- | --- |
| `True` | The condition is currently true. |
| `False` | The condition is currently false. |

The Operator sets `reason` and `message` values as free-form strings. Common reasons include `ErrorReconcile`, `RSReady`, `RSStopping`, `RSPaused`, `MongosReady`, `MongosStopping`, `MongosPaused`, `PBMConfigurationIsUpToDate`, `PBMConfigurationIsChanged`, `TLSSecretNotFound`, `ImageUpgrade`.

When `ImageUpgradeInProgress` is `True`, `reason` is `ImageUpgrade`. While a container still differs from the StatefulSet template, `message` names the containers that are changing, including init containers and containers the template adds that are not on the Pod yet. For example: `Image upgrade is in progress for container(s) mongod, backup-agent`. After every container matches, the message changes to `Image upgrade is waiting for the cluster to be ready`. The Operator removes the condition when `status.state` is `ready`.

## PerconaServerMongoDBBackup status

Backup progress and results are in `status.state`. You also get destination and timing details that help you validate backups and Point-in-time recovery time ranges.

Common fields:

- `status.state` – backup job state
- `status.type` – backup type (`logical`, `physical`, `incremental`, `incremental-base`, `external`)
- `status.snapshots` – for `external` backups, list of `VolumeSnapshot` names per replica set (`replsetName`, `snapshotName`)
- `status.destination` – backup path or URL
- `status.size` – backup size
- `status.start` / `status.completed` – start and completion timestamps
- `status.latestRestorableTime` – latest point for point-in-time recovery from this backup
- `status.error` – error details when the backup fails
- `status.pbmPods` – nodes that PBM used for the backup, keyed by replica set name. Each value is the host and port of a `mongod` node. The first part of the hostname is the Pod name, for example `my-cluster-name-rs0-2` in `my-cluster-name-rs0-2.my-cluster-name-rs0.<namespace>.svc.cluster.local:27017`. Use it to find the Pod whose `backup-agent` logs to check.

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
- `status.conditions` – restore progress for PVC snapshot restores. See [PVC snapshot restore conditions](#pvc-snapshot-restore-conditions)

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


### PVC snapshot restore conditions

For restores from PVC snapshot backups, the Operator sets `status.conditions` as each phase completes. These conditions appear only for snapshot restores of the type `external`. Use them with `status.state` to see where a long-running restore is stuck.

Each condition uses the standard Kubernetes fields (`type`, `status`, `reason`, `message`, `lastTransitionTime`). When a phase succeeds, the Operator sets the matching condition to `status: "True"`.

| Condition | Meaning |
| --- | --- |
| `PBMAgentConfiguredForSnapshot` | Database StatefulSets are scaled to zero. Pods are configured to run `pbm-agent restore-finish` with the PBM config, replica set name, node name, and (if needed) encryption-related MongoDB config. |
| `ReplsetPVCsRestoredFromSnapshot` | All data PVCs are recreated from the `VolumeSnapshot` objects in the backup or in `backupSource.snapshots`. PVCs are rolled out one at a time. |
| `PBMAgentAwaitingRestoreFinish` | StatefulSets are scaled back up. `pbm-agent` processes on every node are running and waiting at PBM **`copyReady`** for the restore to finish. |
| `PBMRestoreFinishing` | The Operator started `pbm restore-finish` to apply backup metadata. |
| `PBMRestoreFinished` | PBM completed the external restore. The Operator can clean up temporary restore configuration. |

Example: list restore conditions:

```bash
kubectl get psmdb-restore <restore-name> -n <namespace> \
  -o jsonpath='{range .status.conditions[*]}{.type}{"\t"}{.status}{"\t"}{.reason}{"\n"}{end}'
```

For the full restore workflow, see [PVC snapshot backups — Restore flow](backups-pvc-snapshots.md#restore-flow).

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
