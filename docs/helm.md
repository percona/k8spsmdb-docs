# Install Percona Server for MongoDB using Helm

[Helm  :octicons-link-external-16:](https://github.com/helm/helm) is the package manager for Kubernetes. 
A Helm [chart  :octicons-link-external-16:](https://helm.sh/docs/topics/charts/) is a package that contains all the necessary resources to deploy an application to a Kubernetes cluster.

You can find Percona Helm charts in [percona/percona-helm-charts  :octicons-link-external-16:](https://github.com/percona/percona-helm-charts) repository in GitHub.

## Prerequisites

To install and deploy the Operator, you need the following:

1. [Helm v3  :octicons-link-external-16:](https://docs.helm.sh/using_helm/#installing-helm).
2. [kubectl  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/tools/) command line utility.
3. A Kubernetes environment. You can deploy it locally on [Minikube  :octicons-link-external-16:](https://github.com/kubernetes/minikube) for testing purposes or using any cloud provider of your choice. Check the list of our [officially supported platforms](System-Requirements.md#officially-supported-platforms).

    !!! note "See also"

        * [Set up Minikube](minikube.md)
        * [Create and configure the GKE cluster](gke.md#create-and-configure-the-gke-cluster)
        * [Set up Amazon Elastic Kubernetes Service](eks.md#prerequisites)
        * [Create and configure the AKS cluster](aks.md#create-and-configure-the-aks-cluster)

--8<-- "what-you-install.md"

## Installation 

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

3. Install Percona Operator for MongoDB Deployment. Replace the `namespace` with the name of your namespace:

    ```bash
    helm install my-op percona/psmdb-operator --namespace <namespace> --set crds.enabled=true
    ```

    The `my-op` parameter in the above example is the name of [a new release object  :octicons-link-external-16:](https://helm.sh/docs/intro/using_helm/#three-big-concepts)
    which is created for the Operator when you install its Helm chart (use any
    name you like).
    
    The `--set crds.enabled=true` flag adds the Helm chart for CRDs as a dependency to the main chart. This is done to enable automatic CRD updates during the [upgrade](update-operator.md).

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
        
4. Install Percona Server for MongoDB:

    ```bash
    helm install cluster1 percona/psmdb-db --namespace <namespace>
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

5. Check the Operator and the Percona Server for MongoDB Pods status.

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

## Next steps

[Connect to Percona Server for MongoDB :material-arrow-right:](connect.md){.md-button}

## Useful links

[Install Percona Server for MongoDB with customized parameters](custom-install.md)
