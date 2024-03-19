# Install Percona Server for MongoDB on OpenShift

{%set commandName = 'oc' %}

Percona Operator for Percona Server for MongoDB is a [Red Hat Certified Operator](https://connect.redhat.com/en/partner-with-us/red-hat-openshift-certification). This means that Percona Operator is portable across hybrid clouds and fully supports the Red Hat OpenShift lifecycle.

Installing Percona Server for MongoDB on OpenShift includes two steps:

* Installing the Percona Operator for MongoDB,
* Install Percona Server for MongoDB using the Operator.

## Install the Operator

You can install Percona Operator for MongoDB on OpenShift using the [Red Hat Marketplace](https://marketplace.redhat.com) web interface or using the command line interface.

### Install the Operator via the Red Hat Marketplace

1. login to the Red Hat Marketplace and register your cluster [following the official instructions](https://marketplace.redhat.com/en-us/workspace/clusters/add/register).
2. Go to the Percona Operator for MongoDB [page](https://marketplace.redhat.com/en-us/products/percona-server-for-mongodb) and click the Free trial button:

    ![image](assets/images/marketplace-operator-page.png)

    Here you can “purchase” the Operator for 0.0 USD.

3. When finished, chose `Workspace->Software` in the system menu on the top and choose the Operator:

    ![image](assets/images/marketplace-operator-install.png)

    Click the `Install Operator` button.

### Install the Operator via the command-line interface

1. Clone the percona-server-mongodb-operator repository:

    ``` {.bash data-prompt="$" }
    $ git clone -b v{{ release }} https://github.com/percona/percona-server-mongodb-operator
    $ cd percona-server-mongodb-operator
    ```

    !!! note

        It is crucial to specify the right branch with `-b`
        option while cloning the code on this step. Please be careful.

2. The Custom Resource Definition for Percona Server for MongoDB should be
    created from the `deploy/crd.yaml` file. The Custom Resource Definition
    extends the standard set of resources which Kubernetes “knows” about with the
    new items, in our case these items are the core of the operator.

    This step should be done only once; it does not need to be repeated with other deployments.

    [Apply it](https://kubernetes.io/docs/reference/using-api/server-side-apply/)
    as follows:

    ``` {.bash data-prompt="$" }
    $ oc apply --server-side -f deploy/crd.yaml
    ```

    !!! note

        Setting Custom Resource Definition requires your user to
        have cluster-admin role privileges.

    If you want to manage Percona Server for MongoDB cluster with a
    non-privileged user, the necessary permissions can be granted by applying the
    next clusterrole:

    ``` {.bash data-prompt="$" }
    $ oc create clusterrole psmdb-admin --verb="*" --resource=perconaservermongodbs.psmdb.percona.com,perconaservermongodbs.psmdb.percona.com/status,perconaservermongodbbackups.psmdb.percona.com,perconaservermongodbbackups.psmdb.percona.com/status,perconaservermongodbrestores.psmdb.percona.com,perconaservermongodbrestores.psmdb.percona.com/status
    $ oc adm policy add-cluster-role-to-user psmdb-admin <some-user>
    ```

    If you have a [cert-manager](https://docs.cert-manager.io/en/release-0.8/getting-started/install/openshift.html) installed, then you have to execute two more commands to be able to manage certificates with a non-privileged user:

    ``` {.bash data-prompt="$" }
    $ oc create clusterrole cert-admin --verb="*" --resource=iissuers.certmanager.k8s.io,certificates.certmanager.k8s.io
    $ oc adm policy add-cluster-role-to-user cert-admin <some-user>
    ```

3. Create a new `psmdb` project:

    ``` {.bash data-prompt="$" }
    $ oc new-project psmdb
    ```

4. Add role-based access control (RBAC) for Percona Server for MongoDB is
    configured with the `deploy/rbac.yaml` file. RBAC is
    based on clearly defined roles and corresponding allowed actions. These
    actions are allowed on specific Kubernetes resources. The details about users
    and roles can be found in [OpenShift documentation](https://docs.openshift.com/enterprise/3.0/architecture/additional_concepts/authorization.html).

    ``` {.bash data-prompt="$" }
    $ oc apply -f deploy/rbac.yaml
    ```

5. Start the Operator within OpenShift:

    ``` {.bash data-prompt="$" }
    $ oc apply -f deploy/operator.yaml
    ```

## Install Percona Server for MongoDB

1. Add the MongoDB Users secrets to OpenShift. These secrets
    should be placed as plain text in the stringData section of the
    `deploy/secrets.yaml` file as login name and
    passwords for the user accounts (see [Kubernetes
    documentation](https://kubernetes.io/docs/concepts/configuration/secret/)
    for details).

    After editing the yaml file, the secrets should be created
    with the following command:

    ``` {.bash data-prompt="$" }
    $ oc create -f deploy/secrets.yaml
    ```

    More details about secrets can be found in [Users](users.md#users).

2. Now certificates should be generated. By default, the Operator generates
    certificates automatically, and no actions are required at this step. Still,
    you can generate and apply your own certificates as secrets according
    to the [TLS instructions](TLS.md#tls).

3. Percona Server for MongoDB cluster can be created at any time with the following steps:

    1. Uncomment the `deploy/cr.yaml` field `#platform:` and edit the field
        to `platform: openshift`. The result should be like this:

        ```yaml
        apiVersion: psmdb.percona.com/v1alpha1
        kind: PerconaServerMongoDB
        metadata:
          name: my-cluster-name
        spec:
          platform: openshift
        ...
        ```

    2. (optional) In you’re using minishift, please adjust antiaffinity policy to `none`

        ```yaml
           affinity:
             antiAffinityTopologyKey: "none"
        ...
        ```

    3. Create/apply the Custom Resource file:

        ``` {.bash data-prompt="$" }
        $ oc apply -f deploy/cr.yaml
        ```

        The creation process will take time. The process is complete when all Pods
        have reached their Running status. You can check it with the following command:

        ``` {.bash data-prompt="$" }
        $ oc get pods
        ```

        The result should look as follows:

        --8<-- "./docs/assets/code/kubectl-get-pods-response.txt"

## Verifying the cluster operation

It may take ten minutes to get the cluster started. When `kubectl get psmdb`
command finally shows you the cluster status as `ready`, you can try to connect
to the cluster.

{% include 'assets/fragments/connectivity.txt' %}
