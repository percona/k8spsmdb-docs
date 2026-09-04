# Install Percona Server for MongoDB using kubectl

Percona Operator for MongoDB is a special type of controller introduced to automate deployment and management of Percona Server for MongoDB in Kubernetes. The Operator extends the Kubernetes API with custom resources. Learn more about [how the Operator works](how-it-works.md) and its [architecture](architecture.md).

We recommend installing the Operator with the [kubectl  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/tools/) command line utility. It is the universal way to interact with Kubernetes. Alternatively, you can install it using the [Helm  :octicons-link-external-16:](https://github.com/helm/helm) package manager.

[Install with kubectl :material-arrow-down:](#prerequisites){.md-button} [Install with Helm :material-arrow-right:](helm.md){.md-button}

## Assumptions

This guide walks you through installing Percona Operator for MongoDB in a [single-namespace mode](namespace-mode.md#single-namespace-deployment) with default parameters.

For how to install Percona Operator for MongoDB in a multi-namespace mode, see [Install in a multi-namespace mode](cluster-wide.md). For how ton install Percona Operator for MongoDB with customized parameters, see [Install Percona Operator for MongoDB with customized parameters](custom-install.md).

--8<-- "what-you-install.md"

## Prerequisites

To install Percona Distribution for MongoDB, you need the following:

1. The **kubectl** tool to manage and deploy applications on Kubernetes, included in most Kubernetes distributions. If you don’t have it installed, you can install it by following the [official installation instructions  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/tools/install-kubectl/).

2. A Kubernetes environment. You can deploy it on [Minikube  :octicons-link-external-16:](https://github.com/kubernetes/minikube) for testing purposes or using any cloud provider of your choice. Check the list of our [officially supported platforms](System-Requirements.md#officially-supported-platforms).

    !!! note "See also"

        * [Set up Minikube](minikube.md)
        * [Create a GKE cluster](gke.md#create-the-gke-cluster)
        * [Create an EKS cluster](eks.md#create-the-eks-cluster)
        * [Create an AKS cluster](aks.md#create-the-aks-cluster)


## Procedure 

Here's a sequence of steps to follow:
{.power-number}

1. Create the Kubernetes namespace for your cluster. It is a good practice to isolate workloads in Kubernetes by installing the Operator in a custom namespace. Replace the `<namespace>` placeholder with your value.

    ```bash
    kubectl create namespace <namespace>
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        namespace/<namespace> was created
        ```

2. Deploy the Operator [using  :octicons-link-external-16:](https://kubernetes.io/docs/reference/using-api/server-side-apply/) the following command:

    ```bash
    kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v{{ release }}/deploy/bundle.yaml -n <namespace>
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        customresourcedefinition.apiextensions.k8s.io/perconaservermongodbs.psmdb.percona.com serverside-applied
        customresourcedefinition.apiextensions.k8s.io/perconaservermongodbbackups.psmdb.percona.com serverside-applied
        customresourcedefinition.apiextensions.k8s.io/perconaservermongodbrestores.psmdb.percona.com serverside-applied
        role.rbac.authorization.k8s.io/percona-server-mongodb-operator serverside-applied
        serviceaccount/percona-server-mongodb-operator serverside-applied
        rolebinding.rbac.authorization.k8s.io/service-account-percona-server-mongodb-operator serverside-applied
        deployment.apps/percona-server-mongodb-operator serverside-applied
        ```

    As the result you will have the Operator Pod up and running. 

3. Deploy Percona Server for MongoDB:

    ```bash
    kubectl apply -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v{{ release }}/deploy/cr.yaml -n <namespace>
    ```

    ??? example "Expected output"

        ```{.text .no-copy}
        perconaservermongodb.psmdb.percona.com/my-cluster-name created
        ```


4. Check the Operator and the Percona Server for MongoDB Pods status.

    ```bash
    kubectl get psmdb -n <namespace>
    ```

    The creation process may take some time. When the process is over your
    cluster obtains the `ready` status. 

    ??? example "Expected output"

        ```{.text .no-copy}
        NAME              ENDPOINT                                           STATUS   AGE
        my-cluster-name   my-cluster-name-mongos.default.svc.cluster.local   ready    5m26s
        ```

You have successfully installed and deployed the Operator with default parameters. 

You can check the rest of the Operator's parameters in the [Custom Resource options reference](operator.md).


## Next steps

[Connect to Percona Server for MongoDB :material-arrow-right:](connect.md){.md-button}

## Useful links

[Install Percona Server for MongoDB with customized parameters](custom-install.md)

