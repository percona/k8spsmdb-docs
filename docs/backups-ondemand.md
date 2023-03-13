# Making on-demand backup

1. To make an on-demand backup, you should first check your Custom Resource for
    the necessary options and make changes, if needed, using the
    `deploy/cr.yaml` configuration file:

    * the `backup.enabled` key should be set to `true`,

    * `backup.storages` subsection should contain at least one [configured storage](backups-storage.md).

    You can apply changes in the `deploy/cr.yaml` file with the usual
    `kubectl apply -f deploy/cr.yaml` command.

2. Now use *a special backup configuration YAML file* with the following
    keys:

    * `metadata.name` key should be set to the **backup name**
        (this name will be needed later to [restore the bakup](backups-restore.md)),

    * `spec.clusterName` key should be set to the name of your cluster (prior to
        the Operator version 1.12.0 this key was named `spec.psmdbCluster`),

    * `spec.storageName` key should be set to the name of your [already configured storage](backups-storage.md).

    * optionally you can set the `spec.type` key to `physical` if you would like
       to make physical backups instead of logical ones (please see the
       [physical backups limitations](backups.md#physical)). Otherwise set
       this key to `logical`, or just omit it.

    You can find the example of such file in
    [deploy/backup/backup.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/backup/backup.yaml):

    ```yaml
    apiVersion: psmdb.percona.com/v1
    kind: PerconaServerMongoDBBackup
    metadata:
      finalizers:
      - delete-backup
      name: backup1
    spec:
      clusterName: my-cluster-name
      storageName: s3-us-west
      type: logical
    ```

3. Run the actual backup command using this file:

    ``` {.bash data-prompt="$" }
    $ kubectl apply -f deploy/backup/backup.yaml
    ```

