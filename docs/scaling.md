# Scale replica sets and shards

Horizontal scaling changes the number of members in the cluster. Add replica set members for redundancy and read capacity, or add shards when one replica set can no longer hold the data or the write load. To give existing members more CPU and memory instead, see [Vertical scaling](scaling-vertical.md). To grow volumes, see [Resize storage](scaling-storage-resize.md).

Changing the member count changes the replica set's voting membership. Review [High availability and topology](ha-topology.md) before you scale.

<a name="vertical-scaling"></a>
<a name="scale-storage"></a>
<a name="horizontal-scaling"></a>

## Replica sets

You can change the size separately for different components of your MongoDB replica set by setting these options in the appropriate subsections:

* [replsets.size](operator.md#replsetssize) allows you to set the size of the MongoDB Replica Set,
* [replsets.nonvoting.size](operator.md#replsetsnonvotingsize) allows you to set the number of non-voting members,
* [replsets.arbiter.size](operator.md#replsetsarbitersize) allows you to set the number of [Replica Set Arbiter instances](arbiter.md),

For example, the following update in `deploy/cr.yaml` sets the size of the MongoDB Replica Set `rs0` to `5` nodes:

```yaml
spec:
  ...
  replsets:
  - name: rs0
    size: 5
    ...
```

Don’t forget to apply changes as usual, running the `kubectl apply -f deploy/cr.yaml` command.

!!! note

    The Operator will not allow to scale Percona Server for MongoDB with the `kubectl scale statefulset <StatefulSet name>` command as it puts `size` configuration options out of sync.

**Verify the change.** Export your namespace, replacing `<namespace>` with your value, then count the `mongod` Pods for the replica set:

```bash
export NAMESPACE=<namespace>
kubectl get pods -n $NAMESPACE -l app.kubernetes.io/component=mongod,app.kubernetes.io/replset=rs0
```

The number of Pods returned must match the `size` you set. You can also check the
cluster's overall readiness:

```bash
kubectl get psmdb -n $NAMESPACE
```

The cluster must show the `ready` state, and `status.ready`/`status.size` in
`kubectl get psmdb <cluster-name> -n $NAMESPACE -o yaml` must both reflect the new
member count. See [Custom resource statuses](cr-statuses.md) for the full status field
reference.

## Sharding

You can change the size for different components of your MongoDB sharded cluster by setting these options in the appropriate subsections:

* [sharding.configsvrReplSet.size](operator.md#shardingconfigsvrreplsetsize) allows you to set the number of [Config Server instances  :octicons-link-external-16:](https://docs.mongodb.com/manual/core/sharded-cluster-config-servers/) in a sharded cluster,
* [sharding.mongos.size](operator.md#shardingmongossize) allows you to set the number of [mongos :octicons-link-external-16:](https://docs.mongodb.com/manual/core/sharded-cluster-query-router/) instances in a sharded cluster.

**Verify the change.** Count the `mongos` Pods:

```bash
kubectl get pods -n $NAMESPACE -l app.kubernetes.io/component=mongos
```

The number of Pods must match `sharding.mongos.size`. Check the config server replica
set the same way, by its component label:

```bash
kubectl get pods -n $NAMESPACE -l app.kubernetes.io/component=mongod,app.kubernetes.io/replset=cfg
```

The number of Pods must match `sharding.configsvrReplSet.size` or your custom config server replica set name if you changed it. For more details, see the section on [Configuring instances of a sharded cluster](sharding.md#configuring-instances-of-a-sharded-cluster).

### Changing the number of shards

You can change the number of shards of an existing cluster by adding or removing members in the [spec.replsets](operator.md#operator-replsets-section) subsection.

For example, given the following cluster that has 2 shards:

```yaml
spec:
  ...
  replsets:
  - name: rs0
    size: 3
    ...
  - name: rs1
    size: 3
    ...
```

You can add an extra shard by applying the following configuration:

```yaml
spec:
  ...
  replsets:
  - name: rs0
    size: 3
    ...
  - name: rs1
    size: 3
    ...
  - name: rs2
    size: 3
    ...
```

Similarly, you can reduce the number of shards by removing the `rs1` and `rs2` elements:

```yaml
spec:
  ...
  replsets:
  - name: rs0
    size: 3
    ...
```

!!! note

    The Operator will not allow you to remove existing shards unless they don't have any user-created collections. It is your responsibility to ensure the shard's data is [migrated to the remaining shards](https://www.mongodb.com/docs/manual/tutorial/remove-shards-from-cluster) in the cluster before trying to applying this change.

## See also

* [Scaling and storage](scaling-about.md)
* [Vertical scaling](scaling-vertical.md)
* [Resize storage](scaling-storage-resize.md)
* [Manage local storage](storage.md)
* [Configure VolumeAttributesClass](volume-attributes-class.md)
