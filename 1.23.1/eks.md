> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Create an Amazon Elastic Kubernetes Service (EKS) cluster

This guide walks you through creating a Kubernetes cluster on Amazon Elastic Kubernetes Service (EKS). The document assumes some experience with the platform. For more information on the EKS, see the [Amazon EKS official documentation](https://aws.amazon.com/eks/) .

## Prerequisites

Install and configure the following:

1. **AWS Command Line Interface (AWS CLI)** for interacting with AWS. See the [installation guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) for your system.
1. **eksctl** to simplify cluster creation. See [eksctl installation](https://github.com/weaveworks/eksctl#installation) on GitHub.
1. **kubectl** — to manage Kubernetes. See the [official kubectl installation](https://kubernetes.io/docs/tasks/tools/install-kubectl/) .

Configure the AWS CLI with your credentials using the [official guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) .

## Create the EKS cluster

1. Decide on the following:

   - EKS cluster name
   - AWS region
   - Number of nodes
   - Mix of [on-demand](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-on-demand-instances.html) and [spot](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-spot-instances.html) instances (if any). Spot instances are not recommended for production but can be useful for testing.

1. Create the cluster by following the [official EKS cluster creation instructions](https://docs.aws.amazon.com/eks/latest/userguide/create-cluster.html) .

1. Install the [Amazon EBS CSI driver](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html) on the cluster so you can use EBS volumes for persistent storage. See [Managing the Amazon EBS CSI add-on](https://docs.aws.amazon.com/eks/latest/userguide/managing-ebs-csi.html) .

## Delete EKS cluster

To remove the Kubernetes cluster and all resources, see [Delete the Operator and database](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/delete.html#delete-the-kubernetes-cluster-platform-specific).

## Next steps

Deploy the Operator and Percona Server for MongoDB.

[Single-namespace deployment](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/kubectl.html) [Multi-namespace deployment](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/cluster-wide.html)
