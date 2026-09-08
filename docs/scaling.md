# Scale Percona Server for MongoDB on Kubernetes

One of the great advantages brought by Kubernetes is
the ease of an application scaling. Scaling a Deployment up or down ensures new
Pods are created and set to available Kubernetes nodes.

This page covers [vertical](#vertical-scaling) and [horizontal](#horizontal-scaling)
scaling. Vertical scaling adds more compute (CPU and memory) to MongoDB nodes;
horizontal scaling is about adding more nodes to the cluster. Storage capacity is
scaled separately - see [Resize storage](scaling-storage-resize.md). [High availability](architecture.md#high-availability)
looks technically similar to horizontal scaling, because it also involves additional
nodes, but the reason is maintaining liveness of the system in case of server or
network failures.

## Vertical scaling

### Scale compute resources

The Operator deploys and manages multiple components, such as MongoDB replica
set instances, `mongos` and config server replica set instances, and others. You can manage CPU or memory for every component separately by editing corresponding sections in the Custom Resource. We follow
the structure for requests and limits that [Kubernetes provides  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/).

To add more resources to your MongoDB replica set instances, edit the following
section in the Custom Resource:

```yaml
spec:
  replsets:
    resources:
      requests: 
        memory: 4G
        cpu: 2
      limits:
        memory: 4G
        cpu: 2
```

Use our reference documentation for the [Custom Resource options](operator.md) 
for more details about other components.

<a name="scale-storage"></a>

Storage capacity is scaled separately - see [Resize storage](scaling-storage-resize.md).

## Horizontal scaling

### Replica Sets

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

### Sharding

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

#### Changing the number of shards

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
* [Resize storage](scaling-storage-resize.md)
* [Manage local storage](storage.md)
* [Configure VolumeAttributesClass](volume-attributes-class.md)
