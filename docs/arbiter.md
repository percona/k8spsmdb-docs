# Replica set members and their usage 

Percona Server for MongoDB replica set is a number of `mongod` instances working together to ensure data durability and system resilience. Such configuration enhances fault tolerance and keeps your database accessible even during failures. 

A replica set consists of one **primary** node and several **secondary** nodes. The primary node accepts all write operations, while secondary nodes replicate the data set to maintain redundancy. Secondary nodes can serve read queries, which helps distribute the read load. Secondary nodes can also have additional configuration, like be non-voting or hidden.

Percona Server for MongoDB replication mechanism is based on elections, when replica set nodes [choose which node :octicons-link-external-16:](https://docs.mongodb.com/manual/core/replica-set-elections/#replica-set-elections) becomes the primary. For elections to be successful, the number fo voting members must be odd.

By default, the Operator creates Percona Server for MongoDB replica set with three members, one primary and the remaining secondaries. This is the minimal recommended configuration. A replica set can have up to 50 members with the maximum of 7 voting members. 

## Replica set member types

In a MongoDB replica set, besides the primary and regular secondaries, you can have special member configurations like hidden, arbiter, and non-voting members.

* **Arbiter**: An arbiter node participates in elections but does not store data. You may want to add arbiter nodes if cost constraints prevent you from adding another secondary node.
* **Non-voting**: This type of node stores a full copy of the data but does not participate in elections. This is useful for scaling read capacity beyond the seven-member voting limit of a replica set.
* **Hidden**: A hidden node is a secondary member that holds data but is invisible to client applications and does not participate in elections by default. It is useful for tasks like backups or running batch jobs that might otherwise interfere with primary operations.

### Arbiter nodes

An Arbiter node participates in the replica set elections but does not store any data. Its primary role is to act as a tiebreaker in a replica set with an even number of data-bearing nodes, ensuring that a primary can always be elected. By not storing data, Arbiter nodes require minimal resources, which can help reduce your overall costs. An does not demand a persistent volume.

To add an Arbiter node, you can update your `deploy/cr.yaml` file by adding an `arbiter` section under `replsets` and setting the `enabled` and `size` options to your desired values.

The following example configuration will create a cluster
with 4 data instances and 1 Arbiter:

```yaml
....
replsets:
  ....
  size: 4
  ....
  arbiter:
    enabled: true
    size: 1
    ....
```

Find the description of other available options in the [replsets.arbiter section](operator.md#replsetsarbiterenabled) of the [Custom Resource options reference](operator.md).

### Prevent Arbiter nodes on the same Kubernetes hosts with data-bearing replica set members

By default, Arbiter nodes are allowed to run on the same Kubernetes hosts as your data nodes. This may be reasonable in terms of the number of
Kubernetes Nodes required for the cluster. But as a result it increases
possibility to have 50/50 votes division in case of network partitioning. 
To prevent this, you can apply an [anti-affinity](constraints.md) constraint, which forces arbiter nodes to be scheduled on separate nodes:

```yaml
....
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

A non-voting node is a secondary member that stores a full copy of the data but does not participate in elections for the primary node. Non-voting nodes enable you to deploy a replica set with more than seven data-bearing nodes. You can also add a non-voting node to a remote location where network latency might make it unsuitable for voting.

You can add non-voting nodes by setting the `replsets.nonvoting.enabled` and `replsets.nonvoting.size` options in your `deploy/cr.yaml` file. 

In this example, the Operator will create a cluster with
3 data instances and 1 non-voting instance:

```yaml
....
replsets:
  ....
  size: 3
  ....
  nonvoting:
    enabled: true
    size: 1
    ....
```

Find the description of other available options in the [replsets.nonvoting section](operator.md#replsetsnonvotingenabled) of the [Custom Resource options reference](operator.md).

Note that you can add a non-voting node in the edge location through the `externalNodes` option. Please see [cross-site replication documentation](replication.md) for details.

## Hidden nodes

Hidden nodes are secondary members that hold a full copy of the data but are not visible to client applications. Hidden always have a 0 priority and therefore, cannot become a primary. But they may vote in primary elections. Read more how the Operator [manages voting members in replica set](#manage-voting-members-in-replica-set).

Hidden nodes are useful for tasks like backups or reporting, as they do not affect primary operations. Client applications will not connect to hidden nodes because they are not listed in the replica set's SRV record.

To add a hidden node with the Operator, set the setting the `replsets.hidden.enabled` and `replsets.hidden.size` options  in the `deploy/cr.yaml` file:

This configuration example create a cluster with 3 data instances and 2 hidden nodes:

```yaml
....
replsets:
  ....
  size: 3
  ....
  hidden:
    enabled: true
    size: 2
    ....
```

Find the description of other available options in the [replsets.hidden section](operator.md#replsetshidden) of the [Custom Resource options reference](operator.md).

## Manage voting members in replica set

Since [hidden nodes](#hidden-nodes) can participate in elections, the Operator enforces rules to ensure the odd number of voting members and maintain a stable and compliant replica set configuration:

* If the total number of voting members is even, the Operator converts one node to non-voting to maintain an odd number of voters. The node to convert is typically the last Pod in the list
* If the number of voting members is odd and not more than 7, all nodes participate in elections.
* If the number of voting members exceeds 7, the Operator automatically converts some nodes to non-voting to stay within MongoDB’s limit of 7 voting members.

To inspect the current configuration, connect to the cluster with clusterAdmin privileges and run:

```javascript
rs.config() command
```
