# Upgrade to a specific version

--8<-- "update-assumptions.md"

## Procedure

To upgrade Percona Server for MongoDB to a specific version, do the following:
{.power-number}

1. Check the version of the Operator you have in your Kubernetes environment. If you need to update it, refer to the [Operator upgrade guide](update-operator.md).

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

{% include 'assets/fragments/patch.txt' %}

5. After you applied the patch, the deployment rollout will be triggered automatically.
    You can track the rollout process in real time using the
    `kubectl rollout status` command with the name of your cluster:

    ```bash
    kubectl rollout status sts my-cluster-name-rs0
    ```


The update process is successfully finished when all Pods have been restarted. If you turned on [Percona Server for MongoDB Sharding](sharding.md), the mongos and Config Server nodes must be restarted too to complete the upgrade.