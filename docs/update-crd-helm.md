# Upgrade the Operator and CRD with Helm

If you have [installed the Operator using Helm](helm.md), you can upgrade the
Operator with the `helm upgrade` command.

The `helm upgrade` command updates only the Operator deployment. The [update flow for the database management system](update-db.md) is the same for all installation methods, whether it was installed via Helm or `kubectl`.

## CRD management by Helm

If you installed the Operator deployment from the main `psmdb-operator` chart, Helm installs the CRDs from the `crds/` directory.

Helm v3 doesn't update the CRDs by default to prevent accidental CRD upgrades that could break existing resources. Starting with version 1.22.0, a dedicated CRD chart `psmdb-operator-crds` was added that enables Helm to handle automatic CRD updates. The use of the separate CRD chart also provides better compatibility with GitOPs tools such as ArgoCD and FluxCD and ensures version control and rollback capability for CRDs.

[Learn more about the dedicated CRD chart](RN/Kubernetes-Operator-for-PSMONGODB-RN1.22.0.md).

To update the CRDs you have the following options:

* update them manually before you update the Operator deployment. Use this option if you run the Operator version *before* 1.22.0.
* install a dedicated CRD chart and update the CRDs using Helm

## Upgrade steps

1. You must have the compatible version of the Custom Resource Definition (CRD) in all namespaces that the Operator manages. Starting with version 1.21.0, you can check it using the following command:

    ```bash
    kubectl get crd perconaservermongodbs.psmdb.percona.com --show-labels
    ```

2. Export the namespace where the Operator deployment is running as an environment variable:

    ```bash
    export NAMESPACE=<namespace>
    ```

3. Update the [Custom Resource Definition :octicons-link-external-16:](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) for the Operator.

    === "Add the CRD chart (recommended)"

        The steps differ slightly depending on the Helm version you run.

        === "Helm v3.17.x and later"

            Install the `psmdb-operator-crds` Helm chart that contains the CRDs

            ```bash
            helm upgrade --install psmdb-operator-crds percona/psmdb-operator-crds \
              --namespace $NAMESPACE \
              --version {{ release }} \
              --take-ownership
            ```

            The `--take-ownership` flag tells Helm to take ownership of existing CRDs that were previously installed from the `crds/` directory. This adds Helm metadata (labels and annotations) to the existing CRDs so that Helm can manage them going forward.

        === "Helm earlier than v3.17.x"
        
            For Helm earlier than 3.17, the `--take-ownership` flag is not supported, and you need to add Helm ownership metadata first. 

            1. Export the CRDs as environment variable and then label and annotate them:

                ```bash
                CRDS=(
                  perconaservermongodbs.psmdb.percona.com
                  perconaservermongodbbackups.psmdb.percona.com
                  perconaservermongodbrestores.psmdb.percona.com
                )

                kubectl label crds "${CRDS[@]}" app.kubernetes.io/managed-by=Helm --overwrite
                kubectl annotate crds "${CRDS[@]}" meta.helm.sh/release-name=psmdb-operator-crds --overwrite
                kubectl annotate crds "${CRDS[@]}" meta.helm.sh/release-namespace=$NAMESPACE --overwrite
                ```

            2. Install the CRD chart:

                ```bash
                helm install psmdb-operator-crds percona/psmdb-operator-crds \
                --namespace $NAMESPACE \
                --version {{ release }}
                ```
        
    === "Update manually"

        Update the Custom Resource Definition for the Operator, taking it from the official repository on Github.

        Refer to the [compatibility between CRD and the Operator](#considerations-for-the-operator-upgrades) and how you can update the CRD if it is too old. Use the following command and replace the version to the required one until you are safe to update to the latest CRD version.

        ```bash
        kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v{{ release }}/deploy/crd.yaml -n $NAMESPACE
        ```

        If you already have the latest CRD version in one of namespaces, don't re-run intermediate upgrades for it.


4. Upgrade the Operator deployment

    === "With default parameters"

        To upgrade the Operator installed with default parameters, use the following command: 

        ```bash
        helm upgrade my-op percona/psmdb-operator --version {{ release }}
        ```

    === "With customized parameters"

        If you installed the Operator with some [customized parameters :octicons-link-external-16:](https://github.com/percona/percona-helm-charts/tree/main/charts/psmdb-operator#installing-the-chart), list these options in the upgrade command.   
    
        1. Get the list of used options in YAML format :
        
            ```bash
            helm get values my-op -a > my-values.yaml
            ``` 
        
        2. Pass these options to the upgrade command as follows:

            ```bash
            helm upgrade my-op percona/psmdb-operator --version {{ release }} -f my-values.yaml
            ```

    The `my-op` parameter in the above example is the name of a [release object :octicons-link-external-16:](https://helm.sh/docs/intro/using_helm/#three-big-concepts) which you have chosen for the Operator when installing its Helm chart.

    During the upgrade, you may see a warning to manually apply the CRD if it has the outdated version. In this case, refer to step 3 to upgrade the CRD and then step 4 to upgrade the deployment.

## Troubleshooting CRD upgrades with Helm

**Error: "invalid ownership metadata" or "CRD already exists"**

This happens when existing CRDs were installed from `crds/` and Helm does not own them. Pass the `--take-ownership` flag when you install the `psmdb-operator-crds` chart (Helm 3.17+). For Helm < 3.17+, add Helm ownership metadata before installing or upgrading `psmdb-operator-crds`.
