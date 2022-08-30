# Percona Server for MongoDB Sharding

## About sharding

[Sharding](https://docs.mongodb.com/manual/reference/glossary/#term-sharding)
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
    1.7.0. Also, before the Operator 1.12.0 mongos were deployed by the [Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
    object, and starting from 1.12.0 they are deployed by the [StatefulSet](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/) one.

## Turning sharding on and off

Sharding is controlled by the `sharding` section of the `deploy/cr.yaml`
configuration file and is turned on by default.

To enable sharding, set the `sharding.enabled` key to `true` (this will turn
existing MongoDB replica set nodes into sharded ones). To disable sharding, set
the `sharding.enabled` key to `false`.

When sharding is turned on, the Operator runs replica sets with config
servers and mongos instances. Their number is controlled by
`configsvrReplSet.size` and `mongos.size` keys, respectively.

!!! note

    Config servers for now can properly work only with WiredTiger engine,
    and sharded MongoDB nodes can use either WiredTiger or InMemory one.

By default [replsets section](operator.md#operator-replsets-section) of the
`deploy/cr.yaml` configuration file contains only one replica set, `rs0`.
You can add more replica sets with different names to the `replsets` section
in a similar way. Please take into account that having more than one replica set
is possible only with the sharding turned on.

## Checking connectivity to sharded and non-sharded cluster

With sharding turned on, you have `mongos` service as an entry point to access
your database. If you do not use sharding, you have to access `mongod`
processes of your replica set.

{% include 'assets/fragments/connectivity.md' %}
