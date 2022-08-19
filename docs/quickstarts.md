# Install Percona Server for MongoDB on Google Kubernetes Engine (GKE)

This quickstart shows you how to configure a Percona Operator for MongoDB with
the following platforms:

* Google Kubernetes Engine (GKE),
* Amazon Elastic Kubernetes Service (EKS).

 The document assumes some experience with the platform of your choice. For more
 information on the GKE, see the [Kubernetes Engine Quickstart](https://cloud.google.com/kubernetes-engine/docs/quickstart).
 For more information on the EKS, see the [Amazon EKS official documentation](https://aws.amazon.com/eks/).

## Prerequisites

=== "Google Kubernetes Engine (GKE)"
    All commands from this quickstart can be run either in the
    **Google Cloud shell** or in **your local shell**.

    To use *Google Cloud shell*, you need nothing but a modern web browser.

    If you would like to use *your local shell*, install the following:

    1. [gcloud](https://cloud.google.com/sdk/docs/quickstarts). This tool is
        part of the Google Cloud SDK. To install it, select your operating
        system on the [official Google Cloud SDK documentation page](https://cloud.google.com/sdk/docs)
        and then follow the instructions.

    2. [kubectl](https://cloud.google.com/kubernetes-engine/docs/quickstart#choosing_a_shell).
        It is the Kubernetes command-line tool you will use to manage and deploy
        applications. To install the tool, run the following command:

        ```bash
        $ gcloud auth login
        $ gcloud components install kubectl
        ```

=== "Amazon Elastic Kubernetes Service (EKS)"
    The following tools are used in this guide and therefore should be preinstalled:

    1. **AWS Command Line Interface (AWS CLI)** for interacting with the different
        parts of AWS. You can install it following the
        [official installation instructions for your system](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html).

    2. **eksctl** to simplify cluster creation on EKS. It can be installed
        along its [installation notes on GitHub](https://github.com/weaveworks/eksctl#installation).

    3. **kubectl**  to manage and deploy applications on Kubernetes. Install
        it [following the official installation instructions](https://kubernetes.io/docs/tasks/tools/install-kubectl/).

    Also, you need to configure AWS CLI with your credentials according to the
    [official guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html).

## Create the cluster within the the cloud of your choice

=== "Google Kubernetes Engine (GKE)"
    You can configure the settings using the `gcloud` tool. You can run it
    either in the [Cloud Shell](https://cloud.google.com/shell/docs/quickstart)
    or in your local shell (if you have installed Google Cloud SDK locally on the previous step). The following command will create a cluster named `my-cluster-name`:

    ```bash
    $ gcloud container clusters create my-cluster-name --project <project name> --zone us-central1-a --cluster-version {{ gkerecommended }} --machine-type n1-standard-4 --num-nodes=3
    ```

    !!! note

        You must edit the following command and other command-line statements to
        replace the `<project name>` placeholder with your project name. You may
        also be required to edit the *zone location*, which is set to
        `us-central1` in the above example. Other parameters specify that we are
        creating a cluster with 3 nodes and with machine type of 4 vCPUs and
        45 GB memory.

    You may wait a few minutes for the cluster to be generated, and then you
    will see it listed in the Google Cloud console
    (select *Kubernetes Engine* → *Clusters* in the left menu panel):

    ![image](assets/images/gke-quickstart-cluster-connect.svg)

    Now you should configure the command-line access to your newly created
    cluster to make `kubectl` be able to use it.

    In the Google Cloud Console, select your cluster and then click the
    *Connect* shown on the above image. You will see the connect statement
    configures command-line access. After you have edited the statement, you may
    run the command in your local shell:

    ```bash
    $ gcloud container clusters get-credentials my-cluster-name --zone us-central1-a --project <project name>
    ```

    Finally, use your [Cloud Identity and Access Management (Cloud IAM)](https://cloud.google.com/iam)
    to control access to the cluster. The following command will give you the
    ability to create Roles and RoleBindings:

    ```bash
    $ kubectl create clusterrolebinding cluster-admin-binding --clusterrole cluster-admin --user $(gcloud config get-value core/account)
    ```

    The return statement confirms the creation:

    ```text
    clusterrolebinding.rbac.authorization.k8s.io/cluster-admin-binding created
    ```

=== "Amazon Elastic Kubernetes Service (EKS)"
    To create your cluster, you will need the following data:

    * name of your EKS cluster,
    * AWS region in which you wish to deploy your cluster,
    * the amount of nodes you would like tho have,
    * the desired ratio between [on-demand](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-on-demand-instances.html)
        and [spot](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-spot-instances.html)
        instances in the total number of nodes.

    !!! note

        [spot](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-spot-instances.html)
        instances are not recommended for production environment, but may be
        useful e.g. for testing purposes.

    The most easy and visually clear way is to describe the desired cluster in
    YAML and to pass this configuration to the `eksctl` command.

    The following example configures a EKS cluster with one
    [managed node group](https://docs.aws.amazon.com/eks/latest/userguide/managed-node-groups.html):

    ```yaml
    apiVersion: eksctl.io/v1alpha5
    kind: ClusterConfig

    metadata:
        name: test-cluster
        region: eu-west-2

    nodeGroups:
        - name: ng-1
          minSize: 3
          maxSize: 5
          instancesDistribution:
            maxPrice: 0.15
            instanceTypes: ["m5.xlarge", "m5.2xlarge"] # At least two instance types should be specified
            onDemandBaseCapacity: 0
            onDemandPercentageAboveBaseCapacity: 50
            spotInstancePools: 2
          tags:
            'iit-billing-tag': 'cloud'
          preBootstrapCommands:
              - "echo 'OPTIONS=\"--default-ulimit nofile=1048576:1048576\"' >> /etc/sysconfig/docker"
              - "systemctl restart docker"
    ```

    !!! note

        `preBootstrapCommands` section is used in the
        above example to increase the limits for the amount of opened files:
        this is important and shouldn’t be omitted, taking into account the
        default EKS soft limit of 65536 files.

    When the cluster configuration file is ready, you can actually create your
    cluster by the following command:

    ```bash
    $ eksctl create cluster -f ~/cluster.yaml
    ```

## Installing the Operator

1. Create a namespace and set the context for the namespace. The resource names
    must be unique within the namespace and provide a way to divide cluster
    resources between users spread across multiple projects.

    So, create the namespace and save it in the namespace context for subsequent
    commands as follows (replace the `<namespace name>` placeholder with some
    descriptive name):

    ```bash
    $ kubectl create namespace <namespace name>
    $ kubectl config set-context $(kubectl config current-context) --namespace=<namespace name>
    ```

    At success, you will see the message that *namespace/<namespace name>* was
    created, and the context was modified.

2. Use the following `git clone` command to download the correct branch of the percona-server-mongodb-operator repository:

    ```bash
    $ git clone -b v{{ release }} https://github.com/percona/percona-server-mongodb-operator
    ```

    After the repository is downloaded, change the directory to run the rest of the commands in this document:

    ```bash
    $ cd percona-server-mongodb-operator
    ```

3. Deploy the Operator [using](https://kubernetes.io/docs/reference/using-api/server-side-apply/) the following command:

    ```bash
    $ kubectl apply --server-side -f deploy/bundle.yaml
    ```

    The following confirmation is returned:

    ```text
    customresourcedefinition.apiextensions.k8s.io/perconaservermongodbs.psmdb.percona.com serverside-applied
    customresourcedefinition.apiextensions.k8s.io/perconaservermongodbbackups.psmdb.percona.com serverside-applied
    customresourcedefinition.apiextensions.k8s.io/perconaservermongodbrestores.psmdb.percona.com serverside-applied
    role.rbac.authorization.k8s.io/percona-server-mongodb-operator serverside-applied
    serviceaccount/percona-server-mongodb-operator serverside-applied
    rolebinding.rbac.authorization.k8s.io/service-account-percona-server-mongodb-operator serverside-applied
    deployment.apps/percona-server-mongodb-operator serverside-applied
    ```

4. The Operator has been started, and you can create the Percona Server for MongoDB:

    ```bash
    $ kubectl apply -f deploy/cr.yaml
    ```

    The return statement confirms the creation:

    ```text
    perconaservermongodb.psmdb.percona.com/my-cluster-name created
    ```

    The creation process may take some time. The process is over when all Pods
    have reached their Running status. You can check it with the following command:

    ```bash
    $ kubectl get pods
    ```

    The result should look as follows:

    --8<-- "./docs/assets/code/kubectl-get-pods-response.txt"

5. During previous steps, the Operator has generated several [secrets](https://kubernetes.io/docs/concepts/configuration/secret/), including the password for the `root` user, which you will need to access the cluster.

    Use `kubectl get secrets` command to see the list of Secrets objects (by
    default Secrets object you are interested in has `my-cluster-secrets` name).
    Then `kubectl get secret my-cluster-secrets -o yaml` will return the YAML
    file with generated secrets, including the `MONGODB_USER_ADMIN` and
    `MONGODB_USER_ADMIN_PASSWORD` strings, which should look as follows:

    ```yaml
    ...
    data:
      ...
      MONGODB_USER_ADMIN_PASSWORD: aDAzQ0pCY3NSWEZ2ZUIzS1I=
      MONGODB_USER_ADMIN_USER: dXNlckFkbWlu
    ```

    Here the actual password is base64-encoded, and
    `echo 'aDAzQ0pCY3NSWEZ2ZUIzS1I=' | base64 --decode` will bring it back to a
    human-readable form.

6. Check connectivity to a newly created cluster.

    First of all, run a container with a MongoDB client and connect its console
    output to your terminal. The following command will do this, naming the new
    Pod `percona-client`:

    ```bash
    $ kubectl run -i --rm --tty percona-client --image=percona/percona-server-mongodb:{{ mongodb44recommended }} --restart=Never -- bash -il
    ```

    Executing it may require some time to deploy the correspondent Pod. Now run
    `mongo` tool in the percona-client command shell using the login (which is
    `userAdmin`) with a proper password obtained from the Secret, and a proper
    namespace name instead of the `<namespace name>` placeholder:

    ```bash
    $ mongo "mongodb://userAdmin:userAdminPassword@my-cluster-name-mongos.<namespace name>.svc.cluster.local/admin?ssl=false"
    ```

## Verifying the cluster operation

It may take ten minutes to get the cluster started. You  can verify its creation with the `kubectl get pods` command:

```bash
$ kubectl get pods
```

The result should look as follows:

--8<-- "./docs/assets/code/kubectl-get-pods-response.txt"

Also, you can see the same information when browsing Pods of your cluster in Google Cloud console via the *Object Browser*:

![image](assets/images/gke-quickstart-object-browser.png)

If all nodes are up and running, you can try to connect to the cluster.

First of all, run a container with a MongoDB client and connect its console
output to your terminal. The following command will do this, naming the new Pod
`percona-client`:

```bash
$ kubectl run -i --rm --tty percona-client --image=percona/percona-server-mongodb:{{ mongodb44recommended }} --restart=Never -- bash -il
```

Executing it may require some time to deploy the correspondent Pod. Now run
`mongo` tool in the percona-client command shell using the login (which is
`userAdmin`) with a proper password obtained from the Secret, and a proper
namespace name instead of the `<namespace name>` placeholder:

```bash
$ mongo "mongodb://userAdmin:userAdminPassword@my-cluster-name-mongos.<namespace name>.svc.cluster.local/admin?ssl=false"
```

## Troubleshooting

If `kubectl get pods` command had shown some errors, you can examine the problematic Pod with the `kubectl describe <pod name>` command.  For example, this command returns information for the selected Pod:

```bash
$ kubectl describe pod my-cluster-name-rs0-2
```

Review the detailed information for `Warning` statements and then correct the
configuration. An example of a warning is as follows:

`Warning  FailedScheduling  68s (x4 over 2m22s)  default-scheduler  0/1 nodes are available: 1 node(s) didn’t match pod affinity/anti-affinity, 1 node(s) didn’t satisfy existing pods anti-affinity rules.`

Alternatively, you can examine your Pods via the *object browser*. Errors will
look as follows:

![image](assets/images/gke-quickstart-object-browser-error.png)

Clicking the problematic Pod will bring you to the details page with the same
warning:

![image](assets/images/gke-quickstart-object-browser-details.png)

## Removing the cluster

=== "Google Kubernetes Engine (GKE)"
    There are several ways that you can delete the cluster.

    You can clean up the cluster with the `gcloud` command as follows:

    ```bash
    $ gcloud container clusters delete <cluster name>
    ```

    The return statement requests your confirmation of the deletion. Type `y` to confirm.

    Also, you can delete your cluster via the GKE console. Just click the `Delete` popup menu item in the clusters list:

    ![image](assets/images/gke-quickstart-cluster-connect.svg)

    The cluster deletion may take time.

=== "Amazon Elastic Kubernetes Service (EKS)"
    To delete your cluster, you will need the following data:

    * name of your EKS cluster,
    * AWS region in which you have deployed your cluster.
    
    You can clean up the cluster with the `eksctl` command as follows (with
    real names instead of `<region>` and `<cluster name>` placeholders):

    ```bash
    $ delete cluster --region=<region> --name="<cluster name>"
    ```

    The cluster deletion may take time.
