> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Create a Microsoft Azure Kubernetes Service (AKS) cluster

This guide walks you through creating a Kubernetes cluster on Microsoft Azure Kubernetes Service (AKS). The document assumes some experience with the platform.

For more information on AKS, see the [Microsoft AKS documentation](https://azure.microsoft.com/en-us/services/kubernetes-service/) .

## Prerequisites

Install and configure the following:

1. **Azure CLI** for interacting with Azure. See the [installation guide](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) for your system.
1. **kubectl** to manage Kubernetes. See the [official kubectl installation](https://kubernetes.io/docs/tasks/tools/install-kubectl/) .

Sign in with the Azure CLI using the [official authentication guide](https://docs.microsoft.com/en-us/cli/azure/authenticate-azure-cli) .

## Create the AKS cluster

1. Have the following ready:

   - AKS cluster name
   - An [Azure resource group](https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/overview) (create one if needed)
   - Number of nodes

1. Create the cluster. The following creates a 3-node cluster named `my-cluster-name` in resource group `my-resource-group` (create the resource group first if it does not exist):

   ```
   az aks create --resource-group my-resource-group --name my-cluster-name \
     --enable-managed-identity --node-count 3 --node-vm-size Standard_B4ms \
     --node-osdisk-size 30 --network-plugin kubenet --generate-ssh-keys --outbound-type loadbalancer
   ```

   For ARM64, use a different node size, for example [Standard_D4ps_v5](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/general-purpose/dpsv5-series) . See [AKS creation options](https://docs.microsoft.com/en-us/cli/azure/aks?view=azure-cli-latest) for more parameters. Wait a few minutes for the cluster to be created.

1. Configure `kubectl` to use the new cluster:

   ```
   az aks get-credentials --resource-group my-resource-group --name my-cluster-name
   ```

## Delete the AKS cluster

To remove the Kubernetes cluster and all resources, see [Delete the Operator and database](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/delete.html#delete-the-kubernetes-cluster-platform-specific).

## Next steps

Deploy the Operator and Percona Server for MongoDB in [single-namespace mode](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/kubectl.html) or [cluster-wide mode](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/cluster-wide.html).

[Single-namespace deployment](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/kubectl.html) [Multi-namespace deployment](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/cluster-wide.html)
