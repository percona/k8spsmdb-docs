# Create a Microsoft Azure Kubernetes Service (AKS) cluster

This guide walks you through creating a Kubernetes cluster on Microsoft Azure Kubernetes Service (AKS). The document assumes some experience with the
platform. 

For more information on AKS, see the [Microsoft AKS documentation  :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/).

## Prerequisites

Install and configure the following:

1. **Azure CLI** for interacting with Azure. See the [installation guide  :octicons-link-external-16:](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) for your system.
2. **kubectl** to manage Kubernetes. See the [official kubectl installation  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/tools/install-kubectl/).

Sign in with the Azure CLI using the [official authentication guide  :octicons-link-external-16:](https://docs.microsoft.com/en-us/cli/azure/authenticate-azure-cli).

## Create the AKS cluster

1. Have the following ready:

   * AKS cluster name
   * An [Azure resource group  :octicons-link-external-16:](https://docs.microsoft.com/en-us/azure/azure-resource-manager/management/overview) (create one if needed)
   * Number of nodes

2. Create the cluster. The following creates a 3-node cluster named `my-cluster-name` in resource group `my-resource-group` (create the resource group first if it does not exist):

   ```bash
   az aks create --resource-group my-resource-group --name my-cluster-name \
     --enable-managed-identity --node-count 3 --node-vm-size Standard_B4ms \
     --node-osdisk-size 30 --network-plugin kubenet --generate-ssh-keys --outbound-type loadbalancer
   ```

   For ARM64, use a different node size, for example [Standard_D4ps_v5  :octicons-link-external-16:](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/general-purpose/dpsv5-series). See [AKS creation options  :octicons-link-external-16:](https://docs.microsoft.com/en-us/cli/azure/aks?view=azure-cli-latest) for more parameters. Wait a few minutes for the cluster to be created.

3. Configure `kubectl` to use the new cluster:

   ```bash
   az aks get-credentials --resource-group my-resource-group --name my-cluster-name
   ```

## Next steps

* Deploy the Operator and Percona Server for MongoDB in [single-namespace mode](kubectl.md) or [cluster-wide mode](cluster-wide.md).
* [Verify the cluster operation](verify-cluster.md).
* If the cluster does not become ready, see [Initial troubleshooting](debug.md).
* To remove the Kubernetes cluster and all resources, see [Delete the Operator and database](delete.md#delete-the-kubernetes-cluster-platform-specific).
