# Enable multi-cluster Services on EKS

The [AWS Cloud Map MCS Controller](https://github.com/aws/aws-cloud-map-mcs-controller-for-k8s) is an open-source Kubernetes controller that implements the Multi-Cluster Services API using [AWS Cloud Map](https://docs.aws.amazon.com/cloud-map/latest/dg/what-is-cloud-map.html) as the backend. It allows services exported from one cluster to be discovered and consumed in another using the DNS format:

```
SERVICE_NAME.NAMESPACE.svc.clusterset.local
```

Read more about how AWS Cloud Map MCS Controller works in the [AWS blog post :octicons-link-external-16:](https://aws.amazon.com/blogs/opensource/introducing-the-aws-cloud-map-multicluster-service-controller-for-k8s-for-kubernetes-multicluster-service-discovery/).

Also, lear more about [AWS Cloud Map pricing :octicons-link-external-16:](https://aws.amazon.com/cloud-map/pricing/)

## Prerequisites

Before you get started with MCS on EKS, ensure you have the following:

1. Two EKS clusters that can communicate with each other over the [Virtual Private Cloud (Amazon VPC) peering :octicons-link-external-16:](https://docs.aws.amazon.com/vpc/latest/peering/create-vpc-peering-connection.html). See [Create the EKS cluster](eks.md#create-the-eks-cluster) guide for the cluster creation steps.

2. Each EKS cluster has permissions to communicate with AWS Cloud Map. A service account must have the IAM policy assigned that grants access to the AWS Cloud Map. For testing purposes, you can use the _AWSCloudMapFullAccess_ policy. In production, apply least privilege permissions.

    For more information about IAM policies for AWS Cloud Map, see the [Identity and Access Management for AWS Cloud Map :octicons-link-external-16:](https://docs.aws.amazon.com/cloud-map/latest/dg/security-iam.html#security_iam_access-manage) documentation.

## Configuration

Follow the steps from the [AWS Cloud Map MCS Controller for K8s :octicons-link-external-16:](https://aws.amazon.com/blogs/opensource/introducing-the-aws-cloud-map-multicluster-service-controller-for-k8s-for-kubernetes-multicluster-service-discovery/) guide to configure multi-cloud Services.

Before you enable MCS on the clusters, create the ClusterProperty objects on each cluster:

```yaml
apiVersion: about.k8s.io/v1alpha1
kind: ClusterProperty
metadata:
  name: cluster.clusterset.k8s.io
spec:
  value: [Your Cluster identifier]
---
apiVersion: about.k8s.io/v1alpha1
kind: ClusterProperty
metadata:
  name: clusterset.k8s.io
spec:
  value: [Your ClusterSet identifier]
```

Check the [AWS MCS controller repository  :octicons-link-external-16:](https://github.com/aws/aws-cloud-map-mcs-controller-for-k8s#usage) for more information.



