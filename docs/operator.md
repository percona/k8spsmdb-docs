# Custom Resource options

The operator is configured via the spec section of the
[deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) file.

## `metadata`

The metadata part of this file contains the following keys:

* `name` (`my-cluster-name` by default) sets the name of your Percona Server
for MongoDB Cluster; it should include only [URL-compatible characters  :octicons-link-external-16:](https://datatracker.ietf.org/doc/html/rfc3986#section-2.3), not exceed 22 characters, start with an alphabetic character, and end with an alphanumeric character
* `finalizers` subsection:
    * `percona.com/delete-psmdb-pods-in-order` if present, activates the [Finalizer  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#finalizers) which controls the proper Pods deletion order in case of the cluster deletion event (on by default)
    * `percona.com/delete-psmdb-pvc` if present, activates the [Finalizer  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#finalizers) which deletes appropriate [Persistent Volume Claims  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) after the cluster deletion event (off by default)
    * `percona.com/delete-pitr-chunks` if present, activates the [Finalizer  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#finalizers) which deletes all [point-in-time recovery chunks from the cloud storage](backups-pitr.md) on cluster deletion (off by default)

## Toplevel `spec` elements

The spec part of the [deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) file contains the following keys and sections:

### `platform`

Override/set the Kubernetes platform: `kubernetes` or `openshift`.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `kubernetes` |

### `pause`

Pause/resume: setting it to `true` gracefully stops the cluster, and setting it to `false` after shut down starts the cluster back.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `false`    |

### `unmanaged`

Setting it to `true` instructs the Operator to run the cluster in unmanaged state - the Operator does not form replica sets, and does not generate TLS certificates or user credentials. This can be useful for migration scenarios and for [cross-site replication](replication.md). 

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `false`    |

### `enableVolumeExpansion`

Enables or disables [automatic storage scaling / volume expansion](scaling.md#automated-scaling-with-volume-expansion-capability).

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `false`  |

### `crVersion`

Version of the Operator the Custom Resource belongs to.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `{{ release }}` |

### `image`

The Docker image of [Percona Server for MongoDB  :octicons-link-external-16:](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/index.html) to deploy (actual image names can be found [in the list of certified images](images.md)).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `percona/percona`-`server`-`mongodb:{{ mongodb60recommended }}` |

### `imagePullPolicy`

The [policy used to update images  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/containers/images/#updating-images).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Always`   |

### `imagePullSecrets.name`

The [Kubernetes ImagePullSecret  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/#using-imagepullsecrets) to access the [custom registry](custom-registry.md).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `private`-`registry`-`credentials` |

### `initImage`

An alternative image for the initial Operator installation.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `percona/percona-server-mongodb-operator:{{ release }}` |

### `initContainerSecurityContext`

A custom [Kubernetes Security Context for a Container  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) for the initImage (image, which can be used instead of the default one while the initial Operator installation).

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc      | `{}`       |

### `ClusterServiceDNSSuffix`

The (non-standard) cluster domain to be used as a suffix of the Service name.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `svc.cluster.local` |

### `clusterServiceDNSMode`

Can be `internal` (local fully-qualified domain names will be used in replset configuration even if the replset is exposed - the default value), `external` (exposed MongoDB instances will use ClusterIP addresses, [should be applied with caution](expose.md#controlling-hostnames-in-replset-configuration)) or `ServiceMesh` (use a [special FQDN based on the Pod name](expose.md#servicemesh)). Being set, `ServiceMesh` value suprecedes multiCluster settings, and therefore these two modes cannot be combined together.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Internal` |

### `allowUnsafeConfigurations`

Prevents users from configuring a cluster with unsafe parameters: starting it with less than 3 replica set instances, with an [even number of replica set instances without additional arbiter](arbiter.md), or without TLS/SSL certificates, or running a sharded cluster with less than 3 config server Pods or less than 2 mongos Pods (if `false`, the Operator will automatically change unsafe parameters to safe defaults). *After switching to unsafe configurations permissive mode you will not be able to switch the cluster back by setting `spec.allowUnsafeConfigurations` key to `false`, the flag will be ignored*. **This option is deprecated and will be removed in future releases**. Use `unsafeFlags` subsection instead 

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `false`    |

### `updateStrategy`

A strategy the Operator uses for [upgrades](update.md). Possible values are [SmartUpdate](update.md#automated-upgrade), [RollingUpdate  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#rolling-updates) and [OnDelete  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#on-delete).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `SmartUpdate` |

### `ignoreAnnotations`

The list of annotations [to be ignored](annotations.md#annotations-ignore) by the Operator.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc      | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol` |

### `ignoreLabels`

The list of labels [to be ignored](annotations.md#annotations-ignore) by the Operator.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc      | `rack`     |

### `multiCluster.enabled`

[Multi-cluster Services (MCS)](replication-mcs.md): setting it to `true` enables [MCS cluster mode  :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine/docs/concepts/multi-cluster-services).

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `false`    |

### `multiCluster.DNSSuffix`

The cluster domain to be used as a suffix for [multi-cluster Services](replication-mcs.md) used by Kubernetes (`svc.clusterset.local` [by default  :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine/docs/how-to/multi-cluster-services)).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `svc.clusterset.local` |

## <a name="operator-unsafeflags-section"></a>Unsafe flags section

The `unsafeFlags` section in the [deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) file contains various configuration options to prevent users from configuring a cluster with unsafe parameters. *After switching to unsafe configurations permissive mode you will not be able to switch the cluster back by setting same keys to `false`, the flags will be ignored*.

### `unsafeFlags.tls`

Prevents users from configuring a cluster without TLS/SSL certificates (if `false`, the Operator will automatically change unsafe parameters to safe defaults).

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     |`false` |

### `unsafeFlags.replsetSize`

Prevents users from configuring a cluster with unsafe parameters: starting it with less than 3 replica set instances or with an [even number of replica set instances without additional arbiter](arbiter.md) (if `false`, the Operator will automatically change unsafe parameters to safe defaults).

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     |`false` |

### `unsafeFlags.mongosSize`

Prevents users from configuring a sharded cluster with less than 3 config server Pods or less than 2 mongos Pods (if `false`, the Operator will automatically change unsafe parameters to safe defaults).

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     |`false` |

### `unsafeFlags.terminationGracePeriod`

Prevents users from configuring a sharded cluster without termination grace period for [replica set](operator.md#replsetsterminationgraceperiodseconds), [config servers](operator.md#shardingconfigsvrreplsetterminationgraceperiodseconds) and [mongos](operator.md#shardingmongosterminationgraceperiodseconds) Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     |`false` |

### `unsafeFlags.backupIfUnhealthy`

Prevents running backup on a cluster with [failed health checks :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes).

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     |`false` |

### <a name="operator-issuerconf-section"></a>TLS (extended cert-manager configuration section)

The `tls` section in the [deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) file contains various configuration options for additional customization of the [Transport Layer Security](TLS.md).

### `tls.mode`

Controls if the [TLS encryption](TLS.md) should be used and/or enforced. Can be
 `disabled`, `allowTLS`, `preferTLS`, or `requireTLS`. If set to `disabled`,
 it also requires setting `unsafeFlags.tls option to `true`.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `preferTLS`    |

### `tls.certValidityDuration`

The validity duration of the external certificate for cert manager (90 days by default). This value is used only at cluster creation time and can’t be changed for existing clusters.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `2160h`    |

### `tls.allowInvalidCertificates`

If `true`, the mongo shell will not attempt to validate the server certificates.
**Should be true (default variant) to use self-signed certificates generated by the Operator when there is no cert-manager.**

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `true`    |

### 'tls.issuerConf.name'

A [cert-manager issuer name :octicons-link-external-16:](https://cert-manager.io/docs/concepts/issuer/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     |  `special-selfsigned-issuer` |

### 'tls.issuerConf.kind'

A [cert-manager issuer type :octicons-link-external-16:](https://cert-manager.io/docs/configuration/).

### 'tls.issuerConf.group'

A [cert-manager issuer group :octicons-link-external-16:](https://cert-manager.io/docs/configuration/). Should be `cert-manager.io` for built-in cert-manager certificate issuers.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `cert-manager.io` |

## <a name="operator-upgradeoptions-section"></a>Upgrade Options Section

The `upgradeOptions` section in the [deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) file contains various configuration options to control Percona Server for MongoDB upgrades.

### `upgradeOptions.versionServiceEndpoint`

The Version Service URL used to check versions compatibility for upgrade.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     |`https://check.percona.com` |

### `upgradeOptions.apply`

Specifies how [updates are processed](update.md#automated-upgrade) by the Operator. `Never` or `Disabled` will completely disable automatic upgrades, otherwise it can be set to `Latest` or `Recommended` or to a specific version :material-code-string: stringof Percona Server for MongoDB (e.g. `{{ mongodb60recommended }}`) that is wished to be version-locked (so that the user can control the version running, but use automatic upgrades to move between them).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     |`disabled`  |

### `upgradeOptions.schedule`

Scheduled time to check for updates, specified in the [crontab format  :octicons-link-external-16:](https://en.wikipedia.org/wiki/Cron).

| Value type  | Example        |
| ----------- | -------------- |
| :material-code-string: string     | `0 2 \* \* \*` |

### `upgradeOptions.setFCV`

If enabled, [FeatureCompatibilityVersion (FCV)  :octicons-link-external-16:](https://docs.mongodb.com/manual/reference/command/setFeatureCompatibilityVersion/) will be set to match the version during major version upgrade.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `false`    |

## <a name="operator-secrets-section"></a>Secrets section

Each spec in its turn may contain some key-value pairs. The secrets one
has only two of them:

### `secrets.keyFile`

The secret name for the [MongoDB Internal Auth Key file :octicons-link-external-16:](https://docs.mongodb.com/manual/core/security-internal-authentication/). This secret is auto-created by the operator if it doesn’t exist.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `my-cluster-name-mongodb-keyfile` |

### `secrets.users`

The name of the Secrets object for the MongoDB users required to run the operator.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `my-cluster-name-secrets` |

### `secrets.sse`

The name of the Secrets object for [server side encryption credentials](backups-encryption.md)

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `my-cluster-name-sse` |


### `secrets.ssl`

A secret with TLS certificate generated for *external* communications, see [Transport Layer Security (TLS)](TLS.md) for details.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `my-custom-ssl` |

### `secrets.sslInternal`

A secret with TLS certificate generated for *internal* communications, see [Transport Layer Security (TLS)](TLS.md) for details.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `my-custom-ssl-internal` |

### `secrets.encryptionKey`

Specifies a secret object with the [encryption key  :octicons-link-external-16:](https://docs.mongodb.com/manual/tutorial/configure-encryption/#local-key-management).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `my-cluster-name-mongodb-encryption-key` |

### `secrets.vault`

Specifies a secret object [to provide integration with HashiCorp Vault](encryption.md#using-vault).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `my-cluster-name-vault` |

### `secrets.ldapSecret`

Specifies a secret object for [LDAP over TLS](ldap.md#using-ldap-over-tls-connection) connection between MongoDB and OpenLDAP server.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `my-ldap-secret` |

## <a name="operator-replsets-section"></a>Replsets Section

The replsets section controls the MongoDB Replica Set.

### `replsets.name`

The name of the [MongoDB Replica Set  :octicons-link-external-16:](https://docs.mongodb.com/manual/replication/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `rs 0`     |

### `replsets.size`

The size of the MongoDB Replica Set, must be >= 3 for [High-Availability  :octicons-link-external-16:](https://docs.mongodb.com/manual/replication/#redundancy-and-data-availability).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `3`        |

### `replsets.terminationGracePeriodSeconds`

The amount of seconds Kubernetes will wait for a clean replica set Pods termination.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `300`      |

### 'replsets.serviceAccountName'

Name of the separate privileged service account for Replica Set Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `default` |

### `replsets.topologySpreadConstraints.labelSelector.matchLabels`

The label selector for the [Kubernetes Pod Topology Spread Constraints  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label       | `app.kubernetes.io/name: percona-server-mongodb` |

### `replsets.topologySpreadConstraints.maxSkew`

The degree to which Pods may be unevenly distributed under the [Kubernetes Pod Topology Spread Constraints  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `1`        |

### `replsets.topologySpreadConstraints.topologyKey`

The key of node labels for the [Kubernetes Pod Topology Spread Constraints  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `kubernetes.io/hostname` |

### `replsets.topologySpreadConstraints.whenUnsatisfiable`

What to do with a Pod if it doesn't satisfy the [Kubernetes Pod Topology Spread Constraints  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `DoNotSchedule` |

### `replsets.replsetOverrides.MEMBER-NAME.host`

Use if you need to [override the replica set members FQDNs with custom host names](replication-multi-dc.md). Each key (`MEMBER-NAME`) under `replsetOverrides` should be name of a Pod. The Operator won’t perform any validation for hostnames, so it's the user’s responsibility to ensure connectivity.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `my-cluster-name-rs0-0.example.net:27017` |

### `replsets.replsetOverrides.MEMBER-NAME.priority`

Use if you need to override the [replica set members priorities  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/tutorial/adjust-replica-set-member-priority/). 

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `3` |

### `replsets.replsetOverrides.MEMBER-NAME.tags`

Optional custom tags which can be added to the replset members to make their identication easier.

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label     | `key: value-0` |

### `replsets.externalNodes.host`

The URL or IP address of the [external replset instance](replication-main.md).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `34.124.76.90` |

### `replsets.externalNodes.port`

The port number of the [external replset instance](replication-main.md).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `27017` |

### `replsets.externalNodes.votes`

The number of [votes  :octicons-link-external-16:](https://docs.mongodb.com/manual/reference/replica-configuration/#mongodb-rsconf-rsconf.members-n-.votes) of the [external replset instance](replication-main.md).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `0` |

### `replsets.externalNodes.priority`

The [priority :octicons-link-external-16:](https://docs.mongodb.com/manual/reference/replica-configuration/#mongodb-rsconf-rsconf.members-n-.priority) of the [external replset instance](replication-main.md).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `0` |

### `replsets.configuration`

Custom configuration options for mongod. Please refer to the [official manual  :octicons-link-external-16:](https://docs.mongodb.com/manual/reference/configuration-options/) for the full list of options, and [specific  :octicons-link-external-16:](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/rate-limit.html) [Percona  :octicons-link-external-16:](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/inmemory.html) [Server  :octicons-link-external-16:](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/data_at_rest_encryption.html) [for MongoDB  :octicons-link-external-16:](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/log-redaction.html) [docs  :octicons-link-external-16:](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/audit-logging.html).

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | <pre>&#124;<br>operationProfiling:<br>  mode: slowOp<br>systemLog:<br>  verbosity: 1<br>storage:<br>  engine: wiredTiger<br>  wiredTiger:<br>    engineConfig:<br>      directoryForIndexes: false<br>      journalCompressor: snappy<br>    collectionConfig:<br>      blockCompressor: snappy<br>    indexConfig:<br>      prefixCompression: true</pre> |

### `replsets.affinity.antiAffinityTopologyKey`

The [Kubernetes topologyKey  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#inter-pod-affinity-and-anti-affinity-beta-feature) node affinity constraint for the Replica Set nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `kubernetes.io/hostname` |

### `replsets.affinity.advanced`

In cases where the pods require complex tuning the advanced option turns off the `topologykey` effect. This setting allows the standard Kubernetes affinity constraints of any complexity to be used.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc      |            |

### `replsets.tolerations.key`

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) key for the Replica Set nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `node.alpha.kubernetes.io/unreachable` |

### `replsets.tolerations.operator`

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) operator for the Replica Set nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Exists`   |

### `replsets.tolerations.effect`

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) effect for the Replica Set nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `NoExecute` |

### `replsets.tolerations.tolerationSeconds`

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) time limit  for the Replica Set nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `6000`     |

### `replsets.primaryPreferTagSelector.region` 

Ensures the MongoDB instance is selected as Primary based on specified region

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `us-west-2` |

### `replsets.primaryPreferTagSelector.zone`

Ensures the MongoDB instance is selected as Primary based on specified zone

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `us-west-2c` |

### `replsets.priorityClassName`

The [Kuberentes Pod priority class  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption/#priorityclass)  for the Replica Set nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `high priority` |

### `replsets.annotations`

The [Kubernetes annotations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the Replica Set nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `iam.amazonaws.com/role: role-arn` |

### `replsets.labels`

The [Kubernetes affinity labels  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/) for the Replica Set nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label       | `rack: rack-22` |

### `replsets.nodeSelector`

The [Kubernetes nodeSelector  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#nodeselector) affinity constraint  for the Replica Set nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label       | `disktype: ssd` |

### `replsets.storage.engine`

Sets the storage.engine option <https://docs.mongodb.com/manual/reference/configuration-options/#storage.engine>\`_ for the Replica Set nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `wiredTiger` |

### `replsets.storage.wiredTiger.engineConfig.cacheSizeRatio`

The ratio used to compute the [storage.wiredTiger.engineConfig.cacheSizeGB option  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/configuration-options/#mongodb-setting-storage.wiredTiger.engineConfig.cacheSizeGB) for the Replica Set nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-decimal: float       | `0.5`      |

### `replsets.storage.wiredTiger.engineConfig.directoryForIndexes`

Sets the [storage.wiredTiger.engineConfig.directoryForIndexes option  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/configuration-options/#mongodb-setting-storage.wiredTiger.engineConfig.directoryForIndexes) for the Replica Set nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `false`    |

### `replsets.storage.wiredTiger.engineConfig.journalCompressor`

Sets the [storage.wiredTiger.engineConfig.journalCompressor option  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/configuration-options/#mongodb-setting-storage.wiredTiger.engineConfig.journalCompressor) for the Replica Set nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `snappy`   |

### `replsets.storage.wiredTiger.collectionConfig.blockCompressor`

Sets the [storage.wiredTiger.collectionConfig.blockCompressor option  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/configuration-options/#mongodb-setting-storage.wiredTiger.collectionConfig.blockCompressor) for the Replica Set nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `snappy`   |

### `replsets.storage.wiredTiger.indexConfig.prefixCompression`

Sets the [storage.wiredTiger.indexConfig.prefixCompression option  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/configuration-options/#mongodb-setting-storage.wiredTiger.indexConfig.prefixCompression) for the Replica Set nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `true`     |

### `replsets.storage.inMemory.engineConfig.inMemorySizeRatio`

The ratio used to compute the [storage.engine.inMemory.inMemorySizeGb option  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/configuration-options/#mongodb-setting-storage.inMemory.engineConfig.inMemorySizeGB) for the Replica Set nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-decimal: float       |  `0.9`     |

### `replsets.livenessProbe.failureThreshold`

Number of consecutive unsuccessful tries of the [liveness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be undertaken before giving up.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `4`        |

### `replsets.livenessProbe.initialDelaySeconds`

Number of seconds to wait after the container start before initiating the [liveness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `60`       |

### `replsets.livenessProbe.periodSeconds`

How often to perform a [liveness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) (in seconds).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `30`       |

### `replsets.livenessProbe.timeoutSeconds`

Number of seconds after which the [liveness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) times out.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `10`       |

### `replsets.livenessProbe.startupDelaySeconds`

Time after which the liveness probe is failed if the MongoDB instance didn’t finish its full startup yet.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `7200`     |

### `replsets.readinessProbe.failureThreshold`

Number of consecutive unsuccessful tries of the [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be undertaken before giving up.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `8`        |

### `replsets.readinessProbe.initialDelaySeconds`

Number of seconds to wait after the container start before initiating the [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `10`       |

### `replsets.readinessProbe.periodSeconds`

How often to perform a [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) (in seconds).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `3`        |

### `replsets.readinessProbe.successThreshold`

Minimum consecutive successes for the [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be considered successful after having failed.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `1`        |

### `replsets.readinessProbe.timeoutSeconds`

Number of seconds after which the [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) times out.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `2`        |

### 'replsets.containerSecurityContext'

A custom [Kubernetes Security Context for a Container :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc      | `privileged: false`          |

### 'replsets.podSecurityContext'

A custom [Kubernetes Security Context for a Pod :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc      | <pre>runAsUser: 1001<br>runAsGroup: 1001<br>supplementalGroups: [1001]</pre> |

### `replsets.runtimeClassName`

Name of the [Kubernetes Runtime Class  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/containers/runtime-class/) for Replica Set Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `image-rc` |

### `replsets.sidecars.image`

Image for the [custom sidecar container](sidecar.md) for Replica Set Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `busybox`  |

### `replsets.sidecars.command`

Command for the [custom sidecar container](sidecar.md) for Replica Set Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-application-array-outline: array       | `["/bin/sh"]` |

### `replsets.sidecars.args`

Command arguments for the [custom sidecar container](sidecar.md) for Replica Set Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-application-array-outline: array       | `["-c", "while true; do echo echo $(date -u) 'test' >> /dev/null; sleep 5;done"]` |

### `replsets.sidecars.name`

Name of the [custom sidecar container](sidecar.md) for Replica Set Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `rs-sidecar-1` |

### `replsets.sidecars.volumeMounts.mountPath`

Mount path of the [custom sidecar container](sidecar.md) volume for Replica Set Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `/volume1` |

### `replsets.sidecars.volumeMounts.name`

Name of the [custom sidecar container](sidecar.md) volume for Replica Set Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `sidecar-volume-claim` |

### `replsets.sidecarVolumes.name`

Name of the [custom sidecar container](sidecar.md) volume for Replica Set Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `sidecar-config` |

### `replsets.sidecarVolumes.configMap.name`

Name of the [ConfigMap  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#configmap) for a [custom sidecar container](sidecar.md) volume for Replica Set Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `myconfigmap` |

### `replsets.sidecarVolumes.secret.secretName`

Name of the [Secret  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#secret) for a [custom sidecar container](sidecar.md) volume for Replica Set Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `sidecar-secret` |

### `replsets.sidecarPVCs`

[Persistent Volume Claim  :octicons-link-external-16:](https://v1-20.docs.kubernetes.io/docs/concepts/storage/persistent-volumes/) for the [custom sidecar container](sidecar.md) volume for Replica Set Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc      |            |

### `replsets.podDisruptionBudget.maxUnavailable`

The [Kubernetes Pod distribution budget  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/) limit specifying the maximum value for unavailable Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `1`        |

### `replsets.podDisruptionBudget.minAvailable`

The [Kubernetes Pod distribution budget  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/) limit specifying the minimum value for available Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `1`        |

### `replsets.splitHorizons.REPLICASET-POD-NAME.external`

External URI for [Split-horizon](expose.md#exposing-replica-set-with-split-horizon-dns) for replica set Pods of the exposed cluster.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `rs0-0.mycluster.xyz` |

### `replsets.splitHorizons.REPLICASET-POD-NAME.external-2`

External URI for [Split-horizon](expose.md#exposing-replica-set-with-split-horizon-dns) for replica set Pods of the exposed cluster.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `rs0-0.mycluster2.xyz` |

### `replsets.expose.enabled`

Enable or disable exposing [MongoDB Replica Set  :octicons-link-external-16:](https://docs.mongodb.com/manual/replication/) nodes with dedicated IP addresses.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `false`    |

### `replsets.expose.type`

The [IP address type  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) to be exposed.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `ClusterIP`|

### `replsets.expose.loadBalancerSourceRanges`

The range of client IP addresses from which the load balancer should be reachable (if not set, there is no limitations).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `10.0.0.0/8` |

### `replsets.expose.annotations`

The [Kubernetes annotations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the MongoDB mongod daemon.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: http` |

### `replsets.expose.labels`

The [Kubernetes labels  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) for the MongoDB Replica Set Service.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `rack: rack-22` |

### `replsets.expose.internalTrafficPolicy`

Specifies whether Service for MongoDB instances should [route internal traffic to cluster-wide or to node-local endpoints :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service-traffic-policy/) (it can influence the load balancing effectiveness).

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `Local` |

### `replsets.nonvoting.enabled`

Enable or disable creation of [Replica Set non-voting instances](arbiter.md#adding-non-voting-nodes) within the cluster.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `false`    |

### `replsets.nonvoting.size`

The number of [Replica Set non-voting instances](arbiter.md#adding-non-voting-nodes) within the cluster.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `1`        |

### `replsets.nonvoting.podSecurityContext`

A custom [Kubernetes Security Context for a Pod :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | `{}` |

### `replsets.nonvoting.containerSecurityContext`

A custom [Kubernetes Security Context for a Container :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | `{}` |

### `replsets.nonvoting.afinity.antiAffinityTopologyKey`

The [Kubernetes topologyKey  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#inter-pod-affinity-and-anti-affinity-beta-feature) node affinity constraint for the non-voting nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `kubernetes.io/hostname` |

### `replsets.nonvoting.affinity.advanced`

In cases where the pods require complex tuning the advanced option turns off the `topologykey` effect. This setting allows the standard Kubernetes affinity constraints of any complexity to be used.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc      |            |

### `replsets.nonvoting.tolerations.key`

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) key for the non-voting nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `node.alpha.kubernetes.io/unreachable` |

### `replsets.nonvoting.tolerations.operator`

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) operator for the non-voting nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Exists`   |

### `replsets.nonvoting.tolerations.effect`

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) effect for the non-voting nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `NoExecute`|

### `replsets.nonvoting.tolerations.tolerationSeconds`

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) time limit for the non-voting nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `6000`     |

### `replsets.nonvoting.priorityClassName`

The [Kuberentes Pod priority class  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption/#priorityclass) for the non-voting nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `high priority` |

### `replsets.nonvoting.annotations`

The [Kubernetes annotations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the non-voting nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `iam.amazonaws.com/role: role-arn` |

### `replsets.nonvoting.labels`

The [Kubernetes affinity labels  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/) for the non-voting nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label       | `rack: rack-22` |

### `replsets.nonvoting.nodeSelector`

The [Kubernetes nodeSelector  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#nodeselector) affinity constraint for the non-voting nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label       | `disktype: ssd` |

### `replsets.nonvoting.podDisruptionBudget.maxUnavailable`

The [Kubernetes Pod distribution budget  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/) limit specifying the maximum value for unavailable Pods among non-voting nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `1`        |

### `replsets.nonvoting.podDisruptionBudget.minAvailable`

The [Kubernetes Pod distribution budget  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/) limit specifying the minimum value for available Pods among non-voting nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `1`        |

### `replsets.nonvoting.resources.limits.cpu`

[Kubernetes CPU limit  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for MongoDB container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `300m`     |

### `replsets.nonvoting.resources.limits.memory`

[Kubernetes Memory limit  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for MongoDB container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `0.5G`     |

### `replsets.nonvoting.resources.requests.cpu`

The [Kubernetes CPU requests  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for MongoDB container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `300m`     |

### `replsets.nonvoting.resources.requests.memory`

The [Kubernetes Memory requests  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for MongoDB container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `0.5G`     |

### `replsets.nonvoting.volumeSpec.emptyDir`

The [Kubernetes emptyDir volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir), i.e. the directory which will be created on a node, and will be accessible to the MongoDB Pod containers.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `{}`       |

### `replsets.nonvoting.volumeSpec.hostPath.path`

[Kubernetes hostPath volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath), i.e. the file or directory of a node that will be accessible to the MongoDB Pod containers.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `/data`    |

### `replsets.nonvoting.volumeSpec.hostPath.type`

The [Kubernetes hostPath volume type  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Directory`|

### `replsets.nonvoting.volumeSpec.persistentVolumeClaim.annotations`

The [Kubernetes annotations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for [Persistent Volume Claim  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: http` |

### `replsets.nonvoting.volumeSpec.persistentVolumeClaim.labels`

The [Kubernetes labels  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) metadata for [Persistent Volume Claim  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `rack: rack-22` |

### `replsets.nonvoting.volumeSpec.persistentVolumeClaim.storageClassName`

The [Kubernetes Storage Class  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/storage-classes/) to use with the MongoDB container [Persistent Volume Claim  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) for the non-voting nodes. Use Storage Class with XFS as the default filesystem if possible, [for better MongoDB performance  :octicons-link-external-16:](https://dba.stackexchange.com/questions/190578/is-xfs-still-the-best-choice-for-mongodb.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `standard` |

### `replsets.nonvoting.volumeSpec.persistentVolumeClaim.accessModes`

The [Kubernetes Persistent Volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) access modes for the MongoDB container for the non-voting nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-application-array-outline: array       | `[ "ReadWriteOnce" ]` |

### `replsets.nonvoting.volumeSpec.persistentVolumeClaim.resources.requests.storage`

The [Kubernetes Persistent Volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) size for the MongoDB container for the non-voting nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `3Gi`      |

### `replsets.arbiter.enabled`

Enable or disable creation of [Replica Set Arbiter  :octicons-link-external-16:](https://docs.mongodb.com/manual/core/replica-set-arbiter/) nodes within the cluster.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `false`    |

### `replsets.arbiter.size`

The number of [Replica Set Arbiter  :octicons-link-external-16:](https://docs.mongodb.com/manual/core/replica-set-arbiter/) instances within the cluster.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `1`        |

### `replsets.arbiter.afinity.antiAffinityTopologyKey`

The [Kubernetes topologyKey  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#inter-pod-affinity-and-anti-affinity-beta-feature) node affinity constraint for the Arbiter.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `kubernetes.io/hostname` |

### `replsets.arbiter.affinity.advanced`

In cases where the pods require complex tuning the advanced option turns off the `topologykey` effect. This setting allows the standard Kubernetes affinity constraints of any complexity to be used.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc      |            |

### `replsets.arbiter.tolerations.key`

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) key for the Arbiter nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `node.alpha.kubernetes.io/unreachable` |

### `replsets.arbiter.tolerations.operator`

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) operator for the Arbiter nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Exists`   |

### `replsets.arbiter.tolerations.effect`

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) effect for the Arbiter nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `NoExecute`|

### `replsets.arbiter.tolerations.tolerationSeconds`

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) time limit for the Arbiter nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `6000`     |

### `replsets.arbiter.priorityClassName`

The [Kuberentes Pod priority class  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption/#priorityclass) for the Arbiter nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `high priority` |

### `replsets.arbiter.annotations`

The [Kubernetes annotations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the Arbiter nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `iam.amazonaws.com/role: role-arn` |

### `replsets.arbiter.labels`

The [Kubernetes affinity labels  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/) for the Arbiter nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label       | `rack: rack-22` |

### `replsets.arbiter.nodeSelector`

The [Kubernetes nodeSelector  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#nodeselector) affinity constraint for the Arbiter nodes.

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label       | `disktype: ssd` |

### `replsets.resources.limits.cpu`

[Kubernetes CPU limit  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for MongoDB container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `300m`     |

### `replsets.resources.limits.memory`

[Kubernetes Memory limit  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for MongoDB container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `0.5G`     |

### `replsets.resources.requests.cpu`

The [Kubernetes CPU requests  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for MongoDB container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `300m`     |

### `replsets.resources.requests.memory`

The [Kubernetes Memory requests  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for MongoDB container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `0.5G`     |

### `replsets.volumeSpec.emptyDir`

The [Kubernetes emptyDir volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir), i.e. the directory which will be created on a node, and will be accessible to the MongoDB Pod containers.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `{}`       |

### `replsets.volumeSpec.hostPath.path`

[Kubernetes hostPath volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath), i.e. the file or directory of a node that will be accessible to the MongoDB Pod containers.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `/data`    |

### `replsets.volumeSpec.hostPath.type`

The [Kubernetes hostPath volume type  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Directory`|

### `replsets.volumeSpec.persistentVolumeClaim.annotations`

The [Kubernetes annotations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for [Persistent Volume Claim  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: http` |

### `replsets.volumeSpec.persistentVolumeClaim.labels`

The [Kubernetes labels  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) metadata for [Persistent Volume Claim  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `rack: rack-22` |

### `replsets.volumeSpec.persistentVolumeClaim.storageClassName`

The [Kubernetes Storage Class  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/storage-classes/) to use with the MongoDB container [Persistent Volume Claim  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims). Use Storage Class with XFS as the default filesystem if possible, [for better MongoDB performance  :octicons-link-external-16:](https://dba.stackexchange.com/questions/190578/is-xfs-still-the-best-choice-for-mongodb).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `standard` |

### `replsets.volumeSpec.persistentVolumeClaim.accessModes`

The [Kubernetes Persistent Volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) access modes for the MongoDB container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-application-array-outline: array       | `[ "ReadWriteOnce" ]` |

### `replsets.volumeSpec.persistentVolumeClaim.resources.requests.storage`

The [Kubernetes Persistent Volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) size for the MongoDB container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `3Gi`      |

### `replsets.hostAliases.ip`

The IP address for [Kubernetes host aliases  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/network/customize-hosts-file-for-pods/) for replica set Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `"10.10.0.2"` |

### `replsets.hostAliases.hostnames`

Hostnames for [Kubernetes host aliases  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/network/customize-hosts-file-for-pods/) for replica set Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc      |            |

## <a name="operator-pmm-section"></a>PMM Section

The `pmm` section in the deploy/cr.yaml file contains configuration
options for Percona Monitoring and Management.

### `pmm.enabled`

Enables or disables monitoring Percona Server for MongoDB with [PMM  :octicons-link-external-16:](https://www.percona.com/doc/percona-monitoring-and-managementindex.metrics-monitor.dashboard.html).

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `false`    |

### `pmm.image`

PMM Client docker image to use.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `percona/pmm-client:{{ pmm2recommended }}` |

### `pmm.serverHost`

Address of the PMM Server to collect data from the Cluster.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `monitoring-service` |

### `pmm.containerSecurityContext`

A custom [Kubernetes Security Context for a Container :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | `{}` |


### `pmm.mongodParams`

Additional parameters which will be passed to the [pmm-admin add mongodb  :octicons-link-external-16:](https://www.percona.com/doc/percona-monitoring-and-management/2.x/setting-up/client/mongodb.html#adding-mongodb-service-monitoring) command for `mongod` Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `--environment=DEV-ENV --custom-labels=DEV-ENV` |

### `pmm.mongosParams`

Additional parameters which will be passed to the [pmm-admin add mongodb  :octicons-link-external-16:](https://www.percona.com/doc/percona-monitoring-and-management/2.x/setting-up/client/mongodb.html#adding-mongodb-service-monitoring) command for `mongos` Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `--environment=DEV-ENV --custom-labels=DEV-ENV` |

## <a name="operator-sharding-section"></a>Sharding Section

The `sharding` section in the deploy/cr.yaml file contains configuration
options for Percona Server for MondoDB [sharding](sharding.md).

### `sharding.enabled`

Enables or disables [Percona Server for MondoDB sharding  :octicons-link-external-16:](https://docs.mongodb.com/manual/sharding/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `true`     |

### `sharding.configsvrReplSet.size`

The number of [Config Server instances  :octicons-link-external-16:](https://docs.mongodb.com/manual/core/sharded-cluster-config-servers/) within the cluster.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `3`        |

### `sharding.configsvrReplSet.terminationGracePeriodSeconds`

The amount of seconds Kubernetes will wait for a clean config server Pods termination.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `300`      |

### 'sharding.configsvrReplSet.serviceAccountName'

Name of the separate privileged service account for Config Server Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `default` |

### `sharding.configsvrReplSet.topologySpreadConstraints.labelSelector.matchLabels`

The label selector for the [Kubernetes Pod Topology Spread Constraints  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label       | `app.kubernetes.io/name: percona-server-mongodb` |

### `sharding.configsvrReplSet.topologySpreadConstraints.maxSkew`

The degree to which Pods may be unevenly distributed under the [Kubernetes Pod Topology Spread Constraints  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `1`        |

### `sharding.configsvrReplSet.topologySpreadConstraints.topologyKey`

The key of node labels for the [Kubernetes Pod Topology Spread Constraints  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `kubernetes.io/hostname` |

### `sharding.configsvrReplSet.topologySpreadConstraints.whenUnsatisfiable`

What to do with a Pod if it doesn't satisfy the [Kubernetes Pod Topology Spread Constraints  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `DoNotSchedule` |

### `sharding.configsvrReplSet.externalNodes.host`

The URL or IP address of the [external config server instance](replication-main.md).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `34.124.76.90` |

### `sharding.configsvrReplSet.externalNodes.port`

The port number of the [external config server instance](replication-main.md).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `27017` |

### `sharding.configsvrReplSet.externalNodes.votes`

The number of [votes  :octicons-link-external-16:](https://docs.mongodb.com/manual/reference/replica-configuration/#mongodb-rsconf-rsconf.members-n-.votes) of the [external config server instance](replication-main.md).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `0` |

### `sharding.configsvrReplSet.externalNodes.priority`

The [priority :octicons-link-external-16:](https://docs.mongodb.com/manual/reference/replica-configuration/#mongodb-rsconf-rsconf.members-n-.priority) of the [external config server instance](replication-main.md).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `0` |


### `sharding.configsvrReplSet.configuration`

Custom configuration options for Config Servers. Please refer to the [official manual  :octicons-link-external-16:](https://docs.mongodb.com/manual/reference/configuration-options/) for the full list of options.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | <pre>&#124;<br>operationProfiling:<br>  mode: slowOp<br>systemLog:<br>  verbosity: 1</pre> |

### `sharding.configsvrReplSet.livenessProbe.failureThreshold`

Number of consecutive unsuccessful tries of the [liveness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be undertaken before giving up.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `4`        |

### `sharding.configsvrReplSet.livenessProbe.initialDelaySeconds`

Number of seconds to wait after the container start before initiating the [liveness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `60`       |

### `sharding.configsvrReplSet.livenessProbe.periodSeconds`

How often to perform a [liveness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) (in seconds).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `30`       |

### `sharding.configsvrReplSet.livenessProbe.timeoutSeconds`

Number of seconds after which the [liveness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) times out.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `10`       |

### `sharding.configsvrReplSet.livenessProbe.startupDelaySeconds`

Time after which the liveness probe is failed if the MongoDB instance didn’t finish its full startup yet.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `7200`     |

### `sharding.configsvrReplSet.readinessProbe.failureThreshold`

Number of consecutive unsuccessful tries of the [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be undertaken before giving up.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `3`        |

### `sharding.configsvrReplSet.readinessProbe.initialDelaySeconds`

Number of seconds to wait after the container start before initiating the [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `10`       |

### `sharding.configsvrReplSet.readinessProbe.periodSeconds`

How often to perform a [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) (in seconds).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `3`        |

### `sharding.configsvrReplSet.readinessProbe.successThreshold`

Minimum consecutive successes for the [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be considered successful after having failed.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `1`        |

### `sharding.configsvrReplSet.readinessProbe.timeoutSeconds`

Number of seconds after which the [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) times out.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `2`        |

### 'sharding.configsvrReplSet.containerSecurityContext'

A custom [Kubernetes Security Context for a Container :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc      | `privileged: false`          |

### 'sharding.configsvrReplSet.podSecurityContext'

A custom [Kubernetes Security Context for a Pod :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc      | <pre>runAsUser: 1001<br>runAsGroup: 1001<br>supplementalGroups: [1001]</pre> |

### `sharding.configsvrReplSet.runtimeClassName`

Name of the [Kubernetes Runtime Class  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/containers/runtime-class/) for Config Server Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `image-rc` |

### `sharding.configsvrReplSet.sidecars.image`

Image for the [custom sidecar container](sidecar.md) for Config Server Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `busybox`  |

### `sharding.configsvrReplSet.sidecars.command`

Command for the [custom sidecar container](sidecar.md) for Config Server Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-application-array-outline: array       | `["/bin/sh"]` |

### `sharding.configsvrReplSet.sidecars.args`

Command arguments for the [custom sidecar container](sidecar.md) for Config Server Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-application-array-outline: array       | `["-c", "while true; do echo echo $(date -u) 'test' >> /dev/null; sleep 5;done"]` |

### `sharding.configsvrReplSet.sidecars.name`

Name of the [custom sidecar container](sidecar.md) for Config Server Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `rs-sidecar-1` |

### `sharding.configsvrReplSet.limits.cpu`

[Kubernetes CPU limit  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for Config Server container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `300m`     |

### `sharding.configsvrReplSet.limits.memory`

[Kubernetes Memory limit  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for Config Server container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `0.5G`     |

### `sharding.configsvrReplSet.resources.requests.cpu`

The [Kubernetes CPU requests  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for Config Server container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `300m`     |

### `sharding.configsvrReplSet.requests.memory`

The [Kubernetes Memory requests  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for Config Server container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `0.5G`     |

### `sharding.configsvrReplSet.expose.enabled`

Enable or disable exposing [Config Server  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/core/sharded-cluster-config-servers/) nodes with dedicated IP addresses.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `false`    |

### `sharding.configsvrReplSet.expose.type`

The [IP address type  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) to be exposed.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `ClusterIP`|

### `sharding.configsvrReplSet.expose.loadBalancerSourceRanges`

The range of client IP addresses from which the load balancer should be reachable (if not set, there is no limitations).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `10.0.0.0/8` |

### `sharding.configsvrReplSet.expose.annotations`

The [Kubernetes annotations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the Config Server daemon.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: http` |

### `sharding.configsvrReplSet.expose.labels`

The [Kubernetes labels  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) for the Config Server Service.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `rack: rack-22` |

### `sharding.configsvrReplSet.expose.internalTrafficPolicy`

Specifies whether Service for config servers should [route internal traffic to cluster-wide or to node-local endpoints :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service-traffic-policy/) (it can influence the load balancing effectiveness).

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `Local` |

### `sharding.configsvrReplSet.volumeSpec.emptyDir`

The [Kubernetes emptyDir volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir), i.e. the directory which will be created on a node, and will be accessible to the Config Server Pod containers.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `{}`       |

### `sharding.configsvrReplSet.volumeSpec.hostPath.path`

[Kubernetes hostPath volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath), i.e. the file or directory of a node that will be accessible to the Config Server Pod containers.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `/data`    |

### `sharding.configsvrReplSet.volumeSpec.hostPath.type`

The [Kubernetes hostPath volume type  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Directory`|

### `sharding.configsvrReplSet.volumeSpec.persistentVolumeClaim.annotations`

The [Kubernetes annotations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for [Persistent Volume Claim  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: http` |

### `sharding.configsvrReplSet.volumeSpec.persistentVolumeClaim.labels`

The [Kubernetes labels  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) metadata for [Persistent Volume Claim  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `rack: rack-22` |

### `sharding.configsvrReplSet.volumeSpec.persistentVolumeClaim.storageClassName`

The [Kubernetes Storage Class  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/storage-classes/) to use with the Config Server container [Persistent Volume Claim  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims). Use Storage Class with XFS as the default filesystem if possible, [for better MongoDB performance  :octicons-link-external-16:](https://dba.stackexchange.com/questions/190578/is-xfs-still-the-best-choice-for-mongodb).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `standard` |

### `sharding.configsvrReplSet.volumeSpec.persistentVolumeClaim.accessModes`

The [Kubernetes Persistent Volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) access modes for the Config Server container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-application-array-outline: array       | `[ "ReadWriteOnce" ]` |

### `sharding.configsvrReplSet.volumeSpec.persistentVolumeClaim.resources.requests.storage`

The [Kubernetes Persistent Volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) size for the Config Server container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `3Gi`      |

### `sharding.configsvrReplSet.hostAliases.ip`

The IP address for [Kubernetes host aliases  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/network/customize-hosts-file-for-pods/) for replica set Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `"10.10.0.2"` |

### `sharding.configsvrReplSet.hostAliases.hostnames`

Hostnames for [Kubernetes host aliases  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/network/customize-hosts-file-for-pods/) for config server Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc      |            |

### `sharding.mongos.size`

The number of [mongos  :octicons-link-external-16:](https://docs.mongodb.com/manual/core/sharded-cluster-query-router/) instances within the cluster.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `3`        |

### `sharding.mongos.terminationGracePeriodSeconds`

The amount of seconds Kubernetes will wait for a clean mongos Pods termination.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `300`      |

### 'sharding.mongos.serviceAccountName'

Name of the separate privileged service account for mongos Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `default` |

### `sharding.mongos.topologySpreadConstraints.labelSelector.matchLabels`

The label selector for the [Kubernetes Pod Topology Spread Constraints  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label       | `app.kubernetes.io/name: percona-server-mongodb` |

### `sharding.mongos.topologySpreadConstraints.maxSkew`

The degree to which Pods may be unevenly distributed under the [Kubernetes Pod Topology Spread Constraints  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `1`        |

### `sharding.mongos.topologySpreadConstraints.topologyKey`

The key of node labels for the [Kubernetes Pod Topology Spread Constraints  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `kubernetes.io/hostname` |

### `sharding.mongos.topologySpreadConstraints.whenUnsatisfiable`

What to do with a Pod if it doesn't satisfy the [Kubernetes Pod Topology Spread Constraints  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `DoNotSchedule` |

### `sharding.mongos.configuration`

Custom configuration options for mongos. Please refer to the [official manual  :octicons-link-external-16:](https://docs.mongodb.com/manual/reference/configuration-options/) for the full list of options.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | <pre>&#124;<br>systemLog:<br>  verbosity: 1</pre> |

### `sharding.mongos.afinity.antiAffinityTopologyKey`

The [Kubernetes topologyKey  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#inter-pod-affinity-and-anti-affinity-beta-feature) node affinity constraint for mongos.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `kubernetes.io/hostname` |

### `sharding.mongos.affinity.advanced`

In cases where the Pods require complex tuning the advanced option turns off the `topologykey` effect. This setting allows the standard Kubernetes affinity constraints of any complexity to be used.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc      |            |

### `sharding.mongos.tolerations.key`

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) key for mongos instances.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `node.alpha.kubernetes.io/unreachable` |

### `sharding.mongos.tolerations.operator`

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) operator for mongos instances.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `Exists`   |

### `sharding.mongos.tolerations.effect`

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) effect for mongos instances.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `NoExecute`|

### `sharding.mongos.tolerations.tolerationSeconds`

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) time limit for mongos instances.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `6000`     |

### `sharding.mongos.priorityClassName`

The [Kuberentes Pod priority class  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption/#priorityclass) for mongos instances.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `high priority` |

### `sharding.mongos.annotations`

The [Kubernetes annotations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the mongos instances.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `iam.amazonaws.com/role: role-arn` |

### `sharding.mongos.labels`

The [Kubernetes affinity labels  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/) for mongos instances.

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label       | `rack: rack-22` |

### `sharding.mongos.nodeSelector`

The [Kubernetes nodeSelector  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#nodeselector) affinity constraint for mongos instances.

| Value type  | Example    |
| ----------- | ---------- |
| :material-label-outline: label       | `disktype: ssd` |

### `sharding.mongos.livenessProbe.failureThreshold`

Number of consecutive unsuccessful tries of the [liveness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be undertaken before giving up.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `4`        |

### `sharding.mongos.livenessProbe.initialDelaySeconds`

Number of seconds to wait after the container start before initiating the [liveness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `60`       |

### `sharding.mongos.livenessProbe.periodSeconds`

How often to perform a [liveness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) (in seconds).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `30`       |

### `sharding.mongos.livenessProbe.timeoutSeconds`

Number of seconds after which the [liveness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) times out.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `10`       |

### `sharding.mongos.livenessProbe.startupDelaySeconds`

Time after which the liveness probe is failed if the MongoDB instance didn’t finish its full startup yet.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `7200`     |

### `sharding.mongos.readinessProbe.failureThreshold`

Number of consecutive unsuccessful tries of the [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be undertaken before giving up.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `3`        |

### `sharding.mongos.readinessProbe.initialDelaySeconds`

Number of seconds to wait after the container start before initiating the [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `10`       |

### `sharding.mongos.readinessProbe.periodSeconds`

How often to perform a [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) (in seconds).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `3`        |

### `sharding.mongos.readinessProbe.successThreshold`

Minimum consecutive successes for the [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be considered successful after having failed.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `1`        |

### `sharding.mongos.readinessProbe.timeoutSeconds`

Number of seconds after which the [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) times out.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `2`        |

### 'sharding.mongos.containerSecurityContext'

A custom [Kubernetes Security Context for a Container :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc      | `privileged: false`          |

### 'sharding.mongos.podSecurityContext'

A custom [Kubernetes Security Context for a Pod :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc      | <pre>runAsUser: 1001<br>runAsGroup: 1001<br>supplementalGroups: [1001]</pre> |

### `sharding.mongos.runtimeClassName`

Name of the [Kubernetes Runtime Class  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/containers/runtime-class/) for mongos Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `image-rc` |

### `sharding.mongos.sidecars.image`

Image for the [custom sidecar container](sidecar.md) for mongos Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `busybox`  |

### `sharding.mongos.sidecars.command`

Command for the [custom sidecar container](sidecar.md) for mongos Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-application-array-outline: array       | `["/bin/sh"]` |

### `sharding.mongos.sidecars.args`

Command arguments for the [custom sidecar container](sidecar.md) for mongos Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-application-array-outline: array       | `["-c", "while true; do echo echo $(date -u) 'test' >> /dev/null; sleep 5;done"]` |

### `sharding.mongos.sidecars.name`

Name of the [custom sidecar container](sidecar.md) for mongos Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `rs-sidecar-1` |

### `sharding.mongos.limits.cpu`

[Kubernetes CPU limit  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for mongos container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `300m`     |

### `sharding.mongos.limits.memory`

[Kubernetes Memory limit  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for mongos container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `0.5G`     |

### `sharding.mongos.resources.requests.cpu`

The [Kubernetes CPU requests  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for mongos container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `300m`     |

### `sharding.mongos.requests.memory`

The [Kubernetes Memory requests  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for mongos container.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `0.5G`     |

### `sharding.mongos.expose.type`

The [IP address type  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) to be exposed.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `ClusterIP`|

### `sharding.mongos.expose.servicePerPod`

If set to `true`, a separate ClusterIP Service is created for each mongos instance.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `true`     |

### `sharding.mongos.expose.loadBalancerSourceRanges`

The range of client IP addresses from which the load balancer should be reachable (if not set, there is no limitations).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `10.0.0.0/8` |

### `sharding.mongos.expose.annotations`

The [Kubernetes annotations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the MongoDB mongos daemon.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: http` |

### `sharding.mongos.expose.labels`

The [Kubernetes labels  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) for the MongoDB mongos Service.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `rack: rack-22` |

### 'sharding.mongos.expose.nodePort'

The [Node port number :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport) to be allocated for the MongoDB mongos Service when the  `sharding.mongos.expose.type` is set to the `NodePort`, and `sharding.mongos.expose.servicePerPod` is not turned on.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `32017`        |

### `sharding.mongos.internalTrafficPolicy`

Specifies whether Services for the mongos instances should [route internal traffic to cluster-wide or to node-local endpoints :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service-traffic-policy/) (it can influence the load balancing effectiveness).

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `Local` |

### `sharding.mongos.hostAliases.ip`

The IP address for [Kubernetes host aliases  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/network/customize-hosts-file-for-pods/) for mongos Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `"10.10.0.2"` |

### `sharding.mongos.hostAliases.hostnames`

Hostnames for [Kubernetes host aliases  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/network/customize-hosts-file-for-pods/) for mongos   Pods.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc      |            |

## Roles section

The `roles` section in the [deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) file contains various configuration options [to configure custom MongoDB user roles via the Custom Resource](users.md#create-users-in-the-custom-resource).

### `roles.role`

The [cusom MongoDB role :octicons-link-external-16:](https://www.mongodb.com/docs/manual/core/security-user-defined-roles/) name.

| Value type | Example |
| ---------- | ------- |
| :material-code-string: string | `myClusterwideAdmin` |

### `roles.db`

Database in which you want to store the user-defined role.

| Value type | Example |
| ---------- | ------- |
| :material-code-string: string | `admin

### `roles.authenticationRestrictions.clientSource`

List of the IP addresses or CIDR blocks *from which* users assigned this role can connect. MongoDB servers reject connection requests from users with this role if the requests come from a client that is not present in this array.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc      | `127.0.0.1` |

### `roles.authenticationRestrictions.serverAddress`

List of the  IP addresses or CIDR blocks *to which* users assigned this role can connect. MongoDB servers reject connection requests from users with this role if the client requests to connect to a server that is not present in this array.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc      | `127.0.0.1` |

### `roles.privileges.actions`

List of custom role actions  that users granted this role can perform: For a list of accepted values, see [Privilege Actions :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/privilege-actions/#database-management-actions) in the MongoDB Manual.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc      | `addShard` |

### `roles.privileges.resource.db`

Database for which the custom role actions apply. An empty string ("") indicates that the privilege actions apply to all databases.

| Value type | Example |
| ---------- | ------- |
| :material-code-string: string | `""` |

### `roles.privileges.resource.collection`

Collection for which the custom role actions apply. An empty string ("") indicates that the privilege actions apply to all of the database's collections.

| Value type | Example |
| ---------- | ------- |
| :material-code-string: string | `""` |

### `roles.privileges.resource.cluster`

If true, the custom role actions apply to all databases and collections in the MongoDB deployment. False by default. If set to true, values for `roles.privileges.resource.db` and `roles.privileges.resource.collection` shouldn't be provided.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `true`     |

### `roles.roles`

An array of roles (with names of the role and the database) from which this role inherits privileges, if any.

| Value type | Example |
| ---------- | ------- |
| :material-text-long: subdoc | <pre>role: read<br>db: admin</pre> |

## <a name="operator-users-section"></a>Users section

The `users` section in the [deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) file contains various configuration options [to configure custom MongoDB users via the Custom Resource](users.md#create-users-in-the-custom-resource).

### `users.name`

The username of the MongoDB user.

| Value type | Example |
| ---------- | ------- |
| :material-code-string: string | `my-user` |

### `users.db`

Database that the user authenticates against.

| Value type | Example |
| ---------- | ------- |
| :material-code-string: string | `admin` |

### `users.passwordSecretRef.name`

Name of the secret that contains the user's password. If `passwordSecretRef` is not present, password will be [generated automatically](operator.md#commonsecret).

| Value type | Example |
| ---------- | ------- |
| :material-code-string: string | `my-user-password` |

### `users.passwordSecretRef.key`

Key in the secret that corresponds to the value of the user's password (`password` by default).

| Value type | Example |
| ---------- | ------- |
| :material-code-string: string | `password` |

### `users.roles.role.name`

Name of the MongoDB role assigned to the user. As [built-in roles](https://www.mongodb.com/docs/manual/reference/built-in-roles/#built-in-roles), so [custom roles](https://github.com/mongodb/mongodb-kubernetes-operator/blob/master/docs/deploy-configure.md#define-a-custom-database-role) are supported.

| Value type | Example |
| ---------- | ------- |
| :material-code-string: string | `clusterAdmin` |

### `users.roles.role.db`

Database that the MongoDB role applies to.

| Value type | Example |
| ---------- | ------- |
| :material-code-string: string | `admin` |

## <a name="operator-backup-section"></a>Backup Section

The `backup` section in the
[deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml)
file contains the following configuration options for the regular
Percona Server for MongoDB backups.

### `backup.enabled`

Enables or disables making backups.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `true`     |

### `backup.image`

The Percona Server for MongoDB Docker image to use for the backup.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `percona/percona-server-mongodb-operator:{{ release }}-backup` |

### `backup.serviceAccountName`

Name of the separate privileged service account for backups; **service account for backups is not used by the Operator any more, and the option is deprecated since the Operator version 1.16.0**.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `percona-server-mongodb-operator` |

### `backup.annotations`

The [Kubernetes annotations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the backup job.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `sidecar.istio.io/inject: "false"` |

### `backup.resources.limits.cpu`

[Kubernetes CPU limit  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for backups.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `300m`     |

### `backup.resources.limits.memory`

[Kubernetes Memory limit  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for backups.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `1.2G`     |

### `backup.resources.requests.cpu`

The [Kubernetes CPU requests  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for backups.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `300m`     |

### `backup.resources.requests.memory`

The [Kubernetes Memory requests  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for backups.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `1G`     |

### 'backup.containerSecurityContext'

A custom [Kubernetes Security Context for a Container :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to be used instead of the default one.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc      | `privileged: false`          |

### `backup.storages.STORAGE-NAME.type`

The cloud storage type used for backups. Only `s3` type is currently supported.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `s3`       |

### `backup.storages.STORAGE-NAME.s3.insecureSkipTLSVerify`

Enable or disable verification of the storage server TLS certificate. Disabling it may be useful e.g. to skip TLS verification for private S3-compatible storage with a self-issued certificate.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `true`     |

### `backup.storages.STORAGE-NAME.s3.credentialsSecret`

The [Kubernetes secret  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/) for backups. It should contain `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` keys.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `my-cluster-name-backup-s3` |

### `backup.storages.STORAGE-NAME.s3.bucket`

The [Amazon S3 bucket  :octicons-link-external-16:](https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingBucket.html) name for backups.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     |            |

### `backup.storages.STORAGE-NAME.s3.prefix`

The path (sub-folder) to the backups inside the [bucket  :octicons-link-external-16:](https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingBucket.html).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `""`       |

### `backup.storages.STORAGE-NAME.s3.uploadPartSize`

The size of data chunks in bytes to be uploaded to the storage bucket (10 MiB by default).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `10485760` |

### `backup.storages.STORAGE-NAME.s3.maxUploadParts`

The maximum number of data chunks to be uploaded to the storage bucket (10000 by default).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `10000`    |

### `backup.storages.STORAGE-NAME.s3.storageClass`

The [storage class name  :octicons-link-external-16:](https://aws.amazon.com/s3/storage-classes) of the S3 storage.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `STANDARD` |

### `backup.storages.STORAGE-NAME.s3.retryer.numMaxRetries`

The maximum number of retries to upload data to S3 storage.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `3`|

### `backup.storages.STORAGE-NAME.s3.retryer.minRetryDelay`

The minimum time in milliseconds to wait till the next retry.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `10`|

### `backup.storages.STORAGE-NAME.s3.retryer.maxRetryDelay`

The maximum time in minutes to wait till the next retry.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int     | `5`|

### `backup.storages.STORAGE-NAME.s3.region`

The [AWS region  :octicons-link-external-16:](https://docs.aws.amazon.com/general/latest/gr/rande.html) to use. Please note **this option is mandatory** for Amazon and all S3-compatible storages.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `us-east-1`|

### `backup.storages.STORAGE-NAME.s3.Url`

The  URL of the S3-compatible storage to be used (not needed for the original Amazon S3 cloud).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     |            |

### `backup.storages.STORAGE-NAME.s3.serverSideEncryption.kmsKeyID`

The [ID of the key stored in the AWS KMS  :octicons-link-external-16:](https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html#kms_keys) used by the Operator for [backups server-side encryption](backups-encryption.md)

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `""`       |

### `backup.storages.STORAGE-NAME.s3.serverSideEncryption.sseAlgorithm`

The key management mode used for [backups server-side encryption](backups-encryption.md) with the encryption keys stored in [AWS KMS  :octicons-link-external-16:](https://aws.amazon.com/kms/) - `aws:kms` is the only supported value for now.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `aws:kms`  |

### `backup.storages.STORAGE-NAME.s3.serverSideEncryption.sseCustomerAlgorithm`

The key management mode for [backups server-side encryption with customer-provided keys](backups-encryption.md) - `AES256` is the only supported value for now.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `AES256`   |

### `backup.storages.STORAGE-NAME.s3.serverSideEncryption.sseCustomerKey`

The locally-stored base64-encoded custom encryption key used by the Operator for [backups server-side encryption](backups-encryption.md) on S3-compatible storages.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `""`       |

### `backup.storages.STORAGE-NAME.azure.credentialsSecret`

The [Kubernetes secret  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/) for backups. It should contain `AZURE_STORAGE_ACCOUNT_NAME` and `AZURE_STORAGE_ACCOUNT_KEY` |

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `my-cluster-azure-secret` |

### `backup.storages.STORAGE-NAME.azure.container`

Name of the [container  :octicons-link-external-16:](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction#containers) for backups.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `my-container` |

### `backup.storages.STORAGE-NAME.azure.prefix`

The path (sub-folder) to the backups inside the [container  :octicons-link-external-16:](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction#containers).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `""`       |

### 'backup.storages.STORAGE-NAME.azure.endpointUrl'

The [private endpoint URL :octicons-link-external-16:](https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-overview) to use instead of the public endpoint.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `https://accountName.blob.core.windows.net` |

### `backup.pitr.enabled`

Enables or disables [point-in-time-recovery functionality](backups-pitr.md).

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `false`    |

### `backup.pitr.oplogOnly`

If true, Percona Backup for MongoDB saves oplog chunks even without the base logical backup snapshot (oplog chunks without a base backup can't be used with logical backups to restore a backup by the Operator, [but can still be useful for manual restore operations  :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/usage/oplog-replay.html)).

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | false      |

### `backup.pitr.oplogSpanMin`

Number of minutes between the uploads of oplogs.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `10`       |

### `backup.pitr.compressionType`

The point-in-time-recovery chunks compression format, [can be gzip, snappy, lz4, pgzip, zstd, s2, or none  :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/point-in-time-recovery.html#incremental-backups).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `gzip`     |

### `backup.pitr.compressionLevel`

The point-in-time-recovery chunks compression level ([higher values result in better but slower compression  :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/point-in-time-recovery.html#incremental-backups)).

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `6`        |

### `backup.configuration.backupOptions.priority`

The list of mongod nodes and their priority for making backups.

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc      | <pre>"localhost:28019": 2.5<br>"localhost:27018": 2.5</pre> |

### `backup.configuration.backupOptions.timeouts.startingStatus`

The wait time in seconds Percona Backup for MongoDB should use to start physical backups on all shards. The 0 (zero) value resets the timeout to the default 33 seconds. 

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `33` |

### `backup.configuration.backupOptions.oplogSpanMin`

The duration (in minutes) of oplog slices saved by Percona Backup for MongoDB with the logical backup snapshot.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `10` |

### `backup.configuration.restoreOptions.batchSize`

The number of documents Percona Backup for MongoDB should buffer.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `500` |

### `backup.configuration.restoreOptions.numInsertionWorkers`

The number of workers that Percona Backup for MongoDB should use to add the documents to buffer.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `10` |

### `backup.configuration.restoreOptions.numDownloadWorkers`

The number of workers that Percona Backup for MongoDB should use to request data chunks from the storage during the restore.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `4` |

### `backup.configuration.restoreOptions.maxDownloadBufferMb`

The maximum size of the in-memory buffer that Percona Backup for MongoDB should use use when downloading files from the S3 storage.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `0` |

### `backup.configuration.restoreOptions.downloadChunkMb`

The size of the data chunk in MB, that Percona Backup for MongoDB should use when downloading from the S3 storage.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `32` |

### `backup.configuration.restoreOptions.mongodLocation`

The custom path to mongod binaries which Percona Backup for MongoDB should use during restore.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `/usr/bin/mongo`     |

### `backup.configuration.restoreOptions.mongodLocationMap`

The list of custom paths to mongod binaries on every node, which Percona Backup for MongoDB should use during restore. 

| Value type  | Example    |
| ----------- | ---------- |
| :material-text-long: subdoc     | <pre>"node01:2017": /usr/bin/mongo<br>"node03:27017": /usr/bin/mongo</pre>     |

### `backup.tasks.name`

The name of the backup.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     |            |

### `backup.tasks.enabled`

Enables or disables this exact backup.

| Value type  | Example    |
| ----------- | ---------- |
| :material-toggle-switch-outline: boolean     | `true`     |

### `backup.tasks.schedule`

The scheduled time to make a backup, specified in the [crontab format  :octicons-link-external-16:](https://en.wikipedia.org/wiki/Cron).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `0 0 \* \* 6` |

### `backup.tasks.keep`

The amount of most recent backups to store. Older backups are automatically deleted. Set `keep` to zero or completely remove it to disable automatic deletion of backups.

| Value type  | Example    |
| ----------- | ---------- |
| :material-numeric-1-box: int         | `3`        |

### `backup.tasks.storageName`

The name of the S3-compatible storage for backups, configured in the storages subsection.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `st-us-west` |

### `backup.tasks.compressionType`

The backup compression format, [can be gzip, snappy, lz4, pgzip, zstd, s2, or none  :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/running.html#starting-a-backup).

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `gzip`     |

### `backup.tasks.compressionLevel`

The backup compression level ([higher values result in better but slower compression  :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/running.html#starting-a-backup)).

| Value type  | Example    |
| ----------- | ---------- |
| :octicons-number-24: int         | `6`        |

### `backup.tasks.type`

The backup type: (can be either `logical` (default) or `physical`; see [the Operator backups official documentation](backups.md#physical) for details.

| Value type  | Example    |
| ----------- | ---------- |
| :material-code-string: string     | `physical` |
