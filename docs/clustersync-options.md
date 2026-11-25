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

### `size`

The number of PCSM instances. With `1`, PCSM runs as a single instance. With `2` or more, the instances form an active/standby group: one replicates, and the others take over if it fails. See [High availability](clustersync.md#high-availability). Available starting with version 1.24.0.

| Value type | Example |
| ---------- | ------- |
| :material-numeric-1-box: int | `2` |

### `imagePullPolicy`

The [policy used to update the PCSM image :octicons-link-external-16:](https://kubernetes.io/docs/concepts/containers/images/#updating-images).

| Value type | Example |
| ---------- | ------- |
| :material-code-string: string | `Always` |

### `imagePullSecrets`

The [Kubernetes imagePullSecrets :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/#using-imagepullsecrets) for a private registry.

| Value type | Example |
| ---------- | ------- |
| :material-text-long: array | `[{name: my-registry-secret}]` |

### `env`

Environment variables for the PCSM container. Use them for PCSM settings that have no option in the ClusterSync resource, for example `PCSM_HA_LEASE_TTL`. See the list of [available environment variables :octicons-link-external-16:](https://docs.percona.com/percona-clustersync-for-mongodb/install/parameters.html#environment-variables).

The Operator sets `PCSM_SOURCE_URI`, `PCSM_TARGET_URI` and `PCSM_GROUP_NAME` itself and ignores them here.

| Value type | Example |
| ---------- | ------- |
| :material-text-long: array | `[{name: PCSM_HA_LEASE_TTL, value: "30s"}]` |

## The `source` subsection

Defines how PCSM connects to the source MongoDB cluster. You manage the source.

### `source.uri`

Specifies the source MongoDB connection string **without credentials**. Include replica set options, TLS parameters, and other driver options in the URI query string as needed. TLS options here apply only to the source. The Operator sets up TLS to the target cluster for you. See [TLS connections](clustersync.md#tls-connections).

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

### `pcsmConfig.logJSON`

Writes PCSM logs in JSON format.

| Value type | Example |
| ---------- | ------- |
| :material-toggle-switch-outline: boolean | `true` |

## Pod and scheduling options

These options configure the PCSM Deployment Pod the same way as other Operator-managed workloads.

### `resources`

Specifies CPU and memory requests and limits for the PCSM container.

| Value type | Example |
| ---------- | ------- |
| :material-code-string: object | `requests: {cpu: 500m, memory: 512Mi}` |

### `nodeSelector`

[Kubernetes nodeSelector :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#nodeselector) for the PCSM Pods.

| Value type | Example |
| ---------- | ------- |
| :material-label-outline: label | `disktype: ssd` |

### `tolerations`

[Kubernetes Pod tolerations :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/) for the PCSM Pods.

| Value type | Example |
| ---------- | ------- |
| :material-text-long: array | `[{key: node.alpha.kubernetes.io/unreachable, operator: Exists, effect: NoExecute}]` |

### `affinity.antiAffinityTopologyKey`

The topology key for [Pod anti-affinity :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#affinity-and-anti-affinity) between PCSM Pods. When you set it, PCSM Pods must run in different topology domains. Set `none` to turn anti-affinity off.

If you leave `affinity` unset and the target cluster's `crVersion` is 1.24.0 or later, the Operator prefers to place PCSM Pods on different nodes, but still schedules them on one node if no other node fits.

| Value type | Example |
| ---------- | ------- |
| :material-code-string: string | `kubernetes.io/hostname` |

### `affinity.advanced`

A full [Kubernetes affinity :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#affinity-and-anti-affinity) definition. It replaces `affinity.antiAffinityTopologyKey`.

| Value type | Example |
| ---------- | ------- |
| :material-text-long: subdoc | |

### `podDisruptionBudget.maxUnavailable`

The maximum number of PCSM Pods that can be unavailable during a voluntary disruption, such as a node drain. The Operator creates the PodDisruptionBudget only when `size` is `2` or more. The default is `1`.

| Value type | Example |
| ---------- | ------- |
| :material-numeric-1-box: int | `1` |

### `podDisruptionBudget.minAvailable`

The minimum number of PCSM Pods that must stay available during a voluntary disruption. Use it instead of `podDisruptionBudget.maxUnavailable`.

| Value type | Example |
| ---------- | ------- |
| :material-numeric-1-box: int | `1` |

### `annotations`

[Kubernetes annotations :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) for the PCSM Pods.

| Value type | Example |
| ---------- | ------- |
| :material-label-outline: label | `example.com/team: data` |

### `labels`

[Kubernetes labels :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) for the PCSM Pods.

| Value type | Example |
| ---------- | ------- |
| :material-label-outline: label | `team: data` |

### `runtimeClassName`

The [runtime class :octicons-link-external-16:](https://kubernetes.io/docs/concepts/containers/runtime-class/) for the PCSM Pods.

| Value type | Example |
| ---------- | ------- |
| :material-code-string: string | `image-rc` |

### `containerSecurityContext`

The [security context :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) of the PCSM container. If you set `readOnlyRootFilesystem: true` and the target cluster uses TLS, the Operator mounts a writable `/tmp` volume for the TLS files.

| Value type | Example |
| ---------- | ------- |
| :material-text-long: subdoc | `readOnlyRootFilesystem: true` |

### `podSecurityContext`

The [security context :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) of the PCSM Pods.

| Value type | Example |
| ---------- | ------- |
| :material-text-long: subdoc | `runAsNonRoot: true` |

### `livenessProbe`

A [liveness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) that replaces the default. The default probe queries the PCSM HTTP endpoint on port `2242` every 10 seconds. When the target cluster's `crVersion` is 1.24.0 or later, it uses `/metrics`, which both active and standby instances answer. Earlier versions use `/status`.

| Value type | Example |
| ---------- | ------- |
| :material-text-long: subdoc | |

### `readinessProbe`

A [readiness probe :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) that replaces the default. It uses the same endpoint as the default liveness probe.

| Value type | Example |
| ---------- | ------- |
| :material-text-long: subdoc | |
