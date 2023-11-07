# Install Percona Server for MongoDB using kubectl

The [kubectl](https://kubernetes.io/docs/tasks/tools/) command line utility is a tool used before anything else to interact with Kubernetes and containerized applications running on it. Users can run kubectl to deploy applications, manage cluster resources, check logs, etc.

## Pre-requisites

The following tools are used in this guide and therefore should be preinstalled:

1. The **Git** distributed version control system. You can install it following the [official installation instructions](https://github.com/git-guides/install-git).

2. The **kubectl** tool to manage and deploy applications on Kubernetes, included in most Kubernetes distributions. Install it, if not present, [following the official installation instructions](https://kubernetes.io/docs/tasks/tools/install-kubectl/).

## Install the Operator and Percona Server for MongoDB

The following steps are needed to deploy the Operator and Percona Server for MongoDB in
your Kubernetes environment:

1. Deploy the Operator [using](https://kubernetes.io/docs/reference/using-api/server-side-apply/) the following command:

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

    As the result you will have the Operator Pod up and running. 

2. Deploy Percona Server for MongoDB:

    ```{.bash data-prompt="$" }
    $ kubectl apply -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v{{ release }}/deploy/cr.yaml
    ```

    ??? example "Expected output"

        ```{.text .no-copy}
        perconaservermongodb.psmdb.percona.com/my-cluster-name created
        ```

    !!! note

        This deploys default MongoDB cluster configuration, three mongod, three mongos, and
        three config server instances. Please see [deploy/cr.yaml](https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v{{ release }}/deploy/cr.yaml)
        and [Custom Resource Options](operator.md#operator-custom-resource-options)
        for the configuration options. You can clone the repository with all
        manifests and source code by executing the following command:

        ```bash
        $ git clone -b v{{ release }} https://github.com/percona/percona-server-mongodb-operator
        ```

        After editing the needed options, apply your modified `deploy/cr.yaml` file as follows:

        ```bash
        $ kubectl apply -f deploy/cr.yaml
        ```

    The creation process may take some time. When the process is over your
    cluster will obtain the `ready` status. You can check it with the following
    command:

    ```{.bash data-prompt="$" }
    $ kubectl get psmdb
    ```

    ??? example "Expected output"

        ```{.text .no-copy}
        NAME              ENDPOINT                                           STATUS   AGE
        my-cluster-name   my-cluster-name-mongos.default.svc.cluster.local   ready    5m26s
        ```

## Verifying the cluster operation

It may take ten minutes to get the cluster started. When `kubectl get psmdb`
command finally shows you the cluster status as `ready`, you can try to connect
to the cluster.

{% include 'assets/fragments/connectivity.txt' %}
