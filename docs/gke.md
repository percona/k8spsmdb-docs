## Prerequisites to install Percona Server for MongoDB on Google Kubernetes Engine (GKE)

All commands from this quickstart can be run either in the **Google Cloud shell** or in **your local shell**.

To use *Google Cloud shell*, you need nothing but a modern web browser.

If you would like to use *your local shell*, install the following:

1. [gcloud](https://cloud.google.com/sdk/docs/quickstarts). This tool is part of the Google Cloud SDK. To install it, select your operating system on the [official Google Cloud SDK documentation page](https://cloud.google.com/sdk/docs)
    and then follow the instructions.

2. [kubectl](https://cloud.google.com/kubernetes-engine/docs/quickstart#choosing_a_shell). It is the Kubernetes command-line tool you will use to manage and deploy applications. To install the tool, run the following command:

    ```bash
    $ gcloud auth login
    $ gcloud components install kubectl
    ```

## Configuring default settings for the cluster

You can configure the settings using the `gcloud` tool. You can run it either in the [Cloud Shell](https://cloud.google.com/shell/docs/quickstart) or in your local shell (if you have installed Google Cloud SDK locally on the previous step). The following command will create a cluster named `my-cluster-name`:

```bash
$ gcloud container clusters create my-cluster-name --project <project name> --zone us-central1-a --cluster-version {{ gkerecommended }} --machine-type n1-standard-4 --num-nodes=3
```

!!! note

    You must edit the following command and other command-line statements to replace the `<project name>` placeholder with your project name. You may also be required to edit the *zone location*, which is set to `us-central1` in the above example. Other parameters specify that we are creating a cluster with 3 nodes and with machine type of 4 vCPUs and 45 GB memory.

    You may wait a few minutes for the cluster to be generated, and then you will see it listed in the Google Cloud console (select *Kubernetes Engine* → *Clusters* in the left menu panel):

    ![image](assets/images/gke-quickstart-cluster-connect.svg)

    Now you should configure the command-line access to your newly created cluster to make `kubectl` be able to use it.

    In the Google Cloud Console, select your cluster and then click the *Connect* shown on the above image. You will see the connect statement configures command-line access. After you have edited the statement, you may run the command in your local shell:

    ```bash
    $ gcloud container clusters get-credentials my-cluster-name --zone us-central1-a --project <project name>
    ```

## Installing the Operator

1. First of all, use your [Cloud Identity and Access Management (Cloud IAM)](https://cloud.google.com/iam) to control access to the cluster. The following command will give you the ability to create Roles and RoleBindings:

    ```bash
    $ kubectl create clusterrolebinding cluster-admin-binding --clusterrole cluster-admin --user $(gcloud config get-value core/account)
    ```

    The return statement confirms the creation:

    ```text
    clusterrolebinding.rbac.authorization.k8s.io/cluster-admin-binding created
    ```

2. Deploy the Operator [using](https://kubernetes.io/docs/reference/using-api/server-side-apply/) the following command:

    ```bash
    $ kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v{{ release }}/deploy/bundle.yaml
    ```

    The following confirmation is returned:

    ```text
    customresourcedefinition.apiextensions.k8s.io/perconaservermongodbs.psmdb.percona.com created
    customresourcedefinition.apiextensions.k8s.io/perconaservermongodbbackups.psmdb.percona.com created
    customresourcedefinition.apiextensions.k8s.io/perconaservermongodbrestores.psmdb.percona.com created
    role.rbac.authorization.k8s.io/percona-server-mongodb-operator created
    serviceaccount/percona-server-mongodb-operator created
    rolebinding.rbac.authorization.k8s.io/service-account-percona-server-mongodb-operator created
    deployment.apps/percona-server-mongodb-operator created
    ```

    !!! note

        This deploys the Operator in `default` namespace. Alternatively, you can create a new namespace and/or set the context for the namespace as follows (replace the `<namespace name>` placeholder with some descriptive name):

        ```bash
        $ kubectl create namespace <namespace name>
        $ kubectl config set-context $(kubectl config current-context) --namespace=<namespace name>
        ```

        At success, you will see the message that *namespace/<namespace name>* was created, and the context (*gke_<project name>_<zone location>_<cluster name>*) was modified.

3. The operator has been started, and you can deploy MongoDB cluster:

    ```bash
    $ kubectl apply -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v{{ release }}/deploy/cr.yaml
    ```

    The process could take some time.
    The return statement confirms the creation:

    ```text
    perconaservermongodb.psmdb.percona.com/my-cluster-name created
    ```

    !!! note

        This deploys default MongoDB cluster configuration,
        one mongos node and one config server node. Please see [deploy/cr.yaml](https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v{{ release }}/deploy/cr.yaml)
        and [Custom Resource Options](operator.md#operator-custom-resource-options) for the configuration options. You can clone the repository with all manifests and source code by executing the following command:

        ```bash
        $ git clone -b v{{ release }} https://github.com/percona/percona-server-mongodb-operator
        ```
        
        After editing the needed options, apply your modified `deploy/cr.yaml` file as follows:

        ```bash
        $ kubectl apply -f deploy/cr.yaml
        ```

    The creation process may take some time. When the process is over your cluster
    will obtain the `ready` status. You can check it with the following command:

    ```bash
    $ kubectl get psmdb
    ```

    The result should look as follows:

    ```text
    NAME              ENDPOINT                                           STATUS   AGE
    my-cluster-name   my-cluster-name-mongos.default.svc.cluster.local   ready    5m26s
    ```
4. During previous steps, the Operator has generated several [secrets](https://kubernetes.io/docs/concepts/configuration/secret/), including the password for the `root` user, which you will need to access the cluster.

    Use `kubectl get secrets` command to see the list of Secrets objects (by default Secrets object you are interested in has `my-cluster-secrets` name). Then `kubectl get secret my-cluster-secrets -o yaml` will return the YAML file with generated secrets, including the `MONGODB_USER_ADMIN` and `MONGODB_USER_ADMIN_PASSWORD` strings, which should look as follows:

    ```yaml
    ...
    data:
      ...
      MONGODB_USER_ADMIN_PASSWORD: aDAzQ0pCY3NSWEZ2ZUIzS1I=
      MONGODB_USER_ADMIN_USER: dXNlckFkbWlu
    ```

    Here the actual password is base64-encoded, and `echo 'aDAzQ0pCY3NSWEZ2ZUIzS1I=' | base64 --decode` will bring it back to a human-readable form.

## Verifying the cluster operation

It may take ten minutes to get the cluster started. Beside checking the cluster status with `kubectl get psmdb`, you can also track the creation process with the `kubectl get pods` command:

```bash
$ kubectl get pods
```

The result should look as follows:

--8<-- "./docs/assets/code/kubectl-get-pods-response.txt"

Also, you can see the same information when browsing Pods of your cluster in Google Cloud console via the *Object Browser*:

![image](assets/images/gke-quickstart-object-browser.svg)

If all nodes are up and running, you can try to connect to the cluster.

First of all, run a container with a MongoDB client and connect its console output to your terminal. The following command will do this, naming the new Pod `percona-client`:

```bash
$ kubectl run -i --rm --tty percona-client --image=percona/percona-server-mongodb:{{ mongodb44recommended }} --restart=Never -- bash -il
```

Executing it may require some time to deploy the correspondent Pod. Now run `mongo` tool in the percona-client command shell using the login (which is `userAdmin`) with a proper password obtained from the Secret, and a proper namespace name (just `default`, or some other namespace you have used) instead of the `<namespace name>` placeholder:

```bash
$ mongo "mongodb://userAdmin:userAdminPassword@my-cluster-name-mongos.<namespace name>.svc.cluster.local/admin?ssl=false"
```

## Troubleshooting

If `kubectl get pods` command had shown some errors, you can examine the problematic Pod with the `kubectl describe <pod name>` command.  For example, this command returns information for the selected Pod:

```bash
$ kubectl describe pod my-cluster-name-rs0-2
```

Review the detailed information for `Warning` statements and then correct the configuration. An example of a warning is as follows:

`Warning  FailedScheduling  68s (x4 over 2m22s)  default-scheduler  0/1 nodes are available: 1 node(s) didn’t match pod affinity/anti-affinity, 1 node(s) didn’t satisfy existing pods anti-affinity rules.`

Alternatively, you can examine your Pods via the *object browser*. Errors will look as follows:

![image](assets/images/gke-quickstart-object-browser-error.svg)

Clicking the problematic Pod will bring you to the details page with the same warning:

![image](assets/images/gke-quickstart-object-browser-details.svg)

## Removing the GKE cluster

There are several ways that you can delete the cluster.

You can clean up the cluster with the `gcloud` command as follows:

```bash
$ gcloud container clusters delete <cluster name>
```

The return statement requests your confirmation of the deletion. Type `y` to confirm.

Also, you can delete your cluster via the GKE console. Just click the `Delete` popup menu item in the clusters list:

![image](assets/images/gke-quickstart-cluster-connect.svg)

The cluster deletion may take time.
