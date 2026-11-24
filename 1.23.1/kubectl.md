> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Install Percona Server for MongoDB using kubectl

Percona Operator for MongoDB is a special type of controller introduced to automate deployment and management of Percona Server for MongoDB in Kubernetes. The Operator extends the Kubernetes API with custom resources. Learn more about how the Operator works in [Design and architecture](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture.html).

We recommend installing the Operator with the [kubectl](https://kubernetes.io/docs/tasks/tools/) command line utility. It is the universal way to interact with Kubernetes. Alternatively, you can install it using the [Helm](https://github.com/helm/helm) package manager.

[Install with kubectl](#prerequisites) [Install with Helm](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/helm.html)

## Assumptions

This guide walks you through installing Percona Operator for MongoDB in a [single-namespace mode](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/namespace-mode.html#single-namespace-deployment) with default parameters.

For how to install Percona Operator for MongoDB in a multi-namespace mode, see [Install in a multi-namespace mode](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/cluster-wide.html). For how ton install Percona Operator for MongoDB with customized parameters, see [Install Percona Operator for MongoDB with customized parameters](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/custom-install.html).

## What you will install

- The Operator - the custom controller that uses the custom resources to install and manage the lifecycle of your database cluster. It consists of the following components:

  - the Operator Deployment - the controller Pod
  - the CustomResourceDefinitions (CRDs) are a way to add new API types (custom resources) to Kubernetes so that it understands and handles them
  - Role-based access control (RBAC) is the system that controls who can perform which actions on which resources, using roles and bindings to enforce safe, predictable access.

- The database cluster - the actual Percona Server for MongoDB cluster that the Operator creates for you when you apply the Custom Resource or install the Helm chart. It includes StatefulSets for mongod/mongos/config servers, Services, Secrets, and optional components like backups and PMM.

The default Percona Server for MongoDB configuration includes three mongod, three mongos, and three config server instances with [enabled sharding](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/sharding.html).

## Prerequisites

To install Percona Distribution for MongoDB, you need the following:

1. The **kubectl** tool to manage and deploy applications on Kubernetes. Install it by following the [official installation instructions](https://kubernetes.io/docs/tasks/tools/install-kubectl/) , if you haven’t done it before.

1. A Kubernetes environment. You can deploy it on [Minikube](https://github.com/kubernetes/minikube) for testing purposes or using any cloud provider of your choice. Check the list of our [officially supported platforms](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/System-Requirements.html#officially-supported-platforms).

   See also

   - [Set up Minikube](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/minikube.html)
   - [Create a GKE cluster](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/gke.html#create-the-gke-cluster)
   - [Create an EKS cluster](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/eks.html#create-the-eks-cluster)
   - [Create an AKS cluster](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/aks.html#create-the-aks-cluster)
   - [Create an RKE cluster](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/rke2.html)

   For installing on OpenShift, see [Install Percona Operator for MongoDB on OpenShift via OLM](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/openshift.html#install-the-operator-via-the-operator-lifecycle-manager-olm)

## Procedure

Here’s a sequence of steps to follow:

1. Create the Kubernetes namespace for your cluster. It is a good practice to isolate workloads in Kubernetes by installing the Operator in a custom namespace. Replace the `<namespace>` placeholder with your value.

   ```
   kubectl create namespace <namespace>
   ```

   Expected output

   ```
   namespace/<namespace> was created
   ```

1. Deploy the Operator [using](https://kubernetes.io/docs/reference/using-api/server-side-apply/) the following command:

   ```
   kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v1.23.1/deploy/bundle.yaml -n <namespace>
   ```

   Expected output

   ```
   customresourcedefinition.apiextensions.k8s.io/perconaservermongodbs.psmdb.percona.com serverside-applied
   customresourcedefinition.apiextensions.k8s.io/perconaservermongodbbackups.psmdb.percona.com serverside-applied
   customresourcedefinition.apiextensions.k8s.io/perconaservermongodbrestores.psmdb.percona.com serverside-applied
   role.rbac.authorization.k8s.io/percona-server-mongodb-operator serverside-applied
   serviceaccount/percona-server-mongodb-operator serverside-applied
   rolebinding.rbac.authorization.k8s.io/service-account-percona-server-mongodb-operator serverside-applied
   deployment.apps/percona-server-mongodb-operator serverside-applied
   ```

   As the result you will have the Operator Pod up and running.

1. Deploy Percona Server for MongoDB:

   ```
   kubectl apply -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v1.23.1/deploy/cr.yaml -n <namespace>
   ```

   Expected output

   ```
   perconaservermongodb.psmdb.percona.com/my-cluster-name created
   ```

1. Check the Operator and the Percona Server for MongoDB Pods status.

   ```
   kubectl get psmdb -n <namespace>
   ```

   The creation process may take some time. When the process is over your cluster obtains the `ready` status.

   Expected output

   ```
   NAME              ENDPOINT                                           STATUS   AGE
   my-cluster-name   my-cluster-name-mongos.default.svc.cluster.local   ready    5m26s
   ```

You have successfully installed and deployed the Operator with default parameters.

You can check the rest of the Operator’s parameters in the [Custom Resource options reference](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html).

## Next steps

[Connect and insert sample data](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/connect.html)

## See also

[Install Percona Server for MongoDB with customized parameters](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/custom-install.html)
