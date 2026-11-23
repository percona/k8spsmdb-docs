> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Upgrade the Operator and CRD manually

## Before you begin

- Read [Before you upgrade: limits you should know](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update.html#before-you-upgrade-limits-you-should-know) before you proceed. It is important that you get familiar with the backup requirement, version-jump rules, and known problematic version combinations.
- Check [Considerations](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-operator.html#considerations) for Kubernetes cluster versions and upgrades if you plan to update the Kubernetes cluster.

## Procedure

The upgrade includes the following steps.

1. **For Operators older than v1.12.0**: Update the API version in the [Custom Resource Definition](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) :

   **Manually**

   ```
   kubectl proxy &  \
   curl \
          --header "Content-Type: application/json-patch+json" \
          --request PATCH \
          --data '[{"op": "replace", "path": "/status/storedVersions", "value":["v1"]}]' --url "http://localhost:8001/apis/apiextensions.k8s.io/v1/customresourcedefinitions/perconaservermongodbs.psmdb.percona.com/status"
   ```

   Expected output

   ```
   {
    {...},
     "status": {
       "storedVersions": [
         "v1"
       ]
     }
   }
   ```

   **Via kubectl patch**

   ```
   kubectl patch customresourcedefinitions perconaservermongodbs.psmdb.percona.com --subresource='status' --type='merge' -p '{"status":{"storedVersions":["v1"]}}'
   ```

   Expected output

   ```
   customresourcedefinition.apiextensions.k8s.io/perconaservermongodbs.psmdb.percona.com patched
   ```

1. Update the [Custom Resource Definition](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) for the Operator and the Role-based access control. Take the latest versions from the official repository on GitHub with the following commands:

   ```
   kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v1.23.1/deploy/crd.yaml
   kubectl apply -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v1.23.1/deploy/rbac.yaml
   ```

1. Next, update the Percona Server for MongoDB Operator Deployment in Kubernetes by changing the container image of the Operator Pod to the latest version. Find the image name for the current Operator release [in the list of certified images](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/images.html). Then [apply a patch](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) to the Operator Deployment and specify the image name and version. Use the following command to update the Operator Deployment to the `1.23.1` version:

   ```
   kubectl patch deployment percona-server-mongodb-operator \
      -p'{"spec":{"template":{"spec":{"containers":[{"name":"percona-server-mongodb-operator","image":"percona/percona-server-mongodb-operator:1.23.1"}]}}}}'
   ```

1. The deployment rollout will be automatically triggered by the applied patch. You can track the rollout process in real time with the `kubectl rollout status` command with the name of your cluster:

   ```
   kubectl rollout status deployments percona-server-mongodb-operator
   ```

   Note

   Labels set on the Operator Pod will not be updated during upgrade.

1. Update the Custom Resource version, the database, the backup and PMM Client image names with a newer version tag. This step ensures all new features and improvements of the latest release work well within your environment.

   Find the image names [in the list of certified images](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/images.html).

   We recommend to update the PMM Server **before** the upgrade of PMM Client. If you haven’t done it yet, exclude PMM Client from the list of images to update.

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

## Next steps

[Upgrade the database](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-db.html)
