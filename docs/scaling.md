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

Use our reference documentation for the [Custom Resource options](operator.md) 
for more details about other components.

### Scale storage

Kubernetes manages storage with a PersistentVolume (PV), a segment of
storage supplied by the administrator, and a PersistentVolumeClaim
(PVC), a request for storage from a user. In Kubernetes v1.11 the
feature was added to allow a user to increase the size of an existing
PVC object (considered stable since Kubernetes v1.24).
The user cannot shrink the size of an existing PVC object.

Starting from the version 1.16.0, the Operator allows to scale Percona Server
for MongoDB storage automatically by changing the appropriate Custom Resource
option, if the volume type supports PVCs expansion.

#### Automated scaling with Volume Expansion capability


#### Automated scaling with Volume Expansion capability

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

The Operator 2.5.0 and newer is able to detect if the storage usage on the PVC
reaches a certain threshold, and trigger the PVC resize. Such autoscaling needs
the "auto-growable disk" feature turned on when deploying the Operator.
This is done via the `PGO_FEATURE_GATES` environment variable set in the
`deploy/operator.yaml` manifest (or in the appropriate part of `deploy/bundle.yaml`):

```yaml
...
subjects:
- kind: ServiceAccount
  name: percona-postgresql-operator
  namespace: pg-operator
...
spec:
  containers:
  - env:
    - name: PGO_FEATURE_GATES
      value: "AutoGrowVolumes=true"
...
```

When the support for auto-growable disks is turned on, the
`spec.instances[].dataVolumeClaimSpec.resources.limits.storage` Custom Resource
option sets the maximum value available for the Operator to scale up.



and higher will automatically expand such storage
for you when you change the
`replsets.<NAME>.volumeSpec.persistentVolumeClaim.resources.requests.storage`
and/or `configsvrReplSet.volumeSpec.persistentVolumeClaim.resources.requests.storage`
options in the Custom Resource.

For example, you can do it by editing and applying the `deploy/cr.yaml` file:

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

Apply changes as usual:

``` {.bash data-prompt="$" }
$ kubectl apply -f cr.yaml
```

## Horizontal scaling

The size of the cluster is controlled by the `size` key in the
[Custom Resource options](operator.md)
configuration.

!!! note

    The Operator will not allow to scale Percona Server for MongoDB with the
    `kubectl scale statefulset <StatefulSet name>` command as it puts `size`
    configuration options out of sync.

You can change size separately for different components of your cluster by
setting this option in the appropriate subsections:

* [replsets.size](operator.md#replsetssize) allows to set the size of the
    MongoDB Replica Set,
* [replsets.arbiter.size](operator.md#replsetsarbitersize) allows to set the
    number of [Replica Set Arbiter instances](arbiter.md),
* [sharding.configsvrReplSet.size](operator.md#shardingconfigsvrreplsetsize)
    allows to set the number of [Config Server instances  :octicons-link-external-16:](https://docs.mongodb.com/manual/core/sharded-cluster-config-servers/),
* [sharding.mongos.size](operator.md#shardingmongossize) allows to set the
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
