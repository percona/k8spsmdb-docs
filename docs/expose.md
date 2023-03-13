# Exposing cluster

The Operator provides entry points for accessing the database by client applications in several scenarios. In either way the cluster is exposed with regular Kubernetes [Service objects](https://kubernetes.io/docs/concepts/services-networking/service/), configured by the Operator.

This document describes the usage of [Custom Resource manifest options](operator.md) to expose the clusters deployed with the Operator. 

## Using single entry point in a sharded cluster

If [Percona Server for MongoDB Sharding](sharding.md#operator-sharding) mode
is turned **on** (default behavior), then database cluster runs special
`mongos` Pods - query routers, which acts as an entry point for client
applications,

![image](assets/images/mongos_espose.png)

If this feature is enabled, the URI looks like follows (taking into account the need in a proper password obtained from the Secret, and a proper namespace name instead of the `<namespace name>` placeholder):

``` {.bash data-prompt="$" }
$ mongo "mongodb://userAdmin:userAdminPassword@my-cluster-name-mongos.<namespace name>.svc.cluster.local/admin?ssl=false"
```

You can find more on sharding in the [official MongoDB documentation](https://docs.mongodb.com/manual/reference/glossary/#term-sharding).

## Accessing replica set Pods

If [Percona Server for MongoDB Sharding](sharding.md#operator-sharding) mode
is turned **off**, the application needs access to all MongoDB Pods of the
replica set:

![image](assets/images/mongod_espose.png)

When Kubernetes creates Pods, each Pod has an IP address in the internal virtual
network of the cluster. Creating and destroying Pods is a dynamic process,
therefore binding communication between Pods to specific IP addresses would
cause problems as things change over time as a result of the cluster scaling,
maintenance, etc. Due to this changing environment, you should connect to
Percona Server for MongoDB via Kubernetes internal DNS names in URI
(e.g. using `mongodb+srv://userAdmin:userAdmin123456@<cluster-name>-rs0.<namespace>.svc.cluster.local/admin?replicaSet=rs0&ssl=false` to access one of the Replica Set Pods).

In this case, the URI looks like follows (taking into account the need in a proper password obtained from the Secret, and a proper namespace name instead of the `<namespace name>` placeholder):

``` {.bash data-prompt="$" }
$ mongodb://databaseAdmin:databaseAdminPassword@my-cluster-name-rs0.<namespace name>.svc.cluster.local/admin?replicaSet=rs0&ssl=false"
```

## Service per Pod

URI-based access is strictly recommended.

Still sometimes you cannot communicate with the Pods using the Kubernetes internal DNS
names. To make Pods of the Replica Set accessible, Percona Operator for MongoDB
can assign a [Kubernetes Service](https://kubernetes.io/docs/concepts/services-networking/service/)
to each Pod.

This feature can be configured in the `replsets` (for MondgoDB instances Pod)
and `sharding` (for mongos Pod) sections of the
[deploy/cr.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml)
file:

* set `expose.enabled` option to `true` to allow exposing Pods via services,
* set `expose.exposeType` option specifying the IP address type to be used:
    * `ClusterIP` - expose the Pod’s service with an internal static
        IP address. This variant makes MongoDB Pod only reachable from
        within the Kubernetes cluster.
    * `NodePort` - expose the Pod’s service on each Kubernetes node’s
        IP address at a static port. ClusterIP service, to which the node
        port will be routed, is automatically created in this variant. As
        an advantage, the service will be reachable from outside the
        cluster by node address and port number, but the address will be
        bound to a specific Kubernetes node.
    * `LoadBalancer` - expose the Pod’s service externally using a
        cloud provider’s load balancer. Both ClusterIP and NodePort
        services are automatically created in this variant.

If this feature is enabled, URI looks like
`mongodb://databaseAdmin:databaseAdminPassword@<ip1>:<port1>,<ip2>:<port2>,<ip3>:<port3>/admin?replicaSet=rs0&ssl=false`
All IP adresses should be *directly* reachable by application.

## Controlling hostnames in replset configuration

Starting from v1.14, the Operator configures replica set members using local fully-qualified domain names (FQDN), which are resolvable and available only from inside the Kubernetes cluster. Exposing the replica set using the options described above will not affect hostname usage in the replica set configuration.

!!! note

    Before v1.14, the Operator used the exposed IP addresses in the replica set configuration in the case of the exposed replica set.

It is still possible to restore the old behavior. For example, it may be useful to have the replica set configured with external IP addresses for [multi-cluster deployments](replication.md). The `clusterServiceDNSMode` field in the Custom Resource controls this Operator behavior. You can set `clusterServiceDNSMode` to one of the following values:

1. **`Internal`**: Use local FQDNs (i.e., `cluster1-rs0-0.cluster1-rs0.psmdb.svc.cluster.local`) in replica set configuration even if the replica set is exposed. **This is the default value.**
2. **`ServiceMesh`**: Use a special FQDN using the Pod name (i.e., `cluster1-rs0-0.psmdb.svc.cluster.local`), assuming it's resolvable and available in all clusters.
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

    You should be careful with the `clusterServiceDNSMode=External` variant. Using IP addresses instead of DNS hostnames is discouraged in MongoDB. IP addresses make configuration changes and recovery more complicated. Also, they are particularly problematic in scenarios where IP addresses change (i.e., deleting and recreating the cluster).
