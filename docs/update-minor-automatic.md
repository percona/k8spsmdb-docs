# Automatic minor upgrade to the latest / recommended version

--8<-- "update-assumptions.md"

## Procedure

You can configure the Operator to automatically upgrade Percona Server for MongoDB to the latest available, the recommended or to a specific version of your choice. [Learn more about automatic upgrades](update-db.md).

The steps are the following:
{.power-number}

1. Check the version of the Operator you have in your Kubernetes environment. If you need to update it, refer to the [Operator upgrade guide](update-operator.md).

2. Make sure that `spec.updateStrategy` option in the Custom Resource manifest is set to `SmartUpdate`.

3. Set the `upgradeOptions.apply` option in the Custom Resource manifest from `Disabled` to one of the following values:

    * `Recommended` - automatic upgrade will choose the most recent version
        of software flagged as Recommended (for clusters created from scratch,
        the Percona Server for MongoDB 8.0 version will be selected instead of the
        Percona Server for MongoDB 7.0 or 6.0 version regardless of the image
        path; for already existing clusters, the 8.0 vs. 7.0 vs. 6.0 branch
        choice will be preserved),
    *  `8.0-recommended`, `7.0-recommended`, `6.0-recommended` -
        same as above, but preserves specific major MongoDB
        version for newly provisioned clusters (ex. 8.0 will not be automatically
        used instead of 7.0),
    * `Latest` - automatic upgrade will choose the most recent version of
        the software available (for clusters created from scratch,
        the Percona Server for MongoDB 8.0 version will be selected instead of the
        Percona Server for MongoDB 7.0 or 6.0 version regardless of the image
        path; for already existing clusters, the 8.0 vs. 7.0 vs. 6.0 branch
        choice will be preserved),
    * `8.0-latest`, `7.0-latest`, `6.0-latest` - same as
        above, but preserves specific major MongoDB version for newly provisioned
        clusters (ex. 8.0 will not be automatically used instead of 7.0),
    * *version number* - specify the desired version explicitly
        (version numbers are specified as {{ mongodb60recommended }},
        {{ mongodb70recommended }}, etc.). Actual versions can be found
        [in the list of certified images](images.md).

    !!! note "End of Life versions of MongoDB"

        *  MongoDB 5.0 support has reached its end-of-life in the
            Operator version 1.19.0. Therefore, the `5.0-recommended`
            or `5.0-latest` values are no longer supported. Users of existing clusters based on Percona
            Server for MongoDB 5.0 should explicitly switch to a newer major database
            version before upgrading the Operator to 1.19.0.
        * MongoDB 4.4 support has reached its end-of-life in the
            Operator version 1.16.0. Therefore, the `4.4-recommended`
            or `4.4-latest` values are no longer supported.  Users of existing clusters based on Percona
            Server for MongoDB 4.4 should explicitly switch to a newer major database
            version before upgrading the Operator to 1.16.0.

5. Make sure to set the valid Version Server
    URL for the `versionServiceEndpoint` key. The Operator checks the new software versions in the Version Server. If the Operator can't reach the Version Server, the upgrades won't happen.

    === "Percona’s Version Service (default)"
        You can use the URL of the official Percona’s Version Service (default).
        Set `upgradeOptions.versionServiceEndpoint` to `https://check.percona.com`.

    === "Version Service inside your cluster"
        Alternatively, you can run Version Service inside your cluster. This
        can be done with the `kubectl` command as follows:

        ```bash
        kubectl run version-service --image=perconalab/version-service --env="SERVE_HTTP=true" --port 11000 --expose
        ```

6. Specify the schedule to check for the new versions in in CRON format for the `upgradeOptions.schedule` option.

    The following example sets the midnight update checks with the official
    Percona’s Version Service:

    ```yaml
    spec:
      updateStrategy: SmartUpdate
      upgradeOptions:
        apply: Recommended
        versionServiceEndpoint: https://check.percona.com
        schedule: "0 0 * * *"
    ...
    ```

    !!! note

        You can force an immediate upgrade by changing the schedule to
        `* * * * *` (continuously check and upgrade) and changing it back to
        another more conservative schedule when the upgrade is complete.

7. Apply your changes to the Custom Resource:

    ```bash
    kubectl apply -f deploy/cr.yaml
    ```
