> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Manual upgrades of Percona Server for MongoDB

The default and recommended way to upgrade the database cluster is using the Smart Update strategy. The Operator controls how objects are updated and restarts the Pods in a proper order during the database upgrade or for other events that require the cluster update. To these events belong ConfigMap updates, password rotation or changing resource values.

In some cases running an automatic upgrade of Percona Server for MongoDB is not an option. For example, if the database upgrade impacts your application, you may want to have a full control over the upgrade process.

Running a manual database upgrade allows you to do just that. You can use one of the following *upgrade strategies*:

- *Rolling Update*, initiated manually and [controlled by Kubernetes](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#update-strategies) . Note that the order of Pods restart may not be optimal from the Percona Server for MongoDB point of view.
- *On Delete*, [done by Kubernetes on per-Pod basis](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#update-strategies) when Pods are manually deleted.

## Before you begin

- Read [Before you upgrade: limits you should know](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update.html#before-you-upgrade-limits-you-should-know) before you proceed. It is important that you get familiar with the backup requirement, version-jump rules, and known problematic version combinations.
- Check [Considerations](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-operator.html#considerations) for Kubernetes cluster versions and upgrades if you plan to update the Kubernetes cluster.

## Rolling Update strategy and semi-automatic updates

To run a semi-automatic update of Percona Server for MongoDB, do the following:

1. Check the version of the Operator you have in your Kubernetes environment. If you need to update it, refer to the [Operator upgrade guide](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-operator.html).

1. Edit the `deploy/cr.yaml` file and set the `updateStrategy` key to `RollingUpdate`.

1. Check the current version of the Custom Resource and what versions of the database and cluster components are compatible with it. Use the following command:

   ```
   curl https://check.percona.com/versions/v1/psmdb-operator/1.23.1 |jq -r '.versions[].matrix'
   ```

   You can also find this information in the [Versions compatibility](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/versions.html) matrix.

1. Update the database, the backup and PMM Client image names with a newer version tag. Find the image names [in the list of certified images](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/images.html).

   We recommend to update the PMM Server **before** the upgrade of PMM Client. If you haven’t done it yet, exclude PMM Client from the list of images to update.

   Starting with version 1.21.0, the Operator supports [persistent logging](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/persistent-logging.html). To update to version 1.21.0, exclude the `logcollector` from the list of images to update.

   Since this is a working cluster, the way to update the Custom Resource is to [apply a patch](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) with the `kubectl patch psmdb` command.

   This example command updates the cluster with the name `my-cluster-name` to the `1.23.1` version. The commands in the following examples use Percona Server for MongoDB 8.3. If you run 8.0 or 7.0, update the commands with the corresponding minor versions. Find those versions in the [version compatibility matrix](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/versions.html).

   **With PMM Client**

   ```
   kubectl patch psmdb my-cluster-name --type=merge --patch '{
      "spec": {
         "crVersion":"1.23.1",
         "image": "percona/percona-server-mongodb:8.3.13-4",
         "backup": { "image": "percona/percona-backup-mongodb:2.15.0" },
         "pmm": { "image": "percona/pmm-client:3.9.1" },
         "logcollector": { "image": "percona/fluentbit:5.1.2-1" }
      }}'
   ```

   **Without PMM Client**

   ```
   kubectl patch psmdb my-cluster-name --type=merge --patch '{
      "spec": {
         "crVersion":"1.23.1",
         "image": "percona/percona-server-mongodb:8.3.13-4",
         "backup": { "image": "percona/percona-backup-mongodb:2.15.0" },
         "logcollector": { "image": "percona/fluentbit:5.1.2-1" }
      }}'
   ```

1. After you applied the patch, the deployment rollout will be triggered automatically. You can track the rollout process in real time using the `kubectl rollout status` command with the name of your cluster:

   ```
   kubectl rollout status sts my-cluster-name-rs0
   ```

## Manual upgrade (the On Delete strategy)

To upgrade Percona Server for MongoDB manually, do following:

1. Check the version of the Operator you have in your Kubernetes environment. If you need to update it, refer to the [Operator upgrade guide](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-operator.html).

1. Edit the `deploy/cr.yaml` file and set the `updateStrategy` key to `OnDelete`.

1. Check the current version of the Custom Resource and what versions of the database and cluster components are compatible with it. Use the following command:

   ```
   curl https://check.percona.com/versions/v1/psmdb-operator/1.23.1 |jq -r '.versions[].matrix'
   ```

   You can also find this information in the [Versions compatibility](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/versions.html) matrix.

1. Update the database, the backup and PMM Client image names with a newer version tag. Find the image names [in the list of certified images](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/images.html).

   We recommend to update the PMM Server **before** the upgrade of PMM Client. If you haven’t done it yet, exclude PMM Client from the list of images to update.

   Starting with version 1.21.0, the Operator supports [persistent logging](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/persistent-logging.html). To update to version 1.21.0, exclude the `logcollector` from the list of images to update.

   Since this is a working cluster, the way to update the Custom Resource is to [apply a patch](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) with the `kubectl patch psmdb` command.

   This example command updates the cluster with the name `my-cluster-name` to the `1.23.1` version. The commands in the following examples use Percona Server for MongoDB 8.3. If you run 8.0 or 7.0, update the commands with the corresponding minor versions. Find those versions in the [version compatibility matrix](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/versions.html).

   **With PMM Client**

   ```
   kubectl patch psmdb my-cluster-name --type=merge --patch '{
      "spec": {
         "crVersion":"1.23.1",
         "image": "percona/percona-server-mongodb:8.3.13-4",
         "backup": { "image": "percona/percona-backup-mongodb:2.15.0" },
         "pmm": { "image": "percona/pmm-client:3.9.1" },
         "logcollector": { "image": "percona/fluentbit:5.1.2-1" }
      }}'
   ```

   **Without PMM Client**

   ```
   kubectl patch psmdb my-cluster-name --type=merge --patch '{
      "spec": {
         "crVersion":"1.23.1",
         "image": "percona/percona-server-mongodb:8.3.13-4",
         "backup": { "image": "percona/percona-backup-mongodb:2.15.0" },
         "logcollector": { "image": "percona/fluentbit:5.1.2-1" }
      }}'
   ```

1. The Pod with the newer Percona Server for MongoDB image will start after you delete it. Delete targeted Pods manually one by one to make them restart in the desired order:

   1. Delete the Pod using its name with the command like the following one:

      ```
      $ kubectl delete pod my-cluster-name-rs0-2
      ```

   1. Wait until Pod becomes ready:

      ```
      $ kubectl get pod my-cluster-name-rs0-2
      ```

      The output should be like this:

      ```
      NAME                    READY   STATUS    RESTARTS   AGE
      my-cluster-name-rs0-2   1/1     Running   0          3m33s
      ```

The update process is successfully finished when all Pods have been restarted. If you turned on [Percona Server for MongoDB Sharding](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/sharding.html), the mongos and Config Server nodes must be restarted too to complete the upgrade.

## See also

- [Choose your upgrade path](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update.html)
