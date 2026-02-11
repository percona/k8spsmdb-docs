# Remote file server

You can use the `filesystem` backup storage type to mount a *remote file server* to
a local directory as a *sidecar volume*, and make Percona Backup for MongoDB
use this directory as a storage for backups.

The approach is based on using common
[Network File System (NFS) protocol :octicons-link-external-16:](https://en.wikipedia.org/wiki/Network_File_System).
Particularly, this storage type is useful in network-restricted environments
without S3-compatible storage, or in cases with a non-standard storage service
that still supports NFS access.

1. Add the remote storage as a [sidecar volume](operator.md#replsetssidecarvolumesname)
    in the `replset` section of the Custom Resource (and also in `configsvrReplSet`
    in case of a sharded cluster). You will need to specify the server hostname
    and some directory on it, as in the following example:

    ```yaml
    replsets:
    - name: rs0
      ...
      sidecarVolumes:
      - name: backup-nfs-vol
        nfs:
          server: "nfs-service.storage.svc.cluster.local"
          path: "/psmdb-my-cluster-name-rs0"
      ...
    ```

    The `backup-nfs-vol` name specified above will be used to refer this
    sidecar volume in the backup section.

2. Now put the mount point (the local directory path to which the remote storage
    will be mounted) and the name of your sidecar volume into the
    `backup.volumeMounts` subsection of the Custom Resource:

    ```yaml
    backup:
      ...
      volumeMounts:
      - mountPath: /mnt/nfs/
        name: backup-nfs-vol
      ...
    ```

3. Finally, storage of the `filesystem` type needs to be configured in the
    `backup.storages` subsection. It needs only the mount point:

    ```yaml
    backup:
      enabled: true
      ...
      storages:
        backup-nfs:
          type: filesystem
          filesystem:
            path: /mnt/nfs/
    ```
