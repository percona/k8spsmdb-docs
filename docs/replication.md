# Set up Percona Server for MongoDB cross-site replication

The cross-site replication involves configuring one MongoDB site as _Main_, and
another MongoDB site as _Replica_ to allow replication between them:

![image](assets/images/replication-pods.svg)

This feature can be useful in several cases:

- simplify the migration of the MongoDB cluster to and from Kubernetes
- add remote nodes to the replica set for disaster recovery

## Glossary

- **Main cluster**: The cluster which the primary node runs and accepts write
  traffic. It's the **managed cluster** if it's running on Kubernetes.
- **Replica cluster**: The cluster which is configured to replicate from **main
  cluster**. It's the **unmanaged cluster** if it's running on Kubernetes.
- **Managed cluster**: The cluster controlled by operator. The operator controls
  everything from [Replica Set
  configuration](https://www.mongodb.com/docs/manual/reference/replica-configuration/)
  to users credentials. It's the default deployment of the operator.
- **Unmanaged cluster**: The cluster controlled by operator but the operator
  isn't responsible for managing [Replica Set
  configuration](https://www.mongodb.com/docs/manual/reference/replica-configuration/).

## Topologies

The Operator automates configuration of _Main_ and _Replica_ MongoDB sites, but
the feature itself is not bound to Kubernetes. Either _Main_ or _Replica_ can
run outside of Kubernetes, be regular MongoDB and be out of the Operators’
control.

You need to have a single _Main_ cluster but you can have multiple _Replica_
clusters as long as you don't have more than 50 members in Replica Set. This
limitation comes from MongoDB itself, for more information please check [MongoDB
docs](https://www.mongodb.com/docs/manual/core/replica-set-members/#replica-set-members).

### Main and Replica clusters on Kubernetes

If you want both _Main_ and _Replica_ clusters to run on Kubernetes, overall steps will look like:

1. Deploy _Main_ cluster on a Kubernetes cluster
2. Get secrets from _Main_ cluster and apply them to namespace in Kubernetes cluster which you'll deploy the _Replica_ cluster
3. Deploy _Replica_ cluster on a Kubernetes cluster
4. Add nodes from _Replica_ cluster to _Main_ cluster as external nodes

### Main cluster on Kubernetes and Replica cluster outside of Kubernetes

### Main cluster outside of Kubernetes and Replica cluster on Kubernetes

## Exposing instances of the MongoDB cluster

You need to expose all Replica Set nodes (including Config Servers) through a
dedicated service to ensure that _Main_ and _Replica_ can reach each other,
like in a full mesh:

![image](assets/images/replication-mesh.svg)

This is done through the `replsets.expose`, `sharding.configsvrReplSet.expose`,
and `sharding.mongos.expose` sections in the `deploy/cr.yaml` configuration file
as follows.

```yaml
spec:
  replsets:
  - rs0:
    expose:
      enabled: true
      exposeType: LoadBalancer
    ...
  sharding:
    configsvrReplSet:
      expose:
        enabled: true
        exposeType: LoadBalancer
      ...
```

The above example is using the LoadBalancer Kubernetes Service object, but there
are other options (ClusterIP, NodePort, etc.).

!!! note

    The above example will create a LoadBalancer per each Replica Set Pod.
    In most cases, this Load Balancer should be internet-facing for cross-region
    replication to work.

To list the endpoints assigned to Pods, list the Kubernetes Service objects by
executing `kubectl get services -l "app.kubernetes.io/instance=CLUSTER_NAME"`
command.

## Configuring cross-site replication on Main site

The cluster managed by the Operator should be able to reach external nodes of
the Replica Sets. You can provide needed information in the
`replsets.externalNodes` and `sharding.configsvrReplset.externalNodes`
subsections of the `deploy/cr.yaml` configuration file. Following keys can
be set to specify each external _Replica_, both for its Replica Set and Config
Server instances:

- set `host` to URL or IP address of the external replset instance,
- set `port` to the port number of the external node (or rely on the `27017`
  default value),

Optionaly you can set the following additional keys:

- `priority` key sets the [priority](https://docs.mongodb.com/manual/reference/replica-configuration/#mongodb-rsconf-rsconf.members-n-.priority)
  of the external node (`2` by default for all local members of the cluster;
  external nodes should have lower priority to avoid unmanaged node being elected
  as a primary; `0` adds the node as a [non-voting member](arbiter.md#arbiter-nonvoting)),
- `votes` key sets the number of [votes](https://docs.mongodb.com/manual/reference/replica-configuration/#mongodb-rsconf-rsconf.members-n-.votes)
  an external node can cast in a replica set election (`0` by default, and
  `0` for non-voting members of the cluster).

Here is an example:

```yaml
spec:
  unmanaged: false
  replsets:
  - name: rs0
    externalNodes:
    - host: rs0-1.percona.com
      port: 27017
      priority: 0
      votes: 0
    - host: rs0-2.percona.com
    ...
  sharding:
    configsvrReplSet:
      size: 3
      externalNodes:
        - host: cfg-1.percona.com
          port: 27017
          priority: 0
          votes: 0
        - host: cfg-2.percona.com
        ...
```

The _Main_ site will be ready for replication when you apply changes as usual:

```{.bash data-prompt="$" }
$ kubectl apply -f deploy/cr.yaml
```

### Getting the cluster secrets and certificates to be copied from Main to Replica

_Main_ and _Replica_ should have same Secrets objects (to have same users
credentials) and certificates. So you may need to copy them from _Main_.
Names of the corresponding objects are set in the `users`, `ssl`, and
`sslInternal` keys of the Custom Resource `secrets` subsection
(`my-cluster-name-secrets`, `my-cluster-name-ssl`, and
`my-cluster-name-ssl-internal` by default).

If you can get Secrets from an existing cluster by executing the
`kubectl get secret` command for _each_ Secrets object you want to acquire:

```{.bash data-prompt="$" }
$ kubectl get secret my-cluster-name-secrets -o yaml > my-cluster-secrets.yaml
```

Next remove the `annotations`, `creationTimestamp`, `resourceVersion`,
`selfLink`, and `uid` metadata fields from the resulting file to make it
ready for the _Replica_.

You will need to further apply these secrets on Replica.

## Configuring cross-site replication on Replica instances

When the Operator creates a new cluster, a lot of things are happening, such as
electing the Primary, generating certificates, and picking specific names. This
should not happen if we want the Operator to run the _Replica_ site, so first
of all the cluster should be put into unmanaged state by setting the
`unmanaged` key in the `deploy/cr.yaml` configuration file to true. Also you
should set `updateStrategy` key to `OnDelete` and `backup.enabled` to
`false`, because [Smart Updates](update.md#operator-update-smartupdates) and
[backups](backups.md#backups) are not allowed on unmanaged clusters.

!!! note

    Setting `unmanaged` to true will not only prevent the Operator from
    controlling the Replica Set configuration, but it will also result in not
    generating certificates and users credentials for new clusters.

Here is an example:

```yaml
spec:
  unmanaged: true
  updateStrategy: OnDelete
  replsets:
  - name: rs0
    size: 3
    ...
  backup:
    enabled: false
  ...
```

_Main_ and _Replica_ sites should have same Secrets objects, so don’t forget
to apply Secrets from your _Main_ site. Names of the corresponding objects
are set in the `users`, `ssl`, and `sslInternal` keys of the Custom
Resource `secrets` subsection (`my-cluster-name-secrets`,
`my-cluster-name-ssl`, and `my-cluster-name-ssl-internal` by default).

Copy your secrets from an existing cluster and apply each of them on your
_Replica_ site as follows:

```{.bash data-prompt="$" }
$  kubectl apply -f my-cluster-secrets.yaml
```

The _Replica_ site will be ready for replication when you apply changes as
usual:

```{.bash data-prompt="$" }
$ kubectl apply -f deploy/cr.yaml
```

## Enabling multi-cluster Services

Kubernetes [multi-cluster Services (MCS)](https://cloud.google.com/kubernetes-engine/docs/concepts/multi-cluster-services)
is a cross-cluster discovery and invocation of Services. MCS-enabled Services
become discoverable and accessible across clusters with a virtual IP address.

This feature allows splitting applications into multiple clusters combined in
one _fleet_, which can be useful to separate logically standalone parts
(i.e. stateful and stateless ones), or to address privacy and scalability
requirements, etc.

Multi-cluster Services should be supported by the cloud provider. It is
supported [by Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine/docs/concepts/multi-cluster-services),
and [by Amazon Elastic Kubernetes Service (EKS)](https://aws.amazon.com/blogs/opensource/introducing-the-aws-cloud-map-multicluster-service-controller-for-k8s-for-kubernetes-multicluster-service-discovery/).

Configuring your cluster for multi-cluster Services includes two parts:

- configure MCS with your cloud provider,
- make needed preparations with the Operator.

To set up MCS for a specific cloud provider you should follow official guides,
for example ones [from Google Kubernetes Engine (GKE)](https://cloud.google.com/kubernetes-engine/docs/how-to/multi-cluster-services),
or [from Amazon Elastic Kubernetes Service (EKS)](https://aws.amazon.com/blogs/opensource/introducing-the-aws-cloud-map-multicluster-service-controller-for-k8s-for-kubernetes-multicluster-service-discovery/).

Setting up the Operator for MCS results in registering Services for export to
other clusters [using the ServiceExport object](https://cloud.google.com/kubernetes-engine/docs/how-to/multi-cluster-services),
and using ServiceImport one to import external services. Set the following
options in the `multiCluster` subsection of the `deploy/cr.yaml` configuration
file to make it happened:

- `multiCluster.enabled` should be set to `true`,
- `multiCluster.DNSSuffix` string should be equal to the cluster domain suffix
  for multi-cluster Services used by Kubernetes (`svc.clusterset.local`
  [by default](https://cloud.google.com/kubernetes-engine/docs/how-to/multi-cluster-services)).

The following example in the `deploy/cr.yaml` configuration file is rather
straightforward:

```yaml
---
multiCluster:
  enabled: true
  DNSSuffix: svc.clusterset.local
```

Apply changes as usual with the `kubectl apply -f deploy/cr.yaml` command.

The initial ServiceExport creation and sync with the clusters of the fleet takes
approximately five minutes. You can check the list of services for export and
import with the following commands:

```{.bash data-prompt="$" }
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

```{.bash data-prompt="$" }
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

After ServiceExport object is created, exported Services can be resolved from
any Pod in any fleet cluster as
`SERVICE_EXPORT_NAME.NAMESPACE.svc.clusterset.local`.

!!! note

    This means that ServiceExports with the same name and namespace will
    be recognized as a single combined Service.

MCS can charge cross-site replication with additional limitations specific to
the cloud provider. For example, GKE demands all participating Pods to be in the
same [project](https://cloud.google.com/resource-manager/docs/creating-managing-projects).
Also, `default` Namespace should be used with caution: your cloud provider
[may not allow](https://cloud.google.com/kubernetes-engine/docs/how-to/multi-cluster-services)
exporting Services from it to other clusters.

### Applying MCS to an existing cluster

Additional actions are needed to turn on MCS for the
**already-existing non-MCS cluster**.

- You need to restart the Operator after editing the `multiCluster` subsection
  keys and applying `deploy/cr.yaml`. Find the Operator’s Pod name in the
  output of the `kubectl get pods` command (it will be something like
  `percona-server-mongodb-operator-d859b69b6-t44vk`) and delete it as follows:

  ```{.bash data-prompt="$" }
  $ kubectl delete percona-server-mongodb-operator-d859b69b6-t44vk
  ```

- If you are enabling MCS for a running cluster after upgrading from the
  Operator version `1.11.0` or below, you need rotating multi-domain (SAN)
  certificates. Do this by [pausing the cluster](pause.md#operator-pause) and
  deleting [TLS Secrets](TLS.md#tls).
