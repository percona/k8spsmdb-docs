# Scale Percona Server for MongoDB on Kubernetes and OpenShift

One of the great advantages brought by Kubernetes and the OpenShift platform is
the ease of an application scaling. Scaling a Deployment up or down ensures new
Pods are created and set to available Kubernetes nodes.

Scaling can be vertical and horizontal. Vertical scaling adds more compute or
storage resources to MongoDB nodes; horizontal scaling is about adding more
nodes to the cluster. [High availability](architecture.md#high-availability)
looks technically similar, because it also involves additional nodes, but the
reason is maintaining liveness of the system in case of server or network
failures.

## Vertical scaling

### Scale compute

There are multiple components that Operator deploys and manages: MongoDB replica
set instances, mongos and config server instances, etc. To add or reduce CPU or
Memory you need to edit corresponding sections in the Custom Resource. We follow
the structure for requests and limits that Kubernetes [provides  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/).

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

Use our reference documentation for the [Custom Resource options](operator.md#operator-custom-resource-options) 
for more details about other components.

### Scale storage

Kubernetes manages storage with a PersistentVolume (PV), a segment of
storage supplied by the administrator, and a PersistentVolumeClaim
(PVC), a request for storage from a user. In Kubernetes v1.11 the
feature was added to allow a user to increase the size of an existing
PVC object. The user cannot shrink the size of an existing PVC object.

#### Volume Expansion capability

Certain volume types support PVCs expansion (exact details about
PVCs and the supported volume types can be found in [Kubernetes
documentation  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#expanding-persistent-volumes-claims)).

You can run the following command to check if your storage supports the expansion capability:

``` {.bash data-prompt="$" }
$ kubectl describe sc <storage class name> | grep AllowVolumeExpansion
```

??? example "Expected output"

    ``` {.text .no-copy}
    AllowVolumeExpansion: true
    ```

1. Get the list of volumes for you MongoDB cluster:

    ``` {.bash data-prompt="$" }
    $ kubectl get pvc -l app.kubernetes.io/instance=<CLUSTER_NAME>
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        NAME                                STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
        mongod-data-my-cluster-name-cfg-0   Bound    pvc-a2b37f4d-6f11-443c-8670-de82ce9fc335   3Gi        RWO            standard       13m
        mongod-data-my-cluster-name-cfg-1   Bound    pvc-ded949e5-0f93-4f57-ab2c-7c5fd9528fa0   3Gi        RWO            standard       12m
        mongod-data-my-cluster-name-cfg-2   Bound    pvc-f3a441dd-94b6-4dc0-b96c-58b7851dfaa0   3Gi        RWO            standard       12m
        mongod-data-my-cluster-name-rs0-0   Bound    pvc-b183c40b-c165-445a-aacd-9a34b8fff227   3Gi        RWO            standard       13m
        mongod-data-my-cluster-name-rs0-1   Bound    pvc-f186426b-cbbe-4c31-860e-97a4dfca3de0   3Gi        RWO            standard       12m
        mongod-data-my-cluster-name-rs0-2   Bound    pvc-6beb6ccd-8b3a-4580-b3ef-a2345a2c21d6   3Gi        RWO            standard       12m
        ```

2. Patch the volume to increase the size

    You can either edit the pvc or run the patch command:

    ``` {.bash data-prompt="$" }
    $ kubectl patch pvc <pvc-name> -p '{ "spec": { "resources": { "requests": { "storage": "NEW STORAGE SIZE" }}}}'
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        persistentvolumeclaim/mongod-data-my-cluster-name-rs0-0 patched
        ```

3. Check if expansion is successful by running describe:

    ``` {.bash data-prompt="$" }
    $ kubectl describe pvc <pvc-name>
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        ...
        Normal  ExternalExpanding           3m52s              volume_expand                                                                                     CSI migration enabled for kubernetes.io/gce-pd; waiting for external resizer to expand the pvc
        Normal  Resizing                    3m52s              external-resizer pd.csi.storage.gke.io                                                            External resizer is resizing volume pvc-b183c40b-c165-445a-aacd-9a34b8fff227
        Normal  FileSystemResizeRequired    3m44s              external-resizer pd.csi.storage.gke.io                                                            Require file system resize of volume on node
        Normal  FileSystemResizeSuccessful  3m10s              kubelet                                                                                           MountVolume.NodeExpandVolume succeeded for volume "pvc-b183c40b-c165-445a-aacd-9a34b8fff227"
        ```

    Repeat step 2 for all the volumes of your cluster.

4. Now we have increased storage, but our StatefulSet 
    and Custom Resource are not in sync. Edit your Custom
    Resource with new storage settings and apply:

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

    Apply the Custom Resource:

    ``` {.bash data-prompt="$" }
    $ kubectl apply -f cr.yaml
    ```

5. Delete the StatefulSet to syncronize it with Custom
    Resource:

    ``` {.bash data-prompt="$" }
    $ kubectl delete sts <statefulset-name> --cascade=orphan
    ```

    The Pods will not go down and Operator is going to recreate
    the StatefulSet:

    ``` {.bash data-prompt="$" }
    $ kubectl get sts <statefulset-name>
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        my-cluster-name-rs0       3/3     39s
        ```

#### No Volume Expansion capability

Scaling the storage without Volume Expansion is also possible. We will
need to delete Pods one by one and their persistent volumes to resync 
the data to the new volumes. This can also be used to shrink the storage.

1. Edit the Custom Resource with the new storage size as follows:

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

    Apply the Custom Resource update in a usual way:

    ``` {.bash data-prompt="$" }
    $ kubectl apply -f deploy/cr.yaml
    ```

2. Delete the StatefulSet with the `orphan` option

    ``` {.bash data-prompt="$" }
    $ kubectl delete sts <statefulset-name> --cascade=orphan
    ```

    The Pods will not go down and the Operator is going to recreate
    the StatefulSet:

    ``` {.bash data-prompt="$" }
    $ kubectl get sts <statefulset-name>
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        my-cluster-name-rs0       3/3     39s
        ```

3. Scale up the cluster (Optional)

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
    
    ``` {.bash data-prompt="$" }
    $ kubectl apply -f deploy/cr.yaml
    ```

    New Pods will already have new storage:
    
    ``` {.bash data-prompt="$" }
    $ kubectl get pvc
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

4. Delete PVCs and Pods with old storage size one by one. Wait for data to sync 
    before you proceeding to the next node.

    ``` {.bash data-prompt="$" }
    $ kubectl delete pvc <PVC NAME>
    $ kubectl delete pod <POD NAME>
    ```
    The new PVC is going to be created along with the Pod.

## Horizontal scaling

The size of the cluster is controlled by the `size` key in the
[Custom Resource options](operator.md#operator-custom-resource-options)
configuration.

!!! note

    The Operator will not allow to scale Percona Server for MongoDB with the
    `kubectl scale statefulset <StatefulSet name>` command as it puts `size`
    configuration options out of sync.

You can change size separately for different components of your cluster by
setting this option in the appropriate subsections:

* [replsets.size](operator.md#replsets-size) allows to set the size of the
    MongoDB Replica Set,
* [replsets.arbiter.size](operator.md#replsets-arbiter-size) allows to set the
    number of [Replica Set Arbiter instances](arbiter.md#arbiter),
* [sharding.configsvrReplSet.size](operator.md#sharding-configsvrreplset-size)
    allows to set the number of [Config Server instances  :octicons-link-external-16:](https://docs.mongodb.com/manual/core/sharded-cluster-config-servers/),
* [sharding.mongos.size](operator.md#sharding-mongos-size) allows to set the
    number of [mongos  :octicons-link-external-16:](https://docs.mongodb.com/manual/core/sharded-cluster-query-router/)
    instances.

For example, the following update in `deploy/cr.yaml` will set the size of the
MongoDB Replica Set to `5` nodes:

```yaml
spec:
  ...
  replsets:
    ...
    size: 5
```

Don’t forget to apply changes as usual, running the
`kubectl apply -f deploy/cr.yaml` command.
