# Configuring cross-site replication on Replica instances

When the Operator creates a new cluster, a lot of things are happening, such as
electing the Primary, generating certificates, and picking specific names. This
should not happen if we want the Operator to run the _Replica_ site, so first
of all the cluster should be put into unmanaged state by setting the
`unmanaged` key in the `deploy/cr.yaml` configuration file to true. Also you
should set `updateStrategy` key to `OnDelete` and `backup.enabled` to
`false`, because [Smart Updates](update.md#upgrading-percona-server-for-mongodb) and [backups](backups.md#backups) are not allowed on unmanaged clusters.

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

_Main_ and _Replica_ sites should have same Secrets objects, so don’t forget
to apply Secrets from your _Main_ site. Names of the corresponding objects
are set in the `users`, `ssl`, and `sslInternal` keys of the Custom
Resource `secrets` subsection (`my-cluster-name-secrets`,
`my-cluster-name-ssl`, and `my-cluster-name-ssl-internal` by default).

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
