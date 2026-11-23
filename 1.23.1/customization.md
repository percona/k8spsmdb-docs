> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# About customization and extensibility

The default Custom Resource is meant to be a good starting point, not a straitjacket. This page collects the ways to change the Operator’s behavior when your environment needs something the defaults do not cover.

## Change what the database does

| You want to                                  | Use                                                                                                                              |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Change MongoDB server settings               | [Changing MongoDB options](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/options.html)                            |
| Change Percona Backup for MongoDB settings   | [Change Percona Backup for MongoDB configuration](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/options-pbm.html) |
| Run a script at a point in the Pod lifecycle | [Extend Pod startup logic](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/hookscript.html)                         |

MongoDB settings live in the `configuration` field of each replica set, and are passed through to the server as its configuration file.

## Change what runs beside the database

Sidecar containers let you run your own process in the database Pod. Use `sidecars`, `sidecarVolumes`, and `sidecarPVCs` in the Custom Resource for that. See [Add sidecar containers](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/sidecar.html).

Environment variables are set at three different levels, depending on what you need to influence:

- [Operator environment variables](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/env-vars-operator.html) - the Operator process itself.
- [Cluster component environment variables](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/env-vars-cluster.html) - the database and its companions.
- [Define custom environment variables](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/env-vars-custom.html) - your own values.

## Change how objects are labelled and scoped

- [Labels and annotations](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/annotations.html) - Tell the Operator to leave certain labels and annotations alone with `ignoreLabels` and `ignoreAnnotations`. This matters when another controller in the cluster also manages them.
- [Install Percona Server for MongoDB in multi-namespace (cluster-wide) mode](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/cluster-wide.html) - one Operator managing clusters across namespaces.
- [Configure concurrent reconciliation](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/reconciliation-concurrency.html) - how many clusters the Operator reconciles at once.

## Change where images and backups come from

- [How to use private registry](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/custom-registry.html) - pull images from your own registry with `imagePullSecrets`.
- [Use MinIO or another S3-compatible storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-storage-minio.html) - keep backups inside your own network.
- [Install the database with customized parameters](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/custom-install.html) - tune the Operator and database at startup if you already know what extra configuration you need.

## Unsafe configurations

The `unsafeFlags` section lets you run configurations the Operator would otherwise refuse, such as a replica set below the member count needed for high availability.

Warning

Each `unsafeFlags` setting removes a specific safety guardrail the Operator otherwise enforces - check what a flag does before enabling it in a production cluster.

## Limitations

- Customizations are yours to maintain. A sidecar, hook script, or custom `configuration` block that worked on one Operator version is not automatically revalidated on the next - re-test after an upgrade.
- Options set through `configuration` are passed to the database as-is. The Operator does not validate them, so a typo surfaces as a database that will not start rather than as a rejected Custom Resource.

## See also

- [Changing MongoDB options](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/options.html)
- [Add sidecar containers](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/sidecar.html)
- [Known limitations](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/limitations.html)
