# Custom Resource options

The operator is configured via the spec section of the
[deploy/cr.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) file.

The metadata part of this file contains the following keys:


* `name` (`my-cluster-name` by default) sets the name of your Percona Server
for MongoDB Cluster; it should include only [URL-compatible characters](https://datatracker.ietf.org/doc/html/rfc3986#section-2.3), not exceed 22 characters, start with an alphabetic character, and end with an alphanumeric character
* `finalizers.delete-psmdb-pods-in-order` if present, activates the [Finalizer](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#finalizers) which controls the proper Pods deletion order in case of the cluster deletion event (on by default)
* `finalizers.delete-psmdb-pvc` if present, activates the [Finalizer](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#finalizers) which deletes appropriate [Persistent Volume Claims](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) after the cluster deletion event (off by default)

The spec part of the [deploy/cr.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) file contains the following sections:

| Key             | Value type         | Default      | Description |
| --------------- | ------------------ | ------------ | ----------- |
| platform        | string             | `kubernetes` | Override/set the Kubernetes platform: *kubernetes* or *openshift* |
| pause           | boolean            | `false`      | Pause/resume: setting it to `true` gracefully stops the cluster, and setting it to `false` after shut down starts the cluster back. |
| unmanaged       | boolean            | `false`      | Unmanaged site in [cross-site replication](replication.md#operator-replication): setting it to `true` forces the Operator to run the cluster in unmanaged state - nodes do not form replica sets, operator does not control TLS certificates |
| crVersion       | string             | `{{ release }}`     | Version of the Operator the Custom Resource belongs to |
| image           | string             | `percona/percona`-`server`-`mongodb:{{ mongodb60recommended }}` | The Docker image of [Percona Server for MongoDB](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/index.html) to deploy (actual image names can be found [in the list of certified images](images.md#custom-registry-images)) |
| imagePullPolicy | string             | `Always`     | The [policy used to update images](https://kubernetes.io/docs/concepts/containers/images/#updating-images) |
| tls.certValidityDuration  | string   | `2160h`      | The validity duration of the external certificate for cert manager (90 days by default). This value is used only at cluster creation time and can’t be changed for existing clusters |
| imagePullSecrets.name     | string   | `private`-`registry`-`credentials` | The [Kubernetes ImagePullSecret](https://kubernetes.io/docs/concepts/configuration/secret/#using-imagepullsecrets) to access the [custom registry](custom-registry.md#custom-registry) |
| initImage                 | string   | `percona/percona-server-mongodb-operator:{{ release }}` | An alternative image for the initial Operator installation |
| initContainerSecurityContext | subdoc| `{}`         | A custom [Kubernetes Security Context for a Container](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) for the initImage (image, which can be used instead of the default one while the initial Operator installation) |
| ClusterServiceDNSSuffix   | string   | `svc.cluster.local` | The (non-standard) cluster domain to be used as a suffix of the Service name |
| clusterServiceDNSMode     | string   | `Internal`   | Can be `internal` (local fully-qualified domain names will be used in replset configuration even if the replset is exposed - the default value), `external` (exposed MongoDB instances will use ClusterIP addresses), or `ServiceMesh` (turned on for the exposed Services). Being set, `ServiceMesh` value suprecedes multiCluster settings, and therefore these two modes cannot be combined together. |
| allowUnsafeConfigurations | boolean  | `false`      | Prevents users from configuring a cluster with unsafe parameters: starting it with less than 3 replica set instances, with an [even number of replica set instances without additional arbiter](arbiter.md#arbiter), or without TLS/SSL certificates, or running a sharded cluster with less than 3 config server Pods or less than 2 mongos Pods (if `false`, the Operator will automatically change unsafe parameters to safe defaults). **After switching to unsafe configurations permissive mode you will not be able to switch the cluster back by setting `spec.allowUnsafeConfigurations` key to `false`, the flag will be ignored** |
| updateStrategy | string              | `SmartUpdate`| A strategy the Operator uses for [upgrades](update.md#operator-update). Possible values are [SmartUpdate](update.md#operator-update-smartupdates), [RollingUpdate](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#rolling-updates) and [OnDelete](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#on-delete) |
|ignoreAnnotations| subdoc            | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol` | The list of annotations [to be ignored](annotations.md#annotations-ignore) by the Operator |
| ignoreLabels    | subdoc            | `rack`                     | The list of labels [to be ignored](annotations.md#annotations-ignore) by the Operator |
| multiCluster.enabled      | boolean  | `false`      | [Multi-cluster Services (MCS)](replication.md#operator-replication-mcs): setting it to `true` enables [MCS cluster mode](https://cloud.google.com/kubernetes-engine/docs/concepts/multi-cluster-services) |
| multiCluster.DNSSuffix    | string   | `svc.clusterset.local` | The cluster domain to be used as a suffix for [multi-cluster Services](replication.md#operator-replication-mcs) used by Kubernetes (`svc.clusterset.local` [by default](https://cloud.google.com/kubernetes-engine/docs/how-to/multi-cluster-services)) |
| upgradeOptions  | [subdoc](operator.md#operator-upgradeoptions-section) | | Upgrade configuration section |
| secrets         | [subdoc](operator.md#operator-secrets-section)        | | Operator secrets section |
| replsets        | [subdoc](operator.md#operator-replsets-section)       | | Operator MongoDB Replica Set section |
| pmm             | [subdoc](operator.md#operator-pmm-section)            | | Percona Monitoring and Management section |
| sharding        | [subdoc](operator.md#operator-sharding-section)       | | MongoDB sharding configuration section |
| backup          | [subdoc](operator.md#operator-backup-section)         | | Percona Server for MongoDB backups section |

## <a name="operator-upgradeoptions-section"></a>Upgrade Options Section

The `upgradeOptions` section in the [deploy/cr.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) file contains various configuration options to control Percona Server for MongoDB upgrades.

|                 | |
|-----------------|-|
| **Key**         | {{ optionlink('upgradeOptions.versionServiceEndpoint') }} |
| **Value**       | string |
| **Example**     | `https://check.percona.com` |
| **Description** | The Version Service URL used to check versions compatibility for upgrade |
|                 | |
| **Key**         | {{ optionlink('upgradeOptions.apply') }} |
| **Value**       | string |
| **Example**     | `disabled` |
| **Description** | Specifies how [updates are processed](update.md#operator-update-smartupdates) by the Operator. `Never` or `Disabled` will completely disable automatic upgrades, otherwise it can be set to `Latest` or `Recommended` or to a specific version string of Percona Server for MongoDB (e.g. `{{ mongodb60recommended }}`) that is wished to be version-locked (so that the user can control the version running, but use automatic upgrades to move between them) |
|                 | |
| **Key**         | {{ optionlink('upgradeOptions.schedule') }} |
| **Value**       | string |
| **Example**     | `0 2 \* \* \*` |
| **Description** | Scheduled time to check for updates, specified in the [crontab format](https://en.wikipedia.org/wiki/Cron) |
|                 | |
| **Key**         | {{ optionlink('upgradeOptions.setFCV') }} |
| **Value**       | boolean |
| **Example**     | `false` |
| **Description** | If enabled, [FeatureCompatibilityVersion (FCV)](https://docs.mongodb.com/manual/reference/command/setFeatureCompatibilityVersion/) will be set to match the version during major version upgrade |

## <a name="operator-secrets-section"></a>Secrets section

Each spec in its turn may contain some key-value pairs. The secrets one
has only two of them:

|                 | |
|-----------------|-|
| **Key**         | {{ optionlink('secrets.key') }} |
| **Value**       | string |
| **Example**     | `my-cluster-name-mongodb-key` |
| **Description** | The secret name for the [MongoDB Internal Auth Key](https://docs.mongodb.com/manual/core/security-internal-authentication/). This secret is auto-created by the operator if it doesn’t exist. |
|                 | |
| **Key**         | {{ optionlink('secrets.users') }} |
| **Value**       | string |
| **Example**     | `my-cluster-name-mongodb-users` |
| **Description** | The name of the Secrets object for the MongoDB users **required to run the operator.** |
|                 | |
| **Key**         | {{ optionlink('secrets.ssl') }} |
| **Value**       | string |
| **Example**     | `my-custom-ssl` |
| **Description** | A secret with TLS certificate generated for *external* communications, see [Transport Layer Security (TLS)](TLS.md#tls) for details |
|                 | |
| **Key**         | {{ optionlink('secrets.sslInternal') }} |
| **Value**       | string |
| **Example**     | `my-custom-ssl-internal` |
| **Description** | A secret with TLS certificate generated for *internal* communications, see [Transport Layer Security (TLS)](TLS.md#tls) for details |
|                 | |
| **Key**         | {{ optionlink('secrets.encryptionKey') }} |
| **Value**       | string |
| **Example**     | `my-cluster-name-mongodb-encryption-key` |
| **Description** | Specifies a secret object with the [encryption key](https://docs.mongodb.com/manual/tutorial/configure-encryption/#local-key-management) |
|                 | |
| **Key**         | {{ optionlink('secrets.vault') }} |
| **Value**       | string |
| **Example**     | `my-cluster-name-vault` |
| **Description** | Specifies a secret object [to provide integration with HashiCorp Vault](encryption.md#using-vault) |

## <a name="operator-replsets-section"></a>Replsets Section

The replsets section controls the MongoDB Replica Set.

|                 | |
|-----------------|-|
| **Key**         | {{ optionlink('replsets.name') }} |
| **Value**       | string |
| **Example**     | `rs 0` |
| **Description** | The name of the [MongoDB Replica Set](https://docs.mongodb.com/manual/replication/) |
|                 | |
| **Key**         | {{ optionlink('replsets.size') }} |
| **Value**       | int |
| **Example**     | 3 |
| **Description** | The size of the MongoDB Replica Set, must be >= 3 for [High-Availability](https://docs.mongodb.com/manual/replication/#redundancy-and-data-availability) |
|                 | |
| **Key**         | {{ optionlink('replsets.terminationGracePeriodSeconds') }} |
| **Value**       | int |
| **Example**     | 300 |
| **Description** | The amount of seconds Kubernetes will wait for a clean replica set Pods termination |
|                 | |
| **Key**         | {{ optionlink('replsets.topologySpreadConstraints.labelSelector.matchLabels') }} |
| **Value**       | label |
| **Example**     | `app.kubernetes.io/name: percona-server-mongodb` |
| **Description** | The Label selector for the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) |
|                 | |
| **Key**         | {{ optionlink('replsets.topologySpreadConstraints.maxSkew') }} |
| **Value**       | int |
| **Example**     | 1 |
| **Description** | The degree to which Pods may be unevenly distributed under the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) |
|                 | |
| **Key**         | {{ optionlink('replsets.topologySpreadConstraints.topologyKey') }} |
| **Value**       | string |
| **Example**     | `kubernetes.io/hostname` |
| **Description** | The key of node labels for the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) |
|                 | |
| **Key**         | {{ optionlink('replsets.topologySpreadConstraints.whenUnsatisfiable') }} |
| **Value**       | string |
| **Example**     | `DoNotSchedule` |
| **Description** | What to do with a Pod if it doesn't satisfy the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) |
|                 | |
| **Key**         | {{ optionlink('replsets.configuration') }} |
| **Value**       | string |
| **Example**     | <pre>&#124;<br>net:<br>  tls:<br>    mode: preferTLS<br>operationProfiling:<br>  mode: slowOp<br>systemLog:<br>  verbosity: 1<br>storage:<br>  engine: wiredTiger<br>  wiredTiger:<br>    engineConfig:<br>      directoryForIndexes: false<br>      journalCompressor: snappy<br>    collectionConfig:<br>      blockCompressor: snappy<br>    indexConfig:<br>      prefixCompression: true</pre> |
| **Description** | Custom configuration options for mongod. Please refer to the [official manual](https://docs.mongodb.com/manual/reference/configuration-options/) for the full list of options, and [specific](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/rate-limit.html) [Percona](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/inmemory.html) [Server](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/data_at_rest_encryption.html) [for MongoDB](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/log-redaction.html) [docs](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/audit-logging.html). |
|                 | |
| **Key**         | {{ optionlink('replsets.affinity.antiAffinityTopologyKey') }} |
| **Value**       | string |
| **Example**     | `kubernetes.io/hostname` |
| **Description** | The [Kubernetes topologyKey](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#inter-pod-affinity-and-anti-affinity-beta-feature) node affinity constraint for the Replica Set nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.affinity.advanced') }} |
| **Value**       | subdoc |
| **Example**     | |
| **Description** | In cases where the pods require complex tuning the advanced option turns off the `topologykey` effect. This setting allows the standard Kubernetes affinity constraints of any complexity to be used |
|                 | |
| **Key**         | {{ optionlink('replsets.tolerations.key') }} |
| **Value**       | string |
| **Example**     | `node.alpha.kubernetes.io/unreachable` |
| **Description** | The [Kubernetes Pod tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) key for the Replica Set nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.tolerations.operator') }} |
| **Value**       | string |
| **Example**     | `Exists` |
| **Description** | The [Kubernetes Pod tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) operator for the Replica Set nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.tolerations.effect') }} |
| **Value**       | string |
| **Example**     | `NoExecute` |
| **Description** | The [Kubernetes Pod tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) effect for the Replica Set nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.tolerations.tolerationSeconds') }} |
| **Value**       | int |
| **Example**     | `6000` |
| **Description** | The [Kubernetes Pod tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) time limit  for the Replica Set nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.priorityClassName') }} |
| **Value**       | string |
| **Example**     | `high priority` |
| **Description** | The [Kuberentes Pod priority class](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption/#priorityclass)  for the Replica Set nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.annotations') }} |
| **Value**       | string |
| **Example**     | `iam.amazonaws.com/role: role-arn` |
| **Description** | The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the Replica Set nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.labels') }} |
| **Value**       | label |
| **Example**     | `rack: rack-22` |
| **Description** | The [Kubernetes affinity labels](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/) for the Replica Set nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.nodeSelector') }} |
| **Value**       | label |
| **Example**     | `disktype: ssd` |
| **Description** | The [Kubernetes nodeSelector](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#nodeselector) affinity constraint  for the Replica Set nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.storage.engine') }} |
| **Value**       | string |
| **Example**     | `wiredTiger` |
| **Description** | Sets the storage.engine option <https://docs.mongodb.com/manual/reference/configuration-options/#storage.engine>\`_ for the Replica Set nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.storage.wiredTiger.engineConfig.cacheSizeRatio') }} |
| **Value**       | float |
| **Example**     | `0.5` |
| **Description** | The ratio used to compute the [storage.wiredTiger.engineConfig.cacheSizeGB option](https://www.mongodb.com/docs/manual/reference/configuration-options/#mongodb-setting-storage.wiredTiger.engineConfig.cacheSizeGB) for the Replica Set nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.storage.wiredTiger.engineConfig.directoryForIndexes') }} |
| **Value**       | bool |
| **Example**     | `false` |
| **Description** | Sets the [storage.wiredTiger.engineConfig.directoryForIndexes option](https://www.mongodb.com/docs/manual/reference/configuration-options/#mongodb-setting-storage.wiredTiger.engineConfig.directoryForIndexes) for the Replica Set nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.storage.wiredTiger.engineConfig.journalCompressor') }} |
| **Value**       | string |
| **Example**     | `snappy` |
| **Description** | Sets the [storage.wiredTiger.engineConfig.journalCompressor option](https://www.mongodb.com/docs/manual/reference/configuration-options/#mongodb-setting-storage.wiredTiger.engineConfig.journalCompressor) for the Replica Set nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.storage.wiredTiger.collectionConfig.blockCompressor') }} |
| **Value**       | string |
| **Example**     | `snappy` |
| **Description** | Sets the [storage.wiredTiger.collectionConfig.blockCompressor option](https://www.mongodb.com/docs/manual/reference/configuration-options/#mongodb-setting-storage.wiredTiger.collectionConfig.blockCompressor) for the Replica Set nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.storage.wiredTiger.indexConfig.prefixCompression') }} |
| **Value**       | bool |
| **Example**     | `true` |
| **Description** | Sets the [storage.wiredTiger.indexConfig.prefixCompression option](https://www.mongodb.com/docs/manual/reference/configuration-options/#mongodb-setting-storage.wiredTiger.indexConfig.prefixCompression) for the Replica Set nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.storage.inMemory.engineConfig.inMemorySizeRatio') }} |
| **Value**       | float |
| **Example**     | `0.9` |
| **Description** | The ratio used to compute the [storage.engine.inMemory.inMemorySizeGb option](https://www.mongodb.com/docs/manual/reference/configuration-options/#mongodb-setting-storage.inMemory.engineConfig.inMemorySizeGB) for the Replica Set nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.livenessProbe.failureThreshold') }} |
| **Value**       | int |
| **Example**     | `4` |
| **Description** | Number of consecutive unsuccessful tries of the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be undertaken before giving up |
|                 | |
| **Key**         | {{ optionlink('replsets.livenessProbe.initialDelaySeconds') }} |
| **Value**       | int |
| **Example**     | `60` |
| **Description** | Number of seconds to wait after the container start before initiating the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes). |
|                 | |
| **Key**         | {{ optionlink('replsets.livenessProbe.periodSeconds') }} |
| **Value**       | int |
| **Example**     | `30` |
| **Description** | How often to perform a [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) (in seconds) |
|                 | |
| **Key**         | {{ optionlink('replsets.livenessProbe.timeoutSeconds') }} |
| **Value**       | int |
| **Example**     | `10` |
| **Description** | Number of seconds after which the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) times out |
|                 | |
| **Key**         | {{ optionlink('replsets.livenessProbe.startupDelaySeconds') }} |
| **Value**       | int |
| **Example**     | `7200` |
| **Description** | Time after which the liveness probe is failed if the MongoDB instance didn’t finish its full startup yet |
|                 | |
| **Key**         | {{ optionlink('replsets.readinessProbe.failureThreshold') }} |
| **Value**       | int |
| **Example**     | `8` |
| **Description** | Number of consecutive unsuccessful tries of the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be undertaken before giving up |
|                 | |
| **Key**         | {{ optionlink('replsets.readinessProbe.initialDelaySeconds') }} |
| **Value**       | int |
| **Example**     | `10` |
| **Description** | Number of seconds to wait after the container start before initiating the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) |
|                 | |
| **Key**         | {{ optionlink('replsets.readinessProbe.periodSeconds') }} |
| **Value**       | int |
| **Example**     | `3` |
| **Description** | How often to perform a [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) (in seconds) |
|                 | |
| **Key**         | {{ optionlink('replsets.readinessProbe.successThreshold') }} |
| **Value**       | int |
| **Example**     | `1` |
| **Description** | Minimum consecutive successes for the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be considered successful after having failed |
|                 | |
| **Key**         | {{ optionlink('replsets.readinessProbe.timeoutSeconds') }} |
| **Value**       | int |
| **Example**     | `2` |
| **Description** | Number of seconds after which the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) times out |
|                 | |
| **Key**         | {{ optionlink('replsets.runtimeClassName') }} |
| **Value**       | string |
| **Example**     | `image-rc` |
| **Description** | Name of the [Kubernetes Runtime Class](https://kubernetes.io/docs/concepts/containers/runtime-class/) for Replica Set Pods |
|                 | |
| **Key**         | {{ optionlink('replsets.sidecars.image') }} |
| **Value**       | string |
| **Example**     | `busybox` |
| **Description** | Image for the [custom sidecar container](faq.md#faq-sidecar) for Replica Set Pods |
|                 | |
| **Key**         | {{ optionlink('replsets.sidecars.command') }} |
| **Value**       | array |
| **Example**     | `["/bin/sh"]` |
| **Description** | Command for the [custom sidecar container](faq.md#faq-sidecar) for Replica Set Pods |
|                 | |
| **Key**         | {{ optionlink('replsets.sidecars.args') }} |
| **Value**       | array |
| **Example**     | `["-c", "while true; do echo echo $(date -u) 'test' >> /dev/null; sleep 5;done"]` |
| **Description** | Command arguments for the [custom sidecar container](faq.md#faq-sidecar) for Replica Set Pods |
|                 | |
| **Key**         | {{ optionlink('replsets.sidecars.name') }} |
| **Value**       | string |
| **Example**     | `rs-sidecar-1` |
| **Description** | Name of the [custom sidecar container](faq.md#faq-sidecar) for Replica Set Pods |
|                 | |
| **Key**         | {{ optionlink('replsets.sidecars.volumeMounts.mountPath') }} |
| **Value**       | string |
| **Example**     | `/volume1` |
| **Description** | Mount path of the [custom sidecar container](faq.md#faq-sidecar) volume for Replica Set Pods |
|                 | |
| **Key**         | {{ optionlink('replsets.sidecars.volumeMounts.name') }} |
| **Value**       | string |
| **Example**     | `sidecar-volume-claim` |
| **Description** | Name of the [custom sidecar container](faq.md#faq-sidecar) volume for Replica Set Pods |
|                 | |
| **Key**         | {{ optionlink('replsets.sidecarVolumes.name') }} |
| **Value**       | string |
| **Example**     | `sidecar-config` |
| **Description** | Name of the [custom sidecar container](faq.md#faq-sidecar) volume for Replica Set Pods |
|                 | |
| **Key**         | {{ optionlink('replsets.sidecarVolumes.configMap.name') }} |
| **Value**       | string |
| **Example**     | `myconfigmap` |
| **Description** | Name of the [ConfigMap](https://kubernetes.io/docs/concepts/storage/volumes/#configmap) for a [custom sidecar container](faq.md#faq-sidecar) volume for Replica Set Pods |
|                 | |
| **Key**         | {{ optionlink('replsets.sidecarVolumes.secret.secretName') }} |
| **Value**       | string |
| **Example**     | `sidecar-secret` |
| **Description** | Name of the [Secret](https://kubernetes.io/docs/concepts/storage/volumes/#secret) for a [custom sidecar container](faq.md#faq-sidecar) volume for Replica Set Pods |
|                 | |
| **Key**         | {{ optionlink('replsets.sidecarPVCs') }} |
| **Value**       | subdoc |
| **Example**     | |
| **Description** | [Persistent Volume Claim](https://v1-20.docs.kubernetes.io/docs/concepts/storage/persistent-volumes/) for the [custom sidecar container](faq.md#faq-sidecar) volume for Replica Set Pods |
|                 | |
| **Key**         | {{ optionlink('replsets.podDisruptionBudget.maxUnavailable') }} |
| **Value**       | int |
| **Example**     | `1` |
| **Description** | The [Kubernetes Pod distribution budget](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/) limit specifying the maximum value for unavailable Pods |
|                 | |
| **Key**         | {{ optionlink('replsets.podDisruptionBudget.minAvailable') }} |
| **Value**       | int |
| **Example**     | `1` |
| **Description** | The [Kubernetes Pod distribution budget](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/) limit specifying the minimum value for available Pods |
|                 | |
| **Key**         | {{ optionlink('replsets.splitHorizons.&lt;replicaset-pod-name&gt;.external') }} |
| **Value**       | string |
| **Example**     | `rs0-0.mycluster.xyz` |
| **Description** | External URI for [Split-horizon](expose.md#exposing-replica-set-with-split-horizon-dns) for replica set Pods of the exposed cluster |
|                 | |
| **Key**         | {{ optionlink('replsets.splitHorizons.&lt;replicaset-pod-name&gt;.external-2') }} |
| **Value**       | string |
| **Example**     | `rs0-0.mycluster2.xyz` |
| **Description** | External URI for [Split-horizon](expose.md#exposing-replica-set-with-split-horizon-dns) for replica set Pods of the exposed cluster |
|                 | |
| **Key**         | {{ optionlink('replsets.expose.enabled') }} |
| **Value**       | boolean |
| **Example**     | `false` |
| **Description** | Enable or disable exposing [MongoDB Replica Set](https://docs.mongodb.com/manual/replication/) nodes with dedicated IP addresses |
|                 | |
| **Key**         | {{ optionlink('replsets.expose.exposeType') }} |
| **Value**       | string |
| **Example**     | `ClusterIP` |
| **Description** | The [IP address type](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) to be exposed |
|                 | |
| **Key**         | {{ optionlink('replsets.expose.loadBalancerSourceRanges') }} |
| **Value**       | string |
| **Example**     | `10.0.0.0/8` |
| **Description** | The range of client IP addresses from which the load balancer should be reachable (if not set, there is no limitations) |
|                 | |
| **Key**         | {{ optionlink('replsets.expose.serviceAnnotations') }} |
| **Value**       | string |
| **Example**     | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: http` |
| **Description** | The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the MongoDB mongod daemon |
|                 | |
| **Key**         | {{ optionlink('replsets.expose.serviceLabels') }} |
| **Value**       | string |
| **Example**     | `rack: rack-22` |
| **Description** | The [Kubernetes labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) for the MongoDB Replica Set Service |
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.enabled') }} |
| **Value**       | boolean |
| **Example**     | `false` |
| **Description** | Enable or disable creation of [Replica Set non-voting instances](arbiter.md#arbiter-nonvoting) within the cluster |
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.size') }} |
| **Value**       | int |
| **Example**     | `1` |
| **Description** | The number of [Replica Set non-voting instances](arbiter.md#arbiter-nonvoting) within the cluster |
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.afinity.antiAffinityTopologyKey') }} |
| **Value**       | string |
| **Example**     | `kubernetes.io/hostname` |
| **Description** | The [Kubernetes topologyKey](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#inter-pod-affinity-and-anti-affinity-beta-feature) node affinity constraint for the non-voting nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.affinity.advanced') }} |
| **Value**       | subdoc |
| **Example**     | |
| **Description** | In cases where the pods require complex tuning the advanced option turns off the `topologykey` effect. This setting allows the standard Kubernetes affinity constraints of any complexity to be used |
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.tolerations.key') }} |
| **Value**       | string |
| **Example**     | `node.alpha.kubernetes.io/unreachable` |
| **Description** | The [Kubernetes Pod tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) key for the non-voting nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.tolerations.operator') }} |
| **Value**       | string |
| **Example**     | `Exists` |
| **Description** | The [Kubernetes Pod tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) operator for the non-voting nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.tolerations.effect') }} |
| **Value**       | string |
| **Example**     | `NoExecute` |
| **Description** | The [Kubernetes Pod tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) effect for the non-voting nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.tolerations.tolerationSeconds') }} |
| **Value**       | int |
| **Example**     | `6000` |
| **Description** | The [Kubernetes Pod tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) time limit for the non-voting nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.priorityClassName') }} |
| **Value**       | string |
| **Example**     | `high priority` |
| **Description** | The [Kuberentes Pod priority class](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption/#priorityclass) for the non-voting nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.annotations') }} |
| **Value**       | string |
| **Example**     | `iam.amazonaws.com/role: role-arn` |
| **Description** | The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the non-voting nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.labels') }} |
| **Value**       | label |
| **Example**     | `rack: rack-22` |
| **Description** | The [Kubernetes affinity labels](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/) for the non-voting nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.nodeSelector') }} |
| **Value**       | label |
| **Example**     | `disktype: ssd` |
| **Description** | The [Kubernetes nodeSelector](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#nodeselector) affinity constraint for the non-voting nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.podDisruptionBudget.maxUnavailable') }} |
| **Value**       | int |
| **Example**     | `1` |
| **Description** | The [Kubernetes Pod distribution budget](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/) limit specifying the maximum value for unavailable Pods among non-voting nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.podDisruptionBudget.minAvailable') }} |
| **Value**       | int |
| **Example**     | `1` |
| **Description** | The [Kubernetes Pod distribution budget](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/) limit specifying the minimum value for available Pods among non-voting nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.resources.limits.cpu') }} |
| **Value**       | string |
| **Example**     | `300m` |
| **Description** | [Kubernetes CPU limit](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for MongoDB container |
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.resources.limits.memory') }} |
| **Value**       | string |
| **Example**     | `0.5G` |
| **Description** | [Kubernetes Memory limit](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for MongoDB container |
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.resources.requests.cpu') }} |
| **Value**       | string |
| **Example**     | `300m` |
| **Description** | The [Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for MongoDB container |
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.resources.requests.memory') }} |
| **Value**       | string |
| **Example**     | `0.5G` |
| **Description** | The [Kubernetes Memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for MongoDB container |
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.volumeSpec.emptyDir') }} |
| **Value**       | string |
| **Example**     | `{}` |
| **Description** | The [Kubernetes emptyDir volume](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir), i.e. the directory which will be created on a node, and will be accessible to the MongoDB Pod containers |
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.volumeSpec.hostPath.path') }} |
| **Value**       | string |
| **Example**     | `/data` |
| **Description** | [Kubernetes hostPath volume](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath), i.e. the file or directory of a node that will be accessible to the MongoDB Pod containers |
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.volumeSpec.hostPath.type') }} |
| **Value**       | string |
| **Example**     | `Directory` |
| **Description** | The [Kubernetes hostPath volume type](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath) |
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.volumeSpec.persistentVolumeClaim.annotations') }} |
| **Value**       | string |
| **Example**     | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: http` |
| **Description** | The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for [Persistent Volume Claim](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) |
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.volumeSpec.persistentVolumeClaim.labels') }} |
| **Value**       | string |
| **Example**     | `rack: rack-22` |
| **Description** | The [Kubernetes labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) metadata for [Persistent Volume Claim](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) |
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.volumeSpec.persistentVolumeClaim.storageClassName') }} |
| **Value**       | string |
| **Example**     | `standard` |
| **Description** | The [Kubernetes Storage Class](https://kubernetes.io/docs/concepts/storage/storage-classes/) to use with the MongoDB container [Persistent Volume Claim](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) for the non-voting nodes. Use Storage Class with XFS as the default filesystem if possible, [for better MongoDB performance](https://dba.stackexchange.com/questions/190578/is-xfs-still-the-best-choice-for-mongodb |
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.volumeSpec.persistentVolumeClaim.accessModes') }} |
| **Value**       | array |
| **Example**     | `[ "ReadWriteOnce" ]` |
| **Description** | The [Kubernetes Persistent Volume](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) access modes for the MongoDB container for the non-voting nodes|
|                 | |
| **Key**         | {{ optionlink('replsets.nonvoting.volumeSpec.persistentVolumeClaim.resources.requests.storage') }} |
| **Value**       | string |
| **Example**     | `3Gi` |
| **Description** | The [Kubernetes Persistent Volume](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) size for the MongoDB container for the non-voting nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.arbiter.enabled') }} |
| **Value**       | boolean |
| **Example**     | `false` |
| **Description** | Enable or disable creation of [Replica Set Arbiter](https://docs.mongodb.com/manual/core/replica-set-arbiter/) nodes within the cluster |
|                 | |
| **Key**         | {{ optionlink('replsets.arbiter.size') }} |
| **Value**       | int |
| **Example**     | `1` |
| **Description** | The number of [Replica Set Arbiter](https://docs.mongodb.com/manual/core/replica-set-arbiter/) instances within the cluster |
|                 | |
| **Key**         | {{ optionlink('replsets.arbiter.afinity.antiAffinityTopologyKey') }} |
| **Value**       | string |
| **Example**     | `kubernetes.io/hostname` |
| **Description** | The [Kubernetes topologyKey](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#inter-pod-affinity-and-anti-affinity-beta-feature) node affinity constraint for the Arbiter |
|                 | |
| **Key**         | {{ optionlink('replsets.arbiter.affinity.advanced') }} |
| **Value**       | subdoc |
| **Example**     | |
| **Description** | In cases where the pods require complex tuning the advanced option turns off the `topologykey` effect. This setting allows the standard Kubernetes affinity constraints of any complexity to be used |
|                 | |
| **Key**         | {{ optionlink('replsets.arbiter.tolerations.key') }} |
| **Value**       | string |
| **Example**     | `node.alpha.kubernetes.io/unreachable` |
| **Description** | The [Kubernetes Pod tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) key for the Arbiter nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.arbiter.tolerations.operator') }} |
| **Value**       | string |
| **Example**     | `Exists` |
| **Description** | The [Kubernetes Pod tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) operator for the Arbiter nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.arbiter.tolerations.effect') }} |
| **Value**       | string |
| **Example**     | `NoExecute` |
| **Description** | The [Kubernetes Pod tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) effect for the Arbiter nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.arbiter.tolerations.tolerationSeconds') }} |
| **Value**       | int |
| **Example**     | `6000` |
| **Description** | The [Kubernetes Pod tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) time limit for the Arbiter nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.arbiter.priorityClassName') }} |
| **Value**       | string |
| **Example**     | `high priority` |
| **Description** | The [Kuberentes Pod priority class](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption/#priorityclass) for the Arbiter nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.arbiter.annotations') }} |
| **Value**       | string |
| **Example**     | `iam.amazonaws.com/role: role-arn` |
| **Description** | The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the Arbiter nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.arbiter.labels') }} |
| **Value**       | label |
| **Example**     | `rack: rack-22` |
| **Description** | The [Kubernetes affinity labels](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/) for the Arbiter nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.arbiter.nodeSelector') }} |
| **Value**       | label |
| **Example**     | `disktype: ssd` |
| **Description** | The [Kubernetes nodeSelector](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#nodeselector) affinity constraint for the Arbiter nodes |
|                 | |
| **Key**         | {{ optionlink('replsets.resources.limits.cpu') }} |
| **Value**       | string |
| **Example**     | `300m` |
| **Description** | [Kubernetes CPU limit](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for MongoDB container |
|                 | |
| **Key**         | {{ optionlink('replsets.resources.limits.memory') }} |
| **Value**       | string |
| **Example**     | `0.5G` |
| **Description** | [Kubernetes Memory limit](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for MongoDB container |
|                 | |
| **Key**         | {{ optionlink('replsets.resources.requests.cpu') }} |
| **Value**       | string |
| **Example**     | `300m` |
| **Description** | The [Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for MongoDB container |
|                 | |
| **Key**         | {{ optionlink('replsets.resources.requests.memory') }} |
| **Value**       | string |
| **Example**     | `0.5G` |
| **Description** | The [Kubernetes Memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for MongoDB container |
|                 | |
| **Key**         | {{ optionlink('replsets.volumeSpec.emptyDir') }} |
| **Value**       | string |
| **Example**     | `{}` |
| **Description** | The [Kubernetes emptyDir volume](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir), i.e. the directory which will be created on a node, and will be accessible to the MongoDB Pod containers |
|                 | |
| **Key**         | {{ optionlink('replsets.volumeSpec.hostPath.path') }} |
| **Value**       | string |
| **Example**     | `/data` |
| **Description** | [Kubernetes hostPath volume](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath), i.e. the file or directory of a node that will be accessible to the MongoDB Pod containers |
|                 | |
| **Key**         | {{ optionlink('replsets.volumeSpec.hostPath.type') }} |
| **Value**       | string |
| **Example**     | `Directory` |
| **Description** | The [Kubernetes hostPath volume type](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath) |
|                 | |
| **Key**         | {{ optionlink('replsets.volumeSpec.persistentVolumeClaim.annotations') }} |
| **Value**       | string |
| **Example**     | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: http` |
| **Description** | The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for [Persistent Volume Claim](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) |
|                 | |
| **Key**         | {{ optionlink('replsets.volumeSpec.persistentVolumeClaim.labels') }} |
| **Value**       | string |
| **Example**     | `rack: rack-22` |
| **Description** | The [Kubernetes labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) metadata for [Persistent Volume Claim](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) |
|                 | |
| **Key**         | {{ optionlink('replsets.volumeSpec.persistentVolumeClaim.storageClassName') }} |
| **Value**       | string |
| **Example**     | `standard` |
| **Description** | The [Kubernetes Storage Class](https://kubernetes.io/docs/concepts/storage/storage-classes/) to use with the MongoDB container [Persistent Volume Claim](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims). Use Storage Class with XFS as the default filesystem if possible, [for better MongoDB performance](https://dba.stackexchange.com/questions/190578/is-xfs-still-the-best-choice-for-mongodb |
|                 | |
| **Key**         | {{ optionlink('replsets.volumeSpec.persistentVolumeClaim.accessModes') }} |
| **Value**       | array |
| **Example**     | `[ "ReadWriteOnce" ]` |
| **Description** | The [Kubernetes Persistent Volume](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) access modes for the MongoDB container |
|                 | |
| **Key**         | {{ optionlink('replsets.volumeSpec.persistentVolumeClaim.resources.requests.storage') }} |
| **Value**       | string |
| **Example**     | `3Gi` |
| **Description** | The [Kubernetes Persistent Volume](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) size for the MongoDB container |
|                 | |
| **Key**         | {{ optionlink('replsets.hostAliases.ip') }} |
| **Value**       | string |
| **Example**     | `"10.10.0.2"` |
| **Description** | The IP address for [Kubernetes host aliases]([https://kubernetes.io/docs/concepts/storage/persistent-volumes/](https://kubernetes.io/docs/tasks/network/customize-hosts-file-for-pods/) for replica set Pods |
|                 | |
| **Key**         | {{ optionlink('replsets.hostAliases.hostnames') }} |
| **Value**       | subdoc |
| **Example**     | |
| **Description** | Hostnames for [Kubernetes host aliases]([https://kubernetes.io/docs/concepts/storage/persistent-volumes/](https://kubernetes.io/docs/tasks/network/customize-hosts-file-for-pods/) for replica set Pods |

## <a name="operator-pmm-section"></a>PMM Section

The `pmm` section in the deploy/cr.yaml file contains configuration
options for Percona Monitoring and Management.

|                 | |
|-----------------|-|
| **Key**         | {{ optionlink('pmm.enabled') }} |
| **Value**       | boolean |
| **Example**     | `false` |
| **Description** | Enables or disables monitoring Percona Server for MongoDB with [PMM](https://www.percona.com/doc/percona-monitoring-and-managementindex.metrics-monitor.dashboard.html) |
|                 | |
| **Key**         | {{ optionlink('pmm.image') }} |
| **Value**       | string |
| **Example**     | `percona/pmm-client:{{ pmm2recommended }}` |
| **Description** | PMM Client docker image to use |
|                 | |
| **Key**         | {{ optionlink('pmm.serverHost') }} |
| **Value**       | string |
| **Example**     | `monitoring-service` |
| **Description** | Address of the PMM Server to collect data from the Cluster |
|                 | |
| **Key**         | {{ optionlink('pmm.mongodParams') }} |
| **Value**       | string |
| **Example**     | `--environment=DEV-ENV --custom-labels=DEV-ENV` |
| **Description** | Additional parameters which will be passed to the [pmm-admin add mongodb](https://www.percona.com/doc/percona-monitoring-and-management/2.x/setting-up/client/mongodb.html#adding-mongodb-service-monitoring) command for `mongod` Pods |
|                 | |
| **Key**         | {{ optionlink('pmm.mongosParams') }} |
| **Value**       | string |
| **Example**     | `--environment=DEV-ENV --custom-labels=DEV-ENV` |
| **Description** | Additional parameters which will be passed to the [pmm-admin add mongodb](https://www.percona.com/doc/percona-monitoring-and-management/2.x/setting-up/client/mongodb.html#adding-mongodb-service-monitoring) command for `mongos` Pods |

## <a name="operator-sharding-section"></a>Sharding Section

The `sharding` section in the deploy/cr.yaml file contains configuration
options for Percona Server for MondoDB [sharding](sharding.md#operator-sharding).

|                 | |
|-----------------|-|
| **Key**         | {{ optionlink('sharding.enabled') }} |
| **Value**       | boolean |
| **Example**     | `true` |
| **Description** | Enables or disables [Percona Server for MondoDB sharding](https://docs.mongodb.com/manual/sharding/) |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.size') }} |
| **Value**       | int |
| **Example**     | `3` |
| **Description** | The number of [Config Server instances](https://docs.mongodb.com/manual/core/sharded-cluster-config-servers/) within the cluster |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.terminationGracePeriodSeconds') }} |
| **Value**       | int |
| **Example**     | 300 |
| **Description** | The amount of seconds Kubernetes will wait for a clean config server Pods termination |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.topologySpreadConstraints.labelSelector.matchLabels') }} |
| **Value**       | label |
| **Example**     | `app.kubernetes.io/name: percona-server-mongodb` |
| **Description** | The Label selector for the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.topologySpreadConstraints.maxSkew') }} |
| **Value**       | int |
| **Example**     | 1 |
| **Description** | The degree to which Pods may be unevenly distributed under the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.topologySpreadConstraints.topologyKey') }} |
| **Value**       | string |
| **Example**     | `kubernetes.io/hostname` |
| **Description** | The key of node labels for the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.topologySpreadConstraints.whenUnsatisfiable') }} |
| **Value**       | string |
| **Example**     | `DoNotSchedule` |
| **Description** | What to do with a Pod if it doesn't satisfy the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.configuration') }} |
| **Value**       | string |
| **Example**     | <pre>&#124;<br>operationProfiling:<br>  mode: slowOp<br>systemLog:<br>  verbosity: 1</pre> |
| **Description** | Custom configuration options for Config Servers. Please refer to the [official manual](https://docs.mongodb.com/manual/reference/configuration-options/) for the full list of options |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.livenessProbe.failureThreshold') }} |
| **Value**       | int |
| **Example**     | `4` |
| **Description** | Number of consecutive unsuccessful tries of the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be undertaken before giving up |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.livenessProbe.initialDelaySeconds') }} |
| **Value**       | int |
| **Example**     | `60` |
| **Description** | Number of seconds to wait after the container start before initiating the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.livenessProbe.periodSeconds') }} |
| **Value**       | int |
| **Example**     | `30` |
| **Description** | How often to perform a [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) (in seconds) |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.livenessProbe.timeoutSeconds') }} |
| **Value**       | int |
| **Example**     | `10` |
| **Description** | Number of seconds after which the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) times out |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.livenessProbe.startupDelaySeconds') }} |
| **Value**       | int |
| **Example**     | `7200` |
| **Description** | Time after which the liveness probe is failed if the MongoDB instance didn’t finish its full startup yet |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.readinessProbe.failureThreshold') }} |
| **Value**       | int |
| **Example**     | `3` |
| **Description** | Number of consecutive unsuccessful tries of the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be undertaken before giving up |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.readinessProbe.initialDelaySeconds') }} |
| **Value**       | int |
| **Example**     | `10` |
| **Description** | Number of seconds to wait after the container start before initiating the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.readinessProbe.periodSeconds') }} |
| **Value**       | int |
| **Example**     | `3` |
| **Description** | How often to perform a [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) (in seconds) |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.readinessProbe.successThreshold') }} |
| **Value**       | int |
| **Example**     | `1` |
| **Description** | Minimum consecutive successes for the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be considered successful after having failed |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.readinessProbe.timeoutSeconds') }} |
| **Value**       | int |
| **Example**     | `2` |
| **Description** | Number of seconds after which the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) times out |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.runtimeClassName') }} |
| **Value**       | string |
| **Example**     | `image-rc` |
| **Description** | Name of the [Kubernetes Runtime Class](https://kubernetes.io/docs/concepts/containers/runtime-class/) for Config Server Pods |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.sidecars.image') }} |
| **Value**       | string |
| **Example**     | `busybox` |
| **Description** | Image for the [custom sidecar container](faq.md#faq-sidecar) for Config Server Pods |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.sidecars.command') }} |
| **Value**       | array |
| **Example**     | `["/bin/sh"]` |
| **Description** | Command for the [custom sidecar container](faq.md#faq-sidecar) for Config Server Pods |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.sidecars.args') }} |
| **Value**       | array |
| **Example**     | `["-c", "while true; do echo echo $(date -u) 'test' >> /dev/null; sleep 5;done"]` |
| **Description** | Command arguments for the [custom sidecar container](faq.md#faq-sidecar) for Config Server Pods |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.sidecars.name') }} |
| **Value**       | string |
| **Example**     | `rs-sidecar-1` |
| **Description** | Name of the [custom sidecar container](faq.md#faq-sidecar) for Config Server Pods |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.limits.cpu') }} |
| **Value**       | string |
| **Example**     | `300m` |
| **Description** | [Kubernetes CPU limit](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for Config Server container |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.limits.memory') }} |
| **Value**       | string |
| **Example**     | `0.5G` |
| **Description** | [Kubernetes Memory limit](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for Config Server container |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.resources.requests.cpu') }} |
| **Value**       | string |
| **Example**     | `300m` |
| **Description** | The [Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for Config Server container |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.requests.memory') }} |
| **Value**       | string |
| **Example**     | `0.5G` |
| **Description** | The [Kubernetes Memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for Config Server container |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.expose.enabled') }} |
| **Value**       | boolean |
| **Example**     | `false` |
| **Description** | Enable or disable exposing [Config Server](https://www.mongodb.com/docs/manual/core/sharded-cluster-config-servers/) nodes with dedicated IP addresses |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.expose.exposeType') }} |
| **Value**       | string |
| **Example**     | `ClusterIP` |
| **Description** | The [IP address type](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) to be exposed |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.expose.loadBalancerSourceRanges') }} |
| **Value**       | string |
| **Example**     | `10.0.0.0/8` |
| **Description** | The range of client IP addresses from which the load balancer should be reachable (if not set, there is no limitations) |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.expose.serviceAnnotations') }} |
| **Value**       | string |
| **Example**     | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: http` |
| **Description** | The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the Config Server daemon |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.expose.serviceLabels') }} |
| **Value**       | string |
| **Example**     | `rack: rack-22` |
| **Description** | The [Kubernetes labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) for the Config Server Service |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.volumeSpec.emptyDir') }} |
| **Value**       | string |
| **Example**     | `{}` |
| **Description** | The [Kubernetes emptyDir volume](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir), i.e. the directory which will be created on a node, and will be accessible to the Config Server Pod containers |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.volumeSpec.hostPath.path') }} |
| **Value**       | string |
| **Example**     | `/data` |
| **Description** | [Kubernetes hostPath volume](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath), i.e. the file or directory of a node that will be accessible to the Config Server Pod containers |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.volumeSpec.hostPath.type') }} |
| **Value**       | string |
| **Example**     | `Directory` |
| **Description** | The [Kubernetes hostPath volume type](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath) |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.volumeSpec.persistentVolumeClaim.annotations') }} |
| **Value**       | string |
| **Example**     | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: http` |
| **Description** | The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for [Persistent Volume Claim](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.volumeSpec.persistentVolumeClaim.labels') }} |
| **Value**       | string |
| **Example**     | `rack: rack-22` |
| **Description** | The [Kubernetes labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) metadata for [Persistent Volume Claim](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims) |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.volumeSpec.persistentVolumeClaim.storageClassName') }} |
| **Value**       | string |
| **Example**     | `standard` |
| **Description** | The [Kubernetes Storage Class](https://kubernetes.io/docs/concepts/storage/storage-classes/) to use with the Config Server container [Persistent Volume Claim](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims). Use Storage Class with XFS as the default filesystem if possible, [for better MongoDB performance](https://dba.stackexchange.com/questions/190578/is-xfs-still-the-best-choice-for-mongodb) |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.volumeSpec.persistentVolumeClaim.accessModes') }} |
| **Value**       | array |
| **Example**     | `[ "ReadWriteOnce" ]` |
| **Description** | The [Kubernetes Persistent Volume](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) access modes for the Config Server container |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.volumeSpec.persistentVolumeClaim.resources.requests.storage') }} |
| **Value**       | string |
| **Example**     | `3Gi` |
| **Description** | The [Kubernetes Persistent Volume](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) size for the Config Server container |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.hostAliases.ip') }} |
| **Value**       | string |
| **Example**     | `"10.10.0.2"` |
| **Description** | The IP address for [Kubernetes host aliases]([https://kubernetes.io/docs/concepts/storage/persistent-volumes/](https://kubernetes.io/docs/tasks/network/customize-hosts-file-for-pods/) for replica set Pods |
|                 | |
| **Key**         | {{ optionlink('sharding.configsvrReplSet.hostAliases.hostnames') }} |
| **Value**       | subdoc |
| **Example**     | |
| **Description** | Hostnames for [Kubernetes host aliases]([https://kubernetes.io/docs/concepts/storage/persistent-volumes/](https://kubernetes.io/docs/tasks/network/customize-hosts-file-for-pods/) for config server Pods |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.size') }} |
| **Value**       | int |
| **Example**     | `3` |
| **Description** | The number of [mongos](https://docs.mongodb.com/manual/core/sharded-cluster-query-router/) instances within the cluster |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.terminationGracePeriodSeconds') }} |
| **Value**       | int |
| **Example**     | 300 |
| **Description** | The amount of seconds Kubernetes will wait for a clean mongos Pods termination |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.topologySpreadConstraints.labelSelector.matchLabels') }} |
| **Value**       | label |
| **Example**     | `app.kubernetes.io/name: percona-server-mongodb` |
| **Description** | The Label selector for the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.topologySpreadConstraints.maxSkew') }} |
| **Value**       | int |
| **Example**     | 1 |
| **Description** | The degree to which Pods may be unevenly distributed under the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.topologySpreadConstraints.topologyKey') }} |
| **Value**       | string |
| **Example**     | `kubernetes.io/hostname` |
| **Description** | The key of node labels for the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.topologySpreadConstraints.whenUnsatisfiable') }} |
| **Value**       | string |
| **Example**     | `DoNotSchedule` |
| **Description** | What to do with a Pod if it doesn't satisfy the [Kubernetes Pod Topology Spread Constraints](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.configuration') }} |
| **Value**       | string |
| **Example**     | <pre>&#124;<br>systemLog:<br>  verbosity: 1</pre> |
| **Description** | Custom configuration options for mongos. Please refer to the [official manual](https://docs.mongodb.com/manual/reference/configuration-options/) for the full list of options |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.afinity.antiAffinityTopologyKey') }} |
| **Value**       | string |
| **Example**     | `kubernetes.io/hostname` |
| **Description** | The [Kubernetes topologyKey](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#inter-pod-affinity-and-anti-affinity-beta-feature) node affinity constraint for mongos |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.affinity.advanced') }} |
| **Value**       | subdoc |
| **Example**     | |
| **Description** | In cases where the Pods require complex tuning the advanced option turns off the `topologykey` effect. This setting allows the standard Kubernetes affinity constraints of any complexity to be used |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.tolerations.key') }} |
| **Value**       | string |
| **Example**     | `node.alpha.kubernetes.io/unreachable` |
| **Description** | The [Kubernetes Pod tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) key for mongos instances |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.tolerations.operator') }} |
| **Value**       | string |
| **Example**     | `Exists` |
| **Description** | The [Kubernetes Pod tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) operator for mongos instances |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.tolerations.effect') }} |
| **Value**       | string |
| **Example**     | `NoExecute` |
| **Description** | The [Kubernetes Pod tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) effect for mongos instances |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.tolerations.tolerationSeconds') }} |
| **Value**       | int |
| **Example**     | `6000` |
| **Description** | The [Kubernetes Pod tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/#concepts) time limit for mongos instances |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.priorityClassName') }} |
| **Value**       | string |
| **Example**     | `high priority` |
| **Description** | The [Kuberentes Pod priority class](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption/#priorityclass) for mongos instances |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.annotations') }} |
| **Value**       | string |
| **Example**     | `iam.amazonaws.com/role: role-arn` |
| **Description** | The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the mongos instances |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.labels') }} |
| **Value**       | label |
| **Example**     | `rack: rack-22` |
| **Description** | The [Kubernetes affinity labels](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/) for mongos instances |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.nodeSelector') }} |
| **Value**       | label |
| **Example**     | `disktype: ssd` |
| **Description** | The [Kubernetes nodeSelector](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#nodeselector) affinity constraint for mongos instances |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.livenessProbe.failureThreshold') }} |
| **Value**       | int |
| **Example**     | `4` |
| **Description** | Number of consecutive unsuccessful tries of the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be undertaken before giving up |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.livenessProbe.initialDelaySeconds') }} |
| **Value**       | int |
| **Example**     | `60` |
| **Description** | Number of seconds to wait after the container start before initiating the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.livenessProbe.periodSeconds') }} |
| **Value**       | int |
| **Example**     | `30` |
| **Description** | How often to perform a [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) (in seconds) |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.livenessProbe.timeoutSeconds') }} |
| **Value**       | int |
| **Example**     | `10` |
| **Description** | Number of seconds after which the [liveness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) times out |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.livenessProbe.startupDelaySeconds') }} |
| **Value**       | int |
| **Example**     | `7200` |
| **Description** | Time after which the liveness probe is failed if the MongoDB instance didn’t finish its full startup yet |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.readinessProbe.failureThreshold') }} |
| **Value**       | int |
| **Example**     | `3` |
| **Description** | Number of consecutive unsuccessful tries of the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be undertaken before giving up |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.readinessProbe.initialDelaySeconds') }} |
| **Value**       | int |
| **Example**     | `10` |
| **Description** | Number of seconds to wait after the container start before initiating the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.readinessProbe.periodSeconds') }} |
| **Value**       | int |
| **Example**     | `3` |
| **Description** | How often to perform a [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) (in seconds) |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.readinessProbe.successThreshold') }} |
| **Value**       | int |
| **Example**     | `1` |
| **Description** | Minimum consecutive successes for the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) to be considered successful after having failed |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.readinessProbe.timeoutSeconds') }} |
| **Value**       | int |
| **Example**     | `2` |
| **Description** | Number of seconds after which the [readiness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes) times out |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.runtimeClassName') }} |
| **Value**       | string |
| **Example**     | `image-rc` |
| **Description** | Name of the [Kubernetes Runtime Class](https://kubernetes.io/docs/concepts/containers/runtime-class/) for mongos Pods |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.sidecars.image') }} |
| **Value**       | string |
| **Example**     | `busybox` |
| **Description** | Image for the [custom sidecar container](faq.md#faq-sidecar) for mongos Pods |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.sidecars.command') }} |
| **Value**       | array |
| **Example**     | `["/bin/sh"]` |
| **Description** | Command for the [custom sidecar container](faq.md#faq-sidecar) for mongos Pods |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.sidecars.args') }} |
| **Value**       | array |
| **Example**     | `["-c", "while true; do echo echo $(date -u) 'test' >> /dev/null; sleep 5;done"]` |
| **Description** | Command arguments for the [custom sidecar container](faq.md#faq-sidecar) for mongos Pods |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.sidecars.name') }} |
| **Value**       | string |
| **Example**     | `rs-sidecar-1` |
| **Description** | Name of the [custom sidecar container](faq.md#faq-sidecar) for mongos Pods |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.limits.cpu') }} |
| **Value**       | string |
| **Example**     | `300m` |
| **Description** | [Kubernetes CPU limit](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for mongos container |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.limits.memory') }} |
| **Value**       | string |
| **Example**     | `0.5G` |
| **Description** | [Kubernetes Memory limit](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for mongos container |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.resources.requests.cpu') }} |
| **Value**       | string |
| **Example**     | `300m` |
| **Description** | The [Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for mongos container |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.requests.memory') }} |
| **Value**       | string |
| **Example**     | `0.5G` |
| **Description** | The [Kubernetes Memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for mongos container |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.expose.exposeType') }} |
| **Value**       | string |
| **Example**     | `ClusterIP` |
| **Description** | The [IP address type](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) to be exposed |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.expose.servicePerPod') }} |
| **Value**       | boolean |
| **Example**     | `true` |
| **Description** | If set to `true`, a separate ClusterIP Service is created for each mongos instance |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.expose.loadBalancerSourceRanges') }} |
| **Value**       | string |
| **Example**     | `10.0.0.0/8` |
| **Description** | The range of client IP addresses from which the load balancer should be reachable (if not set, there is no limitations) |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.expose.serviceAnnotations') }} |
| **Value**       | string |
| **Example**     | `service.beta.kubernetes.io/aws-load-balancer-backend-protocol: http` |
| **Description** | The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the MongoDB mongos daemon |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.expose.serviceLabels') }} |
| **Value**       | string |
| **Example**     | `rack: rack-22` |
| **Description** | The [Kubernetes labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/) for the MongoDB mongos Service |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.hostAliases.ip') }} |
| **Value**       | string |
| **Example**     | `"10.10.0.2"` |
| **Description** | The IP address for [Kubernetes host aliases]([https://kubernetes.io/docs/concepts/storage/persistent-volumes/](https://kubernetes.io/docs/tasks/network/customize-hosts-file-for-pods/) for mongos Pods |
|                 | |
| **Key**         | {{ optionlink('sharding.mongos.hostAliases.hostnames') }} |
| **Value**       | subdoc |
| **Example**     | |
| **Description** | Hostnames for [Kubernetes host aliases]([https://kubernetes.io/docs/concepts/storage/persistent-volumes/](https://kubernetes.io/docs/tasks/network/customize-hosts-file-for-pods/) for mongos   Pods |

## <a name="operator-backup-section"></a>Backup Section

The `backup` section in the
[deploy/cr.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml)
file contains the following configuration options for the regular
Percona Server for MongoDB backups.

|                 | |
|-----------------|-|
| **Key**         | {{ optionlink('backup.enabled') }} |
| **Value**       | boolean |
| **Example**     | `true` |
| **Description** | Enables or disables making backups |
|                 | |
| **Key**         | {{ optionlink('backup.image') }} |
| **Value**       | string |
| **Example**     | `percona/percona-server-mongodb-operator:{{ release }}-backup` |
| **Description** | The Percona Server for MongoDB Docker image to use for the backup |
|                 | |
| **Key**         | {{ optionlink('backup.serviceAccountName') }} |
| **Value**       | string |
| **Example**     | `percona-server-mongodb-operator` |
| **Description** | Name of the separate privileged service account used by the Operator |
|                 | |
| **Key**         | {{ optionlink('backup.annotations') }} |
| **Value**       | string |
| **Example**     | `sidecar.istio.io/inject: "false"` |
| **Description** | The [Kubernetes annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/) metadata for the backup job |
|                 | |
| **Key**         | {{ optionlink('backup.resources.limits.cpu') }} |
| **Value**       | string |
| **Example**     | `100m` |
| **Description** | [Kubernetes CPU limit](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for backups |
|                 | |
| **Key**         | {{ optionlink('backup.resources.limits.memory') }} |
| **Value**       | string |
| **Example**     | `0.2G` |
| **Description** | [Kubernetes Memory limit](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for backups |
|                 | |
| **Key**         | {{ optionlink('backup.resources.requests.cpu') }} |
| **Value**       | string |
| **Example**     | `100m` |
| **Description** | The [Kubernetes CPU requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for backups |
|                 | |
| **Key**         | {{ optionlink('backup.resources.requests.memory') }} |
| **Value**       | string |
| **Example**     | `0.1G` |
| **Description** | The [Kubernetes Memory requests](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/#resource-requests-and-limits-of-pod-and-container) for backups |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.type') }} |
| **Value**       | string |
| **Example**     | `s3` |
| **Description** | The cloud storage type used for backups. Only `s3` type is currently supported |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.s3.insecureSkipTLSVerify') }} |
| **Value**       | boolean |
| **Example**     | `true` |
| **Description** | Enable or disable verification of the storage server TLS certificate. Disabling it may be useful e.g. to skip TLS verification for private S3-compatible storage with a self-issued certificate |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.s3.credentialsSecret') }} |
| **Value**       | string |
| **Example**     | `my-cluster-name-backup-s3` |
| **Description** | The [Kubernetes secret](https://kubernetes.io/docs/concepts/configuration/secret/) for backups. It should contain `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` keys. |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.s3.bucket') }} |
| **Value**       | string |
| **Example**     | |
| **Description** | The [Amazon S3 bucket](https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingBucket.html) name for backups |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.s3.prefix') }} |
| **Value**       | string |
| **Example**     | `""` |
| **Description** | The path (sub-folder) to the backups inside the [bucket](https://docs.aws.amazon.com/AmazonS3/latest/dev/UsingBucket.html) |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.s3.uploadPartSize') }} |
| **Value**       | int |
| **Example**     | `10485760` |
| **Description** | The size of data chunks in bytes to be uploaded to the storage bucket (10 MiB by default) |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.s3.maxUploadParts') }} |
| **Value**       | int |
| **Example**     | `10000` |
| **Description** | The maximum number of data chunks to be uploaded to the storage bucket (10000 by default) |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.s3.storageClass') }} |
| **Value**       | string |
| **Example**     | `STANDARD` |
| **Description** | The [storage class name](https://aws.amazon.com/s3/storage-classes) of the S3 storage |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.s3.region') }} |
| **Value**       | string |
| **Example**     | `us-east-1` |
| **Description** | The [AWS region](https://docs.aws.amazon.com/general/latest/gr/rande.html) to use. Please note **this option is mandatory** for Amazon and all S3-compatible storages |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.s3.endpointUrl') }} |
| **Value**       | string |
| **Example**     | |
| **Description** | The endpoint URL of the S3-compatible storage to be used (not needed for the original Amazon S3 cloud) |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.s3.serverSideEncryption.kmsKeyID') }} |
| **Value**       | string |
| **Example**     | `""` |
| **Description** | The [ID of the key stored in the AWS KMS](https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html#kms_keys) used by the Operator for [backups server-side encryption](backups-encryption.md)
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.s3.serverSideEncryption.sseAlgorithm') }} |
| **Value**       | string |
| **Example**     | `aws:kms` |
| **Description** | The key management mode used for [backups server-side encryption](backups-encryption.md) with the encryption keys stored in [AWS KMS](https://aws.amazon.com/kms/) - `aws:kms` is the only supported value for now |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.s3.serverSideEncryption.sseCustomerAlgorithm') }} |
| **Value**       | string |
| **Example**     | `AES256` |
| **Description** | The key management mode for [backups server-side encryption with customer-provided keys](backups-encryption.md) - `AES256` is the only supported value for now|
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.s3.serverSideEncryption.sseCustomerKey') }} |
| **Value**       | string |
| **Example**     | `""` |
| **Description** | The locally-stored base64-encoded custom encryption key used by the Operator for [backups server-side encryption](backups-encryption.md) on S3-compatible storages |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.azure.credentialsSecret') }} |
| **Value**       | string |
| **Example**     | `my-cluster-azure-secret` |
| **Description** | The [Kubernetes secret](https://kubernetes.io/docs/concepts/configuration/secret/) for backups. It should contain `AZURE_STORAGE_ACCOUNT_NAME` and `AZURE_STORAGE_ACCOUNT_KEY` |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.azure.container') }} |
| **Value**       | string |
| **Example**     | `my-container` |
| **Description** | Name of the [container](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction#containers) for backups |
|                 | |
| **Key**         | {{ optionlink('backup.storages.&lt;storage-name&gt;.azure.prefix') }} |
| **Value**       | string |
| **Example**     | `""` |
| **Description** | The path (sub-folder) to the backups inside the [container](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction#containers) |
|                 | |
| **Key**         | {{ optionlink('backup.pitr.enabled') }} |
| **Value**       | boolean |
| **Example**     | `false` |
| **Description** | Enables or disables [point-in-time-recovery functionality](backups.md#backups-pitr-oplog) |
|                 | |
| **Key**         | {{ optionlink('backup.pitr.oplogOnly') }} |
| **Value**       | boolean |
| **Example**     | false |
| **Description** | If true, Percona Backup for MongoDB saves oplog chunks even without the base backup snapshot (oplog chunks without a base backup can't be used to restore a backup by the Operator, [but can still be useful for manual restore operations](https://docs.percona.com/percona-backup-mongodb/usage/oplog-replay.html)) |
|                 | |
| **Key**         | {{ optionlink('backup.pitr.oplogSpanMin') }} |
| **Value**       | int |
| **Example**     | `10` |
| **Description** | Number of minutes between the uploads of oplogs |
|                 | |
| **Key**         | {{ optionlink('backup.pitr.compressionType') }} |
| **Value**       | string |
| **Example**     | `gzip` |
| **Description** | The point-in-time-recovery chunks compression format, [can be gzip, snappy, lz4, pgzip, zstd, s2, or none](https://docs.percona.com/percona-backup-mongodb/point-in-time-recovery.html#incremental-backups) |
|                 | |
| **Key**         | {{ optionlink('backup.pitr.compressionLevel') }} |
| **Value**       | int |
| **Example**     | `6` |
| **Description** | The point-in-time-recovery chunks compression level ([higher values result in better but slower compression](https://docs.percona.com/percona-backup-mongodb/point-in-time-recovery.html#incremental-backups)) |
|                 | |
| **Key**         | {{ optionlink('backup.tasks.name') }} |
| **Value**       | string |
| **Example**     | |
| **Description** | The name of the backup |
|                 | |
| **Key**         | {{ optionlink('backup.tasks.enabled') }} |
| **Value**       | boolean |
| **Example**     | `true` |
| **Description** | Enables or disables this exact backup |
|                 | |
| **Key**         | {{ optionlink('backup.tasks.schedule') }} |
| **Value**       | string |
| **Example**     | `0 0 \* \* 6` |
| **Description** | The scheduled time to make a backup, specified in the [crontab format](https://en.wikipedia.org/wiki/Cron) |
|                 | |
| **Key**         | {{ optionlink('backup.tasks.keep') }} |
| **Value**       | int |
| **Example**     | `3` |
| **Description** | The amount of most recent backups to store. Older backups are automatically deleted. Set `keep` to zero or completely remove it to disable automatic deletion of backups |
|                 | |
| **Key**         | {{ optionlink('backup.tasks.storageName') }} |
| **Value**       | string |
| **Example**     | `st-us-west` |
| **Description** | The name of the S3-compatible storage for backups, configured in the storages subsection |
|                 | |
| **Key**         | {{ optionlink('backup.tasks.compressionType') }} |
| **Value**       | string |
| **Example**     | `gzip` |
| **Description** | The backup compression format, [can be gzip, snappy, lz4, pgzip, zstd, s2, or none](https://docs.percona.com/percona-backup-mongodb/running.html#starting-a-backup) |
|                 | |
| **Key**         | {{ optionlink('backup.tasks.compressionLevel') }} |
| **Value**       | int |
| **Example**     | `6` |
| **Description** | The backup compression level ([higher values result in better but slower compression](https://docs.percona.com/percona-backup-mongodb/running.html#starting-a-backup)) |
|                 | |
| **Key**         | {{ optionlink('backup.tasks.type') }} |
| **Value**       | string |
| **Example**     | `physical` |
| **Description** | The backup type: (can be either `logical` (default) or `physical`; see [the Operator backups official documentation](backups.md#physical) for details |
