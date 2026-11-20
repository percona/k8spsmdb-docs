# Upgrade the Operator and CRD with Rancher Apps

If you [installed the Operator from Rancher Apps](rancher.md), upgrade it from the Rancher UI too. You update the Custom Resource Definitions (CRDs) by hand first, then upgrade the `psmdb-operator` app in **Apps > Installed Apps**.

The Operator chart installs the CRDs from its `crds` folder. Helm never upgrades CRDs from this folder, and Rancher runs a plain `helm upgrade`, so an app upgrade leaves the CRDs at the old version. Your CRDs aren't managed by the `psmdb-operator-crds` chart, so the steps in [Upgrade with Helm](update-crd-helm.md) don't apply.

--8<-- "update-critical-notice.md"

## Before you start

* Read the [upgrade considerations](update-operator.md#considerations) for your target version.
* Have `kubectl` access to the cluster. You can use the **Kubectl Shell** in the Rancher top bar, the `>_` icon.
* Find the chart version for the target Operator version. Open **Apps > Charts**, select **Percona Operator for MongoDB** and check which entry in **Chart Versions** has the target Operator version as its **Application Version**. The chart version and the Operator version can differ in the patch number. See [Chart and Operator versions](helm.md#chart-and-operator-versions).

## Upgrade steps

1. Check the current CRD version. The `version` label shows it:

    ```bash
    kubectl get crd perconaservermongodbs.psmdb.percona.com --show-labels
    ```

2. Apply the CRDs of the target Operator version. Replace `<version>` with the Operator version, for example `{{ release }}`:

    ```bash
    kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v<version>/deploy/crd.yaml
    ```

    CRDs are cluster-wide. If other Operators in the cluster use them, upgrade those Operators to the same version too.

3. Upgrade the Operator:

    1. Go to **Apps > Installed Apps**. When a newer chart version is available, the **Upgradable** column of the `psmdb-operator` app shows it.
    2. Select the version in the **Upgradable** column.
    3. On the **Metadata** step, select **Next**.
    4. On the **Values** step, review the values and select **Upgrade**. Rancher runs `helm upgrade` with the values from this step. The upgrade is done when the log ends with `SUCCESS`.

## Verify

1. Check that the CRD has the new version:

    ```bash
    kubectl get crd perconaservermongodbs.psmdb.percona.com --show-labels
    ```

2. Check that the Operator runs the new image. Replace `<namespace>` with your namespace:

    ```bash
    kubectl get deploy -n <namespace> -l app.kubernetes.io/name=psmdb-operator \
      -o jsonpath='{.items[0].spec.template.spec.containers[0].image}{"\n"}'
    ```

    You can also check the `psmdb-operator` app in **Apps > Installed Apps**: it shows the new chart version.

## Upgrade the database cluster app

After the Operator, upgrade the `psmdb-db` app the same way, to the chart version with the same **Application Version** as the Operator. The new chart version changes `crVersion` and the image versions in the Custom Resource, and the Operator then upgrades the database cluster. To learn how the Operator applies these changes and what to check first, see [Upgrade Percona Server for MongoDB](update-db.md).

## Next steps

[Upgrade the database](update-db.md){.md-button}

## See also

* [Upgrade the Operator and CRD](update-operator.md) for the considerations for each Operator version
* [Install from Rancher Apps](rancher.md) for the installation steps and chart details
* [Delete the Operator](delete.md#use-rancher-apps) to uninstall the apps from Rancher
