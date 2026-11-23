> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Multi-cluster Services

[Multi-cluster Services (MCS)](https://cloud.google.com/kubernetes-engine/docs/concepts/multi-cluster-services) is a cross-cluster discovery and invocation mechanism that uses the existing Service object.

MCS allows you to create a “fleet” of Kubernetes clusters that share a common identity and are managed as a single logical unit. This enables service discovery and communication across clusters via a virtual IP address, simplifying the process of building multi-region or multi-cluster deployments.

Multi-cluster Services should be supported by the cloud provider. It is natively supported [by Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine/docs/concepts/multi-cluster-services) . Amazon Elastic Kubernetes Service (EKS) provides multi-cluster Services via the [AWS Cloud Map](https://aws.amazon.com/cloud-map/) .

## Use multi-cluster Services

To use multi-cluster Services for your deployment, you must do the following:

- Enable multi-cluster Services with your cloud provider
- Configure the Operator to use multi-cluster Services

MCS can charge cross-site replication with additional limitations specific to the cloud provider. For example, GKE demands all participating Pods to be in the same [project](https://cloud.google.com/resource-manager/docs/creating-managing-projects) . Also, consider using a custom namespace for exporting Services. Using the `default` and `kube-system` Namespaces can cause unintended name conflicts and the resulting unintended grouping.

### Enable multi-cluster Services with your cloud provider

To get started, follow the setup guides for your specific cloud provider:

- [Enable multi-cluster Services on GKE](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/replication-mcs-gke.html)
- [Enable multi-cluster Services on EKS](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/replication-mcs-eks.html)

### Configure the Operator to use multi-cluster Services

To work in multi-cluster Kubernetes environment, the Operator must ensure service discovery across clusters.

To do this, the Operator must create the ServiceExport and ServiceImport resources.

A **ServiceExport** is a Kubernetes resource that marks a standard Service for sharing across clusters. When created, ServiceExport signals to the MCS controller that the service with the same name should be made discoverable to other clusters.

The Operator creates the ServiceExport resource for a cluster when the `multiCluster` subsection of the `deploy/cr.yaml` contains the following configuration:

- the `multiCluster.enabled` key is set to `true`
- the `multiCluster.DNSSuffix` string is equal to the cluster domain suffix for multi-cluster Services used by Kubernetes. The [default value](https://cloud.google.com/kubernetes-engine/docs/how-to/multi-cluster-services) is `svc.clusterset.local`.

```
...
multiCluster:
  enabled: true
  DNSSuffix: svc.clusterset.local
...
```

For a Service to be exported and become accessible by other clusters of the fleet, it must have the same name and namespace in each cluster. Once exported, the service is recognized as a single combined Service. It can be resolved from any Pod in any fleet cluster via the shared DNS name:

```
SERVICE_NAME.NAMESPACE.svc.clusterset.local
```

It takes approximately five minutes to create ServiceExport and sync with the clusters of the fleet. You can check the list of services for export with the following commands:

```
kubectl get serviceexport
```

Expected output

```
NAME                     AGE
my-cluster-name-cfg      22m
my-cluster-name-cfg-0    22m
my-cluster-name-cfg-1    22m
my-cluster-name-cfg-2    22m
my-cluster-name-mongos   22m
my-cluster-name-rs0      22m
my-cluster-name-rs0-0    22m
my-cluster-name-rs0-1    22m
my-cluster-name-rs0-2    22m
```

A **ServiceImport** is a Kubernetes resource to consume exported services in each importing cluster. This is analogous to the traditional Service type in Kubernetes. The ServiceImport is created automatically by the MCS controller. It contains endpoint information from all clusters that exported the service and enables workloads in one cluster to access services in another using the unified DNS name.

To check the list of services for import, run this command:

```
kubectl get serviceimport
```

Expected output

```
NAME                     TYPE           IP                  AGE
my-cluster-name-cfg      Headless                           22m
my-cluster-name-cfg-0    ClusterSetIP   ["10.73.200.89"]    22m
my-cluster-name-cfg-1    ClusterSetIP   ["10.73.192.104"]   22m
my-cluster-name-cfg-2    ClusterSetIP   ["10.73.207.254"]   22m
my-cluster-name-mongos   ClusterSetIP   ["10.73.196.213"]   22m
my-cluster-name-rs0      Headless                           22m
my-cluster-name-rs0-0    ClusterSetIP   ["10.73.206.24"]    22m
my-cluster-name-rs0-1    ClusterSetIP   ["10.73.207.20"]    22m
my-cluster-name-rs0-2    ClusterSetIP   ["10.73.193.92"]    22m
```

Since ServiceImport is not controlled by the Operator, objects you must check the MCS controller installed by your cloud provider if you need to troubleshoot it.

## Next steps

[Enable MCS on GKE](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/replication-mcs-gke.html) [Enable MCS on EKS](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/replication-mcs-eks.html)
