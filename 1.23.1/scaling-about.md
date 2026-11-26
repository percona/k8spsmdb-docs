> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# About scaling and storage

A cluster rarely stays the size you first deployed it at. This page covers the three ways the Operator lets a cluster grow - more members, bigger members, and bigger disks - and which of them need planning before you deploy.

## Ways to scale

| Approach             | What changes                                                                   | Choose it when                                  |
| -------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------- |
| *Horizontal scaling* | The number of replica set members (`replsets.size`).                           | You need more redundancy or more read capacity. |
| *Vertical scaling*   | CPU and memory requests and limits (`resources`).                              | Members are resource-bound rather than too few. |
| *Storage scaling*    | The size of the persistent volumes behind the members (`replsets.volumeSpec`). | The dataset outgrows the disks.                 |

Horizontal and vertical scaling are covered in [Horizontal and vertical scaling](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling.html).

## Storage

Each data-bearing member gets its own persistent volume, defined in `replsets.volumeSpec`. The storage class you pick decides what you can do with that volume later, so it is worth choosing deliberately rather than falling back to the cluster default: whether it can be [resized](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling-storage-resize.html) as data grows, and whether it supports [PVC snapshots](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pvc-snapshots.html) for backups. For node-local volumes instead of a cluster-provisioned PVC - `emptyDir` and `hostPath` - see [Manage local storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/storage.html).

### Growing volumes

Volume expansion is controlled by the `storageScaling` section of the Custom Resource:

- `storageScaling.autoscaling` - lets the Operator grow the volumes when their usage crosses a threshold. Autoscaling covers replica set and config server volumes. Starting with version 1.24.0, it also covers the volumes that store `mongos` logs and search index data when they are enabled. The Operator uses the same scaling settings for all of them. See [Volumes and their size](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling-storage-resize.html#volumes-and-their-size).
- `storageScaling.enableVolumeScaling` - lets the Operator resize PVCs when you change the size in the spec. When it is disabled, PVC sizes stay as they are even if the spec changes.
- `storageScaling.enableExternalAutoscaling` - hands volume autoscaling to an external system such as the Kubernetes Vertical Pod Autoscaler. When enabled, the Operator skips its own autoscaling and resize operations.

For the full step-by-step procedures - automatic resizing, Volume Expansion, manual resizing without Volume Expansion, and external autoscalers - see [Resize storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling-storage-resize.html).

Not every storage class supports expansion. If a resize does not take effect, start with [Troubleshoot storage resizing](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug-storage.html).

### Volume attributes

Some storage systems expose tunables such as IOPS and throughput through a `VolumeAttributesClass`. See [volume-attributes-class.md](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/volume-attributes-class.html).

## Limitations

- **Volumes cannot shrink.** Kubernetes supports expanding a PersistentVolumeClaim, not reducing it, and the Operator rejects a spec that asks for less storage than is already provisioned. To move to smaller volumes you have to create a new cluster and restore into it.
- Expansion depends on the storage class. A `StorageClass` without `allowVolumeExpansion: true` cannot grow its volumes at all, so this is worth checking before you need it rather than during an incident.
- Scaling a replica set changes its voting membership. Review [High availability and topology](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/ha-topology.html) before changing member counts.

## Verify a scaling change

```
kubectl get psmdb -n $NAMESPACE
kubectl get pvc -n $NAMESPACE
```

The cluster must return to `ready`, and PVC capacity must show the new size. A PVC stuck at the old size with the cluster otherwise healthy means the storage class did not accept the expansion - check the PVC events.

## See also

- [Horizontal and vertical scaling](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling.html)
- [Resize storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling-storage-resize.html)
- [Local storage support](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/storage.html)
- [Known limitations](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/limitations.html)
