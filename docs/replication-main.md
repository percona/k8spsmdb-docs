# Configuring cross-site replication on the Main site

The cluster managed by the Operator should be able to reach external nodes of
the Replica Sets. You can provide needed information in the
`replsets.externalNodes` and `sharding.configsvrReplset.externalNodes`
subsections of the `deploy/cr.yaml` configuration file. Following keys can
be set to specify each external _Replica_, both for its Replica Set and Config
Server instances:

- set `host` to URL or IP address of the external replset instance,
- set `port` to the port number of the external node (or rely on the `27017`
  default value),
- set `priority` to define the [priority  :octicons-link-external-16:](https://docs.mongodb.com/manual/reference/replica-configuration/#mongodb-rsconf-rsconf.members-n-.priority)
    of the external node (`2` is default for all local members of the cluster;
    external nodes should have lower priority to avoid unmanaged node being elected
    as a primary; `0` adds the node as a [non-voting member](arbiter.md#adding-non-voting-nodes)),
- set `votes` to the number of [votes  :octicons-link-external-16:](https://docs.mongodb.com/manual/reference/replica-configuration/#mongodb-rsconf-rsconf.members-n-.votes)
    an external node can cast in a replica set election (`0` is default and
    should be used for non-voting members of the cluster).

Here is an example:

```yaml
spec:
  unmanaged: false
  replsets:
  - name: rs0
    externalNodes:
    - host: rs0-1.percona.com
      port: 27017
      priority: 0
      votes: 0
    - host: rs0-2.percona.com
    ...
  sharding:
    configsvrReplSet:
      size: 3
      externalNodes:
        - host: cfg-1.percona.com
          port: 27017
          priority: 0
          votes: 0
        - host: cfg-2.percona.com
        ...
```

The _Main_ site will be ready for replication when you apply changes as usual:

```{.bash data-prompt="$" }
$ kubectl apply -f deploy/cr.yaml
```

!!! note

    Don't forget to [expose instances of the Main cluster](expose.md#controlling-hostnames-in-replset-configuration)!

## Getting the cluster secrets and certificates to be copied from Main to Replica

_Main_ and _Replica_ should have same Secrets objects (to have same users
credentials) and certificates. So you may need to copy them from _Main_.
Names of the corresponding objects are set in the `secrets.ssl`,
`secrets.sslInternal`, `secrets.users`, and `secrets.keyfile` Custom Resource
options. The default names are the following ones:

* `my-cluster-name-ssl` (SSL certificates for client connections),

* `my-cluster-name-ssl-internal` (SSL certificates for replication),

* `my-cluster-name-secrets` (user credentials),

* `my-cluster-name-mongodb-keyfile` (encryption key file).

If you can get Secrets from an existing cluster by executing the
`kubectl get secret` command for _each_ Secrets object you want to acquire:

```{.bash data-prompt="$" }
$ kubectl get secret my-cluster-name-secrets -o yaml > my-cluster-secrets.yaml
```

Next remove the `annotations`, `creationTimestamp`, `resourceVersion`,
`selfLink`, and `uid` metadata fields from the resulting file to make it
ready for the _Replica_.

You will need to further apply these secrets on Replica.
