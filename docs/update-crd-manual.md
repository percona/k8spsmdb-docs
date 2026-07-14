# Upgrade the Operator and CRD manually

The upgrade includes the following steps.

1. **For Operators older than v1.12.0**: Update the API version in the [Custom Resource Definition :octicons-link-external-16:](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/):

    === "Manually"

        ```bash
        kubectl proxy &  \
        curl \
               --header "Content-Type: application/json-patch+json" \
               --request PATCH \
               --data '[{"op": "replace", "path": "/status/storedVersions", "value":["v1"]}]' --url "http://localhost:8001/apis/apiextensions.k8s.io/v1/customresourcedefinitions/perconaservermongodbs.psmdb.percona.com/status"
        ```

        ??? example "Expected output"

            ```{.text .no-copy}
            {
             {...},
              "status": {
                "storedVersions": [
                  "v1"
                ]
              }
            }
            ```

    === "Via `kubectl patch`"

        ```bash
        kubectl patch customresourcedefinitions perconaservermongodbs.psmdb.percona.com --subresource='status' --type='merge' -p '{"status":{"storedVersions":["v1"]}}'
        ```

        ??? example "Expected output"

            ```{.text .no-copy}
            customresourcedefinition.apiextensions.k8s.io/perconaservermongodbs.psmdb.percona.com patched
            ```

2. Update the [Custom Resource Definition :octicons-link-external-16:](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)
    for the Operator and the Role-based access control. Take the latest versions from the official repository on GitHub with the following commands:

    ```bash
    kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v{{ release }}/deploy/crd.yaml
    kubectl apply -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v{{ release }}/deploy/rbac.yaml
    ```

3. Next, update the Percona Server for MongoDB Operator Deployment in Kubernetes by changing the container image of the Operator Pod to the latest version. Find the image name for the current Operator release [in the list of certified images](images.md). Then [apply a patch :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) to the Operator Deployment and specify the image name and version. Use the following command to update the Operator Deployment to the `{{ release }}` version:

    ```bash
    kubectl patch deployment percona-server-mongodb-operator \
       -p'{"spec":{"template":{"spec":{"containers":[{"name":"percona-server-mongodb-operator","image":"percona/percona-server-mongodb-operator:{{ release }}"}]}}}}'
    ```

4. The deployment rollout will be automatically triggered by the applied patch.
    You can track the rollout process in real time with the
    `kubectl rollout status` command with the name of your cluster:

    ```bash
    kubectl rollout status deployments percona-server-mongodb-operator
    ```

    !!! note

        Labels set on the Operator Pod will not be updated during upgrade.

5. Update the Custom Resource version, the database, the backup and PMM Client image names with a newer version tag. This step ensures all new features and improvements of the latest release work well within your environment.

    Find the image names [in the list of certified images](images.md).

    We recommend to update the PMM Server **before** the upgrade of PMM Client. If you haven't done it yet, exclude PMM Client from the list of images to update.

    Since this is a working cluster, the way to update the Custom Resource is to [apply a patch  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/) with the `kubectl patch psmdb` command.

    For example, to update the cluster with the name `my-cluster-name` to the `{{ release }}` version, the command is as follows:

    === "With PMM Client"

        ```bash
        kubectl patch psmdb my-cluster-name --type=merge --patch '{
           "spec": {
              "crVersion":"{{ release }}",
              "image": "percona/percona-server-mongodb:{{ mongodb80recommended }}",
              "backup": { "image": "percona/percona-backup-mongodb:{{ pbmrecommended }}" },
              "pmm": { "image": "percona/pmm-client:{{ pmm2recommended }}" },
              "logcollector": { "image": "percona/fluentbit:{{fluentbitrecommended}}" }
           }}'
        ```

    === "Without PMM Client"

        ```bash
        kubectl patch psmdb my-cluster-name --type=merge --patch '{
           "spec": {
              "crVersion":"{{ release }}",
              "image": "percona/percona-server-mongodb:{{ mongodb80recommended }}",
              "backup": { "image": "percona/percona-backup-mongodb:{{ pbmrecommended }}" },
              "logcollector": { "image": "percona/fluentbit:{{fluentbitrecommended}}" }
           }}'
        ```
