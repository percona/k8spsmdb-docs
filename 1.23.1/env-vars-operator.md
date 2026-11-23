> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Configure Operator environment variables

You can configure the Percona Operator for MongoDB by setting environment variables in the Operator Deployment. This lets you tune logging, scope the namespaces that are watched, and adjust reconciliation behavior without rebuilding images.

You can set environment variables in the following ways:

- For installations via `kubectl`, edit the Operator Deployment manifest (`deploy/operator.yaml`) before applying it, or modify the existing Deployment using `kubectl patch` or `kubectl edit`.
- For Helm installations, set environment variables through Helm values.
- For installations on OpenShift, configure environment variables through the OLM subscription.

## Available environment variables

### `LOG_STRUCTURED`

Controls whether Operator logs are structured (JSON) or plain text.

| Value type | Default   | Example  |
| ---------- | --------- | -------- |
| string     | `"false"` | `"true"` |

**Example configuration:**

```
env:
  - name: LOG_STRUCTURED
    value: "true"
```

### `LOG_LEVEL`

Sets the verbosity level of Operator logs.

| Value type | Default  | Example   |
| ---------- | -------- | --------- |
| string     | `"INFO"` | `"DEBUG"` |

Valid values are:

- “DEBUG” - Most verbose, includes detailed debugging information
- “INFO” - Standard informational messages (default)
- “WARN” - Warning messages only
- “ERROR” - Error messages only

**Example configuration:**

```
env:
  - name: LOG_LEVEL
    value: "DEBUG"
```

### `WATCH_NAMESPACE`

Specifies which namespaces the Operator watches for Custom Resources.

| Value type | Default            | Example                      |
| ---------- | ------------------ | ---------------------------- |
| string     | Operator namespace | `"psmdb,psmdb-prod"` or `""` |

**Notes:**

- A comma-separated list limits the Operator to those namespaces.
- An empty string (`""`) enables cluster-wide mode (watch all namespaces).

**Example configuration for multi-namespace mode:**

```
env:
  - name: WATCH_NAMESPACE
    value: "psmdb,psmdb-prod"
```

### `DISABLE_TELEMETRY`

Disables telemetry data collection.

| Value type | Default   | Example  |
| ---------- | --------- | -------- |
| string     | `"false"` | `"true"` |

**Example configuration:**

```
env:
  - name: DISABLE_TELEMETRY
    value: "true"
```

### `RECONCILE_INTERVAL`

Controls how long the Operator waits before re-queuing reconciliation for a cluster after a reconcile loop completes (available since Operator 1.23.0). It doesn’t apply to backups and restores. For them, use [`BACKUP_RECONCILE_INTERVAL`](#backup_reconcile_interval) and [`RESTORE_RECONCILE_INTERVAL`](#restore_reconcile_interval).

| Value type      | Default | Example           |
| --------------- | ------- | ----------------- |
| duration string | `"5s"`  | `"30s"` or `"1m"` |

**Notes:**

- The value must be a Go duration string (for example, `30s`, `1m`, `5m`).
- The minimum allowed value is `5s`. Values below `5s`, zero, negative, or unparseable values fall back to `5s`. The Operator logs a message when it rejects a value.
- Increasing the interval reduces the number of Kubernetes API requests the Operator generates. The default of `5s` can produce a high request rate in large deployments.

**Example configuration:**

```
env:
  - name: RECONCILE_INTERVAL
    value: "30s"
```

### `BACKUP_RECONCILE_INTERVAL`

Controls how often the Operator rechecks a backup that is still in progress: waiting, running or being canceled. Finished backups aren’t rechecked. Available starting with version 1.24.0.

| Value type      | Default | Example           |
| --------------- | ------- | ----------------- |
| duration string | `"5s"`  | `"30s"` or `"1m"` |

**Notes:**

- The value must be a Go duration string (for example, `30s`, `1m`, `5m`). Other values fall back to `5s`, and the Operator logs a message.
- A longer interval reduces the Kubernetes API and PBM status requests for running backups. The Backup status then updates later, up to one interval after the change.

**Example configuration:**

```
env:
  - name: BACKUP_RECONCILE_INTERVAL
    value: "30s"
```

### `RESTORE_RECONCILE_INTERVAL`

Controls how often the Operator rechecks a restore that is still in progress. Finished restores aren’t rechecked. Available starting with version 1.24.0.

| Value type      | Default | Example           |
| --------------- | ------- | ----------------- |
| duration string | `"5s"`  | `"30s"` or `"1m"` |

**Notes:**

- The value must be a Go duration string (for example, `30s`, `1m`, `5m`). Other values fall back to `5s`, and the Operator logs a message.
- A restore goes through several steps, and the Operator moves to the next one only on a recheck. A longer interval can make restores take noticeably longer.

**Example configuration:**

```
env:
  - name: RESTORE_RECONCILE_INTERVAL
    value: "30s"
```

### `MAX_CONCURRENT_RECONCILES`

Controls the maximum number of concurrent reconciliation operations.

| Value type | Default | Example |
| ---------- | ------- | ------- |
| string     | `"1"`   | `"3"`   |

**Example configuration:**

```
env:
  - name: MAX_CONCURRENT_RECONCILES
    value: "3"
```

### `CERTMANAGER_NAMESPACE`

Specifies the namespace where the Operator creates the intermediate CA `Certificate` when [`tls.issuerConf.kind`](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#tlsissuerconfkind) is `ClusterIssuer` and the Operator manages the CA chain.

| Value type | Default        | Example           |
| ---------- | -------------- | ----------------- |
| string     | `cert-manager` | `my-cert-manager` |

**Notes:**

- This variable applies only when the Operator creates cert-manager resources for a `ClusterIssuer`-based CA chain. It does not affect database Pods or TLS Secrets, which remain in the database namespace.
- Change this value only if cert-manager is installed in a non-default namespace.
- When you use an existing organizational `ClusterIssuer`, you typically do not need to change this variable. See [Use an existing ClusterIssuer](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/tls-cert-manager.html#use-an-existing-clusterissuer).

**Example configuration:**

```
env:
  - name: CERTMANAGER_NAMESPACE
    value: "cert-manager"
```

## Automatic environment variables

The following values are set by Kubernetes or the deployment manifest and should not be changed:

- `POD_NAME` - Set from `metadata.name`.
- `OPERATOR_NAME` - Set to `percona-server-mongodb-operator`.

## Update environment variables

### Using `kubectl patch`

To update environment variables and keep the existing ones, use the full `env` list in your patch:

```
kubectl patch deployment percona-server-mongodb-operator \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"percona-server-mongodb-operator","env":[
    {"name":"POD_NAME","valueFrom":{"fieldRef":{"fieldPath":"metadata.name"}}},
    {"name":"OPERATOR_NAME","value":"percona-server-mongodb-operator"},
    {"name":"LOG_LEVEL","value":"DEBUG"}
  ]}}]}}}'
```

### Using `kubectl edit`

```
kubectl edit deployment percona-server-mongodb-operator
```

Then update the `env` section in the container specification.
