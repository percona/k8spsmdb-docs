> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Scale Percona Server for MongoDB on Kubernetes

One of the great advantages brought by Kubernetes is the ease of an application scaling. Scaling a Deployment up or down ensures new Pods are created and set to available Kubernetes nodes.

This page covers [vertical](#vertical-scaling) and [horizontal](#horizontal-scaling) scaling. Vertical scaling adds more compute (CPU and memory) to MongoDB nodes; horizontal scaling is about adding more nodes to the cluster. Storage capacity is scaled separately - see [Resize storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling-storage-resize.html). [High availability](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/architecture.html#high-availability) looks technically similar to horizontal scaling, because it also involves additional nodes, but the reason is maintaining liveness of the system in case of server or network failures.

## Vertical scaling

### Scale compute resources

The Operator deploys and manages multiple components, such as MongoDB replica set instances, `mongos` and config server replica set instances, and others. You can manage CPU or memory for every component separately by editing corresponding sections in the Custom Resource. We follow the structure for requests and limits that [Kubernetes provides](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/) .

To add more resources to your MongoDB replica set instances, edit the following section in the Custom Resource:

```
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

Use our reference documentation for the [Custom Resource options](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html) for more details about other components.

If a container is restarted with `OOMKilled` after you lower a memory limit, or because the workload grew, see [Troubleshoot out-of-memory errors](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug-oom.html).

Storage capacity is scaled separately - see [Resize storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling-storage-resize.html).

## Horizontal scaling

### Replica Sets

You can change the size separately for different components of your MongoDB replica set by setting these options in the appropriate subsections:

- [replsets.size](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#replsetssize) allows you to set the size of the MongoDB Replica Set,
- [replsets.nonvoting.size](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#replsetsnonvotingsize) allows you to set the number of non-voting members,
- [replsets.arbiter.size](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#replsetsarbitersize) allows you to set the number of [Replica Set Arbiter instances](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/arbiter.html),

For example, the following update in `deploy/cr.yaml` sets the size of the MongoDB Replica Set `rs0` to `5` nodes:

```
spec:
  ...
  replsets:
  - name: rs0
    size: 5
    ...
```

Don’t forget to apply changes as usual, running the `kubectl apply -f deploy/cr.yaml` command.

Note

The Operator will not allow to scale Percona Server for MongoDB with the `kubectl scale statefulset <StatefulSet name>` command as it puts `size` configuration options out of sync.

**Verify the change.** Export your namespace, replacing `<namespace>` with your value, then count the `mongod` Pods for the replica set:

```
export NAMESPACE=<namespace>
kubectl get pods -n $NAMESPACE -l app.kubernetes.io/component=mongod,app.kubernetes.io/replset=rs0
```

The number of Pods returned must match the `size` you set. You can also check the cluster’s overall readiness:

```
kubectl get psmdb -n $NAMESPACE
```

The cluster must show the `ready` state, and `status.ready`/`status.size` in `kubectl get psmdb <cluster-name> -n $NAMESPACE -o yaml` must both reflect the new member count. See [Custom resource statuses](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/cr-statuses.html) for the full status field reference.

### Sharding

You can change the size for different components of your MongoDB sharded cluster by setting these options in the appropriate subsections:

- [sharding.configsvrReplSet.size](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#shardingconfigsvrreplsetsize) allows you to set the number of [Config Server instances](https://docs.mongodb.com/manual/core/sharded-cluster-config-servers/) in a sharded cluster,
- [sharding.mongos.size](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#shardingmongossize) allows you to set the number of [mongos](https://docs.mongodb.com/manual/core/sharded-cluster-query-router/) instances in a sharded cluster.

**Verify the change.** Count the `mongos` Pods:

```
kubectl get pods -n $NAMESPACE -l app.kubernetes.io/component=mongos
```

The number of Pods must match `sharding.mongos.size`. Check the config server replica set the same way, by its component label:

```
kubectl get pods -n $NAMESPACE -l app.kubernetes.io/component=mongod,app.kubernetes.io/replset=cfg
```

The number of Pods must match `sharding.configsvrReplSet.size` or your custom config server replica set name if you changed it. For more details, see the section on [Configuring instances of a sharded cluster](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/sharding.html#configuring-instances-of-a-sharded-cluster).

#### Changing the number of shards

You can change the number of shards of an existing cluster by adding or removing members in the [spec.replsets](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#operator-replsets-section) subsection.

For example, given the following cluster that has 2 shards:

```
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

```
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

```
spec:
  ...
  replsets:
  - name: rs0
    size: 3
    ...
```

Note

The Operator will not allow you to remove existing shards unless they don’t have any user-created collections. It is your responsibility to ensure the shard’s data is [migrated to the remaining shards](https://www.mongodb.com/docs/manual/tutorial/remove-shards-from-cluster) in the cluster before trying to applying this change.

## See also

- [Scaling and storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling-about.html)
- [Resize storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling-storage-resize.html)
- [Manage local storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/storage.html)
- [Configure VolumeAttributesClass](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/volume-attributes-class.html)
