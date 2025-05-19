# Manual upgrades of Percona Server for MongoDB

The default and recommended way to upgrade the database cluster is using the Smart Update strategy. The Operator controls how objects are updated and restarts the Pods in a proper order during the database upgrade or for other events that require the cluster update. To these events belong ConfigMap updates, password rotation or changing resource values.

In some cases running an automatic upgrade of Percona Server for MongoDB
is not an option. For example, if the database upgrade impacts your application, you may want to have a full control over the upgrade process. 

Running a manual database upgrade allows you to do just that. You can use one of the following
*upgrade strategies*:

* *Rolling Update*, initiated manually and [controlled by Kubernetes  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#update-strategies). Note that the order of Pods restart may not be optimal from the Percona Server for
    MongoDB point of view.

* *On Delete*, [done by Kubernetes on per-Pod basis  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#update-strategies) when Pods are manually deleted.

## Rolling Update strategy and semi-automatic updates

To run a semi-automatic update of Percona Server for MongoDB, do the following:
{.power-number}

1. Check the version of the Operator you have in your Kubernetes environment. If you need to update it, refer to the [Operator upgrade guide](update-operator.md).

2. Edit the `deploy/cr.yaml` file and set the `updateStrategy` key to 
    `RollingUpdate`.

--8<-- "update-minor-set-version.md:patch"

4. After you applied the patch, the deployment rollout will be triggered automatically.
    You can track the rollout process in real time using the
    `kubectl rollout status` command with the name of your cluster:

    ``` {.bash data-prompt="$" }
    $ kubectl rollout status sts my-cluster-name-rs0
    ```


## Manual upgrade (the On Delete strategy)

To upgrade Percona Server for MongoDB manually, do following:
{.power-number}

1. Check the version of the Operator you have in your Kubernetes environment. If you need to update it, refer to the [Operator upgrade guide](update.md#upgrading-the-operator-and-crd).

2. Edit the `deploy/cr.yaml` file and set the `updateStrategy` key to `OnDelete`.

--8<-- "update-minor-set-version.md:patch"

4. The Pod with the newer Percona Server for MongoDB image will start after you
    delete it. Delete targeted Pods manually one by one to make them restart in
    the desired order:

    1. Delete the Pod using its name with the command like the following one:

        ```default
        $ kubectl delete pod my-cluster-name-rs0-2
        ```

    2. Wait until Pod becomes ready:

        ```default
        $ kubectl get pod my-cluster-name-rs0-2
        ```

        The output should be like this:

        ```default
        NAME                    READY   STATUS    RESTARTS   AGE
        my-cluster-name-rs0-2   1/1     Running   0          3m33s
        ```

The update process is successfully finished when all Pods have been restarted. If you turned on [Percona Server for MongoDB Sharding](sharding.md), the mongos and Config Server nodes must be restarted too to complete the upgrade.
