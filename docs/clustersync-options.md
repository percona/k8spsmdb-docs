# ClusterSync Resource options

A ClusterSync resource is a Kubernetes object that tells the Operator how to deploy and manage [Percona ClusterSync for MongoDB (PCSM) :octicons-link-external-16:](https://docs.percona.com/percona-clustersync-for-mongodb/). The `deploy/clustersync.yaml` file is a template for creating the `PerconaServerMongoDBClusterSync` resource.

This document describes the options you can use to configure ClusterSync. For concepts and limitations, see [Real-time replication with PCSM](clustersync.md). For a hands-on walkthrough, see [Set up and use PCSM](clustersync-setup.md).

## `apiVersion`

Specifies the API version of the Custom Resource.
`psmdb.percona.com` indicates the group, and `v1` is the version of the API.

## `kind`

Defines the type of resource being created: `PerconaServerMongoDBClusterSync`.

## `metadata`

The metadata part of the ClusterSync manifest contains metadata about the resource, such as its name and other attributes. It includes the following keys:

* `name` - The name of the ClusterSync object. The Operator uses this name for owned resources such as the PCSM Deployment (`<name>-pcsm`) and related Secrets.

## `spec`

This section includes the configuration of a ClusterSync resource.

### `clusterName`

Specifies the name of the target `PerconaServerMongoDB` cluster in the same namespace. The Operator builds the target connection URI from this cluster.

| Value type | Example |
| ---------- | ------- |
| :material-code-string: string | `my-target-cluster` |

### `image`

Specifies the Percona ClusterSync for MongoDB container image. Required.

| Value type | Example |
| ---------- | ------- |
| :material-code-string: string | `percona/percona-clustersync-mongodb:{{clustersync}}` |

### `mode`

Controls the replication lifecycle. The Operator compares `spec.mode` with `status.mode` and runs the matching PCSM command when they differ.

Allowed values:

* `running` - Start or resume replication. This is the default.
* `paused` - Pause an active replication channel.
* `finalized` - Finalize replication, create required indexes on the target, and stop. 

| Value type | Example |
| ---------- | ------- |
| :material-code-string: string | `running` |

## The `source` subsection

Defines how PCSM connects to the source MongoDB cluster. You manage the source.

### `source.uri`

Specifies the source MongoDB connection string **without credentials**. Include replica set options, TLS parameters, and other driver options in the URI query string as needed.

For replica sets, use replica set members and `replicaSet`. For sharded clusters, use the `mongos` endpoint.

| Value type | Example |
| ---------- | ------- |
| :material-code-string: string | `mongodb://host1:27017,host2:27017/admin?replicaSet=rs0` |

### `source.credentialsSecret`

Specifies the name of a Kubernetes Secret in the same namespace with `username` and `password` keys for the pcsm user on source. The Operator percent-encodes these values and injects them into the source URI at runtime.

| Value type | Example |
| ---------- | ------- |
| :material-code-string: string | `my-cluster-sync-source` |

### `excludeNamespaces`

Lists MongoDB namespaces to exclude from replication. A namespace is `db` or `db.collection`. These values are passed to PCSM on `pcsm start` only. Changes after start do not re-filter an already running sync.

| Value type | Example |
| ---------- | ------- |
| :material-text-long: array | `["admin", "local", "app.cache"]` |

## The `pcsmConfig` subsection

Controls PCSM process logging.

### `pcsmConfig.logLevel`

Sets the PCSM log level. Allowed values: `debug`, `info`, `warn`, `error`.

| Value type | Example |
| ---------- | ------- |
| :material-code-string: string | `info` |

## Pod and scheduling options

These options configure the PCSM Deployment Pod the same way as other Operator-managed workloads.

### `resources`

Specifies CPU and memory requests and limits for the PCSM container.

| Value type | Example |
| ---------- | ------- |
| :material-code-string: object | `requests: {cpu: 500m, memory: 512Mi}` |

