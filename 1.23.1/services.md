> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Services and ports

The Operator creates Kubernetes Services so that applications reach the database and the cluster members find each other. This page lists every Service, the ports it publishes, and when it exists.

The examples use a cluster named `my-cluster-name` with a replica set named `rs0`. Replace them with the `metadata.name` of your Custom Resource and the names of your replica sets.

## Which Service to connect to

Applications connect to `mongos` in a sharded cluster, and to the replica set members in a replica set. There is no proxy in between.

| You want to                           | Sharded cluster                                                                         | Replica set                                                                                                                             |
| ------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Read and write from inside Kubernetes | `my-cluster-name-mongos`, port 27017                                                    | `mongodb+srv://` connection string with the headless Service `my-cluster-name-rs0`. The driver finds the members and the primary itself |
| Connect from outside Kubernetes       | `my-cluster-name-mongos` with the type `LoadBalancer` or `NodePort`                     | One Service per Pod, `my-cluster-name-rs0-0`, `my-cluster-name-rs0-1`, …, with the type `LoadBalancer` or `NodePort`                    |
| Keep a cursor on one router           | One Service per `mongos` Pod: `my-cluster-name-mongos-0`, `my-cluster-name-mongos-1`, … | Not applicable                                                                                                                          |
| Reach one member directly             | `my-cluster-name-rs0-0.my-cluster-name-rs0.<namespace>.svc.cluster.local`, port 27017   | The same                                                                                                                                |

The [connection Secrets](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/connection-secrets.html) hold ready-made connection strings for each case. For how a client request reaches the data, see [How clients connect](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture.html#how-clients-connect).

## Client-facing Services

These Services are the entry points to the cluster. Their type is `ClusterIP` unless you change it in the Custom Resource.

| Service                                                   | Ports | Created when                                                                                                                                                                  | Type and options set in                                                                                                                  |
| --------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `my-cluster-name-mongos`                                  | 27017 | Sharding is on and `sharding.mongos.expose.servicePerPod` is `false`, the default                                                                                             | [`sharding.mongos.expose`](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#shardingmongosexposetype)          |
| `my-cluster-name-mongos-0`, `my-cluster-name-mongos-1`, … | 27017 | Sharding is on and `sharding.mongos.expose.servicePerPod` is `true`. The shared `my-cluster-name-mongos` Service is removed then                                              | [`sharding.mongos.expose`](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#shardingmongosexposeserviceperpod) |
| `my-cluster-name-rs0-0`, `my-cluster-name-rs0-1`, …       | 27017 | `replsets[].expose.enabled` is `true`. One Service for each Pod of the replica set. The same applies to the config server replica set with `sharding.configsvrReplSet.expose` | [`replsets.expose`](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#replsetsexposeenabled)                    |

Each per-Pod Service selects one Pod by its name and publishes the Pod’s address whether the Pod is ready or not. The Operator removes these Services when you turn the option off or reduce the size.

Exposed members are reachable from outside

With the type `LoadBalancer`, a member or `mongos` is reachable from wherever the load balancer is. Limit access with `loadBalancerSourceRanges`, and keep TLS on. See [Networking and external access](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/expose.html).

### Traffic and exposure options

The client-facing Services accept the same set of standard Kubernetes options:

- `type`: `ClusterIP`, `NodePort` or `LoadBalancer`
- `annotations`, `labels` and `loadBalancerSourceRanges`
- `externalTrafficPolicy` for `NodePort` and `LoadBalancer`, and `internalTrafficPolicy`
- `loadBalancerClass`, starting with version 1.20.0
- `externalDNS`, to have [External DNS](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/expose.html#automatic-dns-records-with-external-dns) create a DNS record for each Service

An exposed replica set doesn’t change how members find each other unless you also change the host names in the replica set configuration. See [Controlling hostnames in replset configuration](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/expose.html#controlling-hostnames-in-replset-configuration).

## Internal Services

These Services are for the Operator and the cluster’s own components. Applications use them only through DNS, as described in [Which Service to connect to](#which-service-to-connect-to).

| Service                                                             | Type                                                     | Ports                            | Contains                                                                            | Used by                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `my-cluster-name-rs0`, one for each replica set                     | Headless                                                 | 27017                            | Ready Pods of the replica set: data-bearing, arbiter, non-voting and hidden members | Drivers that use `mongodb+srv` connection strings. The DNS names of the members, such as `my-cluster-name-rs0-0.my-cluster-name-rs0`, which go into the replica set configuration. The Operator and the PBM agents for their database connections |
| `my-cluster-name-cfg`                                               | Headless                                                 | 27017                            | Ready Pods of the config server replica set                                         | `mongos`, to reach the config servers. The Operator and the PBM agents                                                                                                                                                                            |
| `my-cluster-name-rs0-search`, one for each data-bearing replica set | Headless, publishes addresses of Pods that are not ready | 27028 for gRPC, 9946 for metrics | The `mongot` Pods                                                                   | `mongod` and `mongos`, to send search queries. Created when [search](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/search-overview.html) is on                                                                                     |

With [Multi-Cluster Services](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/replication-mcs.html) enabled, the Operator also creates a ServiceExport for the cluster’s Services, so that they are reachable from the other clusters of the fleet.

## Ports in the Pods

| Port  | Purpose                                                                                             | Container                                                            |
| ----- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 27017 | MongoDB. Change it with `net.port` in the `configuration` section of a replica set                  | `mongod` and its variants for arbiter, non-voting and hidden members |
| 27017 | MongoDB query router. Change it with `net.port` in the `configuration` section of `sharding.mongos` | `mongos`                                                             |
| 27028 | gRPC for search queries                                                                             | `mongot`                                                             |
| 8080  | Health check for the probes                                                                         | `mongot`                                                             |
| 9946  | Prometheus metrics                                                                                  | `mongot`                                                             |

The PBM agents in the `backup-agent` containers don’t listen on a port. They connect to the local `mongod` and to the backup storage.

## See also

- [Design and architecture](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture.html#how-clients-connect) for how a client request reaches the data
- [Networking and external access](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/expose.html) for how to publish the Services outside Kubernetes
- [Connection secrets](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/connection-secrets.html) for ready-made connection strings
- [Objects the Operator creates](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/objects-created.html) for the rest of what the Operator creates
