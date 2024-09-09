# Install Percona Server for MongoDB on Azure Kubernetes Service (AKS)

This guide shows you how to deploy Percona Operator for MongoDB on Microsoft
Azure Kubernetes Service (AKS). The document assumes some experience with the
platform. For more information on the AKS, see the [Microsoft AKS official documentation  :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/).

## Prerequisites

The following tools are used in this guide and therefore should be preinstalled:

1. **Azure Command Line Interface (Azure CLI)** for interacting with the different
    parts of AKS. You can install it following the [official installation instructions for your system  :octicons-link-external-16:](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli).

2. **kubectl**  to manage and deploy applications on Kubernetes. Install
    it [following the official installation instructions  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/tools/install-kubectl/).

Also, you need to sign in with Azure CLI using your credentials according to the
[official guide  :octicons-link-external-16:](https://docs.microsoft.com/en-us/cli/azure/authenticate-azure-cli).

## Create and configure the AKS cluster

To create your cluster, you will need the following data:

* name of your AKS cluster,
* an [Azure resource group  :octicons-link-external-16:](https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/overview), in which resources of your cluster will be deployed and managed.
* the amount of nodes you would like tho have.

You can create your cluster via command line using `az aks create` command.
The following command will create a 3-node cluster named `my-cluster-name` within some [already existing  :octicons-link-external-16:](https://docs.microsoft.com/en-us/azure/aks/learn/quick-kubernetes-deploy-cli#create-a-resource-group) resource group named `my-resource-group`:

``` {.bash data-prompt="$" }
$ az aks create --resource-group my-resource-group --name my-cluster-name --enable-managed-identity --node-count 3 --node-vm-size Standard_B4ms --node-osdisk-size 30 --network-plugin kubenet  --generate-ssh-keys --outbound-type loadbalancer
```

Other parameters in the above example specify that we are creating a cluster with x86_64 machine type of [Standard_B4ms  :octicons-link-external-16:](https://azureprice.net/vm/Standard_B4ms) and OS disk size reduced to 30 GiB. If you need ARM64, use different machine type, for example, [Standard_E4ps_v5](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/memory-optimized/epsv5-series?tabs=sizebasic). You can see detailed information about
cluster creation options in the [AKS official documentation  :octicons-link-external-16:](https://docs.microsoft.com/en-us/cli/azure/aks?view=azure-cli-latest).

You may wait a few minutes for the cluster to be generated.

Now you should configure the command-line access to your newly created cluster
to make `kubectl` be able to use it.

``` {.bash data-prompt="$" } 
az aks get-credentials --resource-group my-resource-group --name my-cluster-name
```

## Install the Operator and deploy your MongoDB cluster

1. Deploy the Operator. By default deployment will be done in the `default`
    namespace. If that's not the desired one, you can create a new namespace
    and/or set the context for the namespace as follows (replace the `<namespace name>` placeholder with some descriptive name):

    ``` {.bash data-prompt="$" }
    $ kubectl create namespace <namespace name>
    $ kubectl config set-context $(kubectl config current-context) --namespace=<namespace name>
    ```

    At success, you will see the message that `namespace/<namespace name>` was created, and the context (`<cluster name>`) was modified.

        Deploy the Operator by applying the `deploy/bundle.yaml` manifest from the Operator source tree. 
    
    === "For x86_64 architecture"
    
        You can apply it without downloading, [using :octicons-link-external-16:](https://kubernetes.io/docs/reference/using-api/server-side-apply/) the following command:

        ``` {.bash data-prompt="$" }
        $ kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v{{ release }}/deploy/bundle.yaml
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

    === "For ARM64 architecture"
    
        Clone the repository with all manifests and source code by executing the following command:

        ``` {.bash data-prompt="$" }
        $ git clone -b v{{ release }} https://github.com/percona/percona-server-mongodb-operator
        ```

        Edit the `deploy/bundle.yaml` file: add the following [affinity rules](constraints.md#affinity-and-anti-affinity) to the  `spec` part of the `percona-server-mongodb-operator` Deployment:
        
        ```yaml hl_lines="6-14"
            apiVersion: apps/v1
            kind: Deployment
            metadata:
              name: percona-server-mongodb-operator
            spec:
              affinity:
                nodeAffinity:
                  requiredDuringSchedulingIgnoredDuringExecution:
                    nodeSelectorTerms:
                      - matchExpressions:
                          - key: kubernetes.io/arch
                            operator: In
                            values:
                              - arm64
        ```

        Also, set `image` and `backup.image` Custom Resource options to special multi-architecture image versions by adding a `-multi` suffix to their tags:
        
        ```yaml
        ...
        image: percona/percona-server-mongodb:{{ mongodb70recommended }}-multi
        ...
        backup:
          ...
          image: percona/percona-backup-mongodb:{{ pbmrecommended }}-multi
        ```

        After editing, [apply :octicons-link-external-16:](https://kubernetes.io/docs/reference/using-api/server-side-apply/) your modified `deploy/bundle.yaml` file as follows:

        ``` {.bash data-prompt="$" }
        $ kubectl apply --server-side -f deploy/bundle.yaml
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

2. The Operator has been started, and you can deploy your MongoDB cluster:

    === "For x86_64 architecture"
      

        ``` {.bash data-prompt="$" }
        $ kubectl apply -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v{{ release }}/deploy/cr.yaml
        ```

        ??? example "Expected output"

            ``` {.text .no-copy}
            perconaservermongodb.psmdb.percona.com/my-cluster-name created
            ```

        !!! note

            This deploys default MongoDB cluster configuration, three mongod, three mongos, and three config server instances. Please see [deploy/cr.yaml  :octicons-link-external-16:](https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v{{ release }}/deploy/cr.yaml) and [Custom Resource Options](operator.md) for the configuration options. You can clone the repository with all manifests and source code by executing the following command:

            ``` {.bash data-prompt="$" }
            $ git clone -b v{{ release }} https://github.com/percona/percona-server-mongodb-operator
            ```

            After editing the needed options, apply your modified `deploy/cr.yaml` file as follows:

            ``` {.bash data-prompt="$" }
            $ kubectl apply -f deploy/cr.yaml
            ```

    === "For ARM64 architecture"
    
        Edit the `deploy/cr.yaml` file: set the following [affinity rules](constraints.md#affinity-and-anti-affinity) in **all `affinity` subsections**:

        ```yaml hl_lines="2-11"
        ....
        affinity:
          advanced:
            nodeAffinity:
              requiredDuringSchedulingIgnoredDuringExecution:
                nodeSelectorTerms:
                - matchExpressions:
                  - key: kubernetes.io/arch
                    operator: In
                    values:
                    - arm64
        ```

        After editing, apply your modified `deploy/cr.yaml` file as follows:

        ``` {.bash data-prompt="$" }
        $ kubectl apply -f deploy/cr.yaml
        ```

        ??? example "Expected output"

            ``` {.text .no-copy}
            perconaservermongodb.psmdb.percona.com/my-cluster-name created
            ```

    The creation process may take some time. When the process is over your
    cluster will obtain the `ready` status. You can check it with the following
    command:

    ``` {.bash data-prompt="$" }
    $ kubectl get psmdb
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        NAME              ENDPOINT                                           STATUS   AGE
        my-cluster-name   my-cluster-name-mongos.default.svc.cluster.local   ready    5m26s
        ```

## Verifying the cluster operation

It may take ten minutes to get the cluster started. When `kubectl get psmdb`
command finally shows you the cluster status as `ready`, you can try to connect
to the cluster.

{% include 'assets/fragments/connectivity.txt' %}

## Troubleshooting

If `kubectl get psmdb` command doesn't show `ready` status too long, you can 
check the creation process with the `kubectl get pods` command:

``` {.bash data-prompt="$" }
$ kubectl get pods
```

??? example "Expected output"

    --8<-- "cli/kubectl-get-pods-response.md"

If the command output had shown some errors, you can examine the problematic
Pod with the `kubectl describe <pod name>` command as follows:

``` {.bash data-prompt="$" }
$ kubectl describe pod my-cluster-name-rs0-2
```

Review the detailed information for `Warning` statements and then correct the
configuration. An example of a warning is as follows:

`Warning  FailedScheduling  68s (x4 over 2m22s)  default-scheduler  0/1 nodes are available: 1 node(s) didn’t match pod affinity/anti-affinity, 1 node(s) didn’t satisfy existing pods anti-affinity rules.`

## Removing the AKS cluster

To delete your cluster, you will need the following data:

* name of your AKS cluster,
* AWS region in which you have deployed your cluster.

You can clean up the cluster with the `az aks delete` command as follows (with
real names instead of `<resource group>` and `<cluster name>` placeholders):

``` {.bash data-prompt="$" }
$ az aks delete --name <cluster name> --resource-group <resource group> --yes --no-wait
```

It may take ten minutes to get the cluster actually deleted after executing this command.

!!! warning

    After deleting the cluster, all data stored in it will be lost!

