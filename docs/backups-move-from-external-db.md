# How to use backups to move the external database to Kubernetes

The Operator allows restoring a backup not only on the Kubernetes cluster where
it was made, but also on any Kubernetes-based environment with the installed
Operator, and the backup/restore tool actually used by the Operator is the [Percona Backup for MongoDB  :octicons-link-external-16:](https://github.com/percona/percona-backup-mongodb).
That makes it possible to *move* external MongoDB Cluster to Kubernetes with
Percona Backup for MongoDB.

!!! note

    There are other scenarios for migrating MongoDB database to Kubernetes as
    well. For example, [this blogpost  :octicons-link-external-16:](https://www.percona.com/blog/migrating-mongodb-to-kubernetes)
    covers migration based on the regular MongoDB replication capabilities.

Backups can be stored either locally, or remotely (on [Amazon S3 or S3-compatible storage  :octicons-link-external-16:](https://en.wikipedia.org/wiki/Amazon_S3#S3_API_and_competing_services),
or on [Azure Blob Storage  :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/storage/blobs/)).
 S3-compatible storage to be used for backups.

1. Make sure the following prerequisite requirements are satisfied within your
    setup:

    * Percona Backup for MongoDB packages are installed on the replica set nodes
        of the source cluster
        [following the official installation instructions  :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/installation.html),
        and the authentication of the pbm-agent
        [is configured  :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/initial-setup.html#configure-authentication-in-mongodb)
        to allow it accessing your database.

    * The Operator and the *destination* cluster should be
        [installed](index.md#quickstart-guides) in the Kuberentes-based
        environment. For simplicity, it's reasonable to have the same topology
        of the *source* and *destination* clusters, although Percona Backup for
        MongoDB [allows replset-remapping  :octicons-link-external-16:](https://www.percona.com/blog/moving-mongodb-cluster-to-a-different-environment-with-percona-backup-for-mongodb/) as well.

2. Configure the cloud storage for backups on your *source* cluster following
    the [official guide  :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/initial-setup.html#configure-remote-backup-storage).
    For example, using the Amazon S3 storage can be configured with the
    following YAML file:

    ``` yaml title="pbm_config.yaml"
    type: s3
    s3:
      region: us-west-2
      bucket: pbm-test-bucket
      credentials:
        access-key-id: <your-access-key-id-here>
        secret-access-key: <your-secret-key-here>
    ```

    After putting all needed details into the file (`AWS_ACCESS_KEY_ID`, 
    `AWS_SECRET_ACCESS_KEY`, the S3 bucket and region in the above example),
    provide the config file to the pbm-agent on all nodes as follows:
    
    ``` {.bash data-prompt="$" }
    $ pbm config --file pbm_config.yaml
    ```
 
3. Start the pbm-agent:

    ``` {.bash data-prompt="$" }
    $ sudo systemctl start pbm-agent
    ```

4. Now you can make backup as follows:

    ``` {.bash data-prompt="$" }
    $ pbm backup --wait
    ```

    The command output will contain the *backup name*, which you will further
    use to restore the backup:
    
    ```text
    Starting backup '2022-06-15T08:18:44Z'....
    Waiting for '2022-06-15T08:18:44Z' backup.......... done
    
    pbm-conf> pbm status -s backups
    
    Backups:
    ========
    FS  /data/pbm
      Snapshots:
        2022-06-15T08:18:44Z 28.23KB <logical> [complete: 2022-06-15T08:18:49Z]
    ```

5. The rest of operations will be carried out on your *destination* cluster in
    a Kubernetes-based environment of your choice. These actions are described
    in the [How to restore backup to a new Kubernetes-based environment](backups-restore-to-new-cluster.md)
    guide. Just use the proper name of the backup (`2022-06-15T08:18:44Z`) in the
    above example, and proper parameters specific to your cloud storage (e.g. 
    the `pbm-test-bucket` bucket name we used above).

