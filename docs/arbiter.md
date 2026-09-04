# Arbiter, non-voting and hidden nodes

A Percona Server for MongoDB replica set is a group of `mongod` instances that hold the same data, so the cluster survives the loss of any single member. One member is **primary** and accepts all writes; the rest are **secondary**, replicating the data set and, optionally, serving reads to spread the load. Secondary members can also take on a special role - arbiter, non-voting, or hidden.

The replica set picks its primary through [elections :octicons-link-external-16:](https://docs.mongodb.com/manual/core/replica-set-elections/#replica-set-elections), and elections only work reliably when the number of voting members is odd. An even count risks a tied vote.

By default, the Operator creates a three-member replica set: one primary and two secondaries. This is the minimum recommended configuration. A replica set can have up to 50 members, with a maximum of 7 voting among them.

## Replica set member types

Beyond the primary and regular secondaries, a replica set can include these special member types:

* **Arbiter**: participates in elections but stores no data. Add one when cost constraints rule out another full secondary.
* **Non-voting**: holds a full copy of the data but does not vote in elections. Use it to scale read capacity beyond the seven-member voting limit.
* **Hidden**: holds a full copy of the data but is invisible to client applications. It's still a voting member by default. Use it for backups or batch jobs that must not affect client traffic.

### Arbiter nodes

An Arbiter node participates in replica set elections but stores no data. Its role is to break ties in a replica set with an even number of data-bearing nodes, so a primary can always be elected. Because it holds no data, an Arbiter needs minimal resources and no persistent volume. Use it to reduce costs.

To add an Arbiter node, add an `arbiter` section under `replsets` in your `deploy/cr.yaml` file and set `enabled` and `size`.

This example creates a cluster with 4 data instances and 1 Arbiter:

```yaml
replsets:
  size: 4
  arbiter:
    enabled: true
    size: 1
```

Find the description of other available options in the [replsets.arbiter section](operator.md#replsetsarbiterenabled) of the [Custom Resource options reference](operator.md).

**Verify the Arbiter joined the replica set.** [Connect to the cluster](connect.md), then check its state:

```javascript
rs.status().members
```

The Arbiter's entry shows `stateStr: 'ARBITER'`. To confirm it's configured as an arbiter (not just currently acting as one), check the replica set configuration instead:

```javascript
rs.conf().members
```

The same entry shows `arbiterOnly: true`.

### Default read and write concern for replica sets with an Arbiter

MongoDB's [implicit default write concern  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/reference/write-concern/#implicit-default-write-concern) falls back to `w: 1` instead of `w: "majority"` when a replica set has an Arbiter and the number of data-bearing voting members alone isn't enough to reach a voting majority — for example, 2 data nodes plus 1 Arbiter, which is exactly the kind of configuration this Operator's Arbiter feature is meant for. With `w: 1`, the primary acknowledges a write as soon as it applies it locally. If the primary then fails over before that write replicates to the secondary, the write is silently [rolled back  :octicons-link-external-16:](https://www.mongodb.com/docs/manual/core/replica-set-rollbacks/) once the old primary rejoins the set, even though the client already received a success response. To close this gap, the Operator always sets the cluster-wide default read and write concern to `majority` whenever a replica set has an Arbiter enabled, regardless of the exact node count.

Note the trade-off: with `w: "majority"` in a Primary-Secondary-Arbiter (PSA) replica set, the Arbiter holds no data and therefore can never acknowledge a write, so `majority` effectively requires both the primary and the secondary to be up. If the secondary becomes unavailable, `majority`-write-concern operations can stall or time out. You can override the Operator's defaults using the [`defaultRWConcern`](operator.md#defaultrwconcernreadconcern) section in your `deploy/cr.yaml` file if you'd rather favor availability over this durability guarantee:

```yaml
spec:
  defaultRWConcern:
    readConcern: majority
    writeConcern:
      w: majority
      wtimeout: 5000
```

Setting `defaultRWConcern` also applies the specified default read and write concern to replica sets without an Arbiter, and to sharded clusters.

### Prevent Arbiter nodes on the same Kubernetes hosts with data-bearing replica set members

By default, Arbiter nodes can run on the same Kubernetes hosts as your data nodes, which keeps the node count down but raises the odds of a 50/50 vote split if the network partitions. To prevent this, apply an [anti-affinity](constraints.md#affinity-and-anti-affinity) constraint that forces Arbiter nodes onto separate nodes:

```yaml
arbiter:
  enabled: true
  size: 1
  affinity:
    antiAffinityTopologyKey: "kubernetes.io/hostname"
    advanced:
      podAntiAffinity:
        requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchLabels:
              app.kubernetes.io/component: mongod
              app.kubernetes.io/instance: cluster1
              app.kubernetes.io/managed-by: percona-server-mongodb-operator
              app.kubernetes.io/name: percona-server-mongodb
              app.kubernetes.io/part-of: percona-server-mongodb
              app.kubernetes.io/replset: rs0
          topologyKey: kubernetes.io/hostname
```

## Non-voting nodes

A non-voting node is a secondary that holds a full copy of the data but does not vote in primary elections. Use it to scale a replica set beyond the seven-member voting limit, or to place a member in a remote location where network latency would make it a liability as a voter.

To add non-voting nodes, set `replsets.nonvoting.enabled` and `replsets.nonvoting.size` in your `deploy/cr.yaml` file.

This example creates a cluster with 3 data instances and 1 non-voting instance:

```yaml
replsets:
  size: 3
  nonvoting:
    enabled: true
    size: 1
```

Find the description of other available options in the [replsets.nonvoting section](operator.md#replsetsnonvotingenabled) of the [Custom Resource options reference](operator.md).

You can also add a non-voting node or an external arbiter in another location through the `externalNodes` option. See [Voting members across sites](replication.md#voting-members-across-sites) and [Deploy Primary-Secondary-Arbiter across sites](replication-multi-dc.md#deploy-primary-secondary-arbiter-across-sites) for details.

**Verify the node is non-voting.** [Connect to the cluster](connect.md), then run:

```javascript
rs.config().members
```

The non-voting member's entry shows `votes: 0`.

## Hidden nodes

A hidden node is a secondary that holds a full copy of the data but is invisible to client applications - it's not listed in the replica set's SRV record, so clients never connect to it. It always has priority `0` and so can never become primary, but it's still a voting member by default and can take part in elections. See [Manage voting members](#manage-voting-members-in-replica-set) below for how the Operator handles that.

Hidden nodes are useful for backups, reporting, or other workloads that must not affect primary operations.

To add a hidden node, set `replsets.hidden.enabled` and `replsets.hidden.size` in your `deploy/cr.yaml` file.

This example creates a cluster with 3 data instances and 2 hidden nodes:

```yaml
replsets:
  size: 3
  hidden:
    enabled: true
    size: 2
```

Find the description of other available options in the [replsets.hidden section](operator.md#replsetshiddenenabled) of the [Custom Resource options reference](operator.md).

**Verify the node is hidden.** [Connect to the cluster](connect.md), then run:

```javascript
rs.config().members
```

The hidden member's entry shows `hidden: true` and `priority: 0`.

### Manage voting members in replica set

Since hidden nodes can participate in elections, the Operator enforces rules to keep the number of voting members odd and the replica set in a stable, compliant configuration:

* If the total number of voting members is even, the Operator converts one node to non-voting to restore an odd count. It typically converts the last Pod in the list.
* If the number of voting members is odd and no more than 7, every node votes.
* If the number of voting members exceeds 7, the Operator converts enough nodes to non-voting to stay within MongoDB's limit of 7 voting members.

To inspect the current configuration, connect to the cluster with clusterAdmin privileges and run:

```javascript
rs.config()
```
