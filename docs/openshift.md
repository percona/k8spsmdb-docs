# Install Percona Server for MongoDB on OpenShift

{%set commandName = 'oc' %}

Percona Operator for Percona Server for MongoDB is a [Red Hat Certified Operator  :octicons-link-external-16:](https://connect.redhat.com/en/partner-with-us/red-hat-openshift-certification). This means that Percona Operator is portable across hybrid clouds and fully supports the Red Hat OpenShift lifecycle.

To install Percona Server for MongoDB on OpenShift means:

* Install the Percona Operator for MongoDB Deployment,
* Install Percona Server for MongoDB using the Operator.

## Prerequisites

* OpenShift cluster with administrative access
* `oc` command-line tool installed
* Git client installed

## Before you start

Check the [System Requirements](System-Requirements.md) to ensure your environment meets the necessary prerequisites.

You can install Percona Operator for MongoDB on OpenShift using either:

* The [Operator Lifecycle Manager :octicons-link-external-16:](https://docs.redhat.com/en/documentation/openshift_container_platform/4.2/html/operators/understanding-the-operator-lifecycle-manager-olm#olm-overview_olm-understanding-olm) web interface
* The command-line interface

Choose the method that best suits your needs. The web interface is recommended for beginners, while the CLI method offers more control and automation capabilities.

## Install the Operator via the Operator Lifecycle Manager (OLM)

Operator Lifecycle Manager (OLM) is a part of the [Operator Framework :octicons-link-external-16:](https://github.com/operator-framework) that allows you to install, update, and manage the Operators lifecycle on the OpenShift platform.

1. Login to the OpenShift console.
2. Navigate to Ecosystem -> Software Catalog
3. Search for "Percona Distribution for MongoDB Operator" and click the needed Operator on the OperatorHub page. You may need to change the project for your user::

    ![image](assets/images/olm1.svg)

4. Then click "Continue", and "Install".

5. A new page opens where you choose the Operator version and the Namespace / OpenShift project you would like to install the Operator into. You can create a namespace (an OpenShift project) right away by clicking the **Create Project** and filling in project details like name, display name and description.

    ![image](assets/images/olm2.svg)
    
6. Click "Install".

You can track the install process on the Installed Operators page. The Operator should report the `Succeeded` status.

### Deploy Percona Server for MongoDB

Now you can deploy Percona Server for MongoDB.

1. Click the Operator you installed.
2. On the **Details** page, find the `PerconaServerMongoDB` Custom Resource.
     
    ![image](assets/images/olm3.svg)

3. Click “Create instance”
4. Edit the Custom Resource manifest to fine-tune your cluster configuration. Refer to [Custom Resource reference](operator.md) for the description of available options.
    
    ![image](assets/images/olm3-cr.svg)

5. Click "Create"
   
6. Upon successful installation, you should see the “Ready” status for the database cluster.

## Install the Operator via the command-line interface

The following steps install the latest version of the Operator with default parameters. To install a specific version, replace the `v{{ release }}` tag with your value. See the full list of tags [in the Operator repository :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/tags) on GitHub.

To install the Operator with customized parameters, see [Install Percona Server for MongoDB with customized parameters](custom-install.md).

Choose the approach that fits your needs:

* [**Quick install**](#quick-install) — Apply a single bundle file. Use this when you want to get started quickly with default settings.
* [**Step-by-step install**](#step-by-step-installation) — Run each installation step separately. Use this when you want more control over the installation process or you need to customize the installation.

### Quick install

1. Clone the `percona-server-mongodb-operator` repository and change the directory to `percona-server-mongodb-operator`.

    !!! important

        You must specify the correct branch with the `-b` option while cloning the code on this step. Please be careful.

    ```bash
    git clone -b v{{ release }} https://github.com/percona/percona-server-mongodb-operator
    cd percona-server-mongodb-operator
    ```

2. Create the Kubernetes namespace for your cluster. It is a good practice to isolate workloads in Kubernetes by installing the Operator in a custom namespace. Replace the `<namespace>` placeholder with your value.

    ```bash
    oc create namespace <namespace>
    ```

    ??? example "Expected output"

        ```{.text .no-copy}
        namespace/<namespace> was created
        ```

3. A `bundle.yaml` is a Kubernetes manifest that packages Operator metadata and resources. By applying this file, Kubernetes creates the Custom Resource Definition, sets up role-based access control and installs the Operator in one single action. Replace the `<namespace>` placeholder with your value:

    ```bash
    oc apply --server-side -f deploy/bundle.yaml -n <namespace>
    ```

    ??? example "Expected output"

        ```{.text .no-copy}
        customresourcedefinition.apiextensions.k8s.io/perconaservermongodbs.psmdb.percona.com serverside-applied
        customresourcedefinition.apiextensions.k8s.io/perconaservermongodbbackups.psmdb.percona.com serverside-applied
        customresourcedefinition.apiextensions.k8s.io/perconaservermongodbrestores.psmdb.percona.com serverside-applied
        customresourcedefinition.apiextensions.k8s.io/perconaservermongodbclustersyncs.psmdb.percona.com serverside-applied
        role.rbac.authorization.k8s.io/percona-server-mongodb-operator serverside-applied
        serviceaccount/percona-server-mongodb-operator serverside-applied
        rolebinding.rbac.authorization.k8s.io/service-account-percona-server-mongodb-operator serverside-applied
        deployment.apps/percona-server-mongodb-operator serverside-applied
        ```

### Step-by-step installation

This section splits the installation flow into separate steps giving you more control over the process.

#### Step 1: Clone the repository

Use the following commands to clone the `percona-server-mongodb-operator` repository and change the directory to `percona-server-mongodb-operator`.

!!! important

    You must specify the correct branch with the `-b` option while cloning the code on this step. Please be careful.

```bash
git clone -b v{{ release }} https://github.com/percona/percona-server-mongodb-operator
cd percona-server-mongodb-operator
```

#### Step 2: Create the Custom Resource Definition

At this step you must create the Custom Resource Definition for Percona Operator for MongoDB from the `deploy/crd.yaml` file.

The Custom Resource Definition extends the standard set of resources which Kubernetes “knows” about with new items.

You create the Custom Resource Definition only once. It is not bound to a specific namespace and all other deployments will use this Custom Resource Definition.

Use the following command to create the Custom Resource Definition:

```bash
oc apply --server-side -f deploy/crd.yaml
```

!!! warning

    This step requires cluster-admin privileges. If you’re using a non-privileged user, you’ll need to set up additional permissions.

#### Step 3: (optional) Set up user permissions

If you’re using a non-privileged user, grant the required permissions by applying the following clusterrole:

```bash
oc create clusterrole psmdb-admin --verb="*" --resource=perconaservermongodbs.psmdb.percona.com,perconaservermongodbs.psmdb.percona.com/status,perconaservermongodbbackups.psmdb.percona.com,perconaservermongodbbackups.psmdb.percona.com/status,perconaservermongodbrestores.psmdb.percona.com,perconaservermongodbrestores.psmdb.percona.com/status
oc adm policy add-cluster-role-to-user psmdb-admin <some-user>
```

If you have a [cert-manager :octicons-link-external-16:](https://docs.cert-manager.io/en/release-0.8/getting-started/install/openshift.html) installed, add these permissions to manage certificates with a non-privileged user:

```bash
oc create clusterrole cert-admin --verb="*" --resource=issuers.certmanager.k8s.io,certificates.certmanager.k8s.io
oc adm policy add-cluster-role-to-user cert-admin <some-user>
```

#### Step 4: Create a project

A project in OpenShift corresponds to a Kubernetes namespace. When you create a new project, you isolate workloads in it.

```bash
oc new-project psmdb
```

??? example "Sample output"

    Now using project "psmdb" on server "https://api.openshift-4-15-my-cluster.example.com:6443".

The command automatically sets context to this project so that all further resources are created in it.

#### Step 5: Configure RBAC

Role-Based Access Control (RBAC) manages resource access in OpenShift. The Operator needs specific permissions to run Percona Server for MongoDB properly. These permissions are defined within roles.

```bash
oc apply -f deploy/rbac.yaml
```

#### Step 6: Deploy the Operator

Now you can deploy the Operator with the following command:

```bash
oc apply -f deploy/operator.yaml
```

## Install Percona Server for MongoDB

After installing the Operator, you can deploy Percona Server for MongoDB. This section guides you through the process of setting up secrets, certificates, and creating your first cluster.

### Step 1: Configure secrets (optional)

By default, the Operator generates users Secrets automatically, so you don’t have to do anything. Yet if you wish to use your own Secrets, here’s how:

1. Edit the `deploy/secrets.yaml` file to set up your MongoDB users and passwords as plain text in the `stringData` section. See [Users](users.md) and [Kubernetes documentation :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/) for details.

2. Apply the secrets:

    ```bash
    oc create -f deploy/secrets.yaml
    ```

### Step 2: Configure certificates (optional)

The Operator handles certificate generation automatically, so you don’t have to do anything. However, if you need custom certificates:

1. Generate your certificates
2. Create a Secret with your certificates
3. Reference the Secret in your cluster configuration

See [TLS instructions](TLS.md) for detailed guidance.

### Step 3: Deploy the database cluster

1. Uncomment the `deploy/cr.yaml` field `#platform:` and set it to `platform: openshift`. The result should look like this:

    ```yaml
    apiVersion: psmdb.percona.com/v1
    kind: PerconaServerMongoDB
    metadata:
      name: my-cluster-name
    spec:
      platform: openshift
    ...
    ```

2. (optional) If you’re using Minishift, set the anti-affinity policy to `none`:

    ```yaml
    affinity:
      antiAffinityTopologyKey: "none"
    ...
    ```

3. Apply the Custom Resource file:

    ```bash
    oc apply -f deploy/cr.yaml
    ```

    ??? example "Expected output"

        ```{.text .no-copy}
        perconaservermongodb.psmdb.percona.com/my-cluster-name created
        ```

4. It may take up to 10 minutes to complete the cluster deployment. Monitor it with:

    ```bash
    oc get psmdb
    ```

    ??? example "Expected output"

        ```{.text .no-copy}
        NAME              ENDPOINT                                           STATUS   AGE
        my-cluster-name   my-cluster-name-mongos.default.svc.cluster.local   ready    5m26s
        ```

    The `ready` status indicates that your cluster is fully operational.

## Verify the cluster operation

When `oc get psmdb` shows the cluster status as `ready`, you can try to connect to the cluster.

{% include 'assets/fragments/connectivity.txt' %}
