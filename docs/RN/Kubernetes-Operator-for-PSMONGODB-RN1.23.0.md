# Percona Operator for MongoDB 1.23.0 ({{date.1_23_0}})

[Get started with the Operator :material-arrow-right:](../quickstart.md){.md-button}
[Upgrade :material-arrow-right:](../update.md){.md-button}

## What's new at a glance

### Data management

* [Real-time replication or near zero-downtime migration with Percona ClusterSync for MongoDB](#migrate-and-keep-clusters-in-sync-with-the-operator-managed-percona-clustersync-for-mongodb)
* [Vector search support in the Operator (tech preview)](#run-ai-and-semantic-search-workloads-with-vector-search-available-in-percona-operator-for-mongodb-tech-preview)

### Storage management

* [Boost backup and restore performance with PVC snapshot support (tech preview)](#boost-backup-and-restore-performance-with-pvc-snapshot-support-tech-preview)
* [Native support of OCI Object Storage](#native-backups-to-oracle-cloud-infrastructure-object-storage)
* [Alibaba Cloud Object Storage Service (OSS) support](#support-of-alibaba-cloud-oss-for-backups)
* [Workload Identity authentication support for GCS backups](#workload-identity-authentication-support-for-gcs-backups)

### Backup and restore operations

* [Improved troubleshooting with the ability to restore a collection under a different name](#restore-a-collection-under-a-different-name)

### Security improvements

* [Use your existing cert-manager ClusterIssuer for TLS management](#use-your-existing-cert-manager-clusterissuer-for-mongodb-tls)

### Developer experience

* [Operator-generated connection strings in Secrets](#connect-applications-using-operator-generated-connection-string-secrets)

## Release Highlights

### Migrate and keep clusters in sync with the Operator-managed Percona ClusterSync for MongoDB

You can now run [Percona ClusterSync for MongoDB (PCSM) :octicons-link-external-16:](https://docs.percona.com/percona-clustersync-for-mongodb/) through the Operator. PCSM clones existing data from source MongoDB deployment to target one and uses MongoDB change stream events to track the changes on the source and replicate them to the target in real time.

You could use PCSM with the Operator before but you had to deploy it yourself, wire up connection strings and run `pcsm` commands manually. Now you declare the source, target, and replication mode in a dedicated `PerconaServerMongoDBClusterSync` Custom Resource. The Operator deploys PCSM, connects the clusters, manages the replication lifecycle, and reports lag and status in the same way it manages your Percona Server for MongoDB.

With Percona ClusterSync for MongoDB available in the Operator you can:

* Move from MongoDB Atlas or MongoDB Enterprise Edition to the Operator-managed Percona Server for MongoDB with less operational risk
* Keep a continuous replica of production data for non-production or disaster recovery workloads
* Run hybrid-cloud sync between external MongoDB and Kubernetes without a separate PCSM stack to maintain
  
See the [documentation](../clustersync.md) for setup and day-2 operations.

### Run AI and semantic search workloads with vector search available in Percona Operator for MongoDB (tech preview)

You can now use full-text and vector search with Percona Operator for MongoDB. Full-text search finds documents by matching keywords and phrases in the text. Vector search retrieves results based on meaning rather than exact word matches, so you can store and query vector data alongside traditional data in Percona Server for MongoDB. Use it for AI and retrieval-augmented generation (RAG) workloads, semantic search and similarity queries. As a result, you have the same capability that MongoDB Atlas customers and self-managed upstream users already have.

Full-text and vector search are provided by a separate tool called Percona Search for MongoDB that runs the `mongot` search process. You manage it declaratively in the Custom Resource. The Operator deploys and manages the `mongot` alongside your cluster, wires authentication and TLS, and keeps search in sync with your data for both replica set and sharded deployments. Existing clusters that don’t enable search continue to run unchanged after you upgrade.

Full-text and vector search require Percona Server for MongoDB 8.3 or later. The Operator uses experimental 8.3 images that you must explicitly specify in the Custom Resource.

This feature is available as a tech preview and is not recommended for production use yet. Try it in staging or testing environments and share your feedback to help us shape its future.

Learn more in the [documentation](../search-overview.md) and [setup tutorial](../search-setup.md).

### Boost backup and restore performance with PVC snapshot support (tech preview)

You can now use PVC snapshots to speed up backups and restores in your Percona Server for MongoDB clusters. A PVC snapshot is a point-in-time copy of your data volumes taken directly at the storage layer. Instead of streaming data to cloud storage, the Operator creates fast, storage level snapshots. This is especially beneficial for large data set owners, boosting their backup and restore performance.

This feature is in the tech preview stage and is not recommended for production use yet. We encourage you to try it out in testing or staging environment and leave your feedback.

Using PVC snapshots, you benefit from:

* Faster backups — Snapshots typically complete in seconds or minutes, no matter how large your database is. Traditional full backups can take hours.
* Compatibility with encrypted and TLS enabled clusters — PVC snapshots work seamlessly with data at rest encryption and TLS, preserving your existing security posture.
* Faster restores — Creating a new cluster from a snapshot is significantly quicker than restoring from cloud storage.
* Lower resource usage — Snapshots avoid the CPU and network overhead of transferring data to remote storage.

The Operator uses the PBM workflow for external backups and restores, automating all required steps. You only need to create the `VolumeSnapshotClass`, reference it in the backup object for on demand backups or in the Custom Resource for scheduled backups, and specify the backup type as `external`.

You can find details about the workflow, requirements, and limitations in the [PVC snapshot support documentation](../backups-snapshots.md). For setup and usage instructions, refer to our [tutorial](backups-snapshots-setup.md).

### Connect applications using operator-generated connection string Secrets

The Operator now creates and maintains Kubernetes Secrets with ready-to-use MongoDB connection strings for the `databaseAdmin` user and for each operator-managed custom user. The Secret names are `<cluster-name>-databaseadmin-conn-str` and `<cluster-name>-custom-user-secret-conn-str` respectively. You no longer need to assemble URIs yourself from Pod names, Services, credentials, and TLS settings.

After you deploy a cluster, the Operator generates connection strings that reflect your actual topology — replica set size, sharded layout, internal DNS names, and exposed endpoints when you enable them. Application teams can mount these Secrets directly in Deployments, Jobs, or CI pipelines instead of maintaining separate connection logic.

The use of connection secrets helps you:

* Connect applications faster — reference a Secret in your manifest and start using MongoDB without writing custom scripts to build URIs
* Stay correct as the cluster changes — when you scale a replica set or expose services, the Operator updates the connection strings for you. 
* Support GitOps and platform workflows — platform teams can standardize on a predictable Secret naming pattern instead of documenting hand-built connection strings for every cluster.
  
For details about connection Secrets, see [connection Secrets documentation](../connection-secrets.md).

### Workload Identity authentication support for GCS backups

You can now make backup to Google Cloud Storage without storing service account JSON keys in Kubernetes Secrets. This unblocks GKE environments that use [Workload Identity](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity) and policies that forbid exporting service account keys.

To use it:

1. Enable Workload Identity on your GKE cluster.
2. Create a Google service account with access to your backup bucket (for example, `roles/storage.objectUser`).
3. Bind that Google service account to the Kubernetes Service Account used by your database Pods.

Then configure GCS storage in the Custom Resource and omit `gcs.credentialsSecret`. The Operator configures Percona Backup for MongoDB to use Application Default Credentials (ADC), so Pods authenticate with short-lived tokens instead of long-lived keys.

```yaml
backup:
  storages:
    gcs-wi:
      type: gcs
      gcs:
        bucket: my-backup-bucket
        prefix: mongodb-backup
        # credentialsSecret omitted — PBM uses Workload Identity / ADC
```

This improvement makes keyless GCS backups a first-class option in the Operator.

### Native backups to Oracle Cloud Infrastructure Object Storage

You can now store MongoDB backups directly in Oracle Cloud Infrastructure (OCI) Object Storage. If your MongoDB cluster runs on Oracle Cloud or Oracle Kubernetes Engine (OKE), you can store backups in OCI Object Storage natively and no longer need to use an S3-compatible endpoint as a workaround.

The Operator embeds this capability from Percona Backup for MongoDB, so you get the latest PBM storage enhancements through the familiar Custom Resource workflow.

Configure storage in the Custom Resource with the `type: oci`, and choose how to authenticate:

* **User principal** — Use the API signing key and store it in a Kubernetes Secret. This method works inside or outside OCI
* **OKE workload identity** — enjoy keyless access via Service Account IAM policies on enhanced OKE clusters

You can also encrypt backups at rest with OCI Vault or a customer-provided key.

With the support of OCI Object Storage, you get the same Operator-managed backup and restore experience on Oracle Cloud as with the other [supported storage services](../backups-storage.md). When you use workload identity, you also benefit from less credential handling.

### Support of Alibaba Cloud OSS for backups

You can now store backups made through the Operator in [Alibaba Cloud Object Storage Service (OSS) :octicons-link-external-16:](https://www.alibabacloud.com/en/product/object-storage-service). If you operate in Asia-Pacific or China region or already use Alibaba Cloud infrastructure, this ability lets you reduce latency, simplify compliance, and achieve fewer cross-cloud hops.

With the new `oss` storage type, configure backups the same way as for other cloud storages: create a Secret with Alibaba credentials, point the Custom Resource at your OSS bucket and endpoint, then run on-demand or scheduled backups and restores as usual.

~~~yaml
backup:
  storages:
    alibaba-oss:
      type: oss
      oss:
        bucket: OSS-BACKUP-BUCKET-NAME-HERE
        prefix: "some-prefix"
        credentialsSecret: my-cluster-name-backup-oss
        endpointUrl: https://oss-eu-central-1.aliyuncs.com
        region: eu-central-1
~~~

The Secret must include `ALIBABA_ACCESS_KEY_ID` and `ALIBABA_ACCESS_KEY_SECRET`. Optional settings cover upload retries, multipart upload size, and server-side encryption (SSE-OSS or SSE-KMS) via a per-storage SSE Secret.

See our [documentation](../backups-storage-oss.md) for configuration and examples.

With this integration, you no longer need a workaround or a second cloud for backups, since logical, physical, and incremental backups now go straight to OSS.

### Restore a collection under a different name

You can now restore a single collection from a full logical backup under a different name up to a certain point in time alongside the current collection in the same database, to a different database or to a different cluster. This is useful when you need to recover from an accidental delete or bad write. Restore the collection side by side, compare or validate the data, then merge what you need back into production.

The Operator automates the full flow through the Restore Custom Resource, so you don't need to exec into pods or run PBM manually. You get safer partial recovery with less operational risk and a clear, trackable restore status.

Set the source and target namespaces in the `PerconaServerMongoDBRestore` Custom Resource:

```yaml
apiVersion: psmdb.percona.com/v1
kind: PerconaServerMongoDBRestore
metadata:
  name: restore-remap
spec:
  clusterName: my-cluster-name
  backupName: backup1
  selective:
    nsFrom: "myApp.test"
    nsTo: "myApp.test_remapped"
```

The feature is supported for replica sets and unsharded collections. Refer to our [documentation](../backups-restore-new-name.md) for configuration examples and workflows.

### Configure external nodes as arbiters

You can now declare an external node as an arbiter in your Custom Resource by setting `arbiterOnly: true` under `replsets.externalNodes`. This lets you add a lightweight tie-breaker vote in a third location without running another data-bearing member in Kubernetes.

Here's the example configuration:
```yaml
replsets:
  - name: rs0
    externalNodes:
      - host: arbiter-0.example.com
        priority: 0
        votes: 1
        arbiterOnly: true
```

For deployments distributed across multiple regions or data centers, this is a practical way to keep an odd number of voters without having to manually restore the majority configuration during a failover. Instead, you can deploy a main cluster with 2 voting members, a replica cluster with 2 voting member and another cluster with only an arbiter in another region . With this setup, you get reliable elections and quorum without the cost and operational overhead of another full replica.

### More control over TLS certificate management

If you manage TLS certificates manually, such as through Kubernetes Secrets synced from AWS Secrets Manager or via External Secrets, losing access to those Secrets even briefly can lead to a service outage.

By default, the Operator treats a missing TLS Secret as a signal to create new certificates, restart the database Pods, and apply the new CA. Applications that still trust your original CA may lose connectivity.

Starting with version 1.23.0, you can control the Operator's behavior with the `spec.tls.certManagementPolicy` option in the Custom Resource. Available policies are:

* `auto` (default) — Keeps the existing behavior. If TLS Secrets are missing, the Operator creates new certificates automatically.
* `userProvidedOnly` — Certificate lifecycle stays entirely under your control. The Operator does not create or replace TLS certificates, if a TLS Secret is temporarily unavailable. In this way, your applications can keep using the existing certificates while you restore access to the Secret.

```yaml
spec:
  tls:
    mode: preferTLS
    certManagementPolicy: userProvidedOnly
    allowInvalidCertificates: false
  secrets:
    ssl: my-cluster-name-ssl
    sslInternal: my-cluster-name-ssl-internal
```

### Use your existing cert-manager ClusterIssuer for MongoDB TLS

If you already run `cert-manager` with a cluster-wide issuer, you can now point the Operator at that ClusterIssuer instead of letting it create its own CA chain. This way you include Percona Server for MongoDB managed by the Operator in your organization’s PKI and apply the same renewal and trust policies you already use elsewhere in the cluster.

Configure your cluster to use your issuer by setting `tls.issuerConf.kind` to `ClusterIssuer` and referencing your existing ClusterIssuer in `tls.issuerConf.name`. The Operator then creates Certificate resources that cert-manager signs through your CA.

If you pre-create Certificate or ClusterIssuer resources before deploying the cluster, the Operator detects and uses them. This gives you a clean path when your platform team owns cert-manager and you only need the Operator to wire MongoDB into that setup.

To use the cluster-wide ClusterIssuer resource, the Operator must know the namespace where the `cert-manager` is deployed.  By default that namespace is `cert-manager`. If you installed cert-manager elsewhere, set the `CERTMANAGER_NAMESPACE` environment variable on the Operator deployment.  

With this improvement, you keep a single source of truth for TLS in your Kubernetes cluster. The Operator fits seamlessly into the way you already manage TLS across your platform. You keep control, avoid duplication, and Percona Server for MongoDB aligns with the same trusted process your other workloads use.

### Tune the Operator reconciliation interval to reduce Kubernetes API load

The Operator re-runs reconciliation on a fixed schedule to keep each cluster aligned with its Custom Resource. Before this release, that interval was hardcoded to 5 seconds. In environments with many clusters, that default can generate a high volume of Kubernetes API requests.

You can now tune the reconciliation behavior to match your environment. Set the `RECONCILE_INTERVAL` environment variable on the Operator Deployment to reduce API traffic in stable production setups, ease pressure on shared Kubernetes clusters or avoid throttling without rebuilding images. The default value remains `5s` seconds, so existing deployments behave as before.

Set the value as a Go duration string (for example, `30s` or `1m`):
```yaml
env:
  - name: RECONCILE_INTERVAL
    value: "30s"
```

To learn more, see the documentation for [Operator environment variables](../env-vars-operator.md) and [Configure concurrent reconciliation](../reconciliation-concurrency.md).

### Control StatefulSet revision history from your Custom Resource

Every configuration change creates a new revision in the StatefulSet history. Without a limit, old revisions can accumulate and clutter the namespace.

With this release, you can configure how many past revisions Kubernetes keeps for your database StatefulSets. Set the value for the `spec.revisionHistoryLimit` option in the `PerconaServerMongoDB` Custom Resource:

```yaml
spec:
  updateStrategy: SmartUpdate
  revisionHistoryLimit: 10
```

The default number of revisions is 10.

By adjusting the `revisionHistoryLimit`, you choose the balance that fits your operations: either to keep fewer revisions for a cleaner environment, or to retain more if you rely on additional rollback points during frequent configuration changes.

### Configure query analytics source for PMM

You can now choose how PMM collects Query Analytics (QAN) data for your MongoDB clusters: via a `profiler` (default) or via a `mongolog` tool. 

`mongolog` reads slow-query data directly from `mongod` log files so PMM needs almost no ongoing database connections and has minimal impact on the server. You keep full QAN visibility in PMM while reducing the operational cost of query monitoring. This is especially useful in production clusters where using the `profiler` has been a concern.

The `profiler` remains the default query analytics source, so existing monitoring setups are unchanged.

To switch to `mongolog`, set the value for the `spec.pmm.querySource` Custom Resource option. Also, ensure your cluster meets these prerequisites:

* PMM Server and PMM Client version 3.3.0 or newer
* [Log collector enabled](../persistent-logging.md) so `mongod` logs are written to `/data/db/logs/`
* Percona Server for MongoDB configured to log slow operations to the diagnostic log (for example, `operationProfiling.mode: off` with a `slowOpThresholdMs` value)

Example configuration:

```yaml
spec:
  pmm:
    enabled: true
    querySource: mongolog
  logcollector:
    enabled: true
  replsets:
    - name: rs0
      configuration: |
        operationProfiling:
          mode: off
          slowOpThresholdMs: 200
```

### Custom health probes for sidecar containers

With this release, you can configure custom liveness and readiness probes for `pmm-client`, `backup`, `logcollector` and `logrotate` sidecar containers. By default, only the PMM Client has a built-in liveness probe; the other sidecars have none.

Custom probes help when you need to:

* Match probe timing to slow starts or constrained clusters, so Kubernetes does not restart healthy containers too early
* Add readiness checks so traffic or dependent workflows wait until monitoring, backup, or logging is actually ready
* Meet platform or compliance rules that require health checks on every container in the Pod
* Use environment-specific checks (HTTP, TCP, or exec) instead of a one-size-fits-all default

Configure probes in the Custom Resource under `pmm`, `backup`, `logcollector`, and `logcollector.logrotate` sections. Defaults stay unchanged until you set a probe. 

### Official support for Rancher Kubernetes Engine (RKE2)

[Rancher Kubernetes Engine (RKE2) :octicons-link-external-16:](https://docs.rke2.io/) is now an officially supported platform. Every Operator release is now tested on RKE2 to ensure that you can run it on Rancher-managed Kubernetes clusters with confidence.

### The Operator is now fully supported on ARM64 architectures

All Operator images are now available for ARM64, giving you native support on ARM based clusters with no extra setup.

## Documentation improvements

* Added a new chapter to the documentation covering how to configure OIDC authentication in the Operator.
* Added instructions how to install the Operator with customized parameters using Helm as well as how to override release names.
  
## CRD Changes

* A new CRD `PerconaServerMongoDBClusterSync` is added
* The `backup.storages.gcs.secret` option is now optional if you use Workload Identity Federation. See [Google Cloud storage](../backups-storage-gcp.md) to learn more.
* The `.spec.type` option has a new value `external`

## Changelog

### New Features

* [K8SPSMDB-1031](https://perconadev.atlassian.net/browse/K8SPSMDB-1031) - Added support for configuring an external node as an arbiter in multi-datacenter replica sets. This lets you place a voting arbiter in a third region for high availability without replicating full data copies to that site. (Thank you @tariktunahanakan for contributing to this feature)

* [K8SPSMDB-1363](https://perconadev.atlassian.net/browse/K8SPSMDB-1363) - Added support for PVC volume snapshots so you can back up large clusters using storage-provider snapshots. This is especially useful for multi-terabyte deployments where object-storage backups are slower or more costly than native volume snapshots.

* [K8SPSMDB-1413](https://perconadev.atlassian.net/browse/K8SPSMDB-1413) - Improved cert-manager integration so TLS setups that use `issuerConf` work correctly with the Operator. 

* [K8SPSMDB-1458](https://perconadev.atlassian.net/browse/K8SPSMDB-1458) - Added the `certManagementPolicy` field to the `PerconaServerMongoDB` Custom Resource. This gives you explicit control over how the Operator manages TLS Secrets with certificates generated manually. (Thank you Lake Yoo for contributing to this feature)

* [K8SPSMDB-1519](https://perconadev.atlassian.net/browse/K8SPSMDB-1519) - Added support for Alibaba Cloud Object Storage Service as a backup destination. 

* [K8SPSMDB-1537](https://perconadev.atlassian.net/browse/K8SPSMDB-1537) - Added automatic generation of a Secret that contains ready-to-use MongoDB connection strings. Applications can consume `mongodb://` and `mongodb+srv://` URIs directly without assembling host lists, credentials, and TLS options manually.

* [K8SPSMDB-1546](https://perconadev.atlassian.net/browse/K8SPSMDB-1546) - Added support for Query Analytics (QAN) via mongolog as a data source for the PMM Client. This lets you use log-based query monitoring, which is better suited for large-scale MongoDB workloads with PMM 3.3.0 and later.

* [K8SPSMDB-1596](https://perconadev.atlassian.net/browse/K8SPSMDB-1596) - Added Rancher Kubernetes Engine (RKE2) to the certified and tested platforms for the Operator. This confirms that you can run production clusters on Rancher-managed Kubernetes and expect the same reliability as on other supported platforms.

* [K8SPSMDB-1602](https://perconadev.atlassian.net/browse/K8SPSMDB-1602) - Added support for Workload Identity authentication with Google cloud Storage for backups. This lets PBM authenticate to object storage with cloud identity federation instead of static access keys. (Thank you Christopher Tineo for contributing to this feature)

* [K8SPSMDB-1603](https://perconadev.atlassian.net/browse/K8SPSMDB-1603) - Added namespace remapping (`nsFrom` / `nsTo`) to the `PerconaServerMongoDBRestore` Custom Resource. You can restore a collection under a different name through a Kubernetes-native restore object, without having to manually run PBM commands.

* [K8SPSMDB-1608](https://perconadev.atlassian.net/browse/K8SPSMDB-1608) - Added the ability to define the custom external DNS so that each exposed Pod Service gets a unique, human-readable hostname. ExternalDNS can then publish predictable DNS records instead of opaque hostnames generated by the cloud load balancer. (Thank you Lake Yoo for reporting and contributing to this feature)

* [K8SPSMDB-1610](https://perconadev.atlassian.net/browse/K8SPSMDB-1610) - Added support for Percona ClusterSync for MongoDB (PCSM) so the Operator can deploy and manage real-time replication or near-zero-downtime migration between MongoDB deployments. Replication state and lag are reflected in the `PerconaServerMongoDB` status for easier monitoring and automation.

* [K8SPSMDB-1644](https://perconadev.atlassian.net/browse/K8SPSMDB-1644) - Added Oracle Cloud Infrastructure (OCI) Object Storage as a supported backup destination in the Custom Resource. You can configure OCI buckets for PBM backups instead of using an S3-compatible endpoint as a workaround.

* [K8SPSMDB-1654](https://perconadev.atlassian.net/browse/K8SPSMDB-1654) - Added Vector Search support for Percona Server for MongoDB clusters managed by the Operator. This lets you run vector search workloads on Operator-managed clusters.

* [K8SPSMDB-1701](https://perconadev.atlassian.net/browse/K8SPSMDB-1701) - Added Custom Resource options to override liveness probes and define readiness probes for the `pmm-client` and `backup-agent` sidecars. Defaults remain unchanged, so existing clusters keep current probe behavior unless you customize them.

* [K8SPSMDB-1705](https://perconadev.atlassian.net/browse/K8SPSMDB-1705) - Upgraded Percona Backup for MongoDB to version 2.15.0. This brings the latest PBM backup and restore improvements into Operator-managed clusters.

* [K8SPSMDB-1728](https://perconadev.atlassian.net/browse/K8SPSMDB-1728) - Added Custom Resource options to override liveness probes and define readiness probes for the `logcollector` and `logrotate` sidecars. Defaults remain unchanged, so these sidecars stay without probes unless you configure them.

### Improvements

* [K8SPSMDB-680](https://perconadev.atlassian.net/browse/K8SPSMDB-680) - Added the ability to set `enableLocalhostAuthBypass=false` for MongoDB instances managed by the Operator. This helps environments that require stricter localhost authentication bypass controls to meet security policy.

* [K8SPSMDB-1427](https://perconadev.atlassian.net/browse/K8SPSMDB-1427) - Ensured TLS `.pem` files are generated even when containers start in sleep-forever debug mode. This simplifies manual troubleshooting because you no longer need to assemble certificate files by hand before starting `mongod`.

* [K8SPSMDB-1456](https://perconadev.atlassian.net/browse/K8SPSMDB-1456) - Improved replica set initialization so a failed system user creation no longer leaves the cluster permanently stuck. The Operator retries initialization and can complete cluster setup after a transient failure during user bootstrap.(Thank you Dobes Vandermeer for reporting this issue)

* [K8SPSMDB-1571](https://perconadev.atlassian.net/browse/K8SPSMDB-1571) - Made the Operator reconciliation interval configurable through an environment variable so that you can adjust Kubernetes API load for your environment instead of relying on the previous fixed five-second interval. (Thank you Alexandre Dutra for contributing to this issue)

* [K8SPSMDB-1572](https://perconadev.atlassian.net/browse/K8SPSMDB-1572) - Added the `revisionHistoryLimit` option to the `PerconaServerMongoDB` Custom Resource. The Operator applies this value to managed StatefulSets so you can limit retained ControllerRevision objects and keep cluster resource usage under control. (Thank you Lake Yoo for contributing to this issue)

* [K8SPSMDB-1586](https://perconadev.atlassian.net/browse/K8SPSMDB-1586) - Stopped creating unused encryption key and keyfile Secrets when HashiCorp Vault is configured for secrets management. This avoids confusing unused credentials in clusters that already store keys in Vault.

* [K8SPSMDB-1711](https://perconadev.atlassian.net/browse/K8SPSMDB-1711) - Switched the Operator Deployment probes to the standard `/healthz` and `/readyz` endpoints. This aligns Operator health checks with common Kubernetes controller patterns and improves readiness detection. (Thank you Ilia Lazebnik for contributing to this issue)

### Bug Fixes

* [K8SPSMDB-1139](https://perconadev.atlassian.net/browse/K8SPSMDB-1139) - Fixed unnecessary PVC resize attempts on platforms that provision volumes with `G` units instead of `Gi`. The Operator now handles both unit styles correctly and no longer triggers resize right after cluster creation on environments such as k3d or some on-premises clusters.

* [K8SPSMDB-1255](https://perconadev.atlassian.net/browse/K8SPSMDB-1255) - Reduced log noise for clusters with arbiter nodes by stopping repeated "Fixing member configurations" messages. The Operator no longer continuously rewrites arbiter member tags on every reconcile cycle.

* [K8SPSMDB-1389](https://perconadev.atlassian.net/browse/K8SPSMDB-1389) - Fixed a storage scaling error that occurred when a requested size rounded to the same PVC size already in use. The Operator now detects no-op resize cases and avoids invalid StatefulSet updates that previously left the cluster in an Error state.

* [K8SPSMDB-1444](https://perconadev.atlassian.net/browse/K8SPSMDB-1444) - Stopped creating an unused internal member keyfile Secret when replica set members authenticate with x509 under TLS. The keyfile Secret is now created only for modes that do require shared keyfile authentication.

* [K8SPSMDB-1455](https://perconadev.atlassian.net/browse/K8SPSMDB-1455) - Fixed a bug where the Operator repeatedly attempted to delete StatefulSets that no longer existed. This removes unnecessary reconcile work and related log noise after resources are already gone. (Thank you Bernard Grymonpon for reporting this issue)

* [K8SPSMDB-1476](https://perconadev.atlassian.net/browse/K8SPSMDB-1476) - Fixed LoadBalancer Service finalizer handling that caused `UnexpectedlyRemovedFinalizer` warnings on internal load balancers. Service updates no longer strip cloud-provider cleanup finalizers during normal reconciliation. (Thank you user @pave-thien for reporting this issue)

* [K8SPSMDB-1547](https://perconadev.atlassian.net/browse/K8SPSMDB-1547) - Fixed Helm chart installs that failed when users defined additional replica sets without repeating `volumeSpec` in every override. The chart now supplies the required volume configuration so multi-replica-set installs validate successfully.

* [K8SPSMDB-1575](https://perconadev.atlassian.net/browse/K8SPSMDB-1575) - Fixed Operator errors after creating custom users with long names caused by user annotation key exceeding the Kubernetes 63-character limit. The Operator now calculates the sha256 sum of `<crName>-<userName>` and encodes it in base32 this way ensuring the annotation key adheres to the 63-character limit. User creation succeeds without secret annotation validation failures during password or role updates.

* [K8SPSMDB-1583](https://perconadev.atlassian.net/browse/K8SPSMDB-1583) - Fixed an Operator panic that occurred when PMM was enabled but the required PMM token or API key was missing from the Secret. The Operator now reports a clear configuration error and continues reconciliation safely.

* [K8SPSMDB-1592](https://perconadev.atlassian.net/browse/K8SPSMDB-1592) - Fixed recovery behavior when a config server replica set StatefulSet is deleted unexpectedly. The Operator now recreates the missing StatefulSet and related configuration so sharded clusters can heal without a manual Operator restart.

* [K8SPSMDB-1595](https://perconadev.atlassian.net/browse/K8SPSMDB-1595) - Fixed missing SecurityContext on the `pbm-init` container during physical restores. The init container now follows the same security context defaults and configuration options as other Operator-managed init containers. (Thank you Afeedh Shaji for reporting and contributing to this issue)

* [K8SPSMDB-1607](https://perconadev.atlassian.net/browse/K8SPSMDB-1607) - Fixed endless custom user role updates caused by unordered role comparisons between the Custom Resource and MongoDB. The Operator now treats role sets as equal regardless of order, which stops unnecessary reconcile loops and log spam. (Thank you Romain Acciari for contributing to this issue)

* [K8SPSMDB-1619](https://perconadev.atlassian.net/browse/K8SPSMDB-1619) - Fixed a backup lock leak where a failed lease acquisition left stale Lease and lock resources behind. Scheduled backups no longer get stuck in Waiting after transient API or network failures during lock creation.

* [K8SPSMDB-1635](https://perconadev.atlassian.net/browse/K8SPSMDB-1635) - Fixed PMM sidecar authentication so the Operator no longer hardcodes SCRAM-SHA-1 for the monitoring user. You can configure the authentication mechanism, which avoids monitoring failures on clusters that do not advertise SCRAM-SHA-1. (Thank you Roger Reed for reporting this issue)

* [K8SPSMDB-1640](https://perconadev.atlassian.net/browse/K8SPSMDB-1640) - Fixed a bug where the Operator continuously reset default read and write concerns back to `majority`. Custom default concern settings in MongoDB are now preserved across reconciliation cycles. (Thank you Jesper Carlsson for reporting this issue)

* [K8SPSMDB-1643](https://perconadev.atlassian.net/browse/K8SPSMDB-1643) - Fixed a deadlock where starting a restore while another backup was still running left both operations hung indefinitely. The Operator now handles concurrent backup and restore requests sequentially. (Thank you user @Vinh1507 for reporting this issue)

* [K8SPSMDB-1645](https://perconadev.atlassian.net/browse/K8SPSMDB-1645) - Fixed liveness probe behavior that could kill `mongod` during initial sync (`STARTUP2`) when short probe thresholds were configured. The health check now recognizes ongoing initial sync and avoids restarting members before they finish synchronizing.

* [K8SPSMDB-1679](https://perconadev.atlassian.net/browse/K8SPSMDB-1679) - Fixed logrotate container failures on arm64 caused by a missing cron dependency in the `logcollector` entrypoint. Persistent log rotation now starts correctly on arm64 nodes.

* [K8SPSMDB-1685](https://perconadev.atlassian.net/browse/K8SPSMDB-1685) - Fixed a bug where LoadBalancer Services for hidden members were repeatedly deleted and recreated. Hidden-member external Services now persist so clients keep a stable load balancer endpoint.

* [K8SPSMDB-1710](https://perconadev.atlassian.net/browse/K8SPSMDB-1710) - Fixed startup crashes when `readOnlyRootFilesystem` is enabled by providing a writable `/tmp` mount for `mongod` and the backup agent. Containers can again create temporary TLS and WiredTiger files required at runtime. (Thank you Olawale (Walz) Ogundiran for contributing to this issue)


## Supported software

The Operator was developed and tested with the following software:

* Percona Server for MongoDB 6.0.29-23, 7.0.37-20, and 8.0.26-11
* Percona Backup for MongoDB 2.15.0
* PMM Client: 2.44.1-1
* PMM3 Client: 3.8.1
* cert-manager: 1.21.0
* LogCollector based on fluent-bit: 5.0.9-1

Other options may also work but have not been tested.

## Supported platforms

Percona Operators are designed for compatibility with all [CNCF-certified :octicons-link-external-16:](https://www.cncf.io/training/certification/software-conformance/) Kubernetes distributions. Our release process includes targeted testing and validation on major cloud provider platforms and OpenShift, as detailed below:

--8<-- [start:platforms]

* [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.33 - 1.35
* [Amazon Elastic Kubernetes Service (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.33 - 1.36
* [Azure Kubernetes Service (AKS) :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.34 - 1.36
* [OpenShift Container Platform :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.18 - 4.22 
* [Rancher :octicons-link-external-16:](https://www.rancher.com/) with Rancher Kubernetes Engine (RKE2) 1.33 - 1.35  
* [Minikube :octicons-link-external-16:](https://github.com/kubernetes/minikube) 1.38.1 with Kubernetes v1.35.1
--8<-- [end:platforms]

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.

## Percona certified images

Find Percona's certified Docker images that you can use with the Percona Operator for MongoDB in the following table:

--8<-- [start:images]

| Image                                                  | Digest                                                           |
|:-------------------------------------------------------|:-----------------------------------------------------------------|
| percona/percona-server-mongodb:8.0.26-11               | e258e1faf74fb3d521bb2732d2a05fe3b7318335974ef3ddf33783746f6c084f |
| percona/percona-server-mongodb:8.0.26-11 (ARM64)       | 2515c4680c8945febea98de5333a9a9895e39e2bf7f9ec0f240f04b1fe1dc645 |
| percona/percona-server-mongodb:7.0.37-20               | 2762037db63934fa15e20a1fa03258ccfb457633bac7a02cdfbff594d1639c4b |
| percona/percona-server-mongodb:7.0.37-20 (ARM64)       | 392b90cc2e8e67c16bff3885c38819439d7db58ad4a7e734ae8a7cfe24a19a14 |
| percona/percona-server-mongodb:6.0.29-23               | cf9254f6d05f7f64b6295a7d96c6b4591d02e521a68488cb99eb54f9720714c1 |
| percona/percona-server-mongodb:6.0.29-23 (ARM64)       | 62fbdebb132307ced293ad30eeb597e7f4f7f9bf05ccc222a436c7f2b71d5cbc |
| percona/fluentbit:5.0.9-1                              | 1ca02c2c820697ea943b39ab3e033446eca383343bb61acc71981548d31f4c7f |
| percona/fluentbit:5.0.9-1 (ARM64)                      | 1814577514a49b851c59d1bf6ad5ec360ebd04d53ce9f5ece5209498b5c6a64b |
| percona/pmm-client:3.8.1                               | a92cfb7f912bd85d8245575c3ee5c423664ad2baedb674d159a87b113dbd4de2 |
| percona/pmm-client:3.8.1 (ARM64)                       | 3fe427c0666337df7613824da5f3b5fb7397e849f70402ac557c1324c5d996e6 |
| percona/pmm-client:2.44.1-1                            | 52a8fb5e8f912eef1ff8a117ea323c401e278908ce29928dafc23fac1db4f1e3 |
| percona/pmm-client:2.44.1-1 (ARM64)                    | 390bfd12f981e8b3890550c4927a3ece071377065e001894458047602c744e3b |
| percona/percona-backup-mongodb:2.15.0                  | 2c69ec2dbd5be02df31577869df97c72781bf6fe6456471e8087b0e03136f672 |
| percona/percona-backup-mongodb:2.15.0 (ARM64)          | 188c38f60e54b9864e74e346209c0a924b6c8b0829062a31d44a5abb42626703 |
| percona/percona-server-mongodb-operator:1.23.0         | 21e9fed2c4309d3e88c6ec64ddf5dce6c0e86ce4be20531ab83c0b838739f89b |
| percona/percona-server-mongodb-operator:1.23.0 (ARM64) | 9747f69b64119ce343cb01ac47fa4b7af8050266852f4faef612908b02d554a2 |

--8<-- [end:images]

Find previous version images in the [documentation archive :octicons-link-external-16:](https://docs.percona.com/legacy-documentation/)
