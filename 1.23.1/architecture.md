> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Design and architecture

This section explains how Percona Operator for MongoDB is built: what runs in your Kubernetes cluster, which component is responsible for what, and how the pieces interact. Read it to build a mental model of the system, and come back to it when something fails and you need to know where to look first. If something is failing now, start with [Initial troubleshooting](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug.html). The [Glossary](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html) explains the Kubernetes and MongoDB terms used in this section.

## What the Operator is

The Operator is a Kubernetes controller that runs as a Deployment named `percona-server-mongodb-operator`. It extends the Kubernetes API with four [Custom Resources](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html#custom-resource):

| Custom Resource                   | Short name          | Describes                                                          |
| --------------------------------- | ------------------- | ------------------------------------------------------------------ |
| `PerconaServerMongoDB`            | `psmdb`             | The database cluster: a replica set or a sharded cluster           |
| `PerconaServerMongoDBBackup`      | `psmdb-backup`      | One backup                                                         |
| `PerconaServerMongoDBRestore`     | `psmdb-restore`     | One restore                                                        |
| `PerconaServerMongoDBClusterSync` | `psmdb-clustersync` | Data migration and replication from an external MongoDB deployment |

You install the [CustomResourceDefinitions (CRDs)](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html#crd) together with the Operator. Then you describe the database that you want in a `PerconaServerMongoDB` object using the `deploy/cr.yaml` example manifest. The Operator creates and maintains everything that the cluster needs. The Operator manages only the clusters that these objects describe. It doesn’t manage MongoDB deployments created in other ways.

The Operator works as a [reconcile loop](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html#reconcile): about every five seconds it compares the Custom Resource with what runs in Kubernetes and in the database, and changes whatever differs. So you [change the cluster through the Custom Resource](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-responsibilities.html#change-the-cluster-through-the-custom-resource), not through the objects the Operator creates. For what the Operator takes care of and what stays with you, see [Who owns what](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-responsibilities.html#the-operator). For when it acts and in which order, see [How the Operator reacts to changes](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-reconciliation.html).

## Percona Server for MongoDB in brief

*Percona Server for MongoDB* is a drop-in replacement for MongoDB Community Edition. It keeps data in [replica sets](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html#replica-set). A replica set is a group of `mongod` processes that hold the same data:

- One member is the [primary](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html#primary). It accepts all writes and records them in its [oplog](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html#oplog).
- The other members are *secondaries*. They copy the primary’s oplog and apply it. Replication is asynchronous, so a secondary can be slightly behind the primary. Drivers read from the primary by default and see the latest data. If an application reads from secondaries with a read preference, it can get slightly older data. The `majority` write concern makes a write wait until most members acknowledge it, but secondaries still apply it on their own schedule.
- If the primary becomes unavailable, the voting members hold an [election](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html#election) and promote a secondary. A candidate needs the votes of a majority of the voting members. MongoDB [usually completes an election within about 12 seconds](https://www.mongodb.com/docs/manual/core/replica-set-elections/) . Drivers retry a failed write once by default, so applications often don’t notice the switch.

A replica set can have up to 50 members, and up to 7 of them can vote. Use an odd number of voting members. With three, the replica set keeps a primary when any one member goes down. With an even number, a network partition can split the voters into two equal halves, and neither half can elect a primary.

By default, the Operator creates replica sets of **three data-bearing members**. You can add [arbiters, non-voting and hidden members](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/arbiter.html) to shape failover and read capacity.

When the data or the write load outgrows one replica set, you turn on [sharding](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/sharding.html):

- Each *shard* is a replica set that holds part of the data.
- The *config server replica set* stores the cluster metadata: which data lives on which shard.
- The `mongos` *query routers* receive client queries and send each one to the shards that hold the data. `mongos` doesn’t store data.

The example manifest `deploy/cr.yaml` creates a sharded cluster with one shard named `rs0`, three config server members and three `mongos` Pods. See [High availability and topology](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/ha-topology.html) to choose between a replica set and a sharded cluster.

## How clients connect

There is no proxy between applications and the database. MongoDB drivers connect to the database Pods and find the members themselves.

- **Sharded cluster.** Applications connect to `mongos` through the `<cluster-name>-mongos` Service on port 27017 (`my-cluster-name-mongos` by default). The Service spreads connections across all `mongos` Pods, and `mongos` routes each query to the right shards.
- **Replica set.** Applications connect to the replica set members directly. The driver reads the list of members from the replica set configuration, sends writes to the primary, and finds the new primary after an election. Use a `mongodb+srv` connection string: the driver resolves the members from the DNS SRV records of the [headless Service](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html#headless-service) `my-cluster-name-rs0`, so you don’t list Pod host names yourself.

The Operator creates a [connection Secret](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/connection-secrets.html) with ready-to-use connection strings for the `databaseAdmin` user and for application users you declare in the Custom Resource. To connect from outside Kubernetes, expose the `mongos` Service or one Service per replica set Pod. To learn more, see [Networking and external access](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/expose.html). [Services and ports](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/services.html) lists every Service, its ports and when it exists.

## The four layers

A running cluster is the combined result of four layers. Most confusion during troubleshooting comes from expecting one layer to do something that belongs to another. The [Who owns what](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-responsibilities.html) page covers each layer in detail.

```
flowchart TB
  U["<b>User</b><br/>Custom Resource, Secrets,<br/>CRDs and RBAC, node and storage capacity"]
  O["<b>Operator</b><br/>reconcile loop: compares the Custom Resource<br/>with the cluster and corrects differences"]
  K["<b>Kubernetes</b><br/>StatefulSets, scheduling, storage (CSI),<br/>networking and DNS, Pod lifecycle"]
  M["<b>Percona Server for MongoDB and PBM</b><br/>replication, elections, initial sync,<br/>backups and restores"]
  U -- "writes the desired state" --> O
  O -- "creates and updates objects" --> K
  K -- "runs Pods and volumes for" --> M
  O -. "writes the replica set configuration;<br/>sends backup and restore commands" .-> M
```

- **User.** You describe the cluster you want in the `PerconaServerMongoDB` Custom Resource and provide everything the Operator cannot create for you: the CRDs and RBAC, credentials for backup storage, and enough nodes and storage to run the cluster.
- **Operator.** Runs the reconcile loop and the day-2 tasks: replica set membership, ordered restarts, passwords, certificates, backups and restores. See [What the Operator is](#what-the-operator-is) and [The Operator](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-responsibilities.html#the-operator).
- **Kubernetes.** Kubernetes turns the objects the Operator creates into running Pods. It schedules Pods to nodes, provisions and attaches volumes through the CSI driver, provides Services and DNS, and restarts failed containers.
- **Percona Server for MongoDB and Percona Backup for MongoDB.** Inside the Pods, MongoDB replicates data, holds elections and brings new members up to date with an [initial sync](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html#initial-sync). The [PBM](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html#pbm) agents in the database Pods make backups and restores.

The Operator does more inside the database than create Pods. It initializes each replica set, writes the replica set configuration, and adds and removes members when the Pods change. Elections and replication stay with MongoDB. See [Replica set membership](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-workflows.html#replica-set-membership).

## Cluster topology

The following diagrams show a cluster named `my-cluster-name` with backups enabled.

### Replica set

```
flowchart LR
  C[Clients] -. "DNS SRV lookup" .-> S["Headless Service<br/>my-cluster-name-rs0"]
  subgraph RS["Replica set rs0"]
    P0["my-cluster-name-rs0-0<br/>primary"]
    P1["my-cluster-name-rs0-1<br/>secondary"]
    P2["my-cluster-name-rs0-2<br/>secondary"]
  end
  C -- "reads and writes" --> P0
  P0 -- "oplog replication" --> P1
  P0 -- "oplog replication" --> P2
  RS -- "backup-agent containers" --> ST[("Backup storage")]
```

Each `mongod` Pod has its own [PersistentVolumeClaim](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html#pvc) for the data directory and, when backups are enabled, a `backup-agent` sidecar container with the PBM agent. Any data-bearing voting member can become the primary. The diagram shows `my-cluster-name-rs0-0` as the primary only as an example.

### Sharded cluster

```
flowchart LR
  C[Clients] --> S["Service<br/>my-cluster-name-mongos"]
  S --> M["mongos Pods"]
  subgraph CFG["Config server replica set"]
    CF["my-cluster-name-cfg-0, -1, -2"]
  end
  subgraph SH["Shard rs0"]
    R0["my-cluster-name-rs0-0, -1, -2"]
  end
  M -- "reads metadata" --> CFG
  M -- "routes queries" --> SH
  CFG -- "backup-agent" --> ST[("Backup storage")]
  SH -- "backup-agent" --> ST
```

Here is how a client request reaches the data in a sharded cluster:

1. A client connects to the `my-cluster-name-mongos` Service on port 27017. The Service forwards the connection to one of the `mongos` Pods.
1. `mongos` uses the metadata from the config server replica set to find the shards that hold the requested data.
1. `mongos` sends the query to the primary of each shard involved, or to a secondary if the client asked for it with a read preference.
1. The shard primary applies a write and replicates it to its secondaries.

Members find each other by host name, not through the Kubernetes API. The Operator writes each member into the replica set configuration with a stable DNS name, such as `my-cluster-name-rs0-0.my-cluster-name-rs0.<namespace>.svc.cluster.local:27017`. If you expose the replica set, the Operator can write the address of the per-Pod Service instead. See [Controlling hostnames in replset configuration](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/expose.html#controlling-hostnames-in-replset-configuration). `mongos` gets the config server members from its start-up arguments, and learns the shards from the metadata.

### What differs between the two topologies

|                                   | Replica set                                                                 | Sharded cluster                                                                                                                                                                                             |
| --------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| StatefulSets                      | One for each replica set                                                    | One for each shard, one for the config server replica set `my-cluster-name-cfg`, and one for `mongos`                                                                                                       |
| Client entry point                | The replica set members, through the headless Service `my-cluster-name-rs0` | `mongos`, through the `my-cluster-name-mongos` Service                                                                                                                                                      |
| Cluster endpoint in `status.host` | The headless Service of the replica set                                     | The `mongos` Service, or the list of per-Pod `mongos` Services                                                                                                                                              |
| Extra Operator tasks              | None                                                                        | Adds and removes shards, and turns the balancer on and off. See [Shards and the balancer](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-workflows.html#shards-and-the-balancer) |
| Smart Update order                | Secondaries, then the primary                                               | The config server replica set first, then the shards, then `mongos`                                                                                                                                         |
| Restore                           | Clients stay connected during a logical restore                             | The Operator stops `mongos` first, so clients can’t connect                                                                                                                                                 |
| Pause and deletion                | Members stop one at a time                                                  | `mongos` stops first, then the replica sets                                                                                                                                                                 |

Optional components run beside the members:

- **Point-in-time recovery** doesn’t add Pods. When it’s on, a PBM agent uploads the oplog to backup storage in short slices. See [Point-in-time recovery](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-workflows.html#point-in-time-recovery).
- **Percona Search for MongoDB** runs a `mongot` StatefulSet for each data-bearing replica set or shard. `mongod` or `mongos` forwards search queries to it. Applications don’t connect to `mongot`. See [About full-text and vector search](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/search-overview.html).
- **Percona ClusterSync for MongoDB (PCSM)** runs as a separate Deployment when you create a `PerconaServerMongoDBClusterSync` object. It copies data from an external MongoDB deployment into the cluster. See [Real-time replication with PCSM](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/clustersync.html).
- **Sidecar containers** such as the PMM Client for [monitoring](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/monitoring.html), the log collector for [persistent logging](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/persistent-logging.html) and your own [sidecars](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/sidecar.html) run in the database and `mongos` Pods. See [Containers in each Pod](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/objects-created.html#containers-in-each-pod).

The [Key workflows](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-workflows.html) page describes replica set membership, backups, restores and recovery step by step.

### Scheduling and storage

To survive a node failure, the Operator places the members of each replica set on separate Kubernetes nodes with [Pod anti-affinity](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#affinity-and-anti-affinity) . By default, this rule is *required* and uses the `kubernetes.io/hostname` topology key: with three members you need at least three schedulable nodes, or a Pod stays `Pending`. See [Control Pod scheduling](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/constraints.html) to change it.

If a Kubernetes node fails, Kubernetes can recreate the Pod on another node, but for a [StatefulSet](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html#statefulset) Pod it does so only after the failed Node object is removed or the stuck Pod is force-deleted. The Operator does neither. Meanwhile, MongoDB elects a new primary if the lost member was the primary, and the replica set keeps working with the remaining members.

The Pod’s data lives in a PersistentVolume, so the storage must be able to follow the Pod. The Container Storage Interface (CSI) driver and StorageClass must support attaching the volume on a different node. A volume that can attach only in one zone keeps the Pod in that zone. For local disks, see [Local storage support](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/storage.html).

## What gets created

For a cluster named `my-cluster-name`, the Operator creates a StatefulSet for each replica set, for the config server replica set and for `mongos`, together with Services, Secrets, ConfigMaps, [PodDisruptionBudgets](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html#pdb) and PVCs. Arbiter, non-voting and hidden members get StatefulSets of their own. The Operator creates no Kubernetes Jobs or CronJobs: the PBM agents make the backups, and the Operator keeps the backup schedules itself. PVCs and Secrets are not owned by the Custom Resource, so deleting the cluster doesn’t delete them unless you set the finalizers.

- [Services and ports](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/services.html) lists every Service, its ports, and when it exists.
- [Objects the Operator creates](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/objects-created.html) lists all other objects, the [finalizers](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html#finalizer) that clean them up, and the containers in each Pod.

## Next steps

[Who owns what](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture-responsibilities.html)

## See also

- [Services and ports](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/services.html)
- [Objects the Operator creates](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/objects-created.html)
- [Glossary](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/glossary.html)
- [Comparison with other solutions](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/compare.html)
