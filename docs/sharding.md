# Sharding

## About sharding

[Sharding  :octicons-link-external-16:](https://docs.mongodb.com/manual/reference/glossary/#term-sharding)
provides horizontal database scaling, distributing data across multiple MongoDB
Pods. It is useful for large data sets when a single machine's overall
processing speed or storage capacity turns out to be not enough.

For what sharding is, its components (shards, `mongos`, config servers), and when to choose
it over a single replica set, see [Choose your topology](ha-topology.md#choose-your-topology).

## Turning sharding on and off

Sharding is controlled by the `sharding` section of the `deploy/cr.yaml`
configuration file and is turned on by default.

**To enable sharding**, set the `sharding.enabled` key to `true`. This will turn
existing MongoDB replica set nodes into sharded ones. 

**To disable sharding**, set the `sharding.enabled` key to `false`.
If backups are disabled (the 
[`backup.enabled` Custom Resource option set to `false`](operator.md#backupenabled)),
the Operator will turn sharded MongoDB instances into unsharded one by one,
so the database cluster will operate without downtime. If backups are enabled
(the [`backup.enabled` Custom Resource option is `true`](operator.md#backupenabled)),
the Operator will pause the cluster (to avoid Percona Backup for MongoDB
misconfiguration), update the instances, and then unpause it back.

**To verify the change**, check for `mongos` Pods:

```bash
export NAMESPACE=<namespace>
kubectl get pods -n $NAMESPACE -l app.kubernetes.io/component=mongos
```

With sharding on, this lists your `mongos` Pods. With sharding off, it returns nothing.
Either way, confirm the cluster itself is healthy:

```bash
kubectl get psmdb -n $NAMESPACE
```

The cluster must show the `ready` state.

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

By default, the [replsets section](operator.md#operator-replsets-section) in
`deploy/cr.yaml` contains one data replica set, `rs0`.

Each additional entry in `replsets` is treated as another **shard**. This works
only when sharding is enabled (`sharding.enabled: true`). If `sharding.enabled: false`, the Operator
supports a single replica set only.

!!! note

    The Operator can remove a shard only when it contains no
    application (non-system) collections.

## Checking connectivity to sharded and non-sharded cluster

With sharding turned on, you have `mongos` service as an entry point to access
your database. If you do not use sharding, you have to access `mongod`
processes of your replica set.

{% include 'assets/fragments/connectivity.txt' %}
