> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Install Percona Server for MongoDB using Helm

[Helm](https://github.com/helm/helm) is the package manager for Kubernetes. A Helm [chart](https://helm.sh/docs/topics/charts/) is a package that contains all the necessary resources to deploy an application to a Kubernetes cluster.

You can find Percona Helm charts in [percona/percona-helm-charts](https://github.com/percona/percona-helm-charts) repository in GitHub.

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

To install and deploy the Operator, you need the following:

1. [Helm v3](https://docs.helm.sh/using_helm/#installing-helm) .

1. [kubectl](https://kubernetes.io/docs/tasks/tools/) command line utility.

1. A Kubernetes environment. You can deploy it locally on [Minikube](https://github.com/kubernetes/minikube) for testing purposes or using any cloud provider of your choice. Check the list of our [officially supported platforms](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/System-Requirements.html#officially-supported-platforms).

   See also

   - [Set up Minikube](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/minikube.html)
   - [Create and configure the GKE cluster](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/gke.html#create-a-google-kubernetes-engine-gke-cluster)
   - [Set up Amazon Elastic Kubernetes Service](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/eks.html#prerequisites)
   - [Create and configure the AKS cluster](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/aks.html#create-the-aks-cluster)

## Installation

Here’s a sequence of steps to follow:

1. Add the Percona’s Helm charts repository and make your Helm client up to date with it:

   ```
   helm repo add percona https://percona.github.io/percona-helm-charts/
   helm repo update
   ```

1. It is a good practice to isolate workloads in Kubernetes via namespaces. Create a namespace:

   ```
   kubectl create namespace <namespace>
   ```

1. Install the Percona Server for MongoDB Operator Custom Resource Definitions (CRDs) first. You can later use this chart to manage and upgrade CRDs independently using Helm or GitOps tools.

   ```
   helm install psmdb-operator-crds percona/psmdb-operator-crds --namespace <namespace>
   ```

   Important

   Although you install the CRD Helm chart (`psmdb-operator-crds`) in a specific namespace, the CRDs themselves are cluster-scoped resources and apply to *all* namespaces in your Kubernetes environment. If you uninstall or delete this CRD chart, it will remove the CRDs from the Kubernetes environment. This will irreversibly delete *all* Percona Server for MongoDB clusters managed by these CRDs across *all* namespaces where you deployed them.

1. Install Percona Operator for MongoDB Deployment. Replace the `namespace` with the name of your namespace:

   ```
   helm install my-op percona/psmdb-operator --namespace <namespace>
   ```

   The `my-op` parameter in the above example is the name of [a new release object](https://helm.sh/docs/intro/using_helm/#three-big-concepts) which is created for the Operator when you install its Helm chart (use any name you like).

   Expected output

   ```
   NAME: my-op
   LAST DEPLOYED: Mon Jan 19 11:45:12 2026
   NAMESPACE: <namespace>
   STATUS: deployed
   REVISION: 1
   TEST SUITE: None
   NOTES:
   .....
   ```

1. Install Percona Server for MongoDB:

   ```
   helm install cluster1 percona/psmdb-db --namespace <namespace>
   ```

   The `cluster1` parameter is the name of [a new release object](https://helm.sh/docs/intro/using_helm/#three-big-concepts) which is created for the Percona Server for MongoDB when you install its Helm chart (use any name you like).

   Expected output

   ```
   NAME: cluster1
   LAST DEPLOYED: Mon Jan 19 12:19:37 2026
   NAMESPACE: <namespace>
   STATUS: deployed
   REVISION: 1
   TEST SUITE: None
   NOTES:
   ....
   ```

1. Check the Operator and the Percona Server for MongoDB Pods status.

   ```
   kubectl get psmdb -n <namespace>
   ```

   The creation process may take some time. When the process is over your cluster obtains the `ready` status.

   Expected output

   ```
   NAME              ENDPOINT                                           STATUS   AGE
   cluster1-psmdb-db   cluster1-psmdb-db-mongos.<namespace>.svc.cluster.local:27017   ready    5m26s
   ```

You have successfully installed and deployed the Operator with default parameters.

You can find in the documentation for the charts which [Operator](https://github.com/percona/percona-helm-charts/tree/main/charts/psmdb-operator#installing-the-chart) and [database](https://github.com/percona/percona-helm-charts/tree/main/charts/psmdb-db#installing-the-chart) parameters can be customized during installation. Also, you can check the rest of the Operator’s parameters in the [Custom Resource options reference](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html).

## Next steps

[Connect and insert sample data](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/connect.html)

## See also

[Install Percona Server for MongoDB with customized parameters](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/custom-install.html)
