# Update Percona Operator for MongoDB

You can upgrade Percona Operator for MongoDB to newer versions. The upgrade process consists of these steps:

* Upgrade the Operator
* Upgrade the database (Percona Server for MongoDB).

You can either upgrade both the Operator and the database, or upgrade only the database. Use this page to find the right procedure and to check what to watch out for before you start.

## Choose your upgrade path

### Upgrade the Operator and CRD

Upgrade the Operator and CRD when:

* New database features need changes in this Operator version
* You want automation or fixes from the new Operator
* Compatibility between the Operator and the database requires a synchronized update

Test in a staging environment first. Upgrading the Operator may cause performance
degradation.

| You installed the Operator via | Use |
| --- | --- |
| `kubectl` | [Upgrade manually](update-crd-manual.md) |
| Helm | [Upgrade via Helm](update-crd-helm.md) |
| OLM on OpenShift | [Upgrade via OLM](update-crd-olm.md) |

### Upgrade the database

Upgrade the database after you've already upgraded the Operator and now want to move the
database forward. Or, when the new database version has features or fixes unrelated
to the Operator.

Check the [version compatibility matrix](versions.md) to confirm that your
current Operator version supports the new database version first.

| You want to | Use |
| --- | --- |
| Let the Operator upgrade the database automatically | [Automatic minor upgrades](update-minor-automatic.md) |
| Pin the database to a specific version | [Upgrade to a specific version](update-minor-set-version.md) |
| Control each Pod restart yourself (Rolling Update or On Delete) | [Upgrade manually](update-manually.md) |
| Move to the next major MongoDB version | [Major upgrades](update-major.md) |

Running on OpenShift? Database upgrades there follow a different procedure - see
[Upgrade Percona Server for MongoDB on OpenShift](update-openshift.md).

## Before you upgrade: compatibility and known issues

- **Take a backup first.** Do this before any upgrade. See
  [Backup and restore](backups.md) or jump straight to an
  [on-demand backup](backup-tutorial.md).
- **Version jumps happen one step at a time.** You can upgrade the Operator only to the
  nearest `major.minor` version - bigger gaps need several sequential upgrades. Database
  major versions move one version at a time too. See
  [Considerations](update-operator.md#for-the-operator-upgrades) and [Major version upgrades](update-major.md).
- **CRD/Operator compatibility window.** The CRD supports the last 3 minor Operator
  versions. See [Considerations](update-operator.md#considerations).
- **FCV changes are not easily reversible.** Setting
  [`upgradeOptions.setFCV`](operator.md#upgradeoptionssetfcv) is not undone by simply
  downgrading the image afterward. See [Feature Compatibility
  Version](update-major.md#feature-compatibility-version).
- **MongoDB end-of-life notices.** MongoDB 4.4 reached end-of-life in Operator 1.16.0, and
  MongoDB 5.0 in Operator 1.19.0 - upgrade the database to a supported major version
  before upgrading the Operator past those releases. See [End of Life versions of MongoDB](update-minor-automatic.md#end-of-life-versions-of-mongodb).
- **Known problematic version combination.** Operator 1.19.0/1.19.1 with a sharded cluster
  and MongoDB 8.0 can fail point-in-time recovery. See
  [Considerations](update-operator.md#considerations).
- **Test in staging first.** Do this for any upgrade, especially Operator upgrades and
  major database version upgrades, before you run it against production.

## Update strategies

You can chose how you want to update your database cluster when you run an upgrade:

* *Smart Update* is the automated way to update the database cluster. The Operator controls how objects are updated. It restarts Pods in a specific order, with the primary instance updated last to avoid connection issues until the whole cluster is updated to the new settings.

    This update method applies during database upgrades and when making changes like updating a ConfigMap, rotating passwords, or changing resource values. It is the default and recommended way to update. 

* *Rolling Update* is initiated manually and [controlled by Kubernetes  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#update-strategies). The StatefulSet controller in Kubernetes deletes a Pod, updates it, waits till it reports the Ready status and proceeds to the next Pod. The order for Pod update is the same as for Pod termination. However, this order may not be optimal from the Percona Server for MongoDB point of view.

* *On Delete* strategy requires [a user to manually delete a Pod to make Kubernetes StatefulSet controller recreate it with the updated configuration :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#update-strategies).

To select an update strategy, set the `updateStrategy` key in the [Custom Resource](operator.md) manifest to one of the following:

* `SmartUpdate`
* `RollingUpdate`
* `OnDelete`

For a manual update of your database cluster using the `RollingUpdate` or `OnDelete` strategies, refer to [the low-level Kubernetes way of database upgrades](update-manually.md) guide.

## Revision history limit

Each time the Operator updates a StatefulSet Pod template, Kubernetes stores a revision in the StatefulSet history. You can control how many of these revisions are kept by setting [`spec.revisionHistoryLimit`](operator.md#revisionhistorylimit) in the Custom Resource. This is useful when you want fewer stale revisions in the namespace, or when you need to keep more rollback points after frequent configuration changes.

```yaml
spec:
  updateStrategy: SmartUpdate
  revisionHistoryLimit: 10
```

When you omit this option, Kubernetes keeps the default of 10 revisions.

## See also

* [Upgrade the Operator and CRD](update-operator.md)
* [Upgrade Percona Server for MongoDB](update-db.md)
* [Known limitations](limitations.md)
