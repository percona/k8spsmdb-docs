# Known limitations

This page describes known limitations of Percona Operator for MongoDB. Understanding these constraints helps you plan deployments and avoid unexpected behavior.

## Hardware and CPU requirements

### x86-64-v3 CPU microarchitecture (Operator 1.22.0 and later)

Starting with Operator version [1.22.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.22.0.md), the Operator image is based on [Red Hat Universal Base Image (UBI) 10 :octicons-link-external-16:](https://catalog.redhat.com/software/base-images). RHEL 10 / UBI 10 requires the **x86-64-v3** CPU microarchitecture on `amd64` hosts. That level includes AVX2, BMI1, BMI2, and FMA (roughly Intel Haswell 2013 or newer, or AMD Excavator 2015 or newer).

This requirement is stricter than the [AVX requirement for MongoDB 5.0 and later :octicons-link-external-16:](https://docs.percona.com/percona-server-for-mongodb/8.0/install/system-requirements.html). Older hosts such as Sandy Bridge-class CPUs may meet the MongoDB AVX requirement but still fail with UBI 10.

## Backups and restores

* Point-in-time recovery and selective restore are not available for [PVC snapshot backups](backups-pvc-snapshots.md) (type `external`).
* When you delete an incremental base backup, Percona Backup for MongoDB also deletes all increments that derived from it from the backup storage. The `percona.com/delete-backup` finalizer applies to the base backup and is ignored for increments. This means that the Operator deletes the Backup resource for the base incremental backup but the Backup resources for increments remain because the Operator doesn't control their deletion.
* Restoring a collection under a different name is supported only on replica set clusters for unsharded collections from a full logical backup. It is not supported on sharded clusters. See [Restore a collection under a different name](backups-restore-new-name.md#limitations).
* Selective restores have additional constraints in Percona Backup for MongoDB. See the [selective restore limitations :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/features/known-limitations.html#selective-backups-and-restores).
* After a failed restore, the Operator cannot guarantee data consistency because it does not know at which stage the failure happened. See [Restore from a backup](backups-restore.md).

## Multi-cluster and multi-region deployments

* The Operator cannot place MongoDB Pods in other data centers by itself. Cross-site topologies need an Operator deployment on each site, with unmanaged clusters registered as `externalNodes` on the Main site. Setup and scaling require manual operations. See [Splitting a replica set across multiple data centers](replication-multi-dc.md).
* Backups are supported on the Main site only, not on Replica sites in a multi-datacenter replica set split.
* Multi-cluster Services (MCS) can add cloud-provider limits. For example, on GKE all participating Pods must be in the same project. Avoid exporting Services from the `default` and `kube-system` namespaces. See [Multi-cluster Services](replication-mcs.md).
* Setting `replsets.clusterServiceDNSMode` to `ServiceMesh` supersedes multi-cluster settings. You cannot combine `ServiceMesh` DNS mode with multi-cluster Services. See the [Custom Resource options](operator.md#replsetsclusterservicednsmode).

## Networking and exposure

Split horizon DNS has these MongoDB constraints:

* You cannot duplicate domain names in horizons
* You cannot use IP addresses in horizons
* You must set horizons for all Pods of a replica set, or for none of them

See [Exposing the cluster](expose.md).

## Search and vector search

Percona Search for MongoDB is in the tech preview stage. Notable limits include:

* a single search Pod per replica set or shard, 
* no automated embedding, 
* no migration from externally managed `mongot`, and
* search index data is not included in backups. 
  
See [Limitations](search-overview.md#limitations) in the search overview.

## Real-time replication with Percona ClusterSync for MongoDB

--8<-- "clustersync.md:pcsmlimitations"
