> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Create a Rancher Kubernetes Engine (RKE2) cluster

This guide walks you through creating a Kubernetes cluster on [Rancher Kubernetes Engine (RKE2)](https://docs.rke2.io/) . RKE2 is a CNCF-certified Kubernetes distribution that you can run standalone or manage with the [Rancher](https://ranchermanager.docs.rancher.com/) Kubernetes management platform.

The document assumes some experience with the platform. For more information, see the [RKE2 official documentation](https://docs.rke2.io/) .

## Prerequisites

The following tools and access are required:

1. **Linux hosts** that meet the [RKE2 requirements](https://docs.rke2.io/install/requirements) . For a production-like setup, use at least 3 nodes so the Operator can schedule a replica set according to the [system requirements](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/System-Requirements.html#resource-limits).
1. **Root or sudo** access on each host to install and start RKE2 services.
1. **kubectl** to manage and deploy applications on Kubernetes. Install it [following the official installation instructions](https://kubernetes.io/docs/tasks/tools/install-kubectl/) . RKE2 also ships a `kubectl` binary under `/var/lib/rancher/rke2/bin/` on server nodes.
1. Optionally, a **Rancher** management server if you prefer to provision and manage the RKE2 cluster from the Rancher UI instead of installing RKE2 manually. See the [Rancher documentation](https://ranchermanager.docs.rancher.com/) .

## Create the RKE2 cluster

You can create the cluster [with the RKE2 installation script](https://docs.rke2.io/install/quickstart) or [provision it through Rancher](https://ranchermanager.docs.rancher.com/how-to-guides/new-user-guides/launch-kubernetes-with-rancher) . Both approaches give you a standard Kubernetes API endpoint that the Operator uses.

## Configure kubectl access

On a server node, RKE2 writes the kubeconfig to `/etc/rancher/rke2/rke2.yaml`. Copy it to your workstation and point `kubectl` at it:

```
mkdir -p ~/.kube
sudo cat /etc/rancher/rke2/rke2.yaml > ~/.kube/rke2.yaml
export KUBECONFIG=~/.kube/rke2.yaml
```

If you connect from a remote machine, replace `127.0.0.1` in the kubeconfig `server:` URL with the reachable address of your RKE2 server node.

Verify that the nodes are ready:

```
kubectl get nodes
```

## Configure storage

Percona Server for MongoDB needs PersistentVolumes for database data. Confirm that your cluster has a default StorageClass (or note the StorageClass name to set in the Custom Resource):

```
kubectl get storageclass
```

RKE2 does not always ship a default StorageClass. For testing, you can install the [Local Path Provisioner](https://github.com/rancher/local-path-provisioner) . For production, use a CSI driver appropriate for your infrastructure, such as [Longhorn](https://longhorn.io/) when you manage the cluster with Rancher.

If Pods later stay in the `Pending` state because volumes cannot be provisioned, confirm that a StorageClass exists and that your Custom Resource references the correct one.

## Delete the RKE2 cluster

To tear down a manually installed RKE2 cluster, run the uninstall script on each node (agent nodes first, then server nodes):

```
/usr/local/bin/rke2-uninstall.sh
```

If you provisioned the cluster with Rancher, delete the cluster from the Rancher UI instead.

Warning

After deleting the cluster, all data stored in it will be lost!

## Next steps

Deploy the Operator and Percona Server for MongoDB.

[Single-namespace deployment](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/kubectl.html) [Multi-namespace deployment](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/cluster-wide.html) [Install with Helm](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/helm.html)
