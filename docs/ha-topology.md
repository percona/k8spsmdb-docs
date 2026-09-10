# About high availability and topology

The Operator runs Percona Server for MongoDB as a replica set. The topology you choose
decides how many node failures the cluster survives, how it scales, and how clients reach
it. This page explains the options so you can pick one before you start configuring.

## Choose your topology

| Topology | What it is | Choose it when |
|---|---|---|
| *Replica set* | A single replica set of data-bearing members that hold the same data. | Your dataset and write throughput fit on one set of nodes. This is the default. |
| *Sharded cluster* | Several replica sets (shards) that each hold a part of the data, a config server replica set that stores cluster metadata, and `mongos` routers that clients connect to. | Your dataset or write throughput outgrows a single replica set, or you need to keep data close to a region. |

You define the topology in the `deploy/cr.yaml` Custom Resource:

* `replsets` - the list of replica sets and their members.
* `sharding.enabled` - turns sharding on or off. When it is on, `sharding.configsvrReplSet`
  configures the config server replica set and `sharding.mongos` configures the routers.

Sharding is not a one-way door: see [Turning sharding on and off](sharding.md#turning-sharding-on-and-off).

## Replica set members

A replica set combines several member types. Only data-bearing voting members serve normal
reads and writes; the others exist to shape failover behavior, add read capacity, or carry
workloads that must not affect clients.

| Member type | Custom Resource field | Holds data | Typical use |
|---|---|---|---|
| Data-bearing | `replsets.size` | Yes | The working members of the replica set. |
| Arbiter | `replsets.arbiter.enabled`, `replsets.arbiter.size` | No | Break election ties without paying for another data-bearing node. |
| Non-voting | `replsets.nonvoting.enabled`, `replsets.nonvoting.size` | Yes | Add read capacity or reach beyond the MongoDB voting-member limit. |
| Hidden | `replsets.hidden.enabled`, `replsets.hidden.size` | Yes | Run backups, analytics, or delayed copies without serving application traffic. |

For what each member type does, its trade-offs, and how to configure it, see
[Replica set members](arbiter.md).

!!! note

    Arbiters change the default write concern of the replica set. Review
    [Default read and write concern for replica sets with an Arbiter](arbiter.md#default-read-and-write-concern-for-replica-sets-with-an-arbiter)
    before you add one.

## Read and write concerns

The `defaultRWConcern` section sets the cluster-wide defaults that apply when a client does
not specify its own:

* `defaultRWConcern.readConcern` accepts `local`, `available`, or `majority`.
* `defaultRWConcern.writeConcern` sets the default write concern.

## Where Pods run

Surviving the loss of a node, a rack, or a zone depends on the Pods being spread across
them. The Operator applies anti-affinity by default, and you can shape placement further
with node selectors, topology spread constraints, tolerations, and priority classes. See
[Pod placement and scheduling](constraints.md).

Anti-affinity only protects against *involuntary* disruption - a node dying takes down at
most one replica set member, because the others are elsewhere. It does nothing against
*voluntary* disruption, such as a node drain during a cluster upgrade, which can evict
several anti-affinitized Pods back to back and break quorum anyway. A
[Pod Disruption Budget](constraints.md#pod-disruption-budgets) is what limits how many Pods
a voluntary disruption can take down at once, and is what actually closes that gap.

Arbiters need particular attention here, because an arbiter sharing a host with a
data-bearing member removes the redundancy it was added to provide. See
[Prevent Arbiter nodes on the same Kubernetes hosts with data-bearing replica set members](arbiter.md#prevent-arbiter-nodes-on-the-same-kubernetes-hosts-with-data-bearing-replica-set-members).

## Limitations

Topology choices interact with other features - selective restores, cross-site replication,
and search each place their own constraints on sharding and member types. See
[Known limitations](limitations.md).

## See also

* [MongoDB sharding](sharding.md)
* [Replica set members](arbiter.md)
* [Pod placement and scheduling](constraints.md)
* [Disaster recovery and multi-site](replication.md)
