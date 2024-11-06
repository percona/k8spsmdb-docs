Users can now override hostnames in replset configuration how they like:

```yaml
replsets:
  - name: rs0
    size: 1
    replsetOverrides:
      cluster1-rs0-0:
        host: r1.percona.local:443
```

* Each key under `replsetOverrides` should be name of a Pod.

* Operator won’t perform any validation for hostnames. It’s user’s responsibility to ensure connectivity.

With these changes we also added possibility to add custom tags to replset members:

```yaml
replsets:
  - name: rs0
    size: 1
    replsetOverrides:
      cluster1-rs0-0:
        host: r1.percona.local:443
        tags:
          team: cloud
```

## General instructions of how to use this with cross-cluster replication


### Primary cluster

1. Deploy primary cluster

2. Use ingress endpoint in replset configuration using `replsetOverrides`:

    ```yaml
    - name: rs0
       size: 1
       replsetOverrides:
         cluster1-rs0-0:
           host: r1.percona.local:443
    ```

### Secondary clusters

Repeat for each secondary cluster the following steps:

1. Copy secrets from primary cluster, rename them according to secondary cluster name and apply.

    * `cluster1-ssl` (SSL certificates for client connections)

    * `cluster1-ssl-internal` (SSL certificates for replication)

    * `cluster1-secrets` (User credentials)

    * `cluster1-mongodb-encryption-key` (Encryption key)

2. Deploy secondary cluster

    1. All secondary clusters must be deployed with `unmanaged: true`. This will stop operator in secondary cluster from touching replset configuration in MongoDB. Only the Operator in primary cluster will be able to modify replset configuration.

    2. Backups must be disabled with `backup.enabaled: false`.

    3. `updateStrategy` Custom Resource option must be set to `RollingUpdate` or `OnDelete`.

3.  Add secondary cluster's Pod to primary cluster using `externalNodes`:

    ```yaml
    replsets:
    - name: rs0
      size: 1
      replsetOverrides:
        cluster1-rs0-0:
          host: r1.percona.local:443
      externalNodes:
      - host: r2.percona.local:443
        votes: 1
        priority: 1
    ```

There are few missing points:

1. In order to start just a single mongod on each location we need:

    ```yaml
    spec:
      unsafeFlags:
        replsetSize: true
        ...
      replsets:
        - name: rs0
    ...
    # make sure that replica sets are exposed for the TransportServer resources
          expose:
            enabled: true
            type: ClusterIP
    ```

2. TLS certificates generated by the Operator are not suitable and it’s required to create certificates on a primary before creating a primary cluster with all names from `replsetOverrides` and `externalNodes`.

3. I’ve tried today to create a primary cluster using both `replsetOverrides` and `externalNodes` and it’s able to initialize the cluster properly even if replicas from `externalNodes` are not yet created. The only important moment: TransportServer resources should be created before primary cluster deployments



Caveats:

* It’s easy to forget to copy secrets properly, replica is not starting if encryption key is not copied or TLS secrets are not copied

* If users & internal users are not copied, the replica joins, but restarts due to failed liveness checks.

* Without `unmanaged=true` replicas joining the cluster, but psmdb resource stays in error state

* `unmanaged=true` is not working with `backup.enabled=true` => backups should be disabled on replicas