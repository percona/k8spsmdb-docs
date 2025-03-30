# Local Storage support for the Percona Operator for MongoDB

Among the wide rage of volume types, supported by Kubernetes, there are two
volume types which allow Pod containers to access part of the local filesystem
on the node the *emptyDir* and *hostPath*.

## emptyDir

A Pod [emptyDir volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir)
is created when the Pod is assigned to a Node. The volume is initially empty and
is erased when the Pod is removed from the Node. The containers in the Pod can
read and write the files in the emptyDir volume.

The `emptyDir` options in the [deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml)
file can be used to turn the emptyDir volume on by setting the directory name.

The `emptyDir` is useful when you use [Percona Memory Engine  :octicons-link-external-16:](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/inmemory.html).

## hostPath

A [hostPath volume  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath)
mounts an existing file or directory from the host node’s filesystem into
the Pod. If the pod is removed, the data persists in the host node’s filesystem.

The `volumeSpec.hostPath` subsection in the
[deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml)
file may include `path` and `type` keys to set the node’s filesystem object
path and to specify whether it is a file, a directory, or something else (e.g.
a socket):

```yaml
volumeSpec:
  hostPath:
    path: /data
    type: Directory
```

Please note, you must created the hostPath manually and should have following
attributes:

* access permissions,
* ownership,
* SELinux security context.

The `hostPath` volume is useful when you perform manual actions
during the first run and require improved disk performance.
Consider using the tolerations settings to avoid a cluster migration to
different hardware in case of a reboot or a hardware failure.

More details can be found in the [official hostPath Kubernetes documentation  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath).
