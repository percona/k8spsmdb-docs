# Major version automated upgrades

Major version upgrade is moving from the current major version to the next one. For example, from 6.0.x to 7.0.x.

It is is a more
complicated task than a minor version upgrade because it might potentially affect how data is stored and how
applications interact with the database (in case of some API changes). Therefore, we recommend to test the major version upgrade on a staging environment first.

A major upgrade is supported by the Operator within one major version at a time:
for example, from 7.0 to 8.0. To upgrade Percona Server for MongoDB from 6.0 to 8.0,
you should first upgrade it to 7.0, and then make a separate upgrade from 7.0
to 8.0. The same is true for major version downgrades.

!!! important

    Before the upgrade, [make a backup](backup-tutorial.md) of your data.

--8<-- "update-assumptions.md"

## Procedure

1. Check the version of the Operator you have in your Kubernetes environment. If you need to update it, refer to the [Operator upgrade guide](update.md#upgrading-the-operator-and-crd).
2. Set the [upgradeOptions.apply](operator.md#upgradeoptionsapply)
key in the `deploy/cr.yaml` Custom Resource manifest to `<version>-recommended`:


```yaml
spec:
  upgradeOptions:
    apply: 8.0-recommended
```

3. Apply the `deploy/cr.yaml` Custom Resource manifest to start the major version upgrade.

### Feature Compatibility Version

By default, the Operator doesn't set
[FeatureCompatibilityVersion (FCV)  :octicons-link-external-16:](https://docs.mongodb.com/manual/reference/command/setFeatureCompatibilityVersion/)
to match the new version. This ensures that backwards-incompatible features
are not automatically enabled with the major version upgrade (which the is
recommended and safe behavior). 

You can turn this backward compatibility off at
any moment (after the upgrade or even before it) by setting the
[upgradeOptions.setFCV](operator.md#upgradeoptionssetfcv) flag in the
`deploy/cr.yaml` configuration file to `true`. 

Note that with this setting, the Operator doesn't yet support major version rollback if the`setFeatureCompatibilityVersion` is set. Therefore it is recommended to stay without enabling this flag for some time after the major upgrade to ensure that everything works as expected and you won't have to downgrade. 


You can set the `setFCV` flag to `true` simultaneously with the `apply` flag but you must be absolutely sure that the whole
    procedure is tested on staging environment and works as expected.

## Downgrades

When making downgrades (e.g. changing version from 7.0 to 6.0), make
sure to remove incompatible features that are persisted and/or update
incompatible configuration settings. Compatibility issues between major
MongoDB versions can be found in
[upstream documentation  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/release-notes/7.0/#std-label-7.0-downgrade-considerations).

 