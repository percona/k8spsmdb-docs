# Scale Percona Server for MongoDB on Kubernetes

One of the great advantages brought by Kubernetes is
the ease of an application scaling. Scaling a Deployment up or down ensures new
Pods are created and set to available Kubernetes nodes.

Scaling can be [vertical](#vertical-scaling) and [horizontal](#horizontal-scaling). Vertical scaling adds more compute or
storage resources to MongoDB nodes; horizontal scaling is about adding more
nodes to the cluster. [High availability](architecture.md#high-availability)
looks technically similar, because it also involves additional nodes, but the
reason is maintaining liveness of the system in case of server or network
failures.

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

### Scale storage

Kubernetes manages storage with the following components:

* a PersistentVolume (PV) - a segment of
storage supplied by the Kubernetes administrator,
* a PersistentVolumeClaim
(PVC) - a request for storage from a user.

Starting with Kubernetes v1.11, you can increase the size of an existing PVC object (considered stable since Kubernetes v1.24).
Note that you **cannot** shrink the size of an existing PVC object.

Use storage scaling to keep up with growing data while keeping the cluster online. The Operator supports the following scaling options:

* automatic scaling - Starting with version 1.22.0, the Operator monitors storage usage and scales the storage automatically
* storage resizing with Volume Expansion capability - Starting with version 1.16.0, instruct the Operator to scale the storage by updating the Custom Resource manifest
* manual scaling - scale the storage manually.

You can also use an external autoscaler with the Operator. Enabling an external autoscaler disables the Operator's internal logic for automatic storage resizing. Choose one method based on your environment and requirements; using both simultaneously is not supported.

For either option, the volume type must support PVC expansion.
To check if your storage supports the expansion capability, run the following command:

```bash
kubectl describe sc <storage class name> | grep AllowVolumeExpansion
```

??? example "Expected output"

    ``` {.text .no-copy}
    AllowVolumeExpansion: true
    ```

Find exact details about
PVCs and the supported volume types in [Kubernetes
documentation  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#expanding-persistent-volumes-claims).

#### Automatic storage resizing

Starting with version 1.22.0, the Operator can automatically resize Persistent Volume Claims (PVCs) for replica sets and config server Pods based on your configured thresholds. The Operator monitors storage usage of all PVCs and when it exceeds the defined threshold, triggers resizing until the storage size reaches the maximum limit. 

This feature gives you:

* fewer outages from full disks because storage grows with demand
* less guesswork on capacity planning and fewer last-minute fixes
* lower operational effort for developers and platform engineers
* cost control by expanding only when needed
* a more predictable environment so teams can focus on delivery

To enable automatic storage resizing, edit the `deploy/cr.yaml` Custom Resource manifest as follows:
{.power-number}

1. Make sure each MongoDB container has a storage size set.

    Example for a replica set container:

    ```yaml
    replsets:
    - name: rs0
      volumeSpec:
        persistentVolumeClaim:
          resources:
            requests:
              storage: 3Gi
    ```

2. Configure autoscaling thresholds in the `storageScaling` subsection:

    * `enableVolumeScaling` - set to `true`
    * `autoscaling.enabled` - set to `true`
    * `autoscaling.triggerThresholdPercent` - specify the usage percentage. When the usage exceeds this threshold, this triggers autoscaling
    * `autoscaling.growthStep` - specify how much to increase the storage on
    * `autoscaling.maxSize` - specify the upper limit for storage growth. When this limit is reached, scaling is no longer possible.

    Example configuration:

    ```yaml
    spec:
      storageScaling:
        enableVolumeScaling: true
        autoscaling:
          enabled: true
          triggerThresholdPercent: 80
          growthStep: 2Gi
          maxSize: "10Gi"
    ```

3. Apply the configuration:

    ```bash
    kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

When the Operator changes the storage size, it updates the Custom Resource status as follows:

* adds the `pvc-resize-in-progress` annotation. The annotation contains the timestamp of the resize start and indicates that the resize operation is running. After the resize finishes, the Operator deletes this annotation.
* records the new size in the `currentSize` field
* updates the `resizeCount` field.

Run the `kubectl get psmdb -o yaml -n <namespace>` to check the current cluster state.

??? example "Sample output"

    ```{.text .no-copy}
    storageAutoscaling:
      mongod-data-my-cluster-name-rs0-0:
        currentSize: 5123744Ki
        lastResizeTime: "2026-01-23T15:08:59Z"
        resizeCount: 2
    ```

The `storageAutoscaling` section appears under `.status` in the Custom Resource.

When the storage size reaches the limit, no further resizing is done and this event is recorded in the logs. You can either clean up the data or set a new limit based on your organization's policies and requirements. For help with common issues, see [Troubleshooting storage resizing](troubleshooting-storage-resizing.md).

#### Storage resizing with Volume Expansion capability

To enable storage resizing via volume expansion, do the following:
{.power-number}

1. Set the [storageScaling.enableVolumeScaling](operator.md#enablevolumescaling) Custom Resource option to `true` (it is turned off by default).
2. Specify new storage size for the  `replsets.<NAME>.volumeSpec.persistentVolumeClaim.resources.requests.storage`
and/or `configsvrReplSet.volumeSpec.persistentVolumeClaim.resources.requests.storage`
options in the Custom Resource. 

    This is the example configuration of defining a new storage size in the `deploy/cr.yaml` file:

    ``` {.text .no-copy}
    spec:
      ...
      enableVolumeExpansion: true
      ...
      replsets:
        ...
        volumeSpec:
          persistentVolumeClaim:
            resources:
              requests:
                storage: <NEW STORAGE SIZE>
      ...
      configsvrReplSets:
        volumeSpec:
          persistentVolumeClaim:
            resources:
              requests:
                storage: <NEW STORAGE SIZE>
    ```

3. Apply changes as usual:

    ```bash
    kubectl apply -f cr.yaml
    ```

The storage size change takes some time. When it starts, the Operator automatically adds the `pvc-resize-in-progress` annotation to the `PerconaServerMongoDB` Custom Resource. The annotation contains the timestamp of the resize start and indicates that the resize operation is running. After the resize finishes, the Operator deletes this annotation.

#### Manual scaling without Volume Expansion capability

Manual scaling is the way to go if:

* your version of the Operator is older than 1.16.0,
* your volumes have a type that does not support Volume Expansion, or 
* you do not rely on automated scaling.

You will need to delete Pods and their persistent volumes one by one to resync 
the data to the new volumes. **This way you can also shrink the storage.**

Here's how to resize the storage:
{.power-number}

1. Update the Custom Resource with the new storage size by editing and applying
    the `deploy/cr.yaml` file:

    ``` {.text .no-copy}
    spec:
      ...
      replsets:
        ...
        volumeSpec:
          persistentVolumeClaim:
            resources:
              requests:
                storage: <NEW STORAGE SIZE>
    ```

2. Apply the Custom Resource for the changes to come into effect:

    ```bash
    kubectl apply -f deploy/cr.yaml
    ```

3. Delete the StatefulSet with the `orphan` option

    ```bash
    kubectl delete sts <statefulset-name> --cascade=orphan
    ```

    The Pods will not go down and the Operator is going to recreate
    the StatefulSet:

    ```bash
    kubectl get sts <statefulset-name>
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        my-cluster-name-rs0       3/3     39s
        ```

4. Scale up the cluster (Optional)

    Changing the storage size would require us to terminate the Pods, which 
    decreases the computational power of the cluster and might cause performance 
    issues. To improve performance during the operation we are going to 
    change the size of the cluster from 3 to 5 nodes:

    ```yaml
    spec:
      ...
      replsets:
        ...
        size: 5
    ```
    
    Apply the change:
    
    ```bash
    kubectl apply -f deploy/cr.yaml
    ```

    New Pods will already have the new storage size:
    
    ```bash
    kubectl get pvc
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        NAME                                STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
        mongod-data-my-cluster-name-cfg-0   Bound    pvc-a2b37f4d-6f11-443c-8670-de82ce9fc335   10Gi       RWO            standard       110m
        mongod-data-my-cluster-name-cfg-1   Bound    pvc-ded949e5-0f93-4f57-ab2c-7c5fd9528fa0   10Gi       RWO            standard       109m
        mongod-data-my-cluster-name-cfg-2   Bound    pvc-f3a441dd-94b6-4dc0-b96c-58b7851dfaa0   10Gi       RWO            standard       108m
        mongod-data-my-cluster-name-rs0-0   Bound    pvc-b183c40b-c165-445a-aacd-9a34b8fff227   19Gi       RWO            standard       49m
        mongod-data-my-cluster-name-rs0-1   Bound    pvc-f186426b-cbbe-4c31-860e-97a4dfca3de0   19Gi       RWO            standard       47m
        mongod-data-my-cluster-name-rs0-2   Bound    pvc-6beb6ccd-8b3a-4580-b3ef-a2345a2c21d6   19Gi       RWO            standard       45m 
        ```

5. Delete PVCs and Pods with the old storage size one by one. Wait for data to sync 
    before you proceed to the next node.

    ```bash
    kubectl delete pvc <PVC NAME>
    kubectl delete pod <POD NAME>
    ```

    The new PVC is going to be created along with the Pod.

The storage size change takes some time. When it starts, the Operator automatically adds the `pvc-resize-in-progress` annotation to the `PerconaServerMongoDB` Custom Resource. The annotation contains the timestamp of the resize start and indicates that the resize operation is running. After the resize finishes, the Operator deletes this annotation.

#### Storage resizing with an external autoscaler

You can configure the Operator to use an external storage autoscaler instead of its own resizing logic. This ability may be useful for organizations needing centralized, advanced, or cross-application scaling policies.

To use an external autoscaler, set the `spec.storageScaling.enableExternalAutoscaling` option to `true` in the Custom Resource manifest.

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

### Sharding

You can change the size for different components of your MongoDB sharded cluster by setting these options in the appropriate subsections:

* [sharding.configsvrReplSet.size](operator.md#shardingconfigsvrreplsetsize) allows you to set the number of [Config Server instances  :octicons-link-external-16:](https://docs.mongodb.com/manual/core/sharded-cluster-config-servers/) in a sharded cluster,
* [sharding.mongos.size](operator.md#shardingmongossize) allows you to set the number of [mongos  :octicons-link-external-16:](https://docs.mongodb.com/manual/core/sharded-cluster-query-router/) instances in a sharded cluster.

#### Changing the number of shards

You can change the number of shards of an existing cluster by adding or removing members in the [spec.replsets](https://docs.percona.com/percona-operator-for-mongodb/operator.html#replsets-section) subsection.

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
