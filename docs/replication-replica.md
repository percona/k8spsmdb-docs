# Configuring cross-site replication on Replica instances

When the Operator creates a new cluster, a lot of things are happening, such as
electing the Primary, generating certificates, and picking specific names. This
should not happen if we want the Operator to run the _Replica_ site, so first
of all the cluster should be put into unmanaged state by setting the
`unmanaged` key in the `deploy/cr.yaml` configuration file to true. Also you
should set `updateStrategy` key to `OnDelete` and `backup.enabled` to
`false`, because [Smart Updates](update.md#upgrading-percona-server-for-mongodb) and [backups](backups.md) are not allowed on unmanaged clusters.

!!! note

    Setting `unmanaged` to true will not only prevent the Operator from
    controlling the Replica Set configuration, but it will also result in not
    generating certificates and users credentials for new clusters.

Here is an example:

```yaml
spec:
  unmanaged: true
  updateStrategy: OnDelete
  replsets:
  - name: rs0
    size: 3
    ...
  backup:
    enabled: false
  ...
```

The _Main_ and _Replica_ sites should [have the same Secrets objects](replication-main.md#getting-the-cluster-secrets-and-certificates-to-be-copied-from-main-to-replica), so don’t forget
to apply Secrets from your _Main_ site. Names of the corresponding objects
are set in the `secrets.ssl`, `secrets.sslInternal`, `secrets.users`, and
`secrets.keyfile` Custom Resource options (`my-cluster-name-ssl`,
`my-cluster-name-ssl-internal`, `my-cluster-name-secrets`, and
`my-cluster-name-mongodb-keyfile` by default).

Copy your secrets from an existing cluster and apply each of them on your
_Replica_ site as follows:

```{.bash data-prompt="$" }
$  kubectl apply -f my-cluster-secrets.yaml
```

The _Replica_ site will be ready for replication when you apply changes as
usual:

```{.bash data-prompt="$" }
$ kubectl apply -f deploy/cr.yaml
```

!!! note

    Don't forget that you need to [expose instances of the Replica cluster](expose.md#controlling-hostnames-in-replset-configuration)!
