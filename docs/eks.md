# Install Percona Server for MongoDB on Amazon Elastic Kubernetes Service (EKS)

This guide shows you how to deploy Percona Operator for MongoDB on Amazon
Elastic Kubernetes Service (EKS). The document assumes some experience with the
platform. For more information on the EKS, see the [Amazon EKS official documentation](https://aws.amazon.com/eks/).

## Prerequisites

The following tools are used in this guide and therefore should be preinstalled:

1. **AWS Command Line Interface (AWS CLI)** for interacting with the different
    parts of AWS. You can install it following the [official installation instructions for your system](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html).

2. **eksctl** to simplify cluster creation on EKS. It can be installed
    along its [installation notes on GitHub](https://github.com/weaveworks/eksctl#installation).

3. **kubectl**  to manage and deploy applications on Kubernetes. Install
    it [following the official installation instructions](https://kubernetes.io/docs/tasks/tools/install-kubectl/).

Also, you need to configure AWS CLI with your credentials according to the
[official guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html).

## Create the EKS cluster

1. To create your cluster, you will need the following data:

    * name of your EKS cluster,
    * AWS region in which you wish to deploy your cluster,
    * the amount of nodes you would like tho have,
    * the desired ratio between [on-demand](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-on-demand-instances.html)
        and [spot](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-spot-instances.html)
        instances in the total number of nodes.

    !!! note

        [spot](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-spot-instances.html)
        instances are not recommended for production environment, but may be useful
        e.g. for testing purposes.

    After you have settled all the needed details, create your EKS cluster [following the official cluster creation instructions](https://docs.aws.amazon.com/eks/latest/userguide/create-cluster.html).

2. After you have created the EKS cluster, you also need to [install the Amazon EBS CSI driver](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html) on your cluster. See the [official documentation](https://docs.aws.amazon.com/eks/latest/userguide/managing-ebs-csi.html) on adding it as an Amazon EKS add-on.

## Install the Operator and deploy your MongoDB cluster

1. Deploy the Operator. By default deployment will be done in the `default`
    namespace. If that's not the desired one, you can create a new namespace
    and/or set the context for the namespace as follows (replace the `<namespace name>` placeholder with some descriptive name):

    ``` {.bash data-prompt="$" }
    $ kubectl create namespace <namespace name>
    $ kubectl config set-context $(kubectl config current-context) --namespace=<namespace name>
    ```

    At success, you will see the message that `namespace/<namespace name>` was created, and the context was modified.

    Deploy the Operator [using](https://kubernetes.io/docs/reference/using-api/server-side-apply/) the following command:

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

2. The operator has been started, and you can deploy your MongoDB cluster:

    ``` {.bash data-prompt="$" }
    $ kubectl apply -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v{{ release }}/deploy/cr.yaml
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        perconaservermongodb.psmdb.percona.com/my-cluster-name created
        ```

    !!! note

        This deploys default MongoDB cluster configuration, three mongod, three mongos, and
        three config server instances. Please see [deploy/cr.yaml](https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v{{ release }}/deploy/cr.yaml)
        and [Custom Resource Options](operator.md#operator-custom-resource-options)
        for the configuration options. You can clone the repository with all
        manifests and source code by executing the following command:

        ``` {.bash data-prompt="$" }
        $ git clone -b v{{ release }} https://github.com/percona/percona-server-mongodb-operator
        ```

        After editing the needed options, apply your modified `deploy/cr.yaml` file as follows:

        ``` {.bash data-prompt="$" }
        $ kubectl apply -f deploy/cr.yaml
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

    --8<-- "./docs/assets/code/kubectl-get-pods-response.txt"

If the command output had shown some errors, you can examine the problematic
Pod with the `kubectl describe <pod name>` command as follows:

``` {.bash data-prompt="$" }
$ kubectl describe pod my-cluster-name-rs0-2
```

Review the detailed information for `Warning` statements and then correct the
configuration. An example of a warning is as follows:

`Warning  FailedScheduling  68s (x4 over 2m22s)  default-scheduler  0/1 nodes are available: 1 node(s) didn’t match pod affinity/anti-affinity, 1 node(s) didn’t satisfy existing pods anti-affinity rules.`

## Removing the EKS cluster

To delete your cluster, you will need the following data:

* name of your EKS cluster,
* AWS region in which you have deployed your cluster.

You can clean up the cluster with the `eksctl` command as follows (with
real names instead of `<region>` and `<cluster name>` placeholders):

``` {.bash data-prompt="$" }
$ eksctl delete cluster --region=<region> --name="<cluster name>"
```

The cluster deletion may take time.

!!! warning

    After deleting the cluster, all data stored in it will be lost!
