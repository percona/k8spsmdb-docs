# Making on-demand backups

An on-demand backup is a backup that you start manually at any time. You create a Backup resource and the Operator uses it to make a backup. A backup can be any of the [supported backup types](backups.md#backup-types).

If you want to run backups automatically, according to the schedule, see [Make scheduled backups](backups-scheduled.md) tutorial.

Here's what you need to do to run on-demand backups:

## Modify the Custom Resource manifest {.power-number}

1. Edit the `deploy/cr.yaml` configuration file and specify the following configuration: 

    * Set the `backup.enabled` key to `true`,

    * Check that you have defined at least one [configured storage](backups-storage.md) in the `backup.storages` subsection.

2. Apply the changes. Don't forget to replace the `<namespace>` placeholder with your namespace:

    ```{.bash data-prompt="$" }
    $ kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

## Create a Backup resource 

To create a Backup resource, you need a special custom resource manifest. The [deploy/backup/backup.yaml :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/backup/backup.yaml) is the example manifest that you can use.
{.power-number}

1. Specify the following configuration:

    * `metadata.name` is the name of the backup. You will need this name when you [restore from this backup](backups-restore.md). The default name is `backup1`.

    * `spec.clusterName` is the name of your cluster (prior to
        the Operator version 1.12.0 this key was named `spec.psmdbCluster`). Run `kubectl get psmdb -n <namespace>` to find out the cluster name.

    * `spec.storageName` is the name of your [already configured storage](backups-storage.md).

    * `spec.type` is the [backup type](backups.md#backup-types). If you leave it empty, the Operator makes a logical backup by default.

    **Examples**

    === "Logical"
   
        ```yaml
        apiVersion: psmdb.percona.com/v1
        kind: PerconaServerMongoDBBackup
        metadata:
          finalizers:
          - percona.com/delete-backup
          name: backup1
        spec:
          clusterName: my-cluster-name
          storageName: s3-us-west
          type: logical
        ```

    === "Physical"
    
        ```yaml
        apiVersion: psmdb.percona.com/v1
        kind: PerconaServerMongoDBBackup
        metadata:
          finalizers:
          - percona.com/delete-backup
          name: backup1
        spec:
          clusterName: my-cluster-name
          storageName: s3-us-west
          type: physical
        ```

    === "Incremental"

        To make incremental backups, consider the following:

        1. Make the incremental base backup first. The Operator needs the base to start the chain of increments and save only changes from previous backup. 

        2. Use the same storage for base backup and increments. 

        3. The `percona.com/delete-backup` finalizer is considered for incremental base backup but are ignored for increments. This means that when a base backup is deleted, PBM deletes all increments that derive from it.

           There is the limitation that the Backup resource for the base incremental backup is deleted but the Backup resources for increments remain in the Operator. This is because the Operator doesn't control their deletion outsourcing this task to PBM. This limitation will be fixed in future releases.

        Here's the configuration example for the base incremental backup
    
        ```yaml
        apiVersion: psmdb.percona.com/v1
        kind: PerconaServerMongoDBBackup
        metadata:
          finalizers:
          - percona.com/delete-backup
          name: backup1
        spec:
          clusterName: my-cluster-name
          storageName: s3-us-west
          type: incremental-base
        ```

        This configuration example is for subsequent incremental backups:

        ```yaml
        apiVersion: psmdb.percona.com/v1
        kind: PerconaServerMongoDBBackup
        metadata:
          - percona.com/delete-backup
          name: backup1
        spec:
          clusterName: my-cluster-name
          storageName: s3-us-west
          type: incremental
        ```


2. Apply the `backup.yaml` manifest to start a backup:

    ``` {.bash data-prompt="$" }
    $ kubectl apply -f deploy/backup/backup.yaml
    ```

3. You can track the backup process with the `PerconaServerMongoDBBackup` Custom Resource as follows:

    ``` {.bash data-prompt="$" }
    $ kubectl get psmdb-backup
    ```
    
    ??? example "Expected output"

        ``` {.text .no-copy}
        NAME      CLUSTER           STORAGE      DESTINATION            STATUS    COMPLETED   AGE
        backup1   my-cluster-name   s3-us-west   2022-09-08T03:22:19Z   running               49s
        ```

    It should show the status as `READY` when the backup process is over.

## Troubleshooting
    
If you have any issues with a backup, here's how you can troubleshoot it:

1. View information about a backup:

    ``` {.bash data-prompt="$" }
    $ kubectl describe psmdb-backup backup1
    ```

    ??? example "Expected output"

        ```{text .no-copy}
        Name:         backup1
        Namespace:    my-namespace
        Labels:       <none>
        Annotations:  <none>
        API Version:  psmdb.percona.com/v1
        Kind:         PerconaServerMongoDBBackup
        Metadata:
          Creation Timestamp:  2025-04-22T11:32:21Z
          Finalizers:
            percona.com/delete-backup
          Generation:        1
          Resource Version:  136319
          UID:               46670473-4fd0-465d-b944-1be3717485a0
        Spec:
          Cluster Name:  my-cluster-name
          Storage Name:  gcp-cs
          Type:          incremental-base
        Status:
          Completed:        2025-04-22T11:32:42Z
          Destination:      s3://my-bucket/demand-backup-incremental/2025-04-22T11:32:26Z
          Last Transition:  2025-04-22T11:32:42Z
          Pbm Name:         2025-04-22T11:32:26Z
          Pbm Pod:          my-cluster-name-rs0-2.my-cluster-name-rs0.demand-backup-incremental-10277.svc.cluster.local:27017
          Pbm Pods:
            rs0:  my-cluster-name-rs0-2.my-cluster-name-rs0.demand-backup-incremental-10277.svc.cluster.local:27017
          Replset Names:
            rs0
          s3:
            Bucket:              my-bucket
            Credentials Secret:  gcp-cs-secret
            Endpoint URL:        https://storage.googleapis.com
            Prefix:              demand-backup-incremental
            Region:              us-east-1
            Server Side Encryption:
          Start:         2025-04-22T11:32:26Z
          State:         ready
          Storage Name:  gcp-cs
          Type:          incremental-base
        ```

2. [Check logs](debug-logs.md) from the backup-agent container of the appropriate Pod as follows. Find the Pod name in the `pbm Pod` field in the output from the previous step. Or use the following command to get the Pod name:

    ```{.bash data-prompt="$" }
    $ kubectl get psmdb-backup -o yaml | grep pbmPod
    ```

    Now connect to the `backup-agent` of this Pod:
    
    ```{.bash data-prompt="$" }
    $ kubectl logs pod/my-cluster-name-rs0 -c backup-agent
    ```
    
3. [Access the same container via ssh](debug-shell.md) and [carry on Percona Backup for MongoDB diagnostics  :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/troubleshoot/troubleshooting.html). 
    
--8<-- "restore-new-k8s-env.md"