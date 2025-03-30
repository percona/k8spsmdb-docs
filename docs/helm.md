# Install Percona Server for MongoDB using Helm

[Helm  :octicons-link-external-16:](https://github.com/helm/helm) is the package manager for Kubernetes. 
A Helm [chart  :octicons-link-external-16:](https://helm.sh/docs/topics/charts/) is a package that contains all the necessary resources to deploy an application to a Kubernetes cluster.

You can find Percona Helm charts in [percona/percona-helm-charts  :octicons-link-external-16:](https://github.com/percona/percona-helm-charts) repository in Github.

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

## Installation 

Here's a sequence of steps to follow:
{.power-number}

1. Add the Percona’s Helm charts repository and make your Helm client up to
    date with it:

    ``` {.bash data-prompt="$" }
    $ helm repo add percona https://percona.github.io/percona-helm-charts/
    $ helm repo update
    ```

2. It is a good practice to isolate workloads in Kubernetes via namespaces. Create a namespace:

    ```{.bash data-prompt="$" }
    $ kubectl create namespace <namespace>
    ```

3. Install Percona Operator for MongoDB:

    ``` {.bash data-prompt="$" }
    $ helm install my-op percona/psmdb-operator --namespace <namespace>
    ```

    The `namespace` is the name of your namespace. The `my-op` parameter in the above example is the name of [a new release object  :octicons-link-external-16:](https://helm.sh/docs/intro/using_helm/#three-big-concepts)
    which is created for the Operator when you install its Helm chart (use any
    name you like).

4. Install Percona Server for MongoDB:

    ``` {.bash data-prompt="$" }
    $ helm install cluster1 percona/psmdb-db --namespace <namespace>
    ```

    The `cluster1` parameter is the name of [a new release object  :octicons-link-external-16:](https://helm.sh/docs/intro/using_helm/#three-big-concepts)
    which is created for the Percona Server for MongoDB when you install its Helm
    chart (use any name you like).

5. Check the Operator and the Percona Server for MongoDB Pods status.

    ```{.bash data-prompt="$" }
    $ kubectl get psmdb -n <namespace>
    ```

    The creation process may take some time. When the process is over your
    cluster obtains the `ready` status. 

    ??? example "Expected output"

        ```{.text .no-copy}
        NAME              ENDPOINT                                           STATUS   AGE
        my-cluster-name   cluster1-mongos.default.svc.cluster.local   ready    5m26s
        ```

You have successfully installed and deployed the Operator with default parameters. 

The default Percona Server for MongoDB configuration includes three mongod, three mongos, and three config server instances with [enabled sharding](sharding.md).

You can find in the documentation for the charts which [Operator :octicons-link-external-16:](https://github.com/percona/percona-helm-charts/tree/main/charts/psmdb-operator#installing-the-chart) and [database :octicons-link-external-16:](https://github.com/percona/percona-helm-charts/tree/main/charts/psmdb-db#installing-the-chart) parameters can be customized during installation.
Also, you can check the rest of the Operator's parameters in the [Custom Resource options reference](operator.md).

## Next steps

[Connect to Percona Server for MongoDB :material-arrow-right:](connect.md){.md-button}

## Useful links

[Install Percona Server for MongoDB with customized parameters](custom-install.md)
