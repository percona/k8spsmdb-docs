# About security

Securing a cluster comes down to four independent decisions: who may connect, how they prove
it, how traffic is protected in transit, and how data is protected on disk. This page covers
what you already get without configuring anything, and what each decision changes.

## What a new cluster already gives you

A cluster deployed from the default `deploy/cr.yaml` is  protected. This is what is available out of the box:

| | Default | Change it in |
|---|---|---|
| Authentication | Enabled | [Disable authentication](auth-disable.md) |
| Transport encryption | On, `tls.mode: preferTLS` - TLS for internal traffic, TLS or plain accepted from clients | [About TLS security](TLS.md) |
| Certificates | Self-signed by the Operator; renew manually unless you add cert-manager | [About TLS security](TLS.md#tls-certificates) |
| Data-at-rest encryption | On, key in the Secret named by `secrets.encryptionKey` | [About data-at-rest encryption](encryption.md) |
| Internal cluster authentication | A random 1024-byte keyfile, generated if absent | [Users](users.md#mongodb-internal-authentication-key-optional) |

You don't need to turn on security here - it's already on. This section is about changing *how*
it works: for example, switching to your own certificate authority, meeting a compliance
policy, or moving key material into an external store.

## Manage users: who can connect

The Operator distinguishes **system users**, which it creates and uses to run the cluster,
from **application users**, which your workloads use. System users are generated into
Kubernetes Secrets and should not be managed by hand. Application users can be declared in
the Custom Resource so they are created and reconciled like any other resource.

* [About application and system users](users.md)
* [Application-level (unprivileged) users](app-users.md)
* [System users](system-users.md)
* [Connection secrets](connection-secrets.md)
* [Manage system users with Vault](system-users-vault.md)

## Enable authentication: how users prove who they are

Beyond the built-in credentials, authentication can be delegated to an external directory or
identity provider:

| Method | Choose it when |
|---|---|
| Built-in MongoDB users | You have a small number of application accounts and no central identity system. This is the default. |
| [OpenLDAP integration](ldap.md) | Your organization already authenticates against LDAP and you want MongoDB roles mapped to LDAP groups. |
| [OIDC authentication](oidc.md) | You use an identity provider and want short-lived tokens instead of stored passwords. |

[Disable authentication](auth-disable.md) deliberately weakens authentication and exists
for narrow, temporary situations only, such as development, testing, or migration. Never use it
on a cluster holding real data.

!!! warning

    Disabling authentication leaves the database reachable by anyone who can reach its
    network endpoint. Use it only in an isolated environment, and never for a cluster
    holding real data.

[Disable localhost authentication bypass](auth-bypass-localhost.md) does the opposite: it
permanently closes MongoDB's bootstrap-only "localhost exception" on a running cluster,
tightening security rather than loosening it.

## Transport encryption: protecting data in transit (TLS)

TLS is on by default; what you choose is who issues the certificates and how strictly TLS is
enforced.

| Option | Choose it when |
|---|---|
| Operator-generated certificates (default) | You want TLS working with no extra setup. Renewal is manual. |
| [cert-manager](tls-cert-manager.md) | You want issuance and renewal handled automatically. Recommended for production. |
| [Manual certificates](tls-manual.md) | Your organization issues certificates from its own CA. |

`tls.mode` decides enforcement: `preferTLS` (default) accepts both TLS and plain client
connections, `requireTLS` accepts only TLS, `allowTLS` drops TLS for internal traffic, and
`disabled` turns it off. See [About TLS security](TLS.md).

Rotation is covered in [Update certificates](tls-update.md), how much of the lifecycle the
Operator owns is set by the
[TLS certificate management policy](tls-cert-management-policy.md), and TLS can be turned
off entirely with [Disable TLS](tls-disable.md).

## Data-at-rest encryption: protecting data on disk

Encryption at rest is on by default; what you choose is where the key lives.

| Option | Choose it when |
|---|---|
| [Encryption key Secret](encryption-keyfile.md) | You are comfortable with the key living in a Kubernetes Secret. This is the default. |
| HashiCorp Vault | You need centralized key management, rotation, or an audit trail. Set it up [without TLS](encryption-vault.md) or [with TLS](encryption-vault-tls.md). |

See [About data-at-rest encryption](encryption.md).

!!! note "Vault is used for two different things"

    Vault appears twice in this section, in unrelated roles. **Encryption keys** in Vault
    protect data on disk (the pages above). **System user credentials** in Vault replace the
    generated passwords the Operator stores in Secrets - a separate, optional feature added
    in 1.22.0, described in [Manage system users with Vault](system-users-vault.md). Setting
    up one does not set up the other.

## Limitations

Security settings interact with other features - `requireTLS` affects how clients and other
sites connect, and disabling TLS or authentication constrains cross-site replication. See
[Known limitations](limitations.md).

## Next steps

* [About application and system users](users.md)
* [About TLS security](TLS.md)
* [About data-at-rest encryption](encryption.md)
