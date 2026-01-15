# Cluster component environment variables

The Operator sets specific environment variables on cluster components to pass service metadata, authentication details, and integration settings. Use this page as a reference for what is injected by default. If you want to add your own variables, see [Define custom environment variables](env-vars-custom.md).

## MongoDB (`mongod`) containers

These variables are injected into every MongoDB container (replica sets and config servers):

| Variable | Purpose |
| --- | --- |
| `SERVICE_NAME` | Cluster name. |
| `NAMESPACE` | Kubernetes namespace of the cluster. |
| `MONGODB_PORT` | Port of the `mongod` process. |
| `MONGODB_REPLSET` | Replica set name. |
| `LOGCOLLECTOR_ENABLED` | `"true"` when [log collector is enabled](debug-logs.md#configure-log-collector). |

## `mongos` containers (sharding)

| Variable | Purpose |
| --- | --- |
| `MONGODB_PORT` | Port of the `mongos` process. |

## Backup agent sidecar (PBM)

These variables are injected into the PBM backup agent sidecar:

| Variable | Purpose |
| --- | --- |
| `PBM_AGENT_MONGODB_USERNAME` | Backup user name (from Secret). |
| `PBM_AGENT_MONGODB_PASSWORD` | Backup user password (from Secret). |
| `PBM_MONGODB_REPLSET` | Replica set name. |
| `PBM_MONGODB_PORT` | MongoDB port. |
| `PBM_AGENT_SIDECAR` | Marks the container as a sidecar. |
| `PBM_AGENT_SIDECAR_SLEEP` | Sidecar retry delay (seconds). |
| `SHARDED` | Set to `"TRUE"` when sharding is enabled. |
| `POD_NAME` | Pod name (from `metadata.name`). |
| `PBM_MONGODB_URI` | MongoDB connection string URI constructed by the Operator. |
| `PBM_AGENT_TLS_ENABLED` | `"true"` when TLS is enabled. |

## Scheduled backup job

The scheduled backup job container gets the namespace so it can create backup objects:

| Variable | Purpose |
| --- | --- |
| `NAMESPACE` | Namespace where the backup is created. |

## PMM sidecar

The PMM sidecar supports two modes (PMM2 and PMM3). The Operator injects the following variables.

### PMM2

| Variable | Purpose |
| --- | --- |
| `PMM_SERVER` | PMM server address. |
| `DB_TYPE` | Database type (`mongodb`). |
| `DB_USER` | Monitoring user (from Secret). |
| `DB_PASSWORD` | Monitoring password (from Secret). |
| `DB_HOST` | MongoDB host (defaults to `localhost`). |
| `DB_CLUSTER` | Cluster name. |
| `DB_PORT` | MongoDB port. |
| `DB_PORT_MIN` | Minimum PMM agent port. |
| `DB_PORT_MAX` | Maximum PMM agent port. |
| `PMM_USER` | PMM user for custom login (optional). |
| `PMM_PASSWORD` | PMM password or API key (optional). |
| `CLUSTER_NAME` | Cluster name (or custom PMM cluster name). |
| `PMM_AGENT_PRERUN_SCRIPT` | PMM pre-run script. |
| `POD_NAME` | Pod name. |
| `POD_NAMESPASE` | Pod namespace (note the spelling). |
| `PMM_AGENT_SERVER_ADDRESS` | PMM server address. |
| `PMM_AGENT_LISTEN_PORT` | PMM agent listen port. |
| `PMM_AGENT_PORTS_MIN` | Min PMM agent port. |
| `PMM_AGENT_PORTS_MAX` | Max PMM agent port. |
| `PMM_AGENT_CONFIG_FILE` | PMM agent config path. |
| `PMM_AGENT_SERVER_INSECURE_TLS` | Allows insecure TLS. |
| `PMM_AGENT_LISTEN_ADDRESS` | PMM agent listen address. |
| `PMM_AGENT_SETUP_NODE_NAME` | Node name used by PMM. |
| `PMM_AGENT_SETUP` | Enables auto-setup. |
| `PMM_AGENT_SETUP_FORCE` | Forces auto-setup. |
| `PMM_AGENT_SETUP_NODE_TYPE` | Node type (`container`). |
| `PMM_AGENT_SETUP_METRICS_MODE` | Metrics mode (`push`). |
| `PMM_ADMIN_CUSTOM_PARAMS` | Extra `pmm-admin` parameters. |
| `PMM_AGENT_SERVER_USERNAME` | PMM server user (optional). |
| `PMM_AGENT_SERVER_PASSWORD` | PMM server password (optional). |
| `PMM_AGENT_SIDECAR` | Sidecar flag (v1.10+). |
| `PMM_AGENT_SIDECAR_SLEEP` | Sidecar delay (v1.10+). |
| `PMM_AGENT_PATHS_TEMPDIR` | Temporary dir override (v1.15+). |

### PMM3

| Variable | Purpose |
| --- | --- |
| `DB_TYPE` | Database type (`mongodb`). |
| `DB_USER` | Monitoring user (from Secret). |
| `DB_PASSWORD` | Monitoring password (from Secret). |
| `DB_HOST` | MongoDB host (defaults to `localhost`). |
| `DB_CLUSTER` | Cluster name. |
| `DB_PORT` | MongoDB port. |
| `CLUSTER_NAME` | Cluster name (or custom PMM cluster name). |
| `POD_NAME` | Pod name. |
| `POD_NAMESPACE` | Pod namespace. |
| `PMM_AGENT_SERVER_ADDRESS` | PMM server address. |
| `PMM_AGENT_SERVER_USERNAME` | PMM server username (`service_token`). |
| `PMM_AGENT_SERVER_PASSWORD` | PMM server token (from Secret). |
| `PMM_AGENT_LISTEN_PORT` | PMM agent listen port. |
| `PMM_AGENT_PORTS_MIN` | Min PMM agent port. |
| `PMM_AGENT_PORTS_MAX` | Max PMM agent port. |
| `PMM_AGENT_CONFIG_FILE` | PMM agent config path. |
| `PMM_AGENT_SERVER_INSECURE_TLS` | Allows insecure TLS. |
| `PMM_AGENT_LISTEN_ADDRESS` | PMM agent listen address. |
| `PMM_AGENT_SETUP_NODE_NAME` | Node name used by PMM. |
| `PMM_AGENT_SETUP` | Enables auto-setup. |
| `PMM_AGENT_SETUP_FORCE` | Forces auto-setup. |
| `PMM_AGENT_SETUP_NODE_TYPE` | Node type (`container`). |
| `PMM_AGENT_SETUP_METRICS_MODE` | Metrics mode (`push`). |
| `PMM_ADMIN_CUSTOM_PARAMS` | Extra `pmm-admin` parameters. |
| `PMM_AGENT_SIDECAR` | Sidecar flag. |
| `PMM_AGENT_SIDECAR_SLEEP` | Sidecar delay. |
| `PMM_AGENT_PATHS_TEMPDIR` | Temp dir for PMM agent. |
| `PMM_AGENT_PRERUN_SCRIPT` | PMM pre-run script. |

## Log collector sidecars

### Fluent Bit (`logs`)

| Variable | Purpose |
| --- | --- |
| `LOG_DATA_DIR` | Log directory location. |
| `POD_NAMESPACE` | Pod namespace. |
| `POD_NAME` | Pod name. |

### Logrotate (`logrotate`)

| Variable | Purpose |
| --- | --- |
| `MONGODB_HOST` | MongoDB host (`localhost`). |
| `MONGODB_PORT` | MongoDB port. |
| `MONGODB_USER` | Cluster admin user (from Secret). |
| `MONGODB_PASSWORD` | Cluster admin password (from Secret). |
| `LOGROTATE_SCHEDULE` | Cron schedule for log rotation (optional). |
