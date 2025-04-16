# Upgrade to a specific version

--8<-- "update-assumptions.md"

## Procedure

To upgrade Percona Server for MongoDB to a specific version, do the following:
{.power-number}

1. Check the version of the Operator you have in your Kubernetes environment. If you need to update it, refer to the [Operator upgrade guide](update.md#upgrading-the-operator-and-crd).

2. Check the [Custom Resource](operator.md) manifest configuration to be the following:

    * `spec.updateStrategy` option is set to `SmartUpdate`
    * `spec.upgradeOptions.apply` option is set to `Disabled` or `Never`.
    
    ```yaml
    ...
    spec:
      updateStrategy: SmartUpdate
      upgradeOptions:
        apply: Disabled
        ...
    ```
--8<-- [start:patch]

3. Update the Custom Resource version, the database, the backup and PMM Client image names with a newer version tag. Find the image names [in the list of certified images](images.md).

    We recommend to update the PMM Server **before** the upgrade of PMM Client. If you haven't done it yet, exclude PMM Client from the list of images to update.

    Since this is a working cluster, the way to update the Custom Resource is to [apply a patch  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) with the `kubectl patch psmdb` command.

    For example, to update the cluster with the name `my-cluster-name` to the `{{ release }}` version, the command is as follows:

    === "With PMM Client"

        ``` {.bash data-prompt="$" }
        $ kubectl patch psmdb my-cluster-name --type=merge --patch '{
           "spec": {
              "crVersion":"{{ release }}",
              "image": "percona/percona-server-mongodb:{{ mongodb70recommended }}",
              "backup": { "image": "percona/percona-backup-mongodb:{{ pbmrecommended }}" },
              "pmm": { "image": "percona/pmm-client:{{ pmm2recommended }}" }
           }}'
        ```

    === "Without PMM Client"

        ``` {.bash data-prompt="$" }
        $ kubectl patch psmdb my-cluster-name --type=merge --patch '{
           "spec": {
              "crVersion":"{{ release }}",
              "image": "percona/percona-server-mongodb:{{ mongodb70recommended }}",
              "backup": { "image": "percona/percona-backup-mongodb:{{ pbmrecommended }}" }
           }}'
        ```


4. After you applied the patch, the deployment rollout will be automatically.
    You can track the rollout process in real time using the
    `kubectl rollout status` command with the name of your cluster:

    ``` {.bash data-prompt="$" }
    $ kubectl rollout status sts my-cluster-name-rs0
    ```
--8<-- [end:patch]

The update process is successfully finished when all Pods have been restarted. If you turned on [Percona Server for MongoDB Sharding](sharding.md), the mongos and Config Server nodes must be restarted too to complete the upgrade.