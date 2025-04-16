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

1. Check the version of the Operator you have in your Kubernetes environment. If you need to update it, refer to the [Operator upgrade guide](update.md#upgrading-the-operator-and-crd).

2. Edit the `deploy/cr.yaml` file and set the `updateStrategy` key to 
    `RollingUpdate`.

--8<-- "update-minor-set-version.md:patch"


## Manual upgrade (the On Delete strategy)

To upgrade Percona Server for MongoDB manually, do following:

1. Check the version of the Operator you have in your Kubernetes environment. If you need to update it, refer to the [Operator upgrade guide](update.md#upgrading-the-operator-and-crd).

2. Edit the `deploy/cr.yaml` file and set the `updateStrategy` key to `OnDelete`.

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
