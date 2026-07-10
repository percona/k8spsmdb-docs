# Transport Layer Security (TLS)

Percona Operator for MongoDB uses Transport Layer Security (TLS) cryptographic protocol for the following types of communication:

* External - to enable client applications communicate with the cluster
* Internal - for communication between Percona Server for MongoDB instances in the cluster. The internal certificate is also used as an authorization method.

You control TLS usage with the `tls.mode` option in the Custom Resource. This setting defines how Percona Server for MongoDB cluster handles TLS for both internal and external connections. You can choose from the following modes:

- `allowTLS`: The cluster accepts both TLS and non-TLS incoming connections, but does not use TLS for internal communication.
- `preferTLS` (default): The cluster uses TLS for internal communication and accepts both TLS and non-TLS external connections.
- `requireTLS`: The cluster enforces TLS encryption for all connections and accepts only TLS connections.
- `disabled`: The cluster completely [disables TLS](tls-disable.md) for all connections.

Example configuration:

```yaml
...
spec:
  ...
  tls:
    mode: preferTLS
```

## TLS Certificates

TLS security can be configured in several ways:

* The Operator generates long-term certificates automatically during cluster creation if no TLS Secrets are available. It creates two Secret objects named `<cluster-name>-ssl` and `<cluster-name>-ssl-internal`, referenced by `secrets.ssl` and `secrets.sslInternal` in the Custom Resource. This is the default behavior. The Operator doesn't rotate the certificates as long as it has access to the Secrets. Learn more about it in the [Certificate management policy](#certificate-management-policy) section.

   To use Operator-generated self-signed certificates, leave [tls.allowInvalidCertificates](operator.md#tlsallowinvalidcertificates) at `true` (default). Set it to `false` when you use other certificate generation methods, such as cert-manager or your own CA.

* The Operator can use a specifically installed *cert-manager*, which will automatically generate and renew short-term TLS certificates.
* You can [generate TLS certificates manually](tls-manual.md).

   **For testing purposes**, you can use pre-generated certificates available in the `deploy/ssl-secrets.yaml` file. We strongly recommend **not** using them in production.

### Certificate management policy

Starting with Operator version 1.23.0, you can control what happens when TLS Secrets are missing via the `spec.tls.certManagementPolicy` option in the Custom Resource:

* `auto` (default) — If Secrets are not found, the Operator creates new certificates automatically (self-signed or via cert-manager). New certificates can replace a lost user-managed Secret with a **new CA**, which triggers a rolling restart of all database Pods, and can disconnect clients that trust the original CA.
* `userProvidedOnly` — The Operator skips auto-creation or replacement of unavailable TLS certificates, so that you control the certificate lifecycle management (manually, via External Secrets, GitOps, or your own cert-manager workflow). If a Secret is missing, Pods keep running with existing certificates where possible, and the Operator sets the `TLSSecretsReady=False` condition until you restore the Secret.

| Your setup | Recommended policy |
|------------|-------------------|
| Operator self-signed or Operator-driven cert-manager | `auto` |
| Manual, External Secrets, or GitOps-managed TLS Secrets in production | `userProvidedOnly` |

Example:

```yaml
spec:
  tls:
    mode: preferTLS
    certManagementPolicy: userProvidedOnly
  secrets:
    ssl: my-cluster-name-ssl
    sslInternal: my-cluster-name-ssl-internal
```

See [Configure the TLS certificate management policy](tls-cert-management-policy.md) for setup steps, monitoring, recovery, and policy switching.

## TLS configuration

The following sections provide guidelines how to:

* [Configure TLS security with the Operator using cert-manager](tls-cert-manager.md)
* [Generate certificates manually](tls-manual.md)
* [Update certificates](tls-update.md)
* [Configure the TLS certificate management policy](tls-cert-management-policy.md)
* [Disable TLS temporarily](tls-disable.md)

To use TLS for external traffic, you need to additionally configure your client application. See [this blog post :octicons-link-external-16:](https://www.percona.com/blog/authenticating-your-clients-to-mongodb-on-kubernetes-using-x509-certificates/) for detailed instruction with examples. Also, you can check the [official MongoDB documentation :octicons-link-external-16:](https://www.mongodb.com/docs/manual/tutorial/configure-ssl-clients/). 

For clients outside of your Kubernetes-based environment, you must also [expose your cluster](expose.md).
