# Upgrade Percona Server for MongoDB

--8<-- "update-critical-notice.md"

## Choose your database upgrade path

| What you want to do | Guide |
| ----------------------------------------------------- | ------- |
| Let the Operator upgrade automatically | [Automatic upgrades](update-minor-automatic.md) |
| Upgrade to a specific minor version manually | [Set a version manually](update-minor-set-version.md) |
| Full manual control (Rolling Update or On Delete) | [Manual upgrades](update-manually.md) |
| Upgrade to a new major version | [Major version upgrades](update-major.md) |
| Running on OpenShift | [Upgrade on OpenShift](update-openshift.md) |

## How upgrades work

* **Automatic** upgrades: the Operator periodically checks for new versions of the database images and valid image paths, and automatically updates your deployment to the latest, recommended, or a specific version, depending on your configuration. To do so, the Operator queries a special *Version Service* server at scheduled times. If the current version should be upgraded, the Operator updates the Custom Resource to reflect the new image paths and sequentially deletes Pods, allowing the StatefulSet to redeploy the cluster Pods with the new image.

* **Manual** upgrades: you manually update the Custom Resource and specify the desired version of the database. Then, depending on the configured [update strategy](update.md#update-strategies), either the Operator automatically updates the deployment to this version, or you manually trigger the upgrade by deleting Pods.

## Automatic upgrade control

The way to instruct the Operator how it should run the database upgrades is to set the `upgradeOptions.apply` Custom Resource option to one of the following:

* `Never` or `Disabled` - the Operator doesn't make automatic upgrades. You must upgrade the Custom Resource and images manually. Default is `Disabled`.
* `Recommended` - the Operator automatically updates the database and components to the version flagged as Recommended.
* `Latest` - the Operator automatically updates the database and components to the most recent available version.
* `version` - specify the exact database version you want to update to. The Operator updates the database to it automatically.

## Next steps

* [Upgrade the Operator](update-operator.md), if it also needs updating
* [Compatibility and known issues before you upgrade](update.md#before-you-upgrade-compatibility-and-known-issues)
