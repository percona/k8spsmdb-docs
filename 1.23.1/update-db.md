> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Upgrade Percona Server for MongoDB

## Before you begin

- Read [Before you upgrade: limits you should know](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update.html#before-you-upgrade-limits-you-should-know) before you proceed. It is important that you get familiar with the backup requirement, version-jump rules, and known problematic version combinations.
- Check [Considerations](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-operator.html#considerations) for Kubernetes cluster versions and upgrades if you plan to update the Kubernetes cluster.

## Choose your database upgrade path

| What you want to do                               | Guide                                                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Let the Operator upgrade automatically            | [Automatic upgrades](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-minor-automatic.html)       |
| Upgrade to a specific minor version manually      | [Set a version manually](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-minor-set-version.html) |
| Full manual control (Rolling Update or On Delete) | [Manual upgrades](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-manually.html)                 |
| Upgrade to a new major version                    | [Major version upgrades](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-major.html)             |
| Running on OpenShift                              | [Upgrade on OpenShift](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-openshift.html)           |

## How upgrades work

- **Automatic** upgrades: the Operator periodically checks for new versions of the database images and valid image paths, and automatically updates your deployment to the latest, recommended, or a specific version, depending on your configuration. To do so, the Operator queries a special *Version Service* server at scheduled times. If the current version should be upgraded, the Operator updates the Custom Resource to reflect the new image paths and sequentially deletes Pods, allowing the StatefulSet to redeploy the cluster Pods with the new image.
- **Manual** upgrades: you manually update the Custom Resource and specify the desired version of the database. Then, depending on the configured [update strategy](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update.html#update-strategies), either the Operator automatically updates the deployment to this version, or you manually trigger the upgrade by deleting Pods.

## Automatic upgrade control

The way to instruct the Operator how it should run the database upgrades is to set the `upgradeOptions.apply` Custom Resource option to one of the following:

- `Never` or `Disabled` - the Operator doesn’t make automatic upgrades. You must upgrade the Custom Resource and images manually. Default is `Disabled`.
- `Recommended` - the Operator automatically updates the database and components to the version flagged as Recommended.
- `Latest` - the Operator automatically updates the database and components to the most recent available version.
- `version` - specify the exact database version you want to update to. The Operator updates the database to it automatically.

## See also

- [Upgrade the Operator](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-operator.html), if it also needs updating
- [Before you upgrade](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update.html#before-you-upgrade)
