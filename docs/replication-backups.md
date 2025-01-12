# Backups with cross-site replication

Before the Operator version 1.19.0 [Backups](backups.md) were supported for the primary (managed) cluster only.
Now backups can be taken on primary and replica clusters.

Still, backups on cross-site configurations have some specifics.

* Even though you can run backups in unmanaged clusters, you can't run restores on them.
* Even if the backup is started in primary (managed) cluster, most likely it
   will be taken from a secondary instance, even if such instance is on a separate cluster,
   because Percona Backup for MongoDB (PBM) automatically assigns lower priority to primary member to avoid affecting the write performance. This can be overwritten with [custom PBM configuration](operator.md#backupconfigurationbackupoptionsoplogspanmin).
* PBM configuration is shared across all clusters. The Operator will reconfigure PBM every time it runs a backup, and setting PBM configuration in one cluster will affect other clusters too. For example, setting `backup.configuration.backupOptions.oplogSpanMin` to 2 in a secondary cluster will be applied to primary cluster as well.

