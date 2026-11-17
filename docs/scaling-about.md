# About scaling and storage

A cluster rarely stays the size you first deployed it at. This page covers the three ways
the Operator lets a cluster grow - more members, bigger members, and bigger disks - and
which of them need planning before you deploy.

## Ways to scale

| Approach | What changes | Choose it when |
|---|---|---|
| *Horizontal scaling* | The number of replica set members (`replsets.size`). | You need more redundancy or more read capacity. |
| *Vertical scaling* | CPU and memory requests and limits (`resources`), set by hand or from VPA recommendations. | Members are resource-bound rather than too few. |
| *Storage scaling* | The size of the persistent volumes behind the members (`replsets.volumeSpec`). | The dataset outgrows the disks. |

For horizontal scaling, see [Scale replica sets and shards](scaling.md). To change CPU and memory either manually or from VPA recommendations,
see [Vertical scaling](scaling-vertical.md). 

## Storage

Each data-bearing member gets its own persistent volume, defined in
`replsets.volumeSpec`. The storage class you pick decides what you can do with that
volume later, so it is worth choosing deliberately rather than falling back to the
cluster default: whether it can be [resized](scaling-storage-resize.md) as data grows, and
whether it supports [PVC snapshots](backups-pvc-snapshots.md) for backups. For
node-local volumes instead of a cluster-provisioned PVC - `emptyDir` and `hostPath` -
see [Manage local storage](storage.md).

### Growing volumes

Volume expansion is controlled by the `storageScaling` section of the Custom Resource:

* `storageScaling.enableVolumeScaling` - lets the Operator resize PVCs when you change
  the size in the spec. When it is disabled, PVC sizes stay as they are even if the spec
  changes.
* `storageScaling.enableExternalAutoscaling` - hands volume autoscaling to an external
  storage autoscaler. When enabled, the Operator skips its own autoscaling and resize
  operations. This option is unrelated to the Vertical Pod Autoscaler (VPA), which sizes CPU and
  memory only.

For the full step-by-step procedures - automatic resizing, Volume Expansion, manual
resizing without Volume Expansion, and external autoscalers - see
[Resize storage](scaling-storage-resize.md).

Not every storage class supports expansion. If a resize does not take effect, start with
[Troubleshoot storage resizing](debug-storage.md).

### Volume attributes

Some storage systems expose tunables such as IOPS and throughput through a
`VolumeAttributesClass`. See [volume-attributes-class.md](volume-attributes-class.md).


## Limitations

* **Volumes cannot shrink.** Kubernetes supports expanding a PersistentVolumeClaim, not
  reducing it, and the Operator rejects a spec that asks for less storage than is already
  provisioned. To move to smaller volumes you have to create a new cluster and restore into
  it.
* Expansion depends on the storage class. A `StorageClass` without
  `allowVolumeExpansion: true` cannot grow its volumes at all, so this is worth checking
  before you need it rather than during an incident.
* Scaling a replica set changes its voting membership. Review
  [High availability and topology](ha-topology.md) before changing member counts.

## Verify a scaling change

```bash
kubectl get psmdb -n $NAMESPACE
kubectl get pvc -n $NAMESPACE
```

The cluster must return to `ready`, and PVC capacity must show the new size. A PVC stuck at
the old size with the cluster otherwise healthy means the storage class did not accept the
expansion - check the PVC events.

## See also

* [Scale replica sets and shards](scaling.md)
* [Vertical scaling](scaling-vertical.md)
* [Configure vertical autoscaling](scaling-vpa.md)
* [Resize storage](scaling-storage-resize.md)
* [Local storage support](storage.md)
* [Known limitations](limitations.md)
