# Multiple storages for backups

You can define several storage locations for backups. The Operator treats one of them as the
**main storage** and the rest as **profiles**:

* The **main storage** holds backups *and* the oplog chunks used for point-in-time recovery.
  There is exactly one.
* **Profiles** hold backups only.

Keeping oplog on a single storage is what makes the data consistent, and it is why you can
recover to a point in time from a backup held on any storage.

!!! note

    This applies to Operator version 1.20.0 and later. Earlier versions allowed only one
    storage when point-in-time recovery was enabled, and switching storage meant waiting for
    the Operator to reconfigure the cluster and resync metadata.

## Define the main storage

When you configure only one storage, the Operator automatically uses it as the main one until you add more. When you add another storage, you must mark which one is the main using the `main: true` flag in the `deploy/cr.yaml` Custom Resource manifest. 

```yaml
storages:
  s3-us-west:
    main: true
    type: s3
```

Note that you can have only one main storage. All other storages are added as profiles.

To check the list of profiles, connect to the database Pod and run the `pbm profile list` command. For example, for the cluster `cluster1`, the command looks as follows:

```bash
kubectl exec cluster1-rs0-0 -c backup-agent -- pbm profile list
```

You can run other [profile management commands :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/reference/pbm-commands.html#pbm-profile-add) in the same way.

## Change the main storage

You can change the main storage by reassigning the `main: true` flag for another one. The Operator then:

* Resyncs the metadata for the new main storage 
* Deletes the profile for it
* Adds the previous main storage as a profile

## Pass storage configuration via restore objects

Usually you define the storage configuration within the `deploy/cr.yaml` Custom Resource manifest. You can also pass it to the Operator within the `backupSource` option of a Restore object. For example, when you restore the failed site after a disaster. The Operator then checks the current configuration and:

* If there is no storage configured there, it uses the one from the Restore object as the main storage. After the restore it reverts the PBM configuration. You must define the main storage in the `deploy/cr.yaml` file to run further backups. 
* If the `deploy/cr.yaml` Custom Resource manifest has the storage configured and it differs from the one from the Restore object, the Operator adds the storage from the Restore object as a profile.

## Backup metadata resync

The Operator resyncs the metadata in the following cases:

For the main storage:
 
* When the main storage changes
* When you manually start a resync using the `pbm config --force resync`

For the profile storage:

* When you start a restore from a backup on a profile
* When you manually resync the metadata on a profile using the `pbm profile sync <storage-name>` command

For the main storage and profiles:

* When you added an annotation `percona.com/resync-pbm=true` to the `deploy/cr.yaml` Custom Resource manifest. 

Note that resync is a resource consuming task and we don't recommend to run it manually. Read more when you need to run it in [PBM documentation :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/reference/config.html#syncronize-configuration)

The improved support for multiple backup storages brings the following benefits:

* Enables you to make a point-in-time recovery from any storage with guaranteed data consistency
* Reduces the load on the cluster for reconfiguration when the storage for a next backup changes	 

## Upgrade considerations

You must specify the main storage during the upgrade. If you use a single storage, it will automatically be marked as main in the Custom Resource manifest. If you use multiple storages, you must define one of them as main. 

The following command shows how to set the `s3-us-west` storage as the main one:

```bash
kubectl patch psmdb my-cluster-name --type=merge --patch '{
    "spec": {
      "crVersion": "1.20.0",
      "image": "percona/percona-server-mongodb:7.0.18-11",
      "backup": {
        "image": "percona/percona-backup-mongodb:2.9.1",
        "storages": {
          "s3-us-west": {
            "main": true
          }
        }
      },
      "pmm": {
        "image": "percona/pmm-client:2.44.1"
      }
    }
  }'
```

For more information about the upgrades, see the [Update documentation](update.md)