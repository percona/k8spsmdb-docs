# Set up Minikube

This guide walks you through creating a local Kubernetes cluster with [Minikube  :octicons-link-external-16:](https://github.com/kubernetes/minikube). Minikube runs Kubernetes on Linux, Windows, or macOS using a hypervisor (VirtualBox, KVM/QEMU, VMware Fusion, Hyper-V). It is a common way to try the Percona Operator for MongoDB locally before deploying to a cloud provider.

## Prerequisites

Install Minikube using the [official install guide  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/tools/install-minikube/) for your system. That includes:

* **kubectl**
* A **hypervisor** (if not already installed)
* The **minikube** binary

## Create the Minikube cluster

1. Start Minikube with enough resources for the Operator and MongoDB (adjust memory, CPUs, and disk as needed):

   ```bash
   minikube start --memory=5120 --cpus=4 --disk-size=30g
   ```

   This downloads images, initializes the cluster, and starts it. Optionally run `minikube dashboard` to open the Kubernetes dashboard in your browser.

2. Verify the cluster is up:

   ```bash
   kubectl get nodes
   ```

## Next steps

* Deploy the Operator and Percona Server for MongoDB in [single-namespace mode](kubectl.md) or [cluster-wide mode](cluster-wide.md). For a minimal local deployment, use `deploy/cr-minimal.yaml` from the Operator repository instead of the default `deploy/cr.yaml`.
* [Verify the cluster operation](verify-cluster.md).
* If the cluster does not become ready, see [Initial troubleshooting](debug.md).
* To stop or remove the Minikube cluster, see [Delete the Operator and database](delete.md#delete-the-kubernetes-cluster-platform-specific).
