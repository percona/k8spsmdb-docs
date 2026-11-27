# Install Percona Server for MongoDB using Helm

[Helm  :octicons-link-external-16:](https://github.com/helm/helm) is the package manager for Kubernetes. 
A Helm [chart  :octicons-link-external-16:](https://helm.sh/docs/topics/charts/) is a package that contains all the necessary resources to deploy an application to a Kubernetes cluster.

You can find Percona Helm charts in [percona/percona-helm-charts  :octicons-link-external-16:](https://github.com/percona/percona-helm-charts) repository in GitHub.

## Assumptions

This guide walks you through installing Percona Operator for MongoDB in a [single-namespace mode](namespace-mode.md#single-namespace-deployment) with default parameters. 

For how to install Percona Operator for MongoDB in a multi-namespace mode, see [Install in a multi-namespace mode](cluster-wide.md). For how to install Percona Operator for MongoDB with customized parameters, see [Install Percona Operator for MongoDB with customized parameters](custom-install.md).

--8<-- "what-you-install.md"

## Prerequisites

To install and deploy the Operator, you need the following:

1. [Helm v3  :octicons-link-external-16:](https://docs.helm.sh/using_helm/#installing-helm).
2. [kubectl  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/tools/) command line utility.
3. A Kubernetes environment. You can deploy it locally on [Minikube  :octicons-link-external-16:](https://github.com/kubernetes/minikube) for testing purposes or using any cloud provider of your choice. Check the list of our [officially supported platforms](System-Requirements.md#officially-supported-platforms).

    !!! note "See also"

        * [Set up Minikube](minikube.md)
        * [Create and configure the GKE cluster](gke.md#create-a-google-kubernetes-engine-gke-cluster)
        * [Set up Amazon Elastic Kubernetes Service](eks.md#prerequisites)
        * [Create and configure the AKS cluster](aks.md#create-the-aks-cluster)
        * [Create a Rancher Kubernetes Engine (RKE2) cluster](rke2.md)

## Chart and Operator versions

Each Helm chart has two versions in the `major.minor.patch` format:

* **Chart version** – the version of the chart itself. You pass it to `helm install` and `helm upgrade` with the `--version` flag.
* **App version** – the version of the Operator that the chart installs.

The major and minor numbers of the two versions match, but the patch numbers can differ. Percona releases a new chart patch version each time the chart itself is fixed, even when the Operator doesn't change. For example, Operator {{ release }} is installed by the `psmdb-operator` chart {{ operatorchart }} and the `psmdb-db` chart {{ dbchart }}.

The commands on this page set the chart versions with the `--version` flag. To find the chart versions for an Operator version, see [Find the chart versions](#find-the-chart-versions).

## Installation 

This procedure installs Operator {{ release }} with these chart versions:

* `psmdb-operator-crds` {{ crdchart }}
* `psmdb-operator` {{ operatorchart }}
* `psmdb-db` {{ dbchart }}

Percona can release a newer chart version for the same Operator version after this documentation is published. After you add the Percona repository in step 1, [check the chart versions](#find-the-chart-versions) and use the latest ones in the commands.

Here's a sequence of steps to follow:
{.power-number}

1. Add the Percona’s Helm charts repository and make your Helm client up to
    date with it:

    ```bash
    helm repo add percona https://percona.github.io/percona-helm-charts/
    helm repo update
    ```

2. It is a good practice to isolate workloads in Kubernetes via namespaces. Create a namespace:

    ```bash
    kubectl create namespace <namespace>
    ```

3. Install the Percona Server for MongoDB Operator Custom Resource Definitions (CRDs) first. You can later use this chart to manage and upgrade CRDs independently using Helm or GitOps tools.

    ```bash
    helm install psmdb-operator-crds percona/psmdb-operator-crds --version {{ crdchart }} --namespace <namespace>
    ```

    
    !!! important
    
        Although you install the CRD Helm chart (`psmdb-operator-crds`) in a specific namespace, the CRDs themselves are cluster-scoped resources and apply to *all* namespaces in your Kubernetes environment. If you uninstall or delete this CRD chart, it will remove the CRDs from the Kubernetes environment. This will irreversibly delete *all* Percona Server for MongoDB clusters managed by these CRDs across *all* namespaces where you deployed them. 

4. Install Percona Operator for MongoDB Deployment. Replace the `namespace` with the name of your namespace:

    ```bash
    helm install my-op percona/psmdb-operator --version {{ operatorchart }} --namespace <namespace>
    ```

    The `my-op` parameter in the above example is the name of [a new release object  :octicons-link-external-16:](https://helm.sh/docs/intro/using_helm/#three-big-concepts)
    which is created for the Operator when you install its Helm chart (use any
    name you like).


    ??? example "Expected output"

        ```{.text no-copy}
        NAME: my-op
        LAST DEPLOYED: Mon Jan 19 11:45:12 2026
        NAMESPACE: <namespace>
        STATUS: deployed
        REVISION: 1
        TEST SUITE: None
        NOTES:
        .....
        ```
        
5. Install Percona Server for MongoDB:

    ```bash
    helm install cluster1 percona/psmdb-db --version {{ dbchart }} --namespace <namespace>
    ```
    
    The `cluster1` parameter is the name of [a new release object  :octicons-link-external-16:](https://helm.sh/docs/intro/using_helm/#three-big-concepts)
    which is created for the Percona Server for MongoDB when you install its Helm
    chart (use any name you like).

    ??? example "Expected output"

        ```{.text no-copy}
        NAME: cluster1
        LAST DEPLOYED: Mon Jan 19 12:19:37 2026
        NAMESPACE: <namespace>
        STATUS: deployed
        REVISION: 1
        TEST SUITE: None
        NOTES:
        ....
        ```

6. Check the status of the Percona Server for MongoDB cluster:

    ```bash
    kubectl get psmdb -n <namespace>
    ```

    The creation process may take some time. When the process is over your
    cluster obtains the `ready` status. 

    ??? example "Expected output"

        ```{.text .no-copy}
        NAME              ENDPOINT                                           STATUS   AGE
        cluster1-psmdb-db   cluster1-psmdb-db-mongos.<namespace>.svc.cluster.local:27017   ready    5m26s
        ```

You have successfully installed and deployed the Operator with default parameters. 

You can find in the documentation for the charts which [Operator :octicons-link-external-16:](https://github.com/percona/percona-helm-charts/tree/main/charts/psmdb-operator#installing-the-chart) and [database :octicons-link-external-16:](https://github.com/percona/percona-helm-charts/tree/main/charts/psmdb-db#installing-the-chart) parameters can be customized during installation.
Also, you can check the rest of the Operator's parameters in the [Custom Resource options reference](operator.md).

## Find the chart versions

To find the chart versions for an Operator version, you need the Percona Helm repository added as in step 1 of the [installation](#installation) and the [jq :octicons-link-external-16:](https://jqlang.org/) command-line JSON processor.

List the chart versions that install Operator {{ release }}. To install another Operator version, replace `{{ release }}` in the command:

```bash
helm repo update
helm search repo percona/psmdb --versions -o json \
  | jq -r '.[] | select(.app_version == "{{ release }}") | [.name, .version, .app_version] | @tsv'
```

??? example "Sample output"

    ```{.text .no-copy}
    percona/psmdb-db	{{ dbchart }}	{{ release }}
    percona/psmdb-operator	{{ operatorchart }}	{{ release }}
    percona/psmdb-operator-crds	{{ crdchart }}	{{ release }}
    ```

The columns are the chart name, the chart version and the app version. If a chart has several chart versions for the same app version, use the latest one. Pass it to `helm install` with the `--version` flag.

## Next steps

[Connect and insert sample data :material-arrow-right:](connect.md){.md-button}

## See also

* [Install Percona Server for MongoDB with customized parameters](custom-install.md)
* [Install from Rancher Apps](rancher.md) to install the same charts from the Rancher UI
