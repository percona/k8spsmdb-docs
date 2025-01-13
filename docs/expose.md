# Exposing the cluster

The Operator provides entry points for accessing the database by client applications in several scenarios. In either way the cluster is exposed with regular Kubernetes [Service objects  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/), configured by the Operator.

This document describes the usage of [Custom Resource manifest options](operator.md) to expose clusters deployed with the Operator. 

## Using a single entry point in a sharded cluster

If Percona Server for MongoDB [sharding mode](sharding.md) is turned **on** (the default behavior), then the database cluster runs special
`mongos` Pods - query routers, which act as entry points for client applications:

![image](assets/images/mongos_espose.png)

By default, a ClusterIP type Service is created (this is controlled by [sharding.mongos.expose.type](operator.md#shardingmongosexposetype)). The Service works in a round-robin fashion between all the `mongos` Pods.

The URI looks like this (taking into account the need for a proper password obtained from the Secret, and a proper namespace name instead of the `<namespace name>` placeholder):

``` {.bash data-prompt="$" }
$ mongosh "mongodb://userAdmin:userAdminPassword@my-cluster-name-mongos.<namespace name>.svc.cluster.local/admin?ssl=false"
```

You can get the actual Service endpoints by running the following command:

``` {.bash data-prompt="$" }
$ kubectl get psmdb
```

??? example "Expected output"

    ```
    NAME              ENDPOINT                                             STATUS   AGE
    my-cluster-name   my-cluster-name-mongos.default.svc.cluster.local     ready    85m
    ```

!!! warning

    A ClusterIP Service endpoint is only reachable inside Kubernetes. If you need to connect from the outside, you need to expose the mongos Pods by using the NodePort or Load Balancer Service types.
    See the [Connecting from outside Kubernetes](expose.md#connecting-from-outside-kubernetes) section below for details.
    
## Accessing replica set Pods

If Percona Server for MongoDB [sharding mode](sharding.md) mode is turned **off**, the application needs to connect to all the MongoDB Pods of the replica set:

![image](assets/images/mongod_espose.png)

When Kubernetes creates Pods, each Pod has an IP address in the internal virtual
network of the cluster. Creating and destroying Pods is a dynamic process,
therefore binding communication between Pods to specific IP addresses would
cause problems as things change over time as a result of the cluster scaling,
maintenance, etc. Due to this changing environment, you should connect to
Percona Server for MongoDB by using Kubernetes internal DNS names in the URI.

By default, a ClusterIP type Service is created (this is controlled by [replsets.expose.type](operator.md#replsetsexposetype)). The Service works in a round-robin fashion between all the mongod Pods of the replica set.

In this case, the URI looks like this (taking into account the need for a proper password obtained from the Secret, and a proper namespace name instead of the `<namespace name>` placeholder):

``` {.bash data-prompt="$" }
$ mongosh "mongodb://databaseAdmin:databaseAdminPassword@my-cluster-name-rs0.<namespace name>.svc.cluster.local/admin?replicaSet=rs0&ssl=false"
```

You can get the actual Service endpoints by running the following command:

``` {.bash data-prompt="$" }
$ kubectl get psmdb
```

??? example "Expected output"

    ```
    NAME              ENDPOINT                                             STATUS   AGE
    my-cluster-name   my-cluster-name-rs0.default.svc.cluster.local        ready    2m19s
    ```

!!! warning

    A ClusterIP Service endpoint is only reachable inside Kubernetes. If you need to connect from the outside, you need to expose the mongod Pods by using the NodePort or Load Balancer Service types.
    See the [Connecting from outside Kubernetes](expose.md#connecting-from-outside-kubernetes) section below for details.
    
## Connecting from outside Kubernetes

If connecting to a cluster from outside Kubernetes, you cannot reach the Pods using the Kubernetes internal DNS
names. To make the Pods accessible, Percona Operator for MongoDB
can create [Kubernetes Services  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/).

* set `expose.enabled` option to `true` to allow exposing the Pods via Services,
* set `expose.type` option specifying the type of Service to be used:
    * `ClusterIP` - expose the Pod with an internal static IP address. This variant makes the Service reachable only from within the Kubernetes cluster.
    * `NodePort` - expose the Pod on each Kubernetes Node’s IP address at a static port. A ClusterIP Service, to which the Node port will be routed, is automatically created in this variant.
        As an advantage, the Service will be reachable from outside the cluster by Node address and port number, however the address will be bound to a specific Kubernetes Node.
        The `expose.externalTrafficPolicy` Custom Resource option [available in `replsets`](operator.md#replsetsexposeexternaltrafficpolicy), [`sharding.configsvrReplSet`](operator.md#shardingconfigsvrreplsetexposeexternaltrafficpolicy), [and `sharding.mongos`](operator.md#shardingmongosexternaltrafficpolicy) subsections of the `deploy/cr.yaml` manifest, controlls if the external traffic will be node-local (external requests will be dropped if there is no available Pod on the Node) or cluster-wide (requests can be routed to another Node at the cost of extra latency and not preserving the client IP address).
    * `LoadBalancer` - expose the Pod externally using a cloud provider’s load balancer. Both [ClusterIP and NodePort Services are automatically created :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) in this variant.
        The `expose.externalTrafficPolicy` Custom Resource option controlls if the external traffic will be balanced only between Nodes with the database Pod or cluster-wide (if necessary, requests will be redirected to another node, but with additional delay and replacing the original client IP address with the node's IP address).

If the NodePort type is used, the URI looks like this:

```mongodb://databaseAdmin:databaseAdminPassword@<node1>:<port1>,<node2>:<port2>,<node3>:<port3>/admin?replicaSet=rs0&ssl=false```

All Node addresses should be *directly* reachable by the application.

## Service per Pod

To make all database Pods accessible, Percona Operator for MongoDB can assign a [Kubernetes Service  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/) to each Pod.
Particularly, the Service per Pod option allows the application to take care of Cursor tracking instead of relying on a single Service. This solves the
problem of CursorNotFound errors when the Service transparently cycles between the mongos instances while client is still iterating the cursor
on some large collection.

This feature can be enabled for both sharded and non-sharded clusters by setting the [sharding.mongos.expose.servicePerPod](operator.md#shardingmongosexposeserviceperpod) Custom Resource option to `true` in the [deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) file.

If this feature is enabled with the `expose.type: NodePort`, the created Services look like this:

``` {.bash data-prompt="$" }
$ kubectl get svc
NAME                       TYPE           CLUSTER-IP      EXTERNAL-IP    PORT(S)                      AGE
my-cluster-name-mongos-0   NodePort       10.38.158.103   <none>         27017:31689/TCP              12s
my-cluster-name-mongos-1   NodePort       10.38.155.250   <none>         27017:31389/TCP              12s
...
```

## Controlling hostnames in replset configuration

Starting from v1.14, the Operator configures replica set members using local fully-qualified domain names (FQDN), which are resolvable and available only from inside the Kubernetes cluster. Exposing the replica set using the options described above will not affect hostname usage in the replica set configuration.

!!! note

    Before v1.14, the Operator used the exposed IP addresses in the replica set configuration in the case of the exposed replica set.

It is still possible to restore the old behavior. For example, it may be useful to have the replica set configured with external IP addresses for [multi-cluster deployments](replication.md). The `clusterServiceDNSMode` field in the Custom Resource controls this Operator behavior. You can set `clusterServiceDNSMode` to one of the following values:

1. **`Internal`**: Use local FQDNs (i.e., `cluster1-rs0-0.cluster1-rs0.psmdb.svc.cluster.local`) in replica set configuration even if the replica set is exposed. **This is the default value.**
2. <a name="servicemesh"></a>**`ServiceMesh`**: Use a special FQDN using the Pod name (i.e., `cluster1-rs0-0.psmdb.svc.cluster.local`), assuming it's resolvable and available in all clusters.
3. **`External`**: Use exposed IP in replica set configuration if replica set is exposed; else, use local FQDN. **This copies the behavior of the Operator v1.13.**

If backups are enabled in your cluster, you need to restart replset and config
servers after changing `clusterServiceDNSMode`. This option changes the
hostnames inside the replset configuration and running pbm-agents don't discover
the change until they're restarted. You may have errors in `backup-agent`
container logs and your backups may not work until you restarted the agents.

Restart can be done manually with the `kubectl rollout restart sts
<clusterName>-<replsetName>` command executed for each replica set in the
`spec.replsets`; also, if sharding enabled, do the same for config servers with
`kubectl rollout restart sts <clusterName>-cfg`.  Alternatively, you can simply
[restart your cluster](pause.md).

!!! warning

    You should be careful with the `clusterServiceDNSMode=External` variant. Using IP addresses instead of DNS hostnames is discouraged in MongoDB. IP addresses make reconfiguration and recovery more complicated, and are **generally problematic in scenarios where IP addresses change**. In particular, if you delete and recreate the cluster with `clusterServiceDNSMode=External` without deleting its volumes (having `percona.com/delete-psmdb-pvc` finalizer unset), your cluster will crash and there will be no straightforward way to recover it.

## Exposing replica set with split-horizon DNS

[Split-horizon DNS  :octicons-link-external-16:](https://en.wikipedia.org/wiki/Split-horizon_DNS) provides
each replica set Pod with a set of DNS URIs for external usage. This allows to
communicate with replica set Pods both from inside the Kubernetes cluster and
from outside of Kubernetes.

Split-horizon can be configured via the `replset.splitHorizons` subsection in the
Custom Resource options. Set it in the `deploy/cr.yaml` configuration file as
follows:

``` yaml
    ...
    replsets:
      - name: rs0
        expose:
          enabled: true
          type: LoadBalancer
        splitHorizons:
          cluster1-rs0-0:
            external: rs0-0.mycluster.xyz
            external-2: rs0-0.mycluster2.xyz
          cluster1-rs0-1:
            external: rs0-1.mycluster.xyz
            external-2: rs0-1.mycluster2.xyz
          cluster1-rs0-2:
            external: rs0-2.mycluster.xyz
            external-2: rs0-2.mycluster2.xyz
```

URIs for external usage are specified as key-value pairs, where the key is an
arbitrary name and the value is the actual URI. The URI may include a port
number. If nothing is set, the default MongoDB port will be used.

Split horizon has following limitations:

* connecting with horizon domains is only supported if client connects using TLS
    certificates, and these TLS certificates [need to be generated manually](TLS.md#generate-certificates-manually)
* duplicating domain names in horizons is not allowed by MongoDB
* using IP addresses in horizons is not allowed by MongoDB
* horizons should be set for *all Pods of a replica set* or not set at all

