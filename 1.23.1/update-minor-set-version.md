> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Upgrade to a specific version

## Before you begin

- Read [Before you upgrade: limits you should know](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update.html#before-you-upgrade-limits-you-should-know) before you proceed. It is important that you get familiar with the backup requirement, version-jump rules, and known problematic version combinations.
- Check [Considerations](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-operator.html#considerations) for Kubernetes cluster versions and upgrades if you plan to update the Kubernetes cluster.

## Assumptions

For the procedures in this tutorial, we assume that you have set up the Smart Update strategy to update the objects in your database cluster.

Read more about the Smart Update strategy and other available ones in the [Upgrade strategies](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update.html#update-strategies) section.

## Procedure

To upgrade Percona Server for MongoDB to a specific version, do the following:

1. Check the version of the Operator you have in your Kubernetes environment. If you need to update it, refer to the [Operator upgrade guide](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-operator.html).

1. Check the [Custom Resource](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html) manifest configuration to be the following:

   - `spec.updateStrategy` option is set to `SmartUpdate`
   - `spec.upgradeOptions.apply` option is set to `Disabled` or `Never`.

   ```
   ...
   spec:
     updateStrategy: SmartUpdate
     upgradeOptions:
       apply: Disabled
       ...
   ```

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

The update process is successfully finished when all Pods have been restarted. If you turned on [Percona Server for MongoDB Sharding](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/sharding.html), the mongos and Config Server nodes must be restarted too to complete the upgrade.

## See also

- [Choose your upgrade path](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update.html)
- [Custom resource statuses](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/cr-statuses.html#perconaservermongodb-status)
