# Custom Resource options

The operator is configured via the spec section of the
[deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) file.

## `metadata`

The metadata part of this file contains the following keys:

* `name` (`my-cluster-name` by default) sets the name of your Percona Server
for MongoDB Cluster; it should include only [URL-compatible characters  :octicons-link-external-16:](https://datatracker.ietf.org/doc/html/rfc3986#section-2.3), not exceed 22 characters, start with an alphabetic character, and end with an alphanumeric character
* `finalizers.delete-psmdb-pods-in-order` if present, activates the [Finalizer  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#finalizers) which controls the proper Pods deletion order in case of the cluster deletion event (on by default)
* `finalizers.delete-psmdb-pvc` if present, activates the [Finalizer  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#finalizers) which deletes appropriate [Persistent Volume Claims  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) after the cluster deletion event (off by default)

## Toplevel `spec` elements

The spec part of the [deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) file contains the following keys and sections:


### `platform`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `kubernetes` |

Override/set the Kubernetes platform: `kubernetes` or `openshift`.

### `pause`

| Value type  | Example    |
| ----------- | ---------- |
| boolean     | `false`    |

Pause/resume: setting it to `true` gracefully stops the cluster, and setting it to `false` after shut down starts the cluster back.

### `unmanaged`

| Value type  | Example    |
| ----------- | ---------- |
| boolean     | `false`    |

Unmanaged site in [cross-site replication](replication.md#operator-replication): setting it to `true` forces the Operator to run the cluster in unmanaged state - nodes do not form replica sets, operator does not control TLS certificates.

### `crVersion`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `{{ release }}` |

Version of the Operator the Custom Resource belongs to.

### `image`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `percona/percona`-`server`-`mongodb:{{ mongodb60recommended }}` |

The Docker image of [Percona Server for MongoDB  :octicons-link-external-16:](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/index.html) to deploy (actual image names can be found [in the list of certified images](images.md#custom-registry-images)).

### `imagePullPolicy`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `Always`   |

The [policy used to update images  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/containers/images/#updating-images).

### `tls.certValidityDuration`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `2160h`    |

The validity duration of the external certificate for cert manager (90 days by default). This value is used only at cluster creation time and can’t be changed for existing clusters.

### `imagePullSecrets.name`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `private`-`registry`-`credentials` |

The [Kubernetes ImagePullSecret  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/#using-imagepullsecrets) to access the [custom registry](custom-registry.md#custom-registry).

### `initImage`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `percona/percona-server-mongodb-operator:{{ release }}` |

An alternative image for the initial Operator installation.

### `initContainerSecurityContext`

| Value type  | Example    |
| ----------- | ---------- |
| subdoc      | `{}`       |

A custom [Kubernetes Security Context for a Container  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) for the initImage (image, which can be used instead of the default one while the initial Operator installation).

### `ClusterServiceDNSSuffix`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `svc.cluster.local` |

The (non-standard) cluster domain to be used as a suffix of the Service name.

### `clusterServiceDNSMode`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `Internal` |

Can be `internal` (local fully-qualified domain names will be used in replset configuration even if the replset is exposed - the default value), `external` (exposed MongoDB instances will use ClusterIP addresses), or `ServiceMesh` (turned on for the exposed Services). Being set, `ServiceMesh` value suprecedes multiCluster settings, and therefore these two modes cannot be combined together.

### `allowUnsafeConfigurations`

| Value type  | Example    |
| ----------- | ---------- |
| boolean     | `false`    |

Prevents users from configuring a cluster with unsafe parameters: starting it with less than 3 replica set instances, with an [even number of replica set instances without additional arbiter](arbiter.md#arbiter), or without TLS/SSL certificates, or running a sharded cluster with less than 3 config server Pods or less than 2 mongos Pods (if `false`, the Operator will automatically change unsafe parameters to safe defaults). **After switching to unsafe configurations permissive mode you will not be able to switch the cluster back by setting `spec.allowUnsafeConfigurations` key to `false`, the flag will be ignored**.

### `updateStrategy`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `SmartUpdate` |

A strategy the Operator uses for [upgrades](update.md#operator-update). Possible values are [SmartUpdate](update.md#operator-update-smartupdates), [RollingUpdate  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#rolling-updates) and [OnDelete  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#on-delete).


### `ignoreAnnotations`

| Value type  | Example    |
| ----------- | ---------- |
| subdoc      | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol` |

The list of annotations [to be ignored](annotations.md#annotations-ignore) by the Operator.

### `ignoreLabels`

| Value type  | Example    |
| ----------- | ---------- |
| subdoc      | `rack`     |

The list of labels [to be ignored](annotations.md#annotations-ignore) by the Operator.

### `multiCluster.enabled`

| Value type  | Example    |
| ----------- | ---------- |
| boolean     | `false`    |

[Multi-cluster Services (MCS)](replication.md#operator-replication-mcs): setting it to `true` enables [MCS cluster mode  :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine/docs/concepts/multi-cluster-services).

### `multiCluster.DNSSuffix`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `svc.clusterset.local` |

The cluster domain to be used as a suffix for [multi-cluster Services](replication.md#operator-replication-mcs) used by Kubernetes (`svc.clusterset.local` [by default  :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine/docs/how-to/multi-cluster-services)).

Also there is a number of sections explained below:

| Section                                                       | Description                                |
| ------------------------------------------------------------- | ------------------------------------------ |
| [upgradeOptions](operator.md#operator-upgradeoptions-section) | Upgrade configuration section              |
| [secrets](operator.md#operator-secrets-section)               | Operator secrets section                   |
| [replsets](operator.md#operator-replsets-section)             | Operator MongoDB Replica Set section       |
| [pmm](operator.md#operator-pmm-section)                       | Percona Monitoring and Management section  |
| [sharding](operator.md#operator-sharding-section)             | MongoDB sharding configuration section     |
| [backup](operator.md#operator-backup-section)                 | Percona Server for MongoDB backups section |

## <a name="operator-upgradeoptions-section"></a>Upgrade Options Section

The `upgradeOptions` section in the [deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) file contains various configuration options to control Percona Server for MongoDB upgrades.

### `upgradeOptions.versionServiceEndpoint`

| Value type  | Example    |
| ----------- | ---------- |
| string      |`https://check.percona.com` |

The Version Service URL used to check versions compatibility for upgrade.

### `upgradeOptions.apply`

| Value type  | Example    |
| ----------- | ---------- |
| string      |`disabled`  |

Specifies how [updates are processed](update.md#operator-update-smartupdates) by the Operator. `Never` or `Disabled` will completely disable automatic upgrades, otherwise it can be set to `Latest` or `Recommended` or to a specific version string of Percona Server for MongoDB (e.g. `{{ mongodb60recommended }}`) that is wished to be version-locked (so that the user can control the version running, but use automatic upgrades to move between them).

### `upgradeOptions.schedule`

| Value type  | Example        |
| ----------- | -------------- |
| string      | `0 2 \* \* \*` |

Scheduled time to check for updates, specified in the [crontab format  :octicons-link-external-16:](https://en.wikipedia.org/wiki/Cron).

### `upgradeOptions.setFCV`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `false`    |

If enabled, [FeatureCompatibilityVersion (FCV)  :octicons-link-external-16:](https://docs.mongodb.com/manual/reference/command/setFeatureCompatibilityVersion/) will be set to match the version during major version upgrade.

## <a name="operator-secrets-section"></a>Secrets section

Each spec in its turn may contain some key-value pairs. The secrets one
has only two of them:



### `secrets.key`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `my-cluster-name-mongodb-key` |

The secret name for the [MongoDB Internal Auth Key  :octicons-link-external-16:](https://docs.mongodb.com/manual/core/security-internal-authentication/). This secret is auto-created by the operator if it doesn’t exist. 


### `secrets.users` |

| Value type  | Example    |
| ----------- | ---------- |
| string      | `my-cluster-name-mongodb-users` |

The name of the Secrets object for the MongoDB users **required to run the operator.** 


### `secrets.ssl`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `my-custom-ssl` |

A secret with TLS certificate generated for *external* communications, see [Transport Layer Security (TLS)](TLS.md#tls) for details 


### `secrets.sslInternal`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `my-custom-ssl-internal` |

A secret with TLS certificate generated for *internal* communications, see [Transport Layer Security (TLS)](TLS.md#tls) for details 


### `secrets.encryptionKey`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `my-cluster-name-mongodb-encryption-key` |

Specifies a secret object with the [encryption key  :octicons-link-external-16:](https://docs.mongodb.com/manual/tutorial/configure-encryption/#local-key-management) 


### `secrets.vault`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `my-cluster-name-vault` |

Specifies a secret object [to provide integration with HashiCorp Vault](encryption.md#using-vault) 

## <a name="operator-replsets-section"></a>Replsets Section

The replsets section controls the MongoDB Replica Set.



### `replsets.name`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `rs 0`     |

The name of the [MongoDB Replica Set  :octicons-link-external-16:](https://docs.mongodb.com/manual/replication/) 


### `replsets.size`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `3`        |

The size of the MongoDB Replica Set, must be >= 3 for [High-Availability  :octicons-link-external-16:](https://docs.mongodb.com/manual/replication/#redundancy-and-data-availability) 


### `replsets.terminationGracePeriodSeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `300`      |

The amount of seconds Kubernetes will wait for a clean replica set Pods termination 


### `replsets.topologySpreadConstraints.labelSelector.matchLabels`

| Value type  | Example    |
| ----------- | ---------- |
| label       | `app.kubernetes.io/name: percona-server-mongodb` |

The Label selector for the [Kubernetes Pod Topology Spread Constraints  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) 


### `replsets.topologySpreadConstraints.maxSkew`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `1`        |

The degree to which Pods may be unevenly distributed under the [Kubernetes Pod Topology Spread Constraints  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) 


### `replsets.topologySpreadConstraints.topologyKey`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `kubernetes.io/hostname` |

The key of node labels for the [Kubernetes Pod Topology Spread Constraints  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) 


### `replsets.topologySpreadConstraints.whenUnsatisfiable`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `DoNotSchedule` |

What to do with a Pod if it doesn't satisfy the [Kubernetes Pod Topology Spread Constraints  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) 


### `replsets.configuration`

| Value type  | Example    |
| ----------- | ---------- |
| string      | <pre>&#124;<br>net:<br>  tls:<br>    mode: preferTLS<br>operationProfiling:<br>  mode: slowOp<br>systemLog:<br>  verbosity: 1<br>storage:<br>  engine: wiredTiger<br>  wiredTiger:<br>    engineConfig:<br>      directoryForIndexes: false<br>      journalCompressor: snappy<br>    collectionConfig:<br>      blockCompressor: snappy<br>    indexConfig:<br>      prefixCompression: true</pre> |

Custom configuration options for mongod. Please refer to the [official manual  :octicons-link-external-16:](https://docs.mongodb.com/manual/reference/configuration-options/) for the full list of options, and [specific  :octicons-link-external-16:](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/rate-limit.html) [Percona  :octicons-link-external-16:](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/inmemory.html) [Server  :octicons-link-external-16:](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/data_at_rest_encryption.html) [for MongoDB  :octicons-link-external-16:](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/log-redaction.html) [docs  :octicons-link-external-16:](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/audit-logging.html). 


### `replsets.affinity.antiAffinityTopologyKey`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `kubernetes.io/hostname` |

The [Kubernetes topologyKey  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#inter-pod-affinity-and-anti-affinity-beta-feature) node affinity constraint for the Replica Set nodes 


### `replsets.affinity.advanced`

| Value type  | Example    |
| ----------- | ---------- |
| subdoc      |            |

In cases where the pods require complex tuning the advanced option turns off the `topologykey` effect. This setting allows the standard Kubernetes affinity constraints of any complexity to be used 


### `replsets.tolerations.key`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `node.alpha.kubernetes.io/unreachable` |

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) key for the Replica Set nodes 


### `replsets.tolerations.operator`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `Exists`   |

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) operator for the Replica Set nodes 


### `replsets.tolerations.effect`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `NoExecute` |

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) effect for the Replica Set nodes 


### `replsets.tolerations.tolerationSeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `6000`     |

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) time limit  for the Replica Set nodes 


### `replsets.priorityClassName`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `high priority` |

The [Kuberentes Pod priority class  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption/#priorityclass)  for the Replica Set nodes 


### `replsets.annotations`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `iam.amazonaws.com/role: role-arn` |

The [Kubernetes annotations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the Replica Set nodes 


### `replsets.labels`

| Value type  | Example    |
| ----------- | ---------- |
| label       | `rack: rack-22` |

The [Kubernetes affinity labels  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/) for the Replica Set nodes 


### `replsets.nodeSelector`

| Value type  | Example    |
| ----------- | ---------- |
| label       | `disktype: ssd` |

The [Kubernetes nodeSelector  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#nodeselector) affinity constraint  for the Replica Set nodes 


### `replsets.storage.engine`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `wiredTiger` |

Sets the storage.engine option <https://docs.mongodb.com/manual/reference/configuration-options/#storage.engine>\`_ for the Replica Set nodes 


### `replsets.storage.wiredTiger.engineConfig.cacheSizeRatio`

| Value type  | Example    |
| ----------- | ---------- |
| float       | `0.5`      |

The ratio used to compute the [storage.wiredTiger.engineConfig.cacheSizeGB option  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/configuration-options/#mongodb-setting-storage.wiredTiger.engineConfig.cacheSizeGB) for the Replica Set nodes 


### `replsets.storage.wiredTiger.engineConfig.directoryForIndexes`

| Value type  | Example    |
| ----------- | ---------- |
| boolean     | `false`    |

Sets the [storage.wiredTiger.engineConfig.directoryForIndexes option  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/configuration-options/#mongodb-setting-storage.wiredTiger.engineConfig.directoryForIndexes) for the Replica Set nodes 


### `replsets.storage.wiredTiger.engineConfig.journalCompressor`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `snappy`   |

Sets the [storage.wiredTiger.engineConfig.journalCompressor option  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/configuration-options/#mongodb-setting-storage.wiredTiger.engineConfig.journalCompressor) for the Replica Set nodes 


### `replsets.storage.wiredTiger.collectionConfig.blockCompressor`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `snappy`   |

Sets the [storage.wiredTiger.collectionConfig.blockCompressor option  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/configuration-options/#mongodb-setting-storage.wiredTiger.collectionConfig.blockCompressor) for the Replica Set nodes 


### `replsets.storage.wiredTiger.indexConfig.prefixCompression`

| Value type  | Example    |
| ----------- | ---------- |
| boolean     | `true`     |

Sets the [storage.wiredTiger.indexConfig.prefixCompression option  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/configuration-options/#mongodb-setting-storage.wiredTiger.indexConfig.prefixCompression) for the Replica Set nodes 


### `replsets.storage.inMemory.engineConfig.inMemorySizeRatio`

| Value type  | Example    |
| ----------- | ---------- |
| float       |  `0.9`     |

The ratio used to compute the [storage.engine.inMemory.inMemorySizeGb option  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/configuration-options/#mongodb-setting-storage.inMemory.engineConfig.inMemorySizeGB) for the Replica Set nodes 


### `replsets.livenessProbe.failureThreshold`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `4`        |

Number of consecutive unsuccessful tries of the [liveness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be undertaken before giving up 


### `replsets.livenessProbe.initialDelaySeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `60`       |

Number of seconds to wait after the container start before initiating the [liveness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes). 


### `replsets.livenessProbe.periodSeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `30`       |

How often to perform a [liveness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) (in seconds) 


### `replsets.livenessProbe.timeoutSeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `10`       |

Number of seconds after which the [liveness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) times out 


### `replsets.livenessProbe.startupDelaySeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `7200`     |

Time after which the liveness probe is failed if the MongoDB instance didn’t finish its full startup yet 


### `replsets.readinessProbe.failureThreshold`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `8`        |

Number of consecutive unsuccessful tries of the [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be undertaken before giving up 


### `replsets.readinessProbe.initialDelaySeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `10`       |

Number of seconds to wait after the container start before initiating the [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) 


### `replsets.readinessProbe.periodSeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `3`        |

How often to perform a [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) (in seconds) 


### `replsets.readinessProbe.successThreshold`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `1`        |

Minimum consecutive successes for the [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be considered successful after having failed 


### `replsets.readinessProbe.timeoutSeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `2`        |

Number of seconds after which the [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) times out 


### `replsets.runtimeClassName`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `image-rc` |

Name of the [Kubernetes Runtime Class  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/containers/runtime-class/) for Replica Set Pods 


### `replsets.sidecars.image`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `busybox`  |

Image for the [custom sidecar container](faq.md#faq-sidecar) for Replica Set Pods 


### `replsets.sidecars.command`

| Value type  | Example    |
| ----------- | ---------- |
| array       | `["/bin/sh"]` |

Command for the [custom sidecar container](faq.md#faq-sidecar) for Replica Set Pods 


### `replsets.sidecars.args`

| Value type  | Example    |
| ----------- | ---------- |
| array       | `["-c", "while true; do echo echo $(date -u) 'test' >> /dev/null; sleep 5;done"]` |

Command arguments for the [custom sidecar container](faq.md#faq-sidecar) for Replica Set Pods 


### `replsets.sidecars.name`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `rs-sidecar-1` |

Name of the [custom sidecar container](faq.md#faq-sidecar) for Replica Set Pods 


### `replsets.sidecars.volumeMounts.mountPath`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `/volume1` |

Mount path of the [custom sidecar container](faq.md#faq-sidecar) volume for Replica Set Pods 


### `replsets.sidecars.volumeMounts.name`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `sidecar-volume-claim` |

Name of the [custom sidecar container](faq.md#faq-sidecar) volume for Replica Set Pods 


### `replsets.sidecarVolumes.name`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `sidecar-config` |

Name of the [custom sidecar container](faq.md#faq-sidecar) volume for Replica Set Pods 


### `replsets.sidecarVolumes.configMap.name`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `myconfigmap` |

Name of the [ConfigMap  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#configmap) for a [custom sidecar container](faq.md#faq-sidecar) volume for Replica Set Pods 


### `replsets.sidecarVolumes.secret.secretName`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `sidecar-secret` |

Name of the [Secret  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#secret) for a [custom sidecar container](faq.md#faq-sidecar) volume for Replica Set Pods 


### `replsets.sidecarPVCs`

| Value type  | Example    |
| ----------- | ---------- |
| subdoc      |            |

[Persistent Volume Claim  :octicons-link-external-16:](https://v1-20.docs.kubernetes.io/docs/concepts/storage/persistent-volumes/) for the [custom sidecar container](faq.md#faq-sidecar) volume for Replica Set Pods 


### `replsets.podDisruptionBudget.maxUnavailable`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `1`        |

The [Kubernetes Pod distribution budget  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/) limit specifying the maximum value for unavailable Pods 


### `replsets.podDisruptionBudget.minAvailable`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `1`        |

The [Kubernetes Pod distribution budget  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/) limit specifying the minimum value for available Pods 


### `replsets.splitHorizons.&lt;replicaset-pod-name&gt;.external`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `rs0-0.mycluster.xyz` |

External URI for [Split-horizon](expose.md#exposing-replica-set-with-split-horizon-dns) for replica set Pods of the exposed cluster 


### `replsets.splitHorizons.&lt;replicaset-pod-name&gt;.external-2`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `rs0-0.mycluster2.xyz` |

External URI for [Split-horizon](expose.md#exposing-replica-set-with-split-horizon-dns) for replica set Pods of the exposed cluster 


### `replsets.expose.enabled`

| Value type  | Example    |
| ----------- | ---------- |
| boolean     | `false`    |

Enable or disable exposing [MongoDB Replica Set  :octicons-link-external-16:](https://docs.mongodb.com/manual/replication/) nodes with dedicated IP addresses 


### `replsets.expose.exposeType`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `ClusterIP`|

The [IP address type  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) to be exposed 


### `replsets.expose.loadBalancerSourceRanges`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `10.0.0.0/8` |

The range of client IP addresses from which the load balancer should be reachable (if not set, there is no limitations) 


### `replsets.expose.serviceAnnotations`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: http` |

The [Kubernetes annotations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the MongoDB mongod daemon 


### `replsets.expose.serviceLabels`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `rack: rack-22` |

The [Kubernetes labels  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) for the MongoDB Replica Set Service 


### `replsets.nonvoting.enabled`

| Value type  | Example    |
| ----------- | ---------- |
| boolean     | `false`    |

Enable or disable creation of [Replica Set non-voting instances](arbiter.md#arbiter-nonvoting) within the cluster 


### `replsets.nonvoting.size`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `1`        |

The number of [Replica Set non-voting instances](arbiter.md#arbiter-nonvoting) within the cluster 


### `replsets.nonvoting.afinity.antiAffinityTopologyKey`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `kubernetes.io/hostname` |

The [Kubernetes topologyKey  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#inter-pod-affinity-and-anti-affinity-beta-feature) node affinity constraint for the non-voting nodes 


### `replsets.nonvoting.affinity.advanced`

| Value type  | Example    |
| ----------- | ---------- |
| subdoc      |            |

In cases where the pods require complex tuning the advanced option turns off the `topologykey` effect. This setting allows the standard Kubernetes affinity constraints of any complexity to be used 


### `replsets.nonvoting.tolerations.key`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `node.alpha.kubernetes.io/unreachable` |

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) key for the non-voting nodes 


### `replsets.nonvoting.tolerations.operator`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `Exists`   |

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) operator for the non-voting nodes 


### `replsets.nonvoting.tolerations.effect`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `NoExecute`|

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) effect for the non-voting nodes 


### `replsets.nonvoting.tolerations.tolerationSeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `6000`     |

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) time limit for the non-voting nodes 


### `replsets.nonvoting.priorityClassName`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `high priority` |

The [Kuberentes Pod priority class  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption/#priorityclass) for the non-voting nodes 


### `replsets.nonvoting.annotations`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `iam.amazonaws.com/role: role-arn` |

The [Kubernetes annotations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the non-voting nodes 


### `replsets.nonvoting.labels`

| Value type  | Example    |
| ----------- | ---------- |
| label       | `rack: rack-22` |

The [Kubernetes affinity labels  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/) for the non-voting nodes 


### `replsets.nonvoting.nodeSelector`

| Value type  | Example    |
| ----------- | ---------- |
| label       | `disktype: ssd` |

The [Kubernetes nodeSelector  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#nodeselector) affinity constraint for the non-voting nodes 


### `replsets.nonvoting.podDisruptionBudget.maxUnavailable`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `1`        |

The [Kubernetes Pod distribution budget  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/) limit specifying the maximum value for unavailable Pods among non-voting nodes 


### `replsets.nonvoting.podDisruptionBudget.minAvailable`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `1`        |

The [Kubernetes Pod distribution budget  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/) limit specifying the minimum value for available Pods among non-voting nodes 


### `replsets.nonvoting.resources.limits.cpu`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `300m`     |

[Kubernetes CPU limit  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for MongoDB container 


### `replsets.nonvoting.resources.limits.memory`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `0.5G`     |

[Kubernetes Memory limit  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for MongoDB container 


### `replsets.nonvoting.resources.requests.cpu`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `300m`     |

The [Kubernetes CPU requests  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for MongoDB container 


### `replsets.nonvoting.resources.requests.memory`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `0.5G`     |

The [Kubernetes Memory requests  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for MongoDB container 


### `replsets.nonvoting.volumeSpec.emptyDir`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `{}`       |

The [Kubernetes emptyDir volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir), i.e. the directory which will be created on a node, and will be accessible to the MongoDB Pod containers 


### `replsets.nonvoting.volumeSpec.hostPath.path`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `/data`    |

[Kubernetes hostPath volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath), i.e. the file or directory of a node that will be accessible to the MongoDB Pod containers 


### `replsets.nonvoting.volumeSpec.hostPath.type`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `Directory`|

The [Kubernetes hostPath volume type  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath) 


### `replsets.nonvoting.volumeSpec.persistentVolumeClaim.annotations`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: http` |

The [Kubernetes annotations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for [Persistent Volume Claim  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) 


### `replsets.nonvoting.volumeSpec.persistentVolumeClaim.labels`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `rack: rack-22` |

The [Kubernetes labels  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) metadata for [Persistent Volume Claim  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) 


### `replsets.nonvoting.volumeSpec.persistentVolumeClaim.storageClassName`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `standard` |

The [Kubernetes Storage Class  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/storage-classes/) to use with the MongoDB container [Persistent Volume Claim  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) for the non-voting nodes. Use Storage Class with XFS as the default filesystem if possible, [for better MongoDB performance  :octicons-link-external-16:](https://dba.stackexchange.com/questions/190578/is-xfs-still-the-best-choice-for-mongodb 


### `replsets.nonvoting.volumeSpec.persistentVolumeClaim.accessModes`

| Value type  | Example    |
| ----------- | ---------- |
| array       | `[ "ReadWriteOnce" ]` |

The [Kubernetes Persistent Volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) access modes for the MongoDB container for the non-voting nodes


### `replsets.nonvoting.volumeSpec.persistentVolumeClaim.resources.requests.storage`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `3Gi`      |

The [Kubernetes Persistent Volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) size for the MongoDB container for the non-voting nodes 


### `replsets.arbiter.enabled`

| Value type  | Example    |
| ----------- | ---------- |
| boolean     | `false`    |

Enable or disable creation of [Replica Set Arbiter  :octicons-link-external-16:](https://docs.mongodb.com/manual/core/replica-set-arbiter/) nodes within the cluster 


### `replsets.arbiter.size`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `1`        |

The number of [Replica Set Arbiter  :octicons-link-external-16:](https://docs.mongodb.com/manual/core/replica-set-arbiter/) instances within the cluster 


### `replsets.arbiter.afinity.antiAffinityTopologyKey`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `kubernetes.io/hostname` |

The [Kubernetes topologyKey  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#inter-pod-affinity-and-anti-affinity-beta-feature) node affinity constraint for the Arbiter 


### `replsets.arbiter.affinity.advanced`

| Value type  | Example    |
| ----------- | ---------- |
| subdoc      |            |

In cases where the pods require complex tuning the advanced option turns off the `topologykey` effect. This setting allows the standard Kubernetes affinity constraints of any complexity to be used 


### `replsets.arbiter.tolerations.key`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `node.alpha.kubernetes.io/unreachable` |

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) key for the Arbiter nodes 


### `replsets.arbiter.tolerations.operator`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `Exists`   |

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) operator for the Arbiter nodes 


### `replsets.arbiter.tolerations.effect`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `NoExecute`|

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) effect for the Arbiter nodes 


### `replsets.arbiter.tolerations.tolerationSeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `6000`     |

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) time limit for the Arbiter nodes 


### `replsets.arbiter.priorityClassName`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `high priority` |

The [Kuberentes Pod priority class  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption/#priorityclass) for the Arbiter nodes 


### `replsets.arbiter.annotations`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `iam.amazonaws.com/role: role-arn` |

The [Kubernetes annotations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the Arbiter nodes 


### `replsets.arbiter.labels`

| Value type  | Example    |
| ----------- | ---------- |
| label       | `rack: rack-22` |

The [Kubernetes affinity labels  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/) for the Arbiter nodes 


### `replsets.arbiter.nodeSelector`

| Value type  | Example    |
| ----------- | ---------- |
| label       | `disktype: ssd` |

The [Kubernetes nodeSelector  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#nodeselector) affinity constraint for the Arbiter nodes 


### `replsets.resources.limits.cpu`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `300m`     |

[Kubernetes CPU limit  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for MongoDB container 


### `replsets.resources.limits.memory`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `0.5G`     |

[Kubernetes Memory limit  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for MongoDB container 


### `replsets.resources.requests.cpu`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `300m`     |

The [Kubernetes CPU requests  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for MongoDB container 


### `replsets.resources.requests.memory`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `0.5G`     |

The [Kubernetes Memory requests  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for MongoDB container 


### `replsets.volumeSpec.emptyDir`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `{}`       |

The [Kubernetes emptyDir volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir), i.e. the directory which will be created on a node, and will be accessible to the MongoDB Pod containers 


### `replsets.volumeSpec.hostPath.path`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `/data`    |

[Kubernetes hostPath volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath), i.e. the file or directory of a node that will be accessible to the MongoDB Pod containers 


### `replsets.volumeSpec.hostPath.type`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `Directory`|

The [Kubernetes hostPath volume type  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath) 


### `replsets.volumeSpec.persistentVolumeClaim.annotations`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: http` |

The [Kubernetes annotations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for [Persistent Volume Claim  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) 


### `replsets.volumeSpec.persistentVolumeClaim.labels`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `rack: rack-22` |

The [Kubernetes labels  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) metadata for [Persistent Volume Claim  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) 


### `replsets.volumeSpec.persistentVolumeClaim.storageClassName`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `standard` |

The [Kubernetes Storage Class  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/storage-classes/) to use with the MongoDB container [Persistent Volume Claim  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims). Use Storage Class with XFS as the default filesystem if possible, [for better MongoDB performance  :octicons-link-external-16:](https://dba.stackexchange.com/questions/190578/is-xfs-still-the-best-choice-for-mongodb) 


### `replsets.volumeSpec.persistentVolumeClaim.accessModes`

| Value type  | Example    |
| ----------- | ---------- |
| array       | `[ "ReadWriteOnce" ]` |

The [Kubernetes Persistent Volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) access modes for the MongoDB container 


### `replsets.volumeSpec.persistentVolumeClaim.resources.requests.storage`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `3Gi`      |

The [Kubernetes Persistent Volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) size for the MongoDB container 


### `replsets.hostAliases.ip`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `"10.10.0.2"` |

The IP address for [Kubernetes host aliases  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/network/customize-hosts-file-for-pods/) for replica set Pods 


### `replsets.hostAliases.hostnames`

| Value type  | Example    |
| ----------- | ---------- |
| subdoc      |            |

Hostnames for [Kubernetes host aliases  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/network/customize-hosts-file-for-pods/) for replica set Pods 

## <a name="operator-pmm-section"></a>PMM Section

The `pmm` section in the deploy/cr.yaml file contains configuration
options for Percona Monitoring and Management.



### `pmm.enabled`

| Value type  | Example    |
| ----------- | ---------- |
| boolean     | `false`    |

Enables or disables monitoring Percona Server for MongoDB with [PMM  :octicons-link-external-16:](https://www.percona.com/doc/percona-monitoring-and-managementindex.metrics-monitor.dashboard.html) 


### `pmm.image`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `percona/pmm-client:{{ pmm2recommended }}` |

PMM Client docker image to use 


### `pmm.serverHost`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `monitoring-service` |

Address of the PMM Server to collect data from the Cluster 


### `pmm.mongodParams`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `--environment=DEV-ENV --custom-labels=DEV-ENV` |

Additional parameters which will be passed to the [pmm-admin add mongodb  :octicons-link-external-16:](https://www.percona.com/doc/percona-monitoring-and-management/2.x/setting-up/client/mongodb.html#adding-mongodb-service-monitoring) command for `mongod` Pods 


### `pmm.mongosParams`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `--environment=DEV-ENV --custom-labels=DEV-ENV` |

Additional parameters which will be passed to the [pmm-admin add mongodb  :octicons-link-external-16:](https://www.percona.com/doc/percona-monitoring-and-management/2.x/setting-up/client/mongodb.html#adding-mongodb-service-monitoring) command for `mongos` Pods 

## <a name="operator-sharding-section"></a>Sharding Section

The `sharding` section in the deploy/cr.yaml file contains configuration
options for Percona Server for MondoDB [sharding](sharding.md#operator-sharding).



### `sharding.enabled`

| Value type  | Example    |
| ----------- | ---------- |
| boolean     | `true`     |

Enables or disables [Percona Server for MondoDB sharding  :octicons-link-external-16:](https://docs.mongodb.com/manual/sharding/) 


### `sharding.configsvrReplSet.size`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `3`        |

The number of [Config Server instances  :octicons-link-external-16:](https://docs.mongodb.com/manual/core/sharded-cluster-config-servers/) within the cluster 


### `sharding.configsvrReplSet.terminationGracePeriodSeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `300`      |

The amount of seconds Kubernetes will wait for a clean config server Pods termination 


### `sharding.configsvrReplSet.topologySpreadConstraints.labelSelector.matchLabels`

| Value type  | Example    |
| ----------- | ---------- |
| label       | `app.kubernetes.io/name: percona-server-mongodb` |

The Label selector for the [Kubernetes Pod Topology Spread Constraints  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) 


### `sharding.configsvrReplSet.topologySpreadConstraints.maxSkew`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `1`        |

The degree to which Pods may be unevenly distributed under the [Kubernetes Pod Topology Spread Constraints  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) 


### `sharding.configsvrReplSet.topologySpreadConstraints.topologyKey`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `kubernetes.io/hostname` |

The key of node labels for the [Kubernetes Pod Topology Spread Constraints  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) 


### `sharding.configsvrReplSet.topologySpreadConstraints.whenUnsatisfiable`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `DoNotSchedule` |

What to do with a Pod if it doesn't satisfy the [Kubernetes Pod Topology Spread Constraints  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) 


### `sharding.configsvrReplSet.configuration`

| Value type  | Example    |
| ----------- | ---------- |
| string      | <pre>&#124;<br>operationProfiling:<br>  mode: slowOp<br>systemLog:<br>  verbosity: 1</pre> |

Custom configuration options for Config Servers. Please refer to the [official manual  :octicons-link-external-16:](https://docs.mongodb.com/manual/reference/configuration-options/) for the full list of options 


### `sharding.configsvrReplSet.livenessProbe.failureThreshold`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `4`        |

Number of consecutive unsuccessful tries of the [liveness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be undertaken before giving up 


### `sharding.configsvrReplSet.livenessProbe.initialDelaySeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `60`       |

Number of seconds to wait after the container start before initiating the [liveness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) 


### `sharding.configsvrReplSet.livenessProbe.periodSeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `30`       |

How often to perform a [liveness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) (in seconds) 


### `sharding.configsvrReplSet.livenessProbe.timeoutSeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `10`       |

Number of seconds after which the [liveness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) times out 


### `sharding.configsvrReplSet.livenessProbe.startupDelaySeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `7200`     |

Time after which the liveness probe is failed if the MongoDB instance didn’t finish its full startup yet 


### `sharding.configsvrReplSet.readinessProbe.failureThreshold`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `3`        |

Number of consecutive unsuccessful tries of the [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be undertaken before giving up 


### `sharding.configsvrReplSet.readinessProbe.initialDelaySeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `10`       |

Number of seconds to wait after the container start before initiating the [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) 


### `sharding.configsvrReplSet.readinessProbe.periodSeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `3`        |

How often to perform a [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) (in seconds) 


### `sharding.configsvrReplSet.readinessProbe.successThreshold`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `1`        |

Minimum consecutive successes for the [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be considered successful after having failed 


### `sharding.configsvrReplSet.readinessProbe.timeoutSeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `2`        |

Number of seconds after which the [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) times out 


### `sharding.configsvrReplSet.runtimeClassName`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `image-rc` |

Name of the [Kubernetes Runtime Class  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/containers/runtime-class/) for Config Server Pods 


### `sharding.configsvrReplSet.sidecars.image`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `busybox`  |

Image for the [custom sidecar container](faq.md#faq-sidecar) for Config Server Pods 


### `sharding.configsvrReplSet.sidecars.command`

| Value type  | Example    |
| ----------- | ---------- |
| array       | `["/bin/sh"]` |

Command for the [custom sidecar container](faq.md#faq-sidecar) for Config Server Pods 


### `sharding.configsvrReplSet.sidecars.args`

| Value type  | Example    |
| ----------- | ---------- |
| array       | `["-c", "while true; do echo echo $(date -u) 'test' >> /dev/null; sleep 5;done"]` |

Command arguments for the [custom sidecar container](faq.md#faq-sidecar) for Config Server Pods 


### `sharding.configsvrReplSet.sidecars.name`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `rs-sidecar-1` |

Name of the [custom sidecar container](faq.md#faq-sidecar) for Config Server Pods 


### `sharding.configsvrReplSet.limits.cpu`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `300m`     |

[Kubernetes CPU limit  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for Config Server container 


### `sharding.configsvrReplSet.limits.memory`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `0.5G`     |

[Kubernetes Memory limit  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for Config Server container 


### `sharding.configsvrReplSet.resources.requests.cpu`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `300m`     |

The [Kubernetes CPU requests  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for Config Server container 


### `sharding.configsvrReplSet.requests.memory`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `0.5G`     |

The [Kubernetes Memory requests  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for Config Server container 


### `sharding.configsvrReplSet.expose.enabled`

| Value type  | Example    |
| ----------- | ---------- |
| boolean     | `false`    |

Enable or disable exposing [Config Server  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/core/sharded-cluster-config-servers/) nodes with dedicated IP addresses 


### `sharding.configsvrReplSet.expose.exposeType`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `ClusterIP`|

The [IP address type  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) to be exposed 


### `sharding.configsvrReplSet.expose.loadBalancerSourceRanges`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `10.0.0.0/8` |

The range of client IP addresses from which the load balancer should be reachable (if not set, there is no limitations) 


### `sharding.configsvrReplSet.expose.serviceAnnotations`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: http` |

The [Kubernetes annotations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the Config Server daemon 


### `sharding.configsvrReplSet.expose.serviceLabels`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `rack: rack-22` |

The [Kubernetes labels  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) for the Config Server Service 


### `sharding.configsvrReplSet.volumeSpec.emptyDir`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `{}`       |

The [Kubernetes emptyDir volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir), i.e. the directory which will be created on a node, and will be accessible to the Config Server Pod containers 


### `sharding.configsvrReplSet.volumeSpec.hostPath.path`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `/data`    |

[Kubernetes hostPath volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath), i.e. the file or directory of a node that will be accessible to the Config Server Pod containers 


### `sharding.configsvrReplSet.volumeSpec.hostPath.type`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `Directory`|

The [Kubernetes hostPath volume type  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath) 


### `sharding.configsvrReplSet.volumeSpec.persistentVolumeClaim.annotations`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: http` |

The [Kubernetes annotations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for [Persistent Volume Claim  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) 


### `sharding.configsvrReplSet.volumeSpec.persistentVolumeClaim.labels`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `rack: rack-22` |

The [Kubernetes labels  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) metadata for [Persistent Volume Claim  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) 


### `sharding.configsvrReplSet.volumeSpec.persistentVolumeClaim.storageClassName`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `standard` |

The [Kubernetes Storage Class  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/storage-classes/) to use with the Config Server container [Persistent Volume Claim  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims). Use Storage Class with XFS as the default filesystem if possible, [for better MongoDB performance  :octicons-link-external-16:](https://dba.stackexchange.com/questions/190578/is-xfs-still-the-best-choice-for-mongodb) 


### `sharding.configsvrReplSet.volumeSpec.persistentVolumeClaim.accessModes`

| Value type  | Example    |
| ----------- | ---------- |
| array       | `[ "ReadWriteOnce" ]` |

The [Kubernetes Persistent Volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) access modes for the Config Server container 


### `sharding.configsvrReplSet.volumeSpec.persistentVolumeClaim.resources.requests.storage`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `3Gi`      |

The [Kubernetes Persistent Volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) size for the Config Server container 


### `sharding.configsvrReplSet.hostAliases.ip`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `"10.10.0.2"` |

The IP address for [Kubernetes host aliases  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/network/customize-hosts-file-for-pods/) for replica set Pods 


### `sharding.configsvrReplSet.hostAliases.hostnames`

| Value type  | Example    |
| ----------- | ---------- |
| subdoc      |            |

Hostnames for [Kubernetes host aliases  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/network/customize-hosts-file-for-pods/) for config server Pods 


### `sharding.mongos.size`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `3`        |

The number of [mongos  :octicons-link-external-16:](https://docs.mongodb.com/manual/core/sharded-cluster-query-router/) instances within the cluster 


### `sharding.mongos.terminationGracePeriodSeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `300`      |

The amount of seconds Kubernetes will wait for a clean mongos Pods termination 


### `sharding.mongos.topologySpreadConstraints.labelSelector.matchLabels`

| Value type  | Example    |
| ----------- | ---------- |
| label       | `app.kubernetes.io/name: percona-server-mongodb` |

The Label selector for the [Kubernetes Pod Topology Spread Constraints  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) 


### `sharding.mongos.topologySpreadConstraints.maxSkew`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `1`        |

The degree to which Pods may be unevenly distributed under the [Kubernetes Pod Topology Spread Constraints  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) 


### `sharding.mongos.topologySpreadConstraints.topologyKey`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `kubernetes.io/hostname` |

The key of node labels for the [Kubernetes Pod Topology Spread Constraints  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) 


### `sharding.mongos.topologySpreadConstraints.whenUnsatisfiable`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `DoNotSchedule` |

What to do with a Pod if it doesn't satisfy the [Kubernetes Pod Topology Spread Constraints  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) 


### `sharding.mongos.configuration`

| Value type  | Example    |
| ----------- | ---------- |
| string      | <pre>&#124;<br>systemLog:<br>  verbosity: 1</pre> |

Custom configuration options for mongos. Please refer to the [official manual  :octicons-link-external-16:](https://docs.mongodb.com/manual/reference/configuration-options/) for the full list of options 


### `sharding.mongos.afinity.antiAffinityTopologyKey`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `kubernetes.io/hostname` |

The [Kubernetes topologyKey  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#inter-pod-affinity-and-anti-affinity-beta-feature) node affinity constraint for mongos 


### `sharding.mongos.affinity.advanced`

| Value type  | Example    |
| ----------- | ---------- |
| subdoc      |            |

In cases where the Pods require complex tuning the advanced option turns off the `topologykey` effect. This setting allows the standard Kubernetes affinity constraints of any complexity to be used 


### `sharding.mongos.tolerations.key`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `node.alpha.kubernetes.io/unreachable` |

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) key for mongos instances 


### `sharding.mongos.tolerations.operator`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `Exists`   |

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) operator for mongos instances 


### `sharding.mongos.tolerations.effect`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `NoExecute`|

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) effect for mongos instances 


### `sharding.mongos.tolerations.tolerationSeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `6000`     |

The [Kubernetes Pod tolerations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) time limit for mongos instances 


### `sharding.mongos.priorityClassName`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `high priority` |

The [Kuberentes Pod priority class  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption/#priorityclass) for mongos instances 


### `sharding.mongos.annotations`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `iam.amazonaws.com/role: role-arn` |

The [Kubernetes annotations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the mongos instances 


### `sharding.mongos.labels`

| Value type  | Example    |
| ----------- | ---------- |
| label       | `rack: rack-22` |

The [Kubernetes affinity labels  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/) for mongos instances 


### `sharding.mongos.nodeSelector`

| Value type  | Example    |
| ----------- | ---------- |
| label       | `disktype: ssd` |

The [Kubernetes nodeSelector  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#nodeselector) affinity constraint for mongos instances 


### `sharding.mongos.livenessProbe.failureThreshold`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `4`        |

Number of consecutive unsuccessful tries of the [liveness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be undertaken before giving up 


### `sharding.mongos.livenessProbe.initialDelaySeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `60`       |

Number of seconds to wait after the container start before initiating the [liveness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) 


### `sharding.mongos.livenessProbe.periodSeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `30`       |

How often to perform a [liveness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) (in seconds) 


### `sharding.mongos.livenessProbe.timeoutSeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `10`       |

Number of seconds after which the [liveness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) times out 


### `sharding.mongos.livenessProbe.startupDelaySeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `7200`     |

Time after which the liveness probe is failed if the MongoDB instance didn’t finish its full startup yet 


### `sharding.mongos.readinessProbe.failureThreshold`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `3`        |

Number of consecutive unsuccessful tries of the [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be undertaken before giving up 


### `sharding.mongos.readinessProbe.initialDelaySeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `10`       |

Number of seconds to wait after the container start before initiating the [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) 


### `sharding.mongos.readinessProbe.periodSeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `3`        |

How often to perform a [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) (in seconds) 


### `sharding.mongos.readinessProbe.successThreshold`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `1`        |

Minimum consecutive successes for the [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be considered successful after having failed 


### `sharding.mongos.readinessProbe.timeoutSeconds`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `2`        |

Number of seconds after which the [readiness probe  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) times out 


### `sharding.mongos.runtimeClassName`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `image-rc` |

Name of the [Kubernetes Runtime Class  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/containers/runtime-class/) for mongos Pods 


### `sharding.mongos.sidecars.image`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `busybox`  |

Image for the [custom sidecar container](faq.md#faq-sidecar) for mongos Pods 


### `sharding.mongos.sidecars.command`

| Value type  | Example    |
| ----------- | ---------- |
| array       | `["/bin/sh"]` |

Command for the [custom sidecar container](faq.md#faq-sidecar) for mongos Pods 


### `sharding.mongos.sidecars.args`

| Value type  | Example    |
| ----------- | ---------- |
| array       | `["-c", "while true; do echo echo $(date -u) 'test' >> /dev/null; sleep 5;done"]` |

Command arguments for the [custom sidecar container](faq.md#faq-sidecar) for mongos Pods 


### `sharding.mongos.sidecars.name`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `rs-sidecar-1` |

Name of the [custom sidecar container](faq.md#faq-sidecar) for mongos Pods 


### `sharding.mongos.limits.cpu`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `300m`     |

[Kubernetes CPU limit  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for mongos container 


### `sharding.mongos.limits.memory`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `0.5G`     |

[Kubernetes Memory limit  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for mongos container 


### `sharding.mongos.resources.requests.cpu`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `300m`     |

The [Kubernetes CPU requests  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for mongos container 


### `sharding.mongos.requests.memory`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `0.5G`     |

The [Kubernetes Memory requests  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for mongos container 


### `sharding.mongos.expose.exposeType`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `ClusterIP`|

The [IP address type  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) to be exposed 


### `sharding.mongos.expose.servicePerPod`

| Value type  | Example    |
| ----------- | ---------- |
| boolean     | `true`     |

If set to `true`, a separate ClusterIP Service is created for each mongos instance 


### `sharding.mongos.expose.loadBalancerSourceRanges`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `10.0.0.0/8` |

The range of client IP addresses from which the load balancer should be reachable (if not set, there is no limitations) 


### `sharding.mongos.expose.serviceAnnotations`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: http` |

The [Kubernetes annotations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the MongoDB mongos daemon 


### `sharding.mongos.expose.serviceLabels`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `rack: rack-22` |

The [Kubernetes labels  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) for the MongoDB mongos Service 


### `sharding.mongos.hostAliases.ip`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `"10.10.0.2"` |

The IP address for [Kubernetes host aliases  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/network/customize-hosts-file-for-pods/) for mongos Pods 


### `sharding.mongos.hostAliases.hostnames`

| Value type  | Example    |
| ----------- | ---------- |
| subdoc      |            |

Hostnames for [Kubernetes host aliases  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/network/customize-hosts-file-for-pods/) for mongos   Pods 

## <a name="operator-backup-section"></a>Backup Section

The `backup` section in the
[deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml)
file contains the following configuration options for the regular
Percona Server for MongoDB backups.



### `backup.enabled`

| Value type  | Example    |
| ----------- | ---------- |
| boolean     | `true`     |

Enables or disables making backups 


### `backup.image`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `percona/percona-server-mongodb-operator:{{ release }}-backup` |

The Percona Server for MongoDB Docker image to use for the backup 


### `backup.serviceAccountName`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `percona-server-mongodb-operator` |

Name of the separate privileged service account used by the Operator 


### `backup.annotations`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `sidecar.istio.io/inject: "false"` |

The [Kubernetes annotations  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the backup job 


### `backup.resources.limits.cpu`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `100m`     |

[Kubernetes CPU limit  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for backups 


### `backup.resources.limits.memory`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `0.2G`     |

[Kubernetes Memory limit  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for backups 


### `backup.resources.requests.cpu`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `100m`     |

The [Kubernetes CPU requests  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for backups 


### `backup.resources.requests.memory`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `0.1G`     |

The [Kubernetes Memory requests  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for backups 


### `backup.storages.&lt;storage-name&gt;.type`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `s3`       |

The cloud storage type used for backups. Only `s3` type is currently supported 


### `backup.storages.&lt;storage-name&gt;.s3.insecureSkipTLSVerify`

| Value type  | Example    |
| ----------- | ---------- |
| boolean     | `true`     |

Enable or disable verification of the storage server TLS certificate. Disabling it may be useful e.g. to skip TLS verification for private S3-compatible storage with a self-issued certificate 


### `backup.storages.&lt;storage-name&gt;.s3.credentialsSecret`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `my-cluster-name-backup-s3` |

The [Kubernetes secret  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/) for backups. It should contain `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` keys. 


### `backup.storages.&lt;storage-name&gt;.s3.bucket`

| Value type  | Example    |
| ----------- | ---------- |
| string      |            |

The [Amazon S3 bucket  :octicons-link-external-16:](https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingBucket.html) name for backups 


### `backup.storages.&lt;storage-name&gt;.s3.prefix`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `""`       |

The path (sub-folder) to the backups inside the [bucket  :octicons-link-external-16:](https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingBucket.html) 


### `backup.storages.&lt;storage-name&gt;.s3.uploadPartSize`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `10485760` |

The size of data chunks in bytes to be uploaded to the storage bucket (10 MiB by default) 


### `backup.storages.&lt;storage-name&gt;.s3.maxUploadParts`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `10000`    |

The maximum number of data chunks to be uploaded to the storage bucket (10000 by default) 


### `backup.storages.&lt;storage-name&gt;.s3.storageClass`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `STANDARD` |

The [storage class name  :octicons-link-external-16:](https://aws.amazon.com/s3/storage-classes) of the S3 storage 


### `backup.storages.&lt;storage-name&gt;.s3.region`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `us-east-1`|

The [AWS region  :octicons-link-external-16:](https://docs.aws.amazon.com/general/latest/gr/rande.html) to use. Please note **this option is mandatory** for Amazon and all S3-compatible storages 


### `backup.storages.&lt;storage-name&gt;.s3.endpointUrl`

| Value type  | Example    |
| ----------- | ---------- |
| string      |            |

The endpoint URL of the S3-compatible storage to be used (not needed for the original Amazon S3 cloud) 


### `backup.storages.&lt;storage-name&gt;.s3.serverSideEncryption.kmsKeyID`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `""`       |

The [ID of the key stored in the AWS KMS  :octicons-link-external-16:](https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html#kms_keys) used by the Operator for [backups server-side encryption](backups-encryption.md)


### `backup.storages.&lt;storage-name&gt;.s3.serverSideEncryption.sseAlgorithm`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `aws:kms`  |

The key management mode used for [backups server-side encryption](backups-encryption.md) with the encryption keys stored in [AWS KMS  :octicons-link-external-16:](https://aws.amazon.com/kms/) - `aws:kms` is the only supported value for now 


### `backup.storages.&lt;storage-name&gt;.s3.serverSideEncryption.sseCustomerAlgorithm`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `AES256`   |

The key management mode for [backups server-side encryption with customer-provided keys](backups-encryption.md) - `AES256` is the only supported value for now


### `backup.storages.&lt;storage-name&gt;.s3.serverSideEncryption.sseCustomerKey`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `""`       |

The locally-stored base64-encoded custom encryption key used by the Operator for [backups server-side encryption](backups-encryption.md) on S3-compatible storages 


### `backup.storages.&lt;storage-name&gt;.azure.credentialsSecret`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `my-cluster-azure-secret` |

The [Kubernetes secret  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/) for backups. It should contain `AZURE_STORAGE_ACCOUNT_NAME` and `AZURE_STORAGE_ACCOUNT_KEY` |


### `backup.storages.&lt;storage-name&gt;.azure.container`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `my-container` |

Name of the [container  :octicons-link-external-16:](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction#containers) for backups 


### `backup.storages.&lt;storage-name&gt;.azure.prefix`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `""`       |

The path (sub-folder) to the backups inside the [container  :octicons-link-external-16:](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction#containers) 


### `backup.pitr.enabled`

| Value type  | Example    |
| ----------- | ---------- |
| boolean     | `false`    |

Enables or disables [point-in-time-recovery functionality](backups.md#backups-pitr-oplog) 


### `backup.pitr.oplogOnly`

| Value type  | Example    |
| ----------- | ---------- |
| boolean     | false      |

If true, Percona Backup for MongoDB saves oplog chunks even without the base logical backup snapshot (oplog chunks without a base backup can't be used with logical backups to restore a backup by the Operator, [but can still be useful for manual restore operations  :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/usage/oplog-replay.html)) 


### `backup.pitr.oplogSpanMin`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `10`       |

Number of minutes between the uploads of oplogs 


### `backup.pitr.compressionType`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `gzip`     |

The point-in-time-recovery chunks compression format, [can be gzip, snappy, lz4, pgzip, zstd, s2, or none  :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/point-in-time-recovery.html#incremental-backups) 


### `backup.pitr.compressionLevel`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `6`        |

The point-in-time-recovery chunks compression level ([higher values result in better but slower compression  :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/point-in-time-recovery.html#incremental-backups)) 


### `backup.tasks.name`

| Value type  | Example    |
| ----------- | ---------- |
| string      |            |

The name of the backup 


### `backup.tasks.enabled`

| Value type  | Example    |
| ----------- | ---------- |
| boolean     | `true`     |

Enables or disables this exact backup 


### `backup.tasks.schedule`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `0 0 \* \* 6` |

The scheduled time to make a backup, specified in the [crontab format  :octicons-link-external-16:](https://en.wikipedia.org/wiki/Cron) 


### `backup.tasks.keep`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `3`        |

The amount of most recent backups to store. Older backups are automatically deleted. Set `keep` to zero or completely remove it to disable automatic deletion of backups 


### `backup.tasks.storageName`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `st-us-west` |

The name of the S3-compatible storage for backups, configured in the storages subsection 


### `backup.tasks.compressionType`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `gzip`     |

The backup compression format, [can be gzip, snappy, lz4, pgzip, zstd, s2, or none  :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/running.html#starting-a-backup) 


### `backup.tasks.compressionLevel`

| Value type  | Example    |
| ----------- | ---------- |
| int         | `6`        |

The backup compression level ([higher values result in better but slower compression  :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/running.html#starting-a-backup)) 


### `backup.tasks.type`

| Value type  | Example    |
| ----------- | ---------- |
| string      | `physical` |

The backup type: (can be either `logical` (default) or `physical`; see [the Operator backups official documentation](backups.md#physical) for details |
