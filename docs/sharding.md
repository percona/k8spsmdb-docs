# Percona Server for MongoDB Sharding

## About sharding

[Sharding  :octicons-link-external-16:](https://docs.mongodb.com/manual/reference/glossary/#term-sharding)
provides horizontal database scaling, distributing data across multiple MongoDB
Pods. It is useful for large data sets when a single machine’s overall
processing speed or storage capacity turns out to be not enough.
Sharding allows splitting data across several machines with a special routing
of each request to the necessary subset of data (so-called *shard*).

A MongoDB Sharding involves the following components:

* `shard` - a replica set which contains a subset of data stored in the
    database (similar to a traditional MongoDB replica set),
* `mongos` - a query router, which acts as an entry point for client applications,
* `config servers` - a replica set to store metadata and configuration
    settings for the sharded database cluster.

!!! note

    Percona Operator for MongoDB 1.6.0 supported only one shard of
    a MongoDB cluster; still, this limited sharding support allowed using
    `mongos` as an entry point instead of provisioning a load-balancer per
    replica set node. Multiple shards are supported starting from the Operator
    1.7.0. Also, before the Operator 1.12.0 mongos were deployed by the [Deployment  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
    object, and starting from 1.12.0 they are deployed by the [StatefulSet  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/) one.

## Turning sharding on and off

Sharding is controlled by the `sharding` section of the `deploy/cr.yaml`
configuration file and is turned on by default.

**To enable sharding**, set the `sharding.enabled` key to `true`. This will turn
existing MongoDB replica set nodes into sharded ones). 

**To disable sharding**, set the `sharding.enabled` key to `false`.
If backups are disabled (the 
[`backup.enabled` Custom Resource option set to `false`](operator.md#backupenabled)),
the Operator will turn sharded MongoDB instances into unsharded one by one,
so the database cluster will operate without downtime. If backups are enabled
(the [`backup.enabled` Custom Resource option is `true`](operator.md#backupenabled)),
the Operator will pause the cluster (to avoid Percona Backup for MongoDB
misconfiguration), update the instances, and then unpause it back.

## Configuring instances of a sharded cluster

When sharding is turned on, the Operator runs replica sets with config
servers and mongos instances. Their number is controlled by
`configsvrReplSet.size` and `mongos.size` keys, respectively.

Config servers have `cfg` replica set name by default, which is used by the
Operator in StatefulSet and Service names. If this name needs to be
customized (for example when migrating MongoDB cluster from barebone
installation to Kubernetes), you can override the default `cfg` variant using
`replsets.configuration` Custom Resource option in `deploy/cr.yaml`  as follows:

```
...
configuration: |
  replication:
    replSetName: customCfgRS
    ...
```

!!! note

    Config servers for now can properly work only with WiredTiger engine,
    and sharded MongoDB nodes can use either WiredTiger or InMemory one.

By default [replsets section](operator.md#operator-replsets-section) of the
`deploy/cr.yaml` configuration file contains only one replica set, `rs0`.
You can add more replica sets with different names to the `replsets` section
in a similar way. Please take into account that having more than one replica set
is possible only with the sharding turned on.

!!! note

    The Operator will be able to remove a shard only when it contains no
    application (non-system) collections.

## Checking connectivity to sharded and non-sharded cluster

With sharding turned on, you have `mongos` service as an entry point to access
your database. If you do not use sharding, you have to access `mongod`
processes of your replica set.

{% include 'assets/fragments/connectivity.txt' %}
