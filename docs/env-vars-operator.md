# Configure Operator environment variables

You can configure the Percona Operator for MongoDB by setting environment variables in the Operator Deployment. This lets you tune logging, scope the namespaces that are watched, and adjust reconciliation concurrency without rebuilding images.

You can set environment variables in the following ways:

- For installations via `kubectl`, edit the Operator Deployment manifest (`deploy/operator.yaml`) before applying it, or modify the existing Deployment using `kubectl patch` or `kubectl edit`.
- For Helm installations, set environment variables through Helm values.
- For installations on OpenShift, configure environment variables through the OLM subscription.

## Available environment variables

### `LOG_STRUCTURED`

Controls whether Operator logs are structured (JSON) or plain text.

|Value type|Default|Example|
|---|---|---|
|string|`"false"`|`"true"`|

**Example configuration:**

```yaml
env:
  - name: LOG_STRUCTURED
    value: "true"
```

### `LOG_LEVEL`

Sets the verbosity level of Operator logs.

|Value type|Default|Example|
|---|---|---|
|string|`"INFO"`|`"DEBUG"`|

Valid values are:

* "DEBUG" - Most verbose, includes detailed debugging information
* "INFO" - Standard informational messages (default)
* "WARN" - Warning messages only
* "ERROR" - Error messages only

**Example configuration:**

```yaml
env:
  - name: LOG_LEVEL
    value: "DEBUG"
```

### `WATCH_NAMESPACE`

Specifies which namespaces the Operator watches for Custom Resources.

|Value type|Default|Example|
|---|---|---|
|string|Operator namespace|`"psmdb,psmdb-prod"` or `""`|

**Notes:**

- A comma-separated list limits the Operator to those namespaces.
- An empty string (`""`) enables cluster-wide mode (watch all namespaces).

**Example configuration for multi-namespace mode:**

```yaml
env:
  - name: WATCH_NAMESPACE
    value: "psmdb,psmdb-prod"
```

### `DISABLE_TELEMETRY`

Disables telemetry data collection.

|Value type|Default|Example|
|---|---|---|
|string|`"false"`|`"true"`|

**Example configuration:**

```yaml
env:
  - name: DISABLE_TELEMETRY
    value: "true"
```

### `MAX_CONCURRENT_RECONCILES`

Controls the maximum number of concurrent reconciliation operations.

|Value type|Default|Example|
|---|---|---|
|string|`"1"`|`"3"`|

**Example configuration:**

```yaml
env:
  - name: MAX_CONCURRENT_RECONCILES
    value: "3"
```

## Automatic environment variables

The following values are set by Kubernetes or the deployment manifest and should not be changed:

- `POD_NAME` - Set from `metadata.name`.
- `OPERATOR_NAME` - Set to `percona-server-mongodb-operator`.

## Update environment variables

### Using `kubectl patch`

To update environment variables and keep the existing ones, use the full `env` list in your patch:

```bash
kubectl patch deployment percona-server-mongodb-operator \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"percona-server-mongodb-operator","env":[
    {"name":"POD_NAME","valueFrom":{"fieldRef":{"fieldPath":"metadata.name"}}},
    {"name":"OPERATOR_NAME","value":"percona-server-mongodb-operator"},
    {"name":"LOG_LEVEL","value":"DEBUG"}
  ]}}]}}}'
```

### Using `kubectl edit`

```bash
kubectl edit deployment percona-server-mongodb-operator
```

Then update the `env` section in the container specification.
