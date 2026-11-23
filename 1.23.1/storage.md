> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Local Storage support for the Percona Operator for MongoDB

Among the wide rage of volume types, supported by Kubernetes, there are two volume types which allow Pod containers to access part of the local filesystem on the node the *emptyDir* and *hostPath*.

## Choose the right storage option

This page covers node-local volume types - `emptyDir` and `hostPath` - for the special cases described below. For most data-bearing members, you instead want a cluster-provisioned `PersistentVolumeClaim`, configured through `replsets.volumeSpec.persistentVolumeClaim`. If that’s what you’re after:

- To grow an existing volume’s size, see [Resize storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling-storage-resize.html).
- For snapshot-based backup support, see [PVC snapshots](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pvc-snapshots.html).

## emptyDir

A Pod [emptyDir volume](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir) is created when the Pod is assigned to a Node. The volume is initially empty and is erased when the Pod is removed from the Node. The containers in the Pod can read and write the files in the emptyDir volume.

The `emptyDir` options in the [deploy/cr.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) file can be used to turn the emptyDir volume on by setting the directory name.

The `emptyDir` is useful when you use [Percona Memory Engine](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/inmemory.html) .

## hostPath

A [hostPath volume](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath) mounts an existing file or directory from the host node’s filesystem into the Pod. If the pod is removed, the data persists in the host node’s filesystem.

The `volumeSpec.hostPath` subsection in the [deploy/cr.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) file may include `path` and `type` keys to set the node’s filesystem object path and to specify whether it is a file, a directory, or something else (e.g. a socket):

```
volumeSpec:
  hostPath:
    path: /data
    type: Directory
```

Please note, you must created the hostPath manually and should have following attributes:

- access permissions,
- ownership,
- SELinux security context.

The `hostPath` volume is useful when you perform manual actions during the first run and require improved disk performance. Consider using the tolerations settings to avoid a cluster migration to different hardware in case of a reboot or a hardware failure.

More details can be found in the [official hostPath Kubernetes documentation](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath) .

## See also

- [Resize storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling-storage-resize.html)
- [Configure VolumeAttributesClass](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/volume-attributes-class.html)
- [PVC snapshots](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pvc-snapshots.html)
