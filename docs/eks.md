# Create an Amazon Elastic Kubernetes Service (EKS) cluster

This guide walks you through creating a Kubernetes cluster on Amazon
Elastic Kubernetes Service (EKS). The document assumes some experience with the
platform. For more information on the EKS, see the [Amazon EKS official documentation  :octicons-link-external-16:](https://aws.amazon.com/eks/).

## Prerequisites

Install and configure the following:

1. **AWS Command Line Interface (AWS CLI)** for interacting with AWS. See the [installation guide  :octicons-link-external-16:](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) for your system.
2. **eksctl** to simplify cluster creation. See [eksctl installation  :octicons-link-external-16:](https://github.com/weaveworks/eksctl#installation) on GitHub.
3. **kubectl** — to manage Kubernetes. See the [official kubectl installation  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/tools/install-kubectl/).

Configure the AWS CLI with your credentials using the [official guide  :octicons-link-external-16:](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html).

## Create the EKS cluster

1. Decide the following:

   * EKS cluster name
   * AWS region
   * Number of nodes
   * Mix of [on-demand  :octicons-link-external-16:](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-on-demand-instances.html) and [spot  :octicons-link-external-16:](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-spot-instances.html) instances (if any). Spot instances are not recommended for production but can be useful for testing.

2. Create the cluster by following the [official EKS cluster creation instructions  :octicons-link-external-16:](https://docs.aws.amazon.com/eks/latest/userguide/create-cluster.html).

3. Install the [Amazon EBS CSI driver  :octicons-link-external-16:](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html) on the cluster so you can use EBS volumes for persistent storage. See [Managing the Amazon EBS CSI add-on  :octicons-link-external-16:](https://docs.aws.amazon.com/eks/latest/userguide/managing-ebs-csi.html).

## Next steps

* Deploy the Operator and Percona Server for MongoDB in [single-namespace mode](kubectl.md) (using [kubectl](kubectl.md) or [Helm](helm.md)) or [cluster-wide mode](cluster-wide.md).
* [Verify the cluster operation](verify-cluster.md).
* If the cluster does not become ready, see [Initial troubleshooting](debug.md).
* To remove the Kubernetes cluster and all resources, see [Delete the Operator and database](delete.md#delete-the-kubernetes-cluster-platform-specific).
