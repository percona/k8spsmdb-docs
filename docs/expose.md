# Exposing the cluster

The Operator provides entry points for accessing the database by client applications in several scenarios. In all cases, the cluster is exposed using regular Kubernetes [Service objects  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/), which the Operator configures.

This document describes how to use [Custom Resource manifest options](operator.md) to expose clusters deployed with the Operator. 

## Using a single entry point in a sharded cluster

By default, the Operator deploys Percona Server for MongoDB as a [sharded cluster](sharding.md). This means the database cluster runs special
`mongos` Pods - query routers, which act as entry points for client applications:

![image](assets/images/mongos_espose.png)

By default, the Operator creates `mongos` Service with a ClusterIP service type Service. The service type is controlled by the [sharding.mongos.expose.type](operator.md#shardingmongosexposetype) option in the Custom Resource. The Service works in a round-robin fashion between all the `mongos` Pods.

To view the Service endpoints, run the following command: 

```bash
kubectl get psmdb
```

??? example "Expected output"

    ```
    NAME              ENDPOINT                                             STATUS   AGE
    my-cluster-name   my-cluster-name-mongos.<namespace>.svc.cluster.local     ready    85m
    ```

To connect to MongoDB, you need to construct the MongoDB connection string URI. For the sharded cluster, specify the `mongos` endpoint for the connection string URI. This is the example format:

```bash
mongosh "mongodb://userAdmin:userAdminPassword@my-cluster-name-mongos.<namespace name>.svc.cluster.local/admin?ssl=false"
```

Make sure every part of the connection string reflects your environment:

- **userAdmin** and **userAdminPassword**: replace with your admin username and the actual admin password. Get the username and password from the Kubernetes Secret created for your cluster.
- **my-cluster-name**: use the name of your database cluster. Get the name by running `kubectl get psmdb` command
- **<namespace name>**: the Kubernetes namespace where your cluster is deployed


!!! warning

    A ClusterIP Service endpoint is only reachable inside Kubernetes. If you need to connect from the outside, you need to expose the mongos Pods by using the NodePort or Load Balancer Service types.
    See the [Connecting from outside Kubernetes](expose.md#connecting-from-outside-kubernetes) section below for details.
    
## Accessing replica set Pods

If Percona Server for MongoDB [sharding mode](sharding.md) is turned **off**, the Operator deploys Percona Server for MongoDB  as a replica set. In this case, an application needs to connect to all the MongoDB Pods of the replica set:

![image](assets/images/mongod_espose.png)

When Kubernetes creates Pods, each Pod gets an IP address in the internal virtual network of the cluster. Since Pod creation and destruction is a dynamic process, binding communication to specific IP addresses would cause problems as the cluster scales or undergoes maintenance. For this reason, you should connect to Percona Server for MongoDB using Kubernetes internal DNS names in the connection string URI.

By default, the Operator creates Services for mongod Pods with a ClusterIP service type Service. The service type is controlled by the [replsets.expose.type](operator.md#replsetsexposetype) option. The Service works in a round-robin fashion between all the mongod Pods of the replica set.

You can get the actual Service endpoints by running the following command:

```bash
kubectl get psmdb
```

??? example "Expected output"

    ```
    NAME              ENDPOINT                                             STATUS   AGE
    my-cluster-name   my-cluster-name-rs0.<namespace>.svc.cluster.local        ready    2m19s
    ```

To connect to a MongoDB replica set, you need to specify each replica set member for the MongoDB connection string URI. This is the example format:

```bash
mongosh "mongodb://databaseAdmin:databaseAdminPassword@my-cluster-name-rs0.<namespace name>.svc.cluster.local/admin?replicaSet=rs0&ssl=false"
```

Make sure every part of the connection string reflects your environment:

- **userAdmin** and **userAdminPassword**: replace with your admin username and the actual admin password. Get the username and password from the Kubernetes Secret created for your cluster.
- **my-cluster-name**: use the name of your database cluster. Get the name by running `kubectl get psmdb` command  
- **<namespace name>**: the Kubernetes namespace where your cluster is deployed

!!! warning

    A ClusterIP Service endpoint is only reachable inside Kubernetes. If you need to connect from the outside, you need to expose the mongod Pods by using the NodePort or Load Balancer Service types.
    See the [Connecting from outside Kubernetes](expose.md#connecting-from-outside-kubernetes) section below for details.
    
## Connecting from outside Kubernetes

If you need to connect to a cluster from outside Kubernetes, you cannot reach the Pods using Kubernetes internal DNS names. To make the Pods accessible from outside the cluster, Percona Operator for MongoDB can create [Kubernetes Services  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/) with external access.

To expose Pods externally, configure the following option in the Custom Resource:

* Set `expose.enabled` to `true` to enable exposing the Pods via Services.
* Set `expose.type` to specify the type of Service to use:

    * **`ClusterIP`**: Exposes the Pod with an internal static IP address. This makes the Service reachable only from within the Kubernetes cluster.
    * **`NodePort`**: Exposes the Pod on each Kubernetes Node’s IP address at a static port.  A ClusterIP Service is automatically created, and the Node port routes traffic to it. The Service is reachable from outside the cluster using the Node address and port number, but the address is bound to a specific Kubernetes Node.
        
        The `expose.externalTrafficPolicy` Custom Resource option in [`replsets`](operator.md#replsetsexposeexternaltrafficpolicy), [`sharding.configsvrReplSet`](operator.md#shardingconfigsvrreplsetexposeexternaltrafficpolicy), and [`sharding.mongos`](operator.md#shardingmongosexternaltrafficpolicy) subsections controls how external traffic is routed:

        * `Local`: Traffic is routed to node-local endpoints. External requests will be dropped if there is no available Pod on the Node.
        * `Cluster`: Traffic can be routed to any Node in the cluster, but this adds extra latency and does not preserve the client IP address.

    * **`LoadBalancer`**: Exposes the Pod externally using a cloud provider’s load balancer. Both [ClusterIP and NodePort Services are automatically created :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer) in this variant.

If the NodePort type is used, the URI looks like this:

```mongodb://databaseAdmin:databaseAdminPassword@<node1>:<port1>,<node2>:<port2>,<node3>:<port3>/admin?replicaSet=rs0&ssl=false```

All Node addresses should be *directly* reachable by the application.

## Service per Pod

To make all database Pods accessible, Percona Operator for MongoDB can assign a [Kubernetes Service  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/) to each Pod. This Service per Pod option allows your application to handle Cursor tracking instead of relying on a single Service. This solves the problem of `CursorNotFound` errors that occur when a Service transparently cycles between mongos instances while your client is still iterating a cursor on a large collection.

This feature can be enabled for both sharded and non-sharded clusters by setting the [sharding.mongos.expose.servicePerPod](operator.md#shardingmongosexposeserviceperpod) Custom Resource option to `true` in the [deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) file.

If this feature is enabled with the `expose.type: NodePort`, the created Services look like this:

```bash
kubectl get svc
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

2. **`ServiceMesh`**: Use a special FQDN using the Pod name (i.e., `cluster1-rs0-0.psmdb.svc.cluster.local`), assuming it's resolvable and available in all clusters. This mode is designed for service mesh environments where Pod names are resolvable across clusters. Starting with version 1.22.0, the integration with service meshes is improved. See [application protocol support](#application-protocol-support-for-service-mesh-integrations) to learn more.

3. **`External`**: Use exposed IP addresses in replica set configuration if the replica set is exposed; otherwise, use local FQDN. **This copies the behavior of the Operator v1.13.**

   !!! warning

    Be careful with the `clusterServiceDNSMode=External` variant. Using IP addresses instead of DNS hostnames is discouraged in MongoDB. IP addresses make reconfiguration and recovery more complicated, and are **generally problematic in scenarios where IP addresses change**. In particular, if you delete and recreate the cluster with `clusterServiceDNSMode=External` without deleting its volumes (having `percona.com/delete-psmdb-pvc` finalizer unset), your cluster will crash and there will be no straightforward way to recover it.

If backups are enabled in your cluster, you need to restart replica set and config server replica set Pods after changing `clusterServiceDNSMode`. This option changes the hostnames inside the replica set configuration. Since `pbm-agents` running in your cluster don't discover this change, you must restart them too. You may see errors in `backup-agent` container logs, and your backups may not work until you restart the agents.

To make a manual restart, run the `kubectl rollout restart sts
<clusterName>-<replsetName>` command for each replica set in the
`spec.replsets`. For sharded cluster, also restart config servers with the
`kubectl rollout restart sts <clusterName>-cfg`.  

Alternatively, you can simply
[restart your cluster](pause.md).



### Application protocol support for service mesh integrations

Starting from version 1.22.0, the Operator automatically sets `appProtocol: mongo` on Service ports for all Services (replica sets, config servers, and mongos). This configuration is essential when using service mesh implementations such as Istio.

MongoDB uses a server-first protocol, meaning the server sends data first when establishing a connection. Without explicit protocol specification, service meshes cannot properly detect the protocol and may fail to establish Mutual TLS (mTLS) connections. By setting `appProtocol: mongo`, the Operator tells the service mesh which protocol to expect, enabling proper protocol detection and ensuring mTLS connections work correctly.

The `appProtocol` field is set automatically by the Operator and cannot be configured manually.

## Exposing replica set with split-horizon DNS

[Split-horizon DNS  :octicons-link-external-16:](https://en.wikipedia.org/wiki/Split-horizon_DNS) provides each replica set Pod with a set of DNS URIs for external usage. This allows you to communicate with replica set Pods both from inside the Kubernetes cluster and from outside Kubernetes.

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

URIs for external usage are specified as key-value pairs, where the key is an arbitrary name and the value is the actual URI. The URI may include a port number. If no port is specified, the default MongoDB port (27017) is used.

Starting with version 1.22.0, the Operator adds the DNS records defined in the `splitHorizons` subsection to the certificates it generates. 

Split horizon has following limitations:

* duplicating domain names in horizons is not allowed by MongoDB
* using IP addresses in horizons is not allowed by MongoDB
* horizons should be set for *all Pods of a replica set* or not set at all

