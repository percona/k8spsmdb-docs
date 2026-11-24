> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Automatic minor upgrade to the latest / recommended version

## Before you begin

- Read [Before you upgrade: limits you should know](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update.html#before-you-upgrade-limits-you-should-know) before you proceed. It is important that you get familiar with the backup requirement, version-jump rules, and known problematic version combinations.
- Check [Considerations](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-operator.html#considerations) for Kubernetes cluster versions and upgrades if you plan to update the Kubernetes cluster.

## Assumptions

For the procedures in this tutorial, we assume that you have set up the Smart Update strategy to update the objects in your database cluster.

Read more about the Smart Update strategy and other available ones in the [Upgrade strategies](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update.html#update-strategies) section.

## Procedure

You can configure the Operator to automatically upgrade Percona Server for MongoDB to the latest available, the recommended or to a specific version of your choice. [Learn more about automatic upgrades](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-db.html#how-upgrades-work).

End of Life versions of MongoDB

- MongoDB 6.0 support has reached its end-of-life in the Operator version 1.24.0. Therefore, the `6.0-recommended` or `6.0-latest` values are no longer supported. Users of existing clusters based on Percona Server for MongoDB 6.0 should explicitly switch to a newer major database version before upgrading the Operator to 1.24.0.
- MongoDB 5.0 support has reached its end-of-life in the Operator version 1.19.0. Therefore, the `5.0-recommended` or `5.0-latest` values are no longer supported. Users of existing clusters based on Percona Server for MongoDB 5.0 should explicitly switch to a newer major database version before upgrading the Operator to 1.19.0.
- MongoDB 4.4 support has reached its end-of-life in the Operator version 1.16.0. Therefore, the `4.4-recommended` or `4.4-latest` values are no longer supported. Users of existing clusters based on Percona Server for MongoDB 4.4 should explicitly switch to a newer major database version before upgrading the Operator to 1.16.0.

The steps are the following:

1. Check the version of the Operator you have in your Kubernetes environment. If you need to update it, refer to the [Operator upgrade guide](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-operator.html#update-guides).

1. Make sure that `spec.updateStrategy` option in the Custom Resource manifest is set to `SmartUpdate`.

1. Set the `upgradeOptions.apply` option in the Custom Resource manifest from `Disabled` to one of the available options:

   | Value                                                                                              | What it does                                                                                                                                                                                                                                                                      |
   | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `Recommended`                                                                                      | Automatic upgrade chooses the most recent version flagged as Recommended. For clusters created from scratch, MongoDB 8.3 is selected instead of 8.0 or 7.0, regardless of the image path. For existing clusters, the current major version branch (7.0 / 8.0 / 8.3) is preserved. |
   | `Latest`                                                                                           | Automatic upgrade chooses the most recent version available. Same clusters-created-from-scratch vs. existing-cluster behavior as `Recommended`.                                                                                                                                   |
   | `{major}-recommended` / `{major}-latest` (e.g. `8.3-recommended`, `8.0-recommended`, `7.0-latest`) | Same as `Recommended` / `Latest`, but pins the major MongoDB version so it won’t shift for newly provisioned clusters. For example, `7.0-latest` will never move a new cluster to 8.0.                                                                                            |
   | *version number*                                                                                   | Specify the desired version explicitly (version numbers look like {{ mongodb60recommended }}, 7.0.43-23, etc.). Find supported versions in the [Version compatibility matrix](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/versions.html).                        |

1. Make sure to set the valid Version Server URL for the `versionServiceEndpoint` key. The Operator checks the new software versions in the Version Server. If the Operator can’t reach the Version Server, the upgrades won’t happen.

   **Percona’s Version Service (default)**

   You can use the URL of the official Percona’s Version Service (default). Set `upgradeOptions.versionServiceEndpoint` to `https://check.percona.com`.

   **Version Service inside your cluster**

   Alternatively, you can run Version Service inside your cluster. This can be done with the `kubectl` command as follows:

   ```
   kubectl run version-service --image=perconalab/version-service --env="SERVE_HTTP=true" --port 11000 --expose
   ```

1. Specify the schedule to check for the new versions in in CRON format for the `upgradeOptions.schedule` option.

   The following example sets the midnight update checks with the official Percona’s Version Service:

   ```
   spec:
     updateStrategy: SmartUpdate
     upgradeOptions:
       apply: Recommended
       versionServiceEndpoint: https://check.percona.com
       schedule: "0 0 * * *"
   ...
   ```

   Note

   You can force an immediate upgrade by changing the schedule to `* * * * *` (continuously check and upgrade) and changing it back to another more conservative schedule when the upgrade is complete.

1. Apply your changes to the Custom Resource:

   ```
   kubectl apply -f deploy/cr.yaml
   ```

## See also

- [Choose your upgrade path](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update.html)
- [Custom resource statuses](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/cr-statuses.html#perconaservermongodb-status) - with automatic upgrades, `status.mongoVersion` and `status.mongoImage` show the target version as soon as the upgrade starts. To confirm the upgrade finished, check that `status.state` is `ready` and all Pods run the new image
