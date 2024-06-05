# Exposing cluster

The Operator provides entry points for accessing the database by client applications in several scenarios. In either way the cluster is exposed with regular Kubernetes [Service objects  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/), configured by the Operator.

This document describes the usage of [Custom Resource manifest options](operator.md) to expose the clusters deployed with the Operator. 

## Using single entry point in a sharded cluster

If Percona Server for MongoDB [Sharding mode](sharding.md)
is turned **on** (default behavior), then database cluster runs special
`mongos` Pods - query routers, which acts as an entry point for client
applications,

![image](assets/images/mongos_espose.png)

The URI looks like follows (taking into account the need for a proper password obtained from the Secret, and a proper namespace name instead of the `<namespace name>` placeholder):

``` {.bash data-prompt="$" }
$ mongo "mongodb://userAdmin:userAdminPassword@my-cluster-name-mongos.<namespace name>.svc.cluster.local/admin?ssl=false"
```

!!! warning

    This service endpoint is only reachable inside Kubernetes. If you need to connect from the outside, expose the mongos pods by using NodePort or Load Balancer service types.
    See the "Service per Pod" section for details.
    
You can find more on sharding in the [official MongoDB documentation  :octicons-link-external-16:](https://docs.mongodb.com/manual/reference/glossary/#term-sharding).

## Accessing replica set Pods

If [Percona Server for MongoDB Sharding](sharding.md) mode
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

URI-based access is strictly recommended. Still sometimes you cannot communicate with the Pods using the Kubernetes internal DNS
names. To make Pods of the Replica Set accessible, Percona Operator for MongoDB
can assign a [Kubernetes Service  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/)
to each Pod.

!!! note

    Particularly, Service per Pod will allow application to take care of
    Cursor tracking instead of relying on a single service. This solves the
    problem of CursorNotFound errors when the Service transparently cycles
    between the mongos instances while client is still iterating the cursor
    on some large collection.

This feature can be configured in the `replsets` (for mongod Pods)
and `sharding` (for mongos Pods) sections of the
[deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml)
file:

* set `expose.enabled` option to `true` to allow exposing Pods via services,
* set `expose.exposeType` option specifying the IP address type to be used:
    * `ClusterIP` - expose the Pod’s service with an internal static
        IP address. This variant makes the service reachable only from
        within the Kubernetes cluster.
    * `NodePort` - expose the Pod’s service on each Kubernetes node’s
        IP address at a static port. A ClusterIP service, to which the node
        port will be routed, is automatically created in this variant. As
        an advantage, the service will be reachable from outside the
        cluster by node address and port number, but the address will be
        bound to a specific Kubernetes node.
    * `LoadBalancer` - expose the Pod’s service externally using a
        cloud provider’s load balancer. Both [ClusterIP and NodePort
        services are automatically created :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) in this variant

If the NodePort feature is enabled, the URI looks like
`mongodb://databaseAdmin:databaseAdminPassword@<ip1>:<port1>,<ip2>:<port2>,<ip3>:<port3>/admin?replicaSet=rs0&ssl=false`
All IP adresses should be *directly* reachable by the application.

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

    You should be careful with the `clusterServiceDNSMode=External` variant. Using IP addresses instead of DNS hostnames is discouraged in MongoDB. IP addresses make reconfiguration and recovery more complicated, and are **generally problematic in scenarios where IP addresses change**. In particular, if you delete and recreate the cluster with `clusterServiceDNSMode=External` without deleting its volumes (having `delete-psmdb-pvc` finalizer unset), your cluster will crash and there will be no straightforward way to recover it.

## Exposing replica set with split-horizon DNS

[Split-horizon DNS  :octicons-link-external-16:](https://en.wikipedia.org/wiki/Split-horizon_DNS) provides
each replica set Pod with a set of DNS URIs for external usage. This allows to
communicate with replica set Pods both from inside the Kubernetes cluster and
from outside of Kubernetes.

Split-horizon can be configured via the `replset.horizons` subsection in the
Custom Resource options. Set it in the `deploy/cr.yaml` configuration file as
follows:

``` yaml
    ...
    replsets:
      - name: rs0
        expose:
          enabled: true
          exposeType: LoadBalancer
        horizons:
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
* horizons should be configured on an existing cluster (creating a new
    cluster with pre-configured horizons is currently not supported)

