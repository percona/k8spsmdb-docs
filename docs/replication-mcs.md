# Enabling multi-cluster Services


Kubernetes [multi-cluster Services (MCS)  :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine/docs/concepts/multi-cluster-services)
is a cross-cluster discovery and invocation of Services. MCS-enabled Services
become discoverable and accessible across clusters with a virtual IP address.

This feature allows splitting applications into multiple clusters combined in
one *fleet*, which can be useful to separate logically standalone parts
(i.e. stateful and stateless ones), or to address privacy and scalability
requirements, etc.

Multi-cluster Services should be supported by the cloud provider. It is 
supported [by Google Kubernetes Engine (GKE)  :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine/docs/concepts/multi-cluster-services),
and [by Amazon Elastic Kubernetes Service (EKS)  :octicons-link-external-16:](https://aws.amazon.com/blogs/opensource/introducing-the-aws-cloud-map-multicluster-service-controller-for-k8s-for-kubernetes-multicluster-service-discovery/).

Configuring your cluster for multi-cluster Services includes two parts:

- configure MCS with your cloud provider,
- make needed preparations with the Operator.

To set up MCS for a specific cloud provider you should follow official guides,
for example ones [from Google Kubernetes Engine (GKE)  :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine/docs/how-to/multi-cluster-services),
or [from Amazon Elastic Kubernetes Service (EKS)  :octicons-link-external-16:](https://aws.amazon.com/blogs/opensource/introducing-the-aws-cloud-map-multicluster-service-controller-for-k8s-for-kubernetes-multicluster-service-discovery/).

!!! warning

    For EKS, you also need to create ClusterProperty objects prior to enabling multi-cluster services.

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

    Check [AWS MCS controller repository  :octicons-link-external-16:](https://github.com/aws/aws-cloud-map-mcs-controller-for-k8s#usage) for more information.

Setting up the Operator for MCS results in registering Services for export to
other clusters [using the ServiceExport object  :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine/docs/how-to/multi-cluster-services),
and using ServiceImport one to import external services. Set the following
options in the `multiCluster` subsection of the `deploy/cr.yaml` configuration
file to make it happen:

- `multiCluster.enabled` should be set to `true`,
- `multiCluster.DNSSuffix` string should be equal to the cluster domain suffix
    for multi-cluster Services used by Kubernetes (`svc.clusterset.local`
    [by default  :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine/docs/how-to/multi-cluster-services)).

The following example in the `deploy/cr.yaml` configuration file is rather
straightforward:

```yaml
...
multiCluster:
  enabled: true
  DNSSuffix: svc.clusterset.local
...
```

Apply changes as usual with the `kubectl apply -f deploy/cr.yaml` command.

!!! note

    If you want to enable multi-cluster services in a new cluster, we
    recommended deploying the cluster first with `multiCluster.enabled` set to
    `false` and enable it after replset is initialized. Having MCS enabled from
    the start is prone to errors on replset initialization.

The initial ServiceExport creation and sync with the clusters of the fleet takes
approximately five minutes. You can check the list of services for export and
import with the following commands:

``` {.bash data-prompt="$" }
$ kubectl get serviceexport
```

??? example "Expected output"

    ``` {.text .no-copy}
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

``` {.bash data-prompt="$" }
$ kubectl get serviceimport
```

??? example "Expected output"

    ``` {.text .no-copy}
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

!!! note

    ServiceExport objects are created automatically by the Percona Server for
    MongoDB Operator. ServiceImport objects, on the other hand, are not
    controlled by the operator. If you need to troubleshoot ServiceImport
    objects you must check the MCS controller installed by your cloud provider.

After ServiceExport object is created, exported Services can be resolved from
any Pod in any fleet cluster as
`SERVICE_EXPORT_NAME.NAMESPACE.svc.clusterset.local`.

!!! note

    This means that ServiceExports with the same name and namespace will
    be recognized as a single combined Service.

MCS can charge cross-site replication with additional limitations specific to
the cloud provider. For example, GKE demands all participating Pods to be in the
same [project  :octicons-link-external-16:](https://cloud.google.com/resource-manager/docs/creating-managing-projects).
Also, `default` Namespace should be used with caution: your cloud provider
[may not allow  :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine/docs/how-to/multi-cluster-services)
exporting Services from it to other clusters.

## Applying MCS to an existing cluster

Additional actions are needed to turn on MCS for the 
**already-existing non-MCS cluster**.

- You need to restart the Operator after editing the `multiCluster` subsection
    keys and applying `deploy/cr.yaml`. Find the Operator’s Pod name in the
    output of the `kubectl get pods` command (it will be something like
    `percona-server-mongodb-operator-d859b69b6-t44vk`) and delete it as follows:

    ``` {.bash data-prompt="$" }
    $ kubectl delete percona-server-mongodb-operator-d859b69b6-t44vk
    ```

- If you are enabling MCS for a running cluster after upgrading from the
    Operator version `1.11.0` or below, you need rotating multi-domain (SAN)
    certificates. Do this by [pausing the cluster](pause.md) and
    deleting [TLS Secrets](TLS.md).
