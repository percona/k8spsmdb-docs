> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Install Percona server for MongoDB on Kubernetes

## Assumptions

This guide walks you through installing Percona Operator for MongoDB in a [single-namespace mode](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/namespace-mode.html#single-namespace-deployment) with default parameters.

For how to install Percona Operator for MongoDB in a multi-namespace mode, see [Install in a multi-namespace mode](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/cluster-wide.html). For how to install Percona Operator for MongoDB with customized parameters, see [Install Percona Operator for MongoDB with customized parameters](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/custom-install.html).

## What you will install

- The Operator - the custom controller that uses the custom resources to install and manage the lifecycle of your database cluster. It consists of the following components:

  - the Operator Deployment - the controller Pod
  - the CustomResourceDefinitions (CRDs) are a way to add new API types (custom resources) to Kubernetes so that it understands and handles them
  - Role-based access control (RBAC) is the system that controls who can perform which actions on which resources, using roles and bindings to enforce safe, predictable access.

- The database cluster - the actual Percona Server for MongoDB cluster that the Operator creates for you when you apply the Custom Resource or install the Helm chart. It includes StatefulSets for mongod/mongos/config servers, Services, Secrets, and optional components like backups and PMM.

The default Percona Server for MongoDB configuration includes three mongod, three mongos, and three config server instances with [enabled sharding](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/sharding.html).

## Installation

1. Clone the percona-server-mongodb-operator repository:

   ```
   git clone -b v1.23.1 https://github.com/percona/percona-server-mongodb-operator
   cd percona-server-mongodb-operator
   ```

   Note

   It is crucial to specify the right branch with `-b` option while cloning the code on this step. Please be careful.

1. The Custom Resource Definition for Percona Server for MongoDB should be created from the `deploy/crd.yaml` file. The Custom Resource Definition extends the standard set of resources which Kubernetes “knows” about with the new items, in our case these items are the core of the operator. [Apply it](https://kubernetes.io/docs/reference/using-api/server-side-apply/) as follows:

   ```
   kubectl apply --server-side -f deploy/crd.yaml
   ```

   This step should be done only once; the step does not need to be repeated with any other Operator deployments.

1. Create a namespace and set the context for the namespace. The resource names must be unique within the namespace and provide a way to divide cluster resources between users spread across multiple projects.

   So, create the namespace and save it in the namespace context for subsequent commands as follows (replace the `<namespace name>` placeholder with some descriptive name):

   ```
   kubectl create namespace <namespace name>
   kubectl config set-context $(kubectl config current-context) --namespace=<namespace name>
   ```

   At success, you will see the message that `namespace/<namespace name>` was created, and the context was modified.

1. The role-based access control (RBAC) for Percona Server for MongoDB is configured with the `deploy/rbac.yaml` file. Role-based access is based on defined roles and the available actions which correspond to each role. The role and actions are defined for Kubernetes resources in the yaml file. Further details about users and roles can be found in [Kubernetes documentation](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#default-roles-and-role-bindings) .

   ```
   kubectl apply -f deploy/rbac.yaml
   ```

   Note

   Setting RBAC requires your user to have cluster-admin role privileges. For example, those using Google Kubernetes Engine can grant user needed privileges with the following command:

   ```
   kubectl create clusterrolebinding cluster-admin-binding --clusterrole=cluster-admin --user=$(gcloud config get-value core/account)
   ```

1. Start the operator within Kubernetes:

   ```
   kubectl apply -f deploy/operator.yaml
   ```

1. Add the MongoDB Users secrets to Kubernetes. These secrets should be placed as plain text in the stringData section of the `deploy/secrets.yaml` file as login name and passwords for the user accounts (see [Kubernetes documentation](https://kubernetes.io/docs/concepts/configuration/secret/) for details).

   After editing the yaml file, MongoDB Users secrets should be created using the following command:

   ```
   kubectl create -f deploy/secrets.yaml
   ```

   More details about secrets can be found in [Users](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/users.html). After the cluster reaches the `ready` status, the Operator also creates [connection secrets](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/connection-secrets.html) with ready-to-use MongoDB URIs.

1. Now certificates should be generated. By default, the Operator generates certificates automatically, and no actions are required at this step. Still, you can generate and apply your own certificates as secrets according to the [TLS instructions](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/TLS.html).

1. After the operator is started, Percona Server for MongoDB cluster can be created with the following command:

   ```
   kubectl apply -f deploy/cr.yaml
   ```

   The creation process may take some time. When the process is over your cluster will obtain the `ready` status. You can check it with the following command:

   ```
   kubectl get psmdb
   ```

   Expected output

   ```
   NAME              ENDPOINT                                           STATUS   AGE
   my-cluster-name   my-cluster-name-mongos.default.svc.cluster.local   ready    5m26s
   ```

## Verifying the cluster operation

It may take ten minutes to get the cluster started. When `kubectl get psmdb` command finally shows you the cluster status as `ready`, you can try to connect to the cluster.

To connect to Percona Server for MongoDB, use the connection string Secret that the Operator creates for the `databaseAdmin` user. This Secret is available starting with Operator version 1.23.0 and newer. For previous versions, refer to the [Connect manually](#connect-manually-alternative) section.

1. List the Secrets objects:

   ```
   kubectl get secrets -n <namespace>
   ```

   The connection string Secret is named `my-cluster-name-databaseadmin-conn-str` by default.

1. Retrieve the connection string

   **Sharding is on**

   ```
   kubectl get secret <clusterName>-databaseadmin-conn-str -n <namespace> \
    -o jsonpath='{.data.databaseAdmin_mongos_connectionString}' | base64 --decode && echo
   ```

   **Sharding is off**

   ```
   kubectl get secret <clusterName>-databaseadmin-conn-str -n <namespace> \
   -o jsonpath='{.data.databaseAdmin_rs0_connectionStringSrv}' | base64 --decode && echo
   ```

   See [Connection secrets](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/connection-secrets.html) for other available keys.

1. Run a container with a MongoDB client and connect its console output to your terminal. The following command does this, naming the new Pod `percona-client`:

   ```
   kubectl run -i --rm --tty percona-client --image=percona/percona-server-mongodb:8.3.13-4 --restart=Never -- bash -il
   ```

   Executing it may require some time to deploy the corresponding Pod.

1. Connect using the connection string from step 2:

   ```
   mongosh "<connection-string>"
   ```

## Connect manually (alternative)

If you need to build a connection URI yourself, retrieve credentials from the user Secret and construct the URI.

1. List the Secrets objects:

   ```
   kubectl get secrets -n <namespace>
   ```

   The Secrets object you are interested in has the `<cluster-name>-secrets` name. (For the cluster `my-cluster-name`, the Secret name is `my-cluster-name-secrets`).

1. Retrieve the admin username and password:

   ```
   kubectl get secret <secret-name> -n <namespace> -o jsonpath='{.data.MONGODB_DATABASE_ADMIN_USER}' | base64 --decode && echo
   kubectl get secret <secret-name> -n <namespace> -o jsonpath='{.data.MONGODB_DATABASE_ADMIN_PASSWORD}' | base64 --decode && echo
   ```

1. Run a container with a MongoDB client and connect its console output to your terminal. The following command does this, naming the new Pod `percona-client`:

   ```
   kubectl -n <namespace> run -i --rm --tty percona-client --image=percona/percona-server-mongodb:8.3.13-4 --restart=Never -- bash -il
   ```

   It may take some time to deploy the corresponding Pod.

1. Now run `mongosh` tool inside the `percona-client` command shell using the admin user credentials you obtained from the Secret, and a proper namespace name instead of the `<namespace name>` placeholder. The command will look different depending on whether sharding is on (the default behavior) or off:

   **sharding is on**

   ```
   mongosh "mongodb://databaseAdmin:databaseAdminPassword@my-cluster-name-mongos.<namespace name>.svc.cluster.local/admin?ssl=false"
   ```

   **sharding is off**

   ```
   mongosh "mongodb+srv://databaseAdmin:databaseAdminPassword@my-cluster-name-rs0.<namespace name>.svc.cluster.local/admin?replicaSet=rs0&ssl=false"
   ```
