# Install Percona Server for MongoDB using kubectl

A Kubernetes Operator is a special type of controller introduced to simplify complex deployments. The Operator extends the Kubernetes API with custom resources.

The [Percona Operator for MongoDB](compare.md) is based on best practices for configuration and setup of a [Percona Server for MongoDB  :octicons-link-external-16:](https://www.percona.com/mongodb/software/percona-server-for-mongodb) and [Percona Backup for MongoDB :octicons-link-external-16:](https://www.percona.com/mongodb/software/percona-backup-for-mongodb) in a Kubernetes-based environment on-premises or in the cloud.

We recommend installing the Operator with the [kubectl  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/tools/) command line utility. It is the universal way to interact with Kubernetes. Alternatively, you can install it using the [Helm  :octicons-link-external-16:](https://github.com/helm/helm) package manager.

[Install with kubectl :material-arrow-down:](#prerequisites){.md-button} [Install with Helm :material-arrow-right:](helm.md){.md-button}

## Prerequisites

To install Percona Distribution for MongoDB, you need the following:

1. The **kubectl** tool to manage and deploy applications on Kubernetes, included in most Kubernetes distributions. Install not already installed, [follow its official installation instructions  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/tools/install-kubectl/).

2. A Kubernetes environment. You can deploy it on [Minikube  :octicons-link-external-16:](https://github.com/kubernetes/minikube) for testing purposes or using any cloud provider of your choice. Check the list of our [officially supported platforms](System-Requirements.md#officially-supported-platforms).

    !!! note "See also"

        * [Set up Minikube](minikube.md)
        * [Create and configure the GKE cluster](gke.md#create-and-configure-the-gke-cluster)
        * [Set up Amazon Elastic Kubernetes Service](eks.md#prerequisites)
        * [Create and configure the AKS cluster](aks.md#create-and-configure-the-aks-cluster)

## Procedure 

Here's a sequence of steps to follow:
{.power-number}

1. Create the Kubernetes namespace for your cluster. It is a good practice to isolate workloads in Kubernetes by installing the Operator in a custom namespace. Replace the `<namespace>` placeholder with your value.

    ``` {.bash data-prompt="$" }
    $ kubectl create namespace <namespace>
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        namespace/<namespace> was created
        ```

2. Deploy the Operator [using  :octicons-link-external-16:](https://kubernetes.io/docs/reference/using-api/server-side-apply/) the following command:

    ``` {.bash data-prompt="$" }
    $ kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v{{ release }}/deploy/bundle.yaml -n <namespace>
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

    ```{.bash data-prompt="$" }
    $ kubectl apply -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v{{ release }}/deploy/cr.yaml -n <namespace>
    ```

    ??? example "Expected output"

        ```{.text .no-copy}
        perconaservermongodb.psmdb.percona.com/my-cluster-name created
        ```


4. Check the Operator and the Percona Server for MongoDB Pods status.

    ```{.bash data-prompt="$" }
    $ kubectl get psmdb -n <namespace>
    ```

    The creation process may take some time. When the process is over your
    cluster obtains the `ready` status. 

    ??? example "Expected output"

        ```{.text .no-copy}
        NAME              ENDPOINT                                           STATUS   AGE
        my-cluster-name   my-cluster-name-mongos.default.svc.cluster.local   ready    5m26s
        ```

You have successfully installed and deployed the Operator with default parameters. 

The default Percona Server for MongoDB configuration includes three mongod, three mongos, and three config server instances with [enabled sharding](sharding.md).

You can check the rest of the Operator's parameters in the [Custom Resource options reference](operator.md).


## Next steps

[Connect to Percona Server for MongoDB :material-arrow-right:](connect.md){.md-button}

## Useful links

[Install Percona Server for MongoDB with customized parameters](custom-install.md)

