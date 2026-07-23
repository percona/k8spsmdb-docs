# Upgrade Percona Server for MongoDB on OpenShift

{%set commandName = 'oc' %}

--8<-- "update-assumptions.md" 

## Upgrading Percona Server for MongoDB

1. Check the version of the Operator you have in your Kubernetes environment. If you need to update it, refer to [the Operator upgrade guide](update-crd-olm.md).
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

3. Find the **new** initial Operator installation image name (it had changed during the Operator upgrade) and other image names for the components of your cluster with the `kubectl get deploy` command:

    ```bash
    kubectl get deploy percona-server-mongodb-operator -o yaml
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        ...
        "image": "registry.connect.redhat.com/percona/percona-server-mongodb-operator-containers@sha256:5d29132a60b89e660ab738d463bcc0707a17be73dc955aa8da9e50bed4d9ad3e",
        ...
        "initImage": "registry.connect.redhat.com/percona/percona-server-mongodb-operator@sha256:8adc57e9445cfcea1ae02798a8f9d6a4958ac89f0620b9c6fa6cf969545dd23f",
        ...
        "pmm": {
          "enabled": true,
          "image": "registry.connect.redhat.com/percona/percona-server-mongodb-operator-containers@sha256:165f97cdae2b6def546b0df7f50d88d83c150578bdb9c992953ed866615016f1",
        ...
        "backup": {
          "enabled": true,
          "image": "registry.connect.redhat.com/percona/percona-server-mongodb-operator-containers@sha256:a73889d61e996bc4fbc6b256a1284b60232565e128a64e4f94b2c424966772eb",
        ...
        ```

4. We recommend to [update the PMM Server :octicons-link-external-16:](https://docs.percona.com/percona-monitoring-and-management/3/pmm-upgrade/index.html) **before** the upgrade of PMM Client. If you haven’t done it yet, exclude PMM Client from the list of images to update.
5. [Apply a patch :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) to set the necessary `crVersion` value (equal to the Operator version) and update images in your cluster Custom Resource. Supposing that your cluster name is `cluster1`, the command should look as follows:
   
    === "With PMM Client"

        ```bash
        kubectl patch psmdb my-cluster-name --type=merge --patch '{
            "spec": {
            "crVersion":"{{ release }}",
            "image": "registry.connect.redhat.com/percona/percona-server-mongodb-operator-containers@sha256:5d29132a60b89e660ab738d463bcc0707a17be73dc955aa8da9e50bed4d9ad3e",
            "initImage": "registry.connect.redhat.com/percona/percona-server-mongodb-operator@sha256:8adc57e9445cfcea1ae02798a8f9d6a4958ac89f0620b9c6fa6cf969545dd23f",
            "pmm": {"image": "registry.connect.redhat.com/percona/percona-server-mongodb-operator-containers@sha256:165f97cdae2b6def546b0df7f50d88d83c150578bdb9c992953ed866615016f1"},
            "backup": {"image": "registry.connect.redhat.com/percona/percona-server-mongodb-operator-containers@sha256:a73889d61e996bc4fbc6b256a1284b60232565e128a64e4f94b2c424966772eb"}
            }}'
        ```

    === "Without PMM Client"

        ```bash
        kubectl patch psmdb my-cluster-name --type=merge --patch '{
            "spec": {
               "crVersion":"{{ release }}",
               "image": "registry.connect.redhat.com/percona/percona-server-mongodb-operator-containers@sha256:5d29132a60b89e660ab738d463bcc0707a17be73dc955aa8da9e50bed4d9ad3e",
               "initImage": "registry.connect.redhat.com/percona/percona-server-mongodb-operator@sha256:8adc57e9445cfcea1ae02798a8f9d6a4958ac89f0620b9c6fa6cf969545dd23f",
               "backup": {"image": "registry.connect.redhat.com/percona/percona-server-mongodb-operator-containers@sha256:a73889d61e996bc4fbc6b256a1284b60232565e128a64e4f94b2c424966772eb"}
            }}'
        ```

6. The deployment rollout will be automatically triggered by the applied patch.

