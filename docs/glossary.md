# Glossary

This page explains the Kubernetes and MongoDB terms used in the Operator documentation. The examples use a cluster named `my-cluster-name` with a replica set named `rs0`.

## Arbiter {: #arbiter}

A replica set member that votes in [elections](#election) but holds no data and can't become [primary](#primary). It gives a replica set with an even number of data-bearing members an odd number of votes.

See [Arbiter, non-voting and hidden nodes](arbiter.md).

## Cluster {: #cluster}

The word *cluster* has two meanings in these docs. A *Kubernetes cluster* is the set of machines that Kubernetes manages. A *database cluster* is what one [Custom Resource](#custom-resource) describes: one replica set, or a sharded cluster with its shards, config server replica set and `mongos` routers. One Kubernetes cluster can run several database clusters. Pages that say "the cluster" mean the database cluster, unless they say "Kubernetes cluster".

See [Design and architecture](architecture.md).

## Config server replica set {: #config-server-replica-set}

The replica set that stores the metadata of a sharded cluster: which data lives on which [shard](#shard). The Operator names its Pods `my-cluster-name-cfg-N`.

See [Sharding](sharding.md).

## Custom Resource (CR, cr.yaml) {: #custom-resource}

The Kubernetes object that describes the cluster you want, for example `PerconaServerMongoDB`. The Operator reads it and makes the cluster match. A [CustomResourceDefinition](#crd) tells Kubernetes that this object type exists.

The `deploy/cr.yaml` file in the Operator repository is the example manifest of this object. See [Change the cluster through the Custom Resource](architecture-responsibilities.md#change-the-cluster-through-the-custom-resource).

For all options, see the [Custom Resource options reference](operator.md).

## CustomResourceDefinition (CRD) {: #crd}

A Kubernetes object that adds a new object type to the Kubernetes API and defines its fields. The Operator uses four CRDs in the `psmdb.percona.com` API group: `PerconaServerMongoDB`, `PerconaServerMongoDBBackup`, `PerconaServerMongoDBRestore` and `PerconaServerMongoDBClusterSync`. They are in the `deploy/crd.yaml` file of the Operator repository.

CRDs are cluster-wide objects, so installing them needs cluster-level permissions. You install and upgrade them yourself, before the Operator. The Operator never applies them.

See [Upgrade the Operator and CRD](update-operator.md).

## Election {: #election}

The vote in which the members of a replica set choose a new [primary](#primary). A candidate needs the votes of a majority of the voting members. MongoDB holds an election when the primary becomes unreachable or steps down.

See [Primary failover](architecture-workflows.md#primary-failover).

## Feature compatibility version (FCV) {: #fcv}

The MongoDB setting that turns on the features of a major version that change the data format. Until you raise it after an upgrade, you can still downgrade.

See [Major version upgrades](update-major.md).

## Finalizer {: #finalizer}

A key in `metadata.finalizers` that makes Kubernetes wait for a cleanup step before it deletes an object. The Operator uses finalizers such as `percona.com/delete-psmdb-pvc` to clean up volumes and Secrets.

See [Finalizers](objects-created.md#finalizers).

## Headless Service {: #headless-service}

A Kubernetes Service without a cluster IP. DNS returns the addresses of the Pods behind it, and a DNS name for each Pod. The Operator creates one for each replica set, such as `my-cluster-name-rs0`. Drivers that use `mongodb+srv` connection strings find the members through it.

See [Services and ports](services.md).

## Hidden member {: #hidden}

A data-bearing replica set member that applications don't see and that can't become [primary](#primary). Use it for backups, analytics or reporting.

See [Arbiter, non-voting and hidden nodes](arbiter.md#hidden-nodes).

## Initial sync {: #initial-sync}

A full copy of the data from another member to a member that starts with an empty data directory or fell too far behind. During an initial sync, the member is in the `STARTUP2` state.

See [Health checks and probes](architecture-probes.md).

## Lease {: #lease}

A small Kubernetes object that works as a lock. The Operator uses a Lease so that only one backup runs at a time.

See [Objects the Operator creates](objects-created.md).

## mongos {: #mongos}

The query router of a sharded cluster. Applications connect to `mongos`, and `mongos` sends each query to the [shards](#shard) that hold the data. `mongos` stores no data.

See [Design and architecture](architecture.md#sharded-cluster).

## Node {: #node}

The word *node* has two meanings in these docs. A *Kubernetes node* is a machine, physical or virtual, where Pods run. A *database node*, or *member*, is one `mongod` process of a replica set, running in a Pod such as `my-cluster-name-rs0-0`. By default, the Operator requires the members of a replica set to run on different Kubernetes nodes.

See [Control Pod scheduling](constraints.md).

## Non-voting member {: #non-voting}

A data-bearing replica set member without a vote, which can't become [primary](#primary). Use it to add read capacity, or members beyond the limit of 7 voting members.

See [Arbiter, non-voting and hidden nodes](arbiter.md#non-voting-nodes).

## Oplog {: #oplog}

The operations log: a special collection in which a member records every write. Secondaries copy the oplog of another member and apply it. For point-in-time recovery, PBM saves the oplog to backup storage.

See [Point-in-time recovery](architecture-workflows.md#point-in-time-recovery).

## Percona Backup for MongoDB (PBM) {: #pbm}

The tool that makes backups and restores. Its agent, `pbm-agent`, runs in the `backup-agent` container of each database Pod. The Operator sends PBM the backup and restore commands.

See [Backup and restore](backups.md).

## PersistentVolumeClaim (PVC) {: #pvc}

A request for storage. Each data-bearing member has a PVC that holds its data. The StorageClass and the Container Storage Interface (CSI) driver provide the actual volume.

See [Resize storage](scaling-storage-resize.md).

## PodDisruptionBudget (PDB) {: #pdb}

A Kubernetes object that limits how many Pods of a StatefulSet can be unavailable during voluntary disruptions such as a node drain. The Operator creates one for each StatefulSet.

See [Pod Disruption Budgets](constraints.md#pod-disruption-budgets).

## Primary {: #primary}

The replica set member that accepts writes. A replica set has at most one primary. The other data-bearing members are secondaries.

See [Design and architecture](architecture.md#percona-server-for-mongodb-in-brief).

## Reconcile {: #reconcile}

One pass of the Operator loop: it compares the Custom Resource with what exists in Kubernetes and in the database, and corrects the difference. The Operator repeats it about every five seconds.

See [How the Operator reacts to changes](architecture-reconciliation.md#what-a-reconcile-is).

## Replica set {: #replica-set}

A group of `mongod` processes that hold the same data: one [primary](#primary) and one or more secondaries. The Operator runs each replica set as a StatefulSet.

See [About high availability and topology](ha-topology.md).

## Shard {: #shard}

A replica set that holds part of the data of a sharded cluster.

See [Sharding](sharding.md).

## Smart Update {: #smart-update}

The Operator update strategy that restarts the members one at a time, secondaries first and the primary last after a step-down. It doesn't start while a backup or restore is running.

See [How Smart Update works](architecture-reconciliation.md#how-smart-update-works).

## StatefulSet {: #statefulset}

A Kubernetes workload that gives each Pod a stable name and its own volume, for example `my-cluster-name-rs0-0`. The Operator runs each replica set and `mongos` as StatefulSets.

See [Objects the Operator creates](objects-created.md).

## Write concern {: #write-concern}

The number of members that must confirm a write before MongoDB reports it as successful. With the `majority` write concern, a write survives the loss of the primary. Set the cluster-wide default with the `defaultRWConcern` section of the Custom Resource.

See [About high availability and topology](ha-topology.md#read-and-write-concerns).
