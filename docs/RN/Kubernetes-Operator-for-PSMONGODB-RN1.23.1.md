# Percona Operator for MongoDB 1.23.1 ({{date.1_23_1}})

[Get started with the Operator :material-arrow-right:](../quickstart.md){.md-button}
[Upgrade :material-arrow-right:](../update.md){.md-button}

## What's new at a glance

This release focuses on day-to-day operations. It adds persistent logging for mongos Pods, so you can troubleshoot the query router after a restart. You can also set how often the Operator contacts HashiCorp Vault for system user passwords.

## Release Highlights

### Persistent logging for `mongos`

`mongos` is the query router in a sharded cluster. Its logs record connection failures, slow queries, authentication errors, and which shard received a query.

Starting with this release, persistent logging also covers `mongos` Pods. This enables you to see what the
router did after a rollout, an out-of-memory restart, a node
drain or another incident.

The Operator adds the `logs` (Fluent Bit) and `logrotate` sidecars to each `mongos` Pod. Those logs survive a Pod restart only when you configure the storage for them via the `sharding.mongos.logs.persistentVolumeClaim` section in the Custom Resource. The Operator then creates one Persistent Volume Claim (PVC) per `mongos` Pod and stores the log file on that volume.

Resize that PVC the same way you resize storage for replica set and config server Pods. Automatic storage resizing for `mongos` is not supported yet.

If you turn persistent logging off, the Operator removes the sidecars but keeps existing `mongos` log PVCs. Files already on the volume stay readable.

`logrotate` uses one cluster-wide policy for `mongod` and `mongos`. It rotates logs daily, when they exceed 100 MB and keeps up to 7 rotated files. When you change that policy, include the configuration for both `mongod` and `mongos`.

Read more in the [persistent logging](../persistent-logging.md#collect-logs-from-mongos) and [log rotation](../logrotate.md) documentation.

### Control how often the Operator contacts HashiCorp Vault

When you store system user passwords in HashiCorp Vault, you can now configure how often the Operator reaches Vault to read those passwords and to sign in. The Operator creates a Vault client to sign in, and uses it for password reads.

Use these options in the Custom Resource:

* `vault.requestInterval` sets how often the Operator reads passwords from Vault. A longer interval sends fewer requests when passwords change infrequently. Leave it unset to read Vault on every reconciliation.
* `vault.reinitInterval` sets how often the Operator creates a new Vault client and signs in again. Shorten it when your Vault tokens expire quickly. The default is 30 minutes.

If you update the Vault token in `vault.syncUsers.tokenSecret`, the Operator creates a new Vault client on the next reconciliation and uses that token.

```yaml
spec:
  vault:
    reinitInterval: 30m
    requestInterval: 1m
```

Learn more in [Manage system users with Vault](../system-users-vault.md).


## CRD Changes

* The `.status.oci.credentials.secretName` field has now the minimum length of `1` and maximum length of `253`. An empty name is rejected, and a name longer than 253 characters is rejected.
* The `status.oci.credentials` field requires the `secretName` to be present when `credentials.type` is `userPrincipal`.
* New fields added:
  
  * `sharding.mongos.logs.persistentVolumeClaim` to configure persistent log storage for `mongos` Pods.
  * `vault.requestInterval` and `vault.reinitInterval` to control Vault password-read and client reinitialization intervals.

## Changelog

### New Features

* [K8SPSMDB-1795](https://perconadev.atlassian.net/browse/K8SPSMDB-1795) - Added persistent logging for `mongos` Pods so you can keep query router logs after a Pod restart or rollout. Those logs survive a restart only when you configure `sharding.mongos.logs.persistentVolumeClaim`.

### Improvements

* [K8SPSMDB-1778](https://perconadev.atlassian.net/browse/K8SPSMDB-1778) - Added Custom Resource options so you can set how often the Operator reads system user passwords from HashiCorp Vault and how often it creates a new Vault client to sign in. A longer `vault.requestInterval` sends fewer Vault requests when passwords change infrequently, `vault.reinitInterval` can match short-lived tokens (default 30 minutes), and an update to `vault.syncUsers.tokenSecret` applies on the next reconciliation.

### Bug Fixes

* [K8SPSMDB-1794](https://perconadev.atlassian.net/browse/K8SPSMDB-1794) - Fixed Percona ClusterSync target connection failures caused by a missing slash in the generated MongoDB URI. The Operator now writes a valid `target-uri` so Percona ClusterSync for MongoDB can connect to the target cluster.

* [K8SPSMDB-1817](https://perconadev.atlassian.net/browse/K8SPSMDB-1817) - Fixed a deadlock where Smart Update stayed blocked while Percona ClusterSync for MongoDB (PCSM) held the cluster lease and scheduled backups sat in Waiting. Smart Update no longer waits forever on backups that are parked because PCSM is replicating.

* [K8SPSMDB-1834](https://perconadev.atlassian.net/browse/K8SPSMDB-1834) - Fixed endless Smart Update Pod restarts after you upgrade from Operator 1.22 to 1.23 when `spec.tls.issuerConf.kind` is `ClusterIssuer`. The Operator now keeps leaf certificate `issuerRef.kind` set to `ClusterIssuer`, so cert-manager no longer reissues those certificates in a loop.

## Supported software

The Operator was developed and tested with the following software:

* Percona Server for MongoDB 6.0.29-23, 7.0.43-23, and 8.0.32-14
* Percona Backup for MongoDB 2.15.0
* PMM3 Client: 3.9.1
* cert-manager: 1.21.0
* LogCollector based on fluent-bit: 5.1.1-1

Other options may also work but have not been tested.

## Supported platforms

Percona Operators are designed for compatibility with all [CNCF-certified :octicons-link-external-16:](https://www.cncf.io/training/certification/software-conformance/) Kubernetes distributions. Our release process includes targeted testing and validation on major cloud provider platforms and OpenShift, as detailed below:

--8<-- [start:platforms]

* [Google Kubernetes Engine (GKE) :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine) 1.34 - 1.35
* [Amazon Elastic Kubernetes Service (EKS) :octicons-link-external-16:](https://aws.amazon.com) 1.34 - 1.36
* [Azure Kubernetes Service (AKS) :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) 1.34 - 1.36
* [OpenShift Container Platform :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) 4.19 - 4.22
* [Rancher :octicons-link-external-16:](https://www.rancher.com/) with Rancher Kubernetes Engine (RKE2) 1.34 - 1.36
* [Minikube :octicons-link-external-16:](https://github.com/kubernetes/minikube) 1.39.0 with Kubernetes v1.37.0
--8<-- [end:platforms]

This list only includes the platforms that the Percona Operators are specifically tested on as part of the release process. Other Kubernetes flavors and versions depend on the backward compatibility offered by Kubernetes itself.

## Percona certified images

Find Percona's certified Docker images that you can use with the Percona Operator for MongoDB in the following table:

--8<-- [start:images]

| Image                                                  | Digest                                                           |
|:-------------------------------------------------------|:-----------------------------------------------------------------|
| percona/percona-server-mongodb:8.0.32-14               | 47b05b6624421b7b417d2324da59db7e5fc74d544c15ede4fe8877b6d4e79ff8 |
| percona/percona-server-mongodb:8.0.32-14 (ARM64)       | 2cef2f3fa8a26fe1aa5ce1eb51381f92d1caedc3781b5d474b320d52d4096114 |
| percona/percona-server-mongodb:7.0.43-23               | dc817d4892f0045136745d0988601b6ff0a7bbe50c76110c353920819c720c71 |
| percona/percona-server-mongodb:7.0.43-23 (ARM64)       | 316a9311998523cf0ace036d4a455188535c00629987843fc93c3e244af40a98 |
| percona/percona-server-mongodb:6.0.29-23               | cf9254f6d05f7f64b6295a7d96c6b4591d02e521a68488cb99eb54f9720714c1 |
| percona/percona-server-mongodb:6.0.29-23 (ARM64)       | 62fbdebb132307ced293ad30eeb597e7f4f7f9bf05ccc222a436c7f2b71d5cbc |
| percona/fluentbit:5.1.1-1                              | 332ac2386031925cef314367366abea5cb6ec1ac0bc601b824422753346bc5df |
| percona/fluentbit:5.1.1-1 (ARM64)                      | 1d528ec4a8c9bab32762c83eb4e33458f2e48d9af94f0aa59bba0ce4e89904dd |
| percona/pmm-client:3.9.1                               | 6b4309035f1fc4c0dcb6b7374ac7a01526319374a071759282a21eb016f754bf |
| percona/pmm-client:3.9.1 (ARM64)                       | ab419b7e10cd81fa44dd198e4a10c44dc056e87ea73fd836a66b6a2356bc4efc |
| percona/pmm-client:2.44.1-1                            | 52a8fb5e8f912eef1ff8a117ea323c401e278908ce29928dafc23fac1db4f1e3 |
| percona/pmm-client:2.44.1-1 (ARM64)                    | 390bfd12f981e8b3890550c4927a3ece071377065e001894458047602c744e3b |
| percona/percona-backup-mongodb:2.15.0                  | 2c69ec2dbd5be02df31577869df97c72781bf6fe6456471e8087b0e03136f672 |
| percona/percona-backup-mongodb:2.15.0 (ARM64)          | 188c38f60e54b9864e74e346209c0a924b6c8b0829062a31d44a5abb42626703 |
| percona/percona-server-mongodb-operator:1.23.1         |       |
| percona/percona-server-mongodb-operator:1.23.1 (ARM64) |   |

--8<-- [end:images]

Find previous version images in the [documentation archive :octicons-link-external-16:](https://docs.percona.com/legacy-documentation/)
