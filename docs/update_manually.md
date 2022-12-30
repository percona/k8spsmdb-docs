# How to carry on low-level manual upgrades of Percona Server for MongoDB

Percona Operator for MongoDB supports upgrades of the database management system
(Percona Server for MongoDB) starting from the Operator version 1.1.0.
The Operator 1.5.0 had automated such upgrades with a new upgrade strategy
called [Smart Update](update.md#more-on-upgrade-strategies).
Smart Update automates the upgrade process while giving the user full control
over updates, so it is the most convenient upgrade strategy.

Still there may be use cases when automatic upgrade of Percona Server for MongoDB
is not an option (for example, you may be using Percona Server for MongoDB with the
Operator version 1.5.0 or earlier), and you have to carry on upgrades manually.

Percona Server for MongoDB can be upgraded manually using one of the following
*upgrade strategies*:

* *Rolling Update*, initiated manually and [controlled by Kubernetes](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#update-strategies),
* *On Delete*, [done by Kubernetes on per-Pod basis](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#update-strategies) when Pods are manually deleted.

!!! warning

    In case of [Smart Updates](update.md#automatic-upgrade), the Operator can
    either detect the availability of the Percona Server for MongoDB version or rely
    on the user's choice of the version. In both cases Pods are restarted by the
    Operator automatically in the order, which assures the primary instance to
    be updated last, preventing possible connection issues until the whole
    cluster is updated to the new settings. Kubernetes-controlled Rolling Update
    can't guarantee that Pods update order is optimal from the Percona XtraDB
    Cluster point of view.

## Rolling Update strategy and semi-automatic updates

Semi-automatic update of Percona Server for MongoDB can be done as follows:

1. Edit the `deploy/cr.yaml` file, setting `updateStrategy` key to 
    `RollingUpdate`.

2. Now you should [apply a patch](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) to your
    Custom Resource, setting necessary image names with a newer version tag.

    !!! note

        Check the version of the Operator you have in your Kubernetes
        environment. Please refer to the [Operator upgrade guide](update.md#upgrading-the-operator)
        to upgrade the Operator and CRD, if needed.

    Patching Custom Resource is done with the `kubectl patch psmdb` command.
    Actual image names can be found [in the list of certified images](images.md#custom-registry-images)
    (for older releases, please refer to the [old releases documentation archive](archive.md)).
    For example, updating to the `{{ release }}` version should look as follows:

    ``` {.bash data-prompt="$" }
    $ kubectl patch psmdb my-cluster-name --type=merge --patch '{
       "spec": {
          "crVersion":"{{ release }}",
          "image": "percona/percona-server-mongodb:{{ mongodb44recommended }}",
          "backup": { "image": "percona/percona-backup-mongodb:{{ pbmrecommended }}" },
          "pmm": { "image": "percona/pmm-client:{{ pmm2recommended }}" }
       }}'
    ```

   !!! warning

        The above command upgrades various components of the cluster including PMM Client. It is [highly recommended](https://docs.percona.com/percona-monitoring-and-management/how-to/upgrade.html) to upgrade PMM Server **before** upgrading PMM Client. If it wasn't done and you would like to avoid PMM Client upgrade, remove it from the list of images, reducing the last of two patch commands as follows:
    
        ``` {.bash data-prompt="$" }
        $ kubectl patch psmdb my-cluster-name --type=merge --patch '{
           "spec": {
              "crVersion":"{{ release }}",
              "image": "percona/percona-server-mongodb:{{ mongodb44recommended }}",
              "backup": { "image": "percona/percona-backup-mongodb:{{ pbmrecommended }}" }
           }}'
        ```

3. The deployment rollout will be automatically triggered by the applied patch.
    You can track the rollout process in real time with the
    `kubectl rollout status` command with the name of your cluster:

    ```default
    $ kubectl rollout status sts my-cluster-name-rs0
    ```

## Manual upgrade (the On Delete strategy)

Manual update of Percona Server for MongoDB can be done as follows:

1. Edit the `deploy/cr.yaml` file, setting `updateStrategy` key to
    `OnDelete`.

2. Now you should [apply a patch](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) to your
    Custom Resource, setting necessary image names with a newer version tag.

    !!! note

        Check the version of the Operator you have in your Kubernetes
        environment. Please refer to the [Operator upgrade guide](update.md#upgrading-the-operator)
        to upgrade the Operator and CRD, if needed.

    Patching Custom Resource is done with the `kubectl patch psmdb` command.
    Actual image names can be found [in the list of certified images](images.md#custom-registry-images)
    (for older releases, please refer to the [old releases documentation archive](archive.md)).
    For example, updating to the `{{ release }}` version should look as
    follows.

    ``` {.bash data-prompt="$" }
    $ kubectl patch psmdb my-cluster-name --type=merge --patch '{
       "spec": {
          "crVersion":"{{ release }}",
          "image": "percona/percona-server-mongodb:{{ mongodb44recommended }}",
          "backup": { "image": "percona/percona-backup-mongodb:{{ pbmrecommended }}" },
          "pmm": { "image": "percona/pmm-client:{{ pmm2recommended }}" }
       }}'
    ```

   !!! warning

        The above command upgrades various components of the cluster including PMM Client. It is [highly recommended](https://docs.percona.com/percona-monitoring-and-management/how-to/upgrade.html) to upgrade PMM Server **before** upgrading PMM Client. If it wasn't done and you would like to avoid PMM Client upgrade, remove it from the list of images, reducing the last of two patch commands as follows:
    
        ``` {.bash data-prompt="$" }
        $ kubectl patch psmdb my-cluster-name --type=merge --patch '{
           "spec": {
              "crVersion":"{{ release }}",
              "image": "percona/percona-server-mongodb:{{ mongodb44recommended }}",
              "backup": { "image": "percona/percona-backup-mongodb:{{ pbmrecommended }}" }
           }}'
        ```

3. The Pod with the newer Percona Server for MongoDB image will start after you
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

4. The update process is successfully finished when all Pods have been
    restarted (including the mongos and Config Server nodes, if
    [Percona Server for MongoDB Sharding](sharding.md#operator-sharding) is on).

