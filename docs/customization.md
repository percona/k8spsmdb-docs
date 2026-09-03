# About customization and extensibility

The default Custom Resource is meant to be a good starting point, not a straitjacket. This
page collects the ways to change the Operator's behavior when your environment needs
something the defaults do not cover.

## Change what the database does

| You want to | Use |
|---|---|
| Change MongoDB server settings | [Changing MongoDB options](options.md) |
| Change Percona Backup for MongoDB settings | [options-pbm.md](options-pbm.md) |
| Run a script at a point in the Pod lifecycle | [hookscript.md](hookscript.md) |

MongoDB settings live in the `configuration` field of each replica set, and are passed
through to the server as its configuration file.

## Change what runs beside the database

Sidecar containers let you run your own process in the database Pod, with `sidecars`,
`sidecarVolumes`, and `sidecarPVCs` in the Custom Resource. See
[Add sidecar containers](sidecar.md).

Environment variables are set at three different levels, depending on what you need to
influence:

* [Operator environment variables](env-vars-operator.md) - the Operator process itself.
* [Cluster component environment variables](env-vars-cluster.md) - the database and its
  companions.
* [Define custom environment variables](env-vars-custom.md) - your own values.

## Change how objects are labelled and scoped

* [Labels and annotations](annotations.md) - the Operator can be told to leave certain
  labels and annotations alone with `ignoreLabels` and `ignoreAnnotations`, which matters
  when another controller in the cluster also manages them.
* [Install Percona Server for MongoDB in multi-namespace (cluster-wide) mode](cluster-wide.md) -
  one Operator managing clusters across namespaces.
* [Configure concurrent reconciliation](reconciliation-concurrency.md) - how many clusters
  the Operator reconciles at once.

## Change where images and backups come from

* [How to use private registry](custom-registry.md) - pull images from your own registry
  with `imagePullSecrets`.
* [Creating a private S3-compatible cloud for backups](private.md) - keep backups inside
  your own network.
* [Install the database with customized parameters](custom-install.md)

## Unsafe configurations

The `unsafeFlags` section lets you run configurations the Operator would otherwise refuse,
such as a replica set below the member count needed for high availability.

!!! warning

    Unsafe flags exist for development and testing. A cluster running with them can lose
    data on node failure and is not supported for production use.

## Limitations

* Customizations are yours to maintain. A sidecar, hook script, or custom `configuration`
  block that worked on one Operator version is not automatically revalidated on the next -
  re-test after an upgrade.
* Options set through `configuration` are passed to the database as-is. The Operator does
  not validate them, so a typo surfaces as a database that will not start rather than as a
  rejected Custom Resource.
* `unsafeFlags` disables the guardrails that keep a cluster highly available. Clusters
  running with them are not supported for production use.

## Next steps

* [Changing MongoDB options](options.md)
* [Add sidecar containers](sidecar.md)
* [Known limitations](limitations.md)
