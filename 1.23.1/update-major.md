> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Major version automated upgrades

Major version upgrade is moving from the current major version to the next one. For example, from 8.0.x to 8.3.x.

It is a more complicated task than a minor version upgrade because it might potentially affect how data is stored and how applications interact with the database (in case of some API changes). Therefore, we recommend to test the major version upgrade on a staging environment first.

A major upgrade is supported by the Operator within one major version at a time: for example, from 8.0 to 8.3. To upgrade Percona Server for MongoDB from 6.0 to 8.0, you should first upgrade it to 7.0, and then make a separate upgrade from 7.0 to 8.0. The same is true for major version downgrades.

## Before you begin

- Read [Before you upgrade: limits you should know](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update.html#before-you-upgrade-limits-you-should-know) before you proceed. It is important that you get familiar with the backup requirement, version-jump rules, and known problematic version combinations.
- Check [Considerations](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-operator.html#considerations) for Kubernetes cluster versions and upgrades if you plan to update the Kubernetes cluster.

## Assumptions

For the procedures in this tutorial, we assume that you have set up the Smart Update strategy to update the objects in your database cluster.

Read more about the Smart Update strategy and other available ones in the [Upgrade strategies](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update.html#update-strategies) section.

## Procedure

1. Check the version of the Operator you have in your Kubernetes environment. If you need to update it, refer to the [Operator upgrade guide](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-operator.html).

1. Set the [upgradeOptions.apply](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#upgradeoptionsapply) key in the `deploy/cr.yaml` Custom Resource manifest to `<version>-recommended`:

   ```
   spec:
     upgradeOptions:
       apply: 8.3-recommended
   ```

1. Apply the `deploy/cr.yaml` Custom Resource manifest to start the major version upgrade:

   ```
   kubectl apply -f deploy/cr.yaml -n <namespace>
   ```

### Feature Compatibility Version

By default, the Operator doesn’t set [FeatureCompatibilityVersion (FCV)](https://docs.mongodb.com/manual/reference/command/setFeatureCompatibilityVersion/) to match the new version. This ensures that backwards-incompatible features are not automatically enabled with the major version upgrade (which the is recommended and safe behavior).

You can turn this backward compatibility off at any moment (after the upgrade or even before it) by setting the [upgradeOptions.setFCV](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#upgradeoptionssetfcv) flag in the `deploy/cr.yaml` configuration file to `true`.

Note that with this setting, the Operator doesn’t yet support major version rollback if the`setFeatureCompatibilityVersion` is set. Therefore it is recommended to stay without enabling this flag for some time after the major upgrade to ensure that everything works as expected and you won’t have to downgrade.

You can set the `setFCV` flag to `true` simultaneously with the `apply` flag but you must be absolutely sure that the whole procedure is tested on staging environment and works as expected.

## Downgrades

When making downgrades (e.g. changing version from 7.0 to 6.0), make sure to remove incompatible features that are persisted and/or update incompatible configuration settings. Compatibility issues between major MongoDB versions can be found in [upstream documentation](https://www.mongodb.com/docs/manual/release-notes/7.0/#std-label-7.0-downgrade-considerations) .

## See also

- [Choose your upgrade path](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update.html)
