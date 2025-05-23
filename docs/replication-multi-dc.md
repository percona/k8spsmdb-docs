# Splitting replica set across multiple data centers

Splitting the replica set of the database cluster over multiple Kubernetes clusters can be useful to get a fault-tolerant system in which all replicas are in different data centers.

The Operator cannot deploy MongoDB replicas to other data centers, but this solution can be achieved with a number of Operator deployments, equal to the size of your replica set. So, you will need at least 3 Operator instances: one Operator to control the replica set via cross-site replication, and at least two Operators to bootstrap the unmanaged clusters. Each cluster will contain replica set with only one member, and the _Main_ site will manage instances from other sites as external nodes. All configuration of the replica set is done manually.

The solution has the following limitations to consider:

* setting it up involves a number of manual operations, and the same applies to scaling such a manually configured replica,
* backups are supported on the _Main_ site only, not on the _Replica_ sites.

##  Configuring the _Main_ site

You will use the externally reachable URI for each of your replica set instances, manually overwiriting its default local fully-qualified domain name (FQDN) in the Custom Resouce manifest. Also you will need including all these host names into TLS certificates. So the first thing needed is the list of these externally reachable names. In the above example we will use the following ones:

* `r1.percona.local:443` URI for the `cluster-name-rs0-0` (1st replica set instance),
* `r2.percona.local:443` for the 2nd replica set instance,
* `r3.percona.local:443` for the 3rd replica set instance.

Following steps will allow you to prepare the _Main_ site for cross-site replication, keeping in mind the multiple data centers deployment:

TLS certificates generated by the Operator are not suitable and it’s required to [generate certificates manually](tls-manual.md) on the _Main_ site before creating a database cluster, with all names from `replsetOverrides` and `externalNodes`.

1. Use [TLS ceritficates manual generation instruction](tls-manual.md) to prepare TLS certificates with the host names from your prepared list.

2. Deploy your [Main site](replication-main.md) as usual, with these manually generated certificates. Don't forget to turn on [Pods exposure on your Main cluster](expose.md#controlling-hostnames-in-replset-configuration).

2. Now override hostname of the first replica in the replica set configuration by using the `replsets.replsetOverrides` subsection in the Custom Resource options manifest with the externally reachable endpoint from your externally reachable URI list:

    ```yaml hl_lines="9"
    ...
    unsafeFlags:
      replsetSize: true
    replsets:
    - name: rs0
       size: 1
       replsetOverrides:
         cluster-name-rs0-0:
           host: r1.percona.local:443
       ...
    ```

    The `unsafeFlags.replsetSize` option in the above example is needed to create replica set with less than 3 instances.

    The actual approach to make the URI reachable from the outside of your Kubernetes culster depends on the exposure type. It is different in case of the [NodePort exposure :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport), [Load balancer of the cloud provider  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer), etc. Operator won’t perform any validation for hostnames. It’s user’s responsibility to ensure connectivity.

    !!! note

         You can also add custom tags to the replset members, just to make their identication easier:

         ```yaml hl_lines="5"
         ...
         replsetOverrides:
           cluster-name-rs0-0:
             host: r1.percona.local:443
             tags:
               team: cloud
         ...
         ```

### Configuring _Replica_ sites

To configure _Replica_ sites, you should [deploy your Relica sites](replication-replica.md), repeating the following steps for each Kubernetes cluster you are adding:

1. Copy secrets from the _Main_ site, rename them according to the cluster name you use on the _Replica_ site (if needed), and apply.

    * `cluster1-ssl` (SSL certificates for client connections),

    * `cluster1-ssl-internal` (SSL certificates for replication),

    * `cluster1-secrets` (user credentials),

    * `cluster1-mongodb-encryption-key` (encryption key).

2. Deploy the database cluster on the _Replica_ site. Don't forgetting the following:

    1. All _Replica_ sites must be deployed with the `unmanaged: true` Custom Resource option. This will stop the Operator in the _Replica_ cluster from touching the MongoDB replset configuration. Starting from this moment, only the Operator of the _Main_ cluster will be able to modify it.

    2. Backups must be disabled with the `backup.enabaled: false` Custom Resource option.

    3. The `updateStrategy` Custom Resource option must be set to `RollingUpdate` or `OnDelete`.
    
    4. In order to create a single-instance replica set, you will need to the `unsafeFlags.replsetSize` option to `true` as you did on the _Main_ site.

3.  Now add the new _Replica_ site's Pod **to your _Main_ site's** `externalNodes` subsection of the Custom Resource options manifest:

    ```yaml hl_lines="8 9 10"
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

