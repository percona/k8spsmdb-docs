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
    [deploy/backup/backup.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/backup/backup.yaml):

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

!!! note

    If you plan to [restore backup to a new Kubernetes-based environment](backups-restore-to-new-cluster.md), make sure you will be able to create there a Secrets object with the same user passwords as in the original cluster. More details about secrets can be found in [System Users](users.md#system-users). The name of the current Secrets object you will need to recreate can be found out from the `spec.secrets` key in the `deploy/cr.yaml` (`my-cluster-name-secrets` by default).

4. You can track the backup process with the `PerconaServerMongoDBBackup` [Custom Resource](debug.md) as follows:

    ``` {.bash data-prompt="$" }
    $ kubectl get psmdb-backup
    ```
    
    ??? example "Expected output"

        ``` {.text .no-copy}
        NAME      CLUSTER           STORAGE      DESTINATION            STATUS    COMPLETED   AGE
        backup1   my-cluster-name   s3-us-west   2022-09-08T03:22:19Z   running               49s
        ```

    It should show the status as `READY` when the backup process is over.
    
    If you have any issues with the backup, you can [view logs](debug-logs.md) from the backup-agent container of the appropriate Pod as follows:
    
    ``` {.bash data-prompt="$" }
    $ kubectl logs pod/my-cluster-name-rs0 -c backup-agent
    ```
    
    Alternatively, [getting ssh access](debug-shell.md) to the same container
    will allow you to [carry on Percona Backup for MongoDB diagnostics  :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/manage/troubleshooting.html). 
    
    !!! note
    
        In both cases you will need the name of the Pod that made the backup.
        You can find the `pbmPodName` field in the output of the
        `kubectl get psmdb-backup <backup_name> -o yaml` command.
    
