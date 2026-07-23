# Install and use the *cert-manager*

## About the *cert-manager*

The [cert-manager :octicons-link-external-16:](https://cert-manager.io/docs/) is a Kubernetes certificate
management controller which is widely used to automate the management and issuance
of TLS certificates. It is community-driven and open source.

When the Operator creates a database cluster, it checks if the [cert-manager is installed](#install-the-cert-manager) and if you haven't provided custom TLS secrets. If these conditions are met, the Operator creates the self-signed `Issuer` or `ClusterIssuer` resource within the cert-manager and requests a certificate from it. The cert-manager generates certificates and stores them in Kubernetes Secrets. The Operator uses these Secrets for TLS in the cluster. The cert-manager manages the certificate lifecycle. 

You can use cert-manager in two ways:

* **Operator-managed issuers (default)** — By default, the Operator creates a Kubernetes `Issuer` resource, which is namespace-scoped, along with a local self-signed Certificate Authority (CA) in the same database namespace. The `Issuer` is used for clusters that are deployed within a single namespace and handles certificate generation for that specific namespace.

   For deployments spanning multiple namespaces, the Operator can instead use a `ClusterIssuer` resource, which is cluster-scoped and can issue certificates across any namespace. Use a `ClusterIssuer` for [multi-namespace](cluster-wide.md) setups. Both approaches are automated by the Operator and require no additional PKI configuration from you.

* **Your existing issuer** — you point the Operator at a cert-manager `Issuer` or
  `ClusterIssuer` that your platform team already manages (for example, Smallstep,
  ACME, or a corporate CA). Percona Server for MongoDB certificates are then signed and renewed under
  your organization's PKI policies.

See [Transport Layer Security (TLS)](TLS.md) for a comparison of cert-manager integration
with manual certificate generation.

## Install the *cert-manager*

The cert-manager requires its own namespace. By default, this is the `cert-manager` namespace. 

1. Run the following command to install cert-manager:

    ```bash
    kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v{{ certmanagerrecommended }}/cert-manager.yaml 
    ```
    
    This creates the dedicated namespace cert-manager and installs cert-manager Deployments, Pods and Services in this namespace. It also creates cluster-wide resources such as Custom Resource Definitions and RBAC to enable the use of cert-manager in any namespace in the Kubernetes cluster.

2. Verify the cert-manager by running the
following command:

    ```bash
    kubectl get pods -n cert-manager
    ```

    The result should display the cert-manager and webhook active and running:

    ``` {.text .no-copy}
    NAME                                       READY   STATUS    RESTARTS   AGE
    cert-manager-7d59dd4888-tmjqq              1/1     Running   0          3m8s
    cert-manager-cainjector-85899d45d9-8ncw9   1/1     Running   0          3m8s
    cert-manager-webhook-84fcdcd5d-697k4       1/1     Running   0          3m8s
    ```

At this point you are ready [to install the Operator and deploy Percona Server for MongoDB cluster](kubectl.md). 

See the sections below for how you can fine-tune the Operator and cert-manager to better meet your security requirements when managing TLS for your cluster:

- [Customize certificate duration for cert-manager](#customize-certificate-duration-for-cert-manager)
* [Configure TLS certificate management policy](tls-cert-management-policy.md)
- [Operator-managed namespace-scoped issuers (default)](#operator-managed-namespace-scoped-issuers-default)
- [Operator-managed issuers with ClusterIssuer scope](#operator-managed-issuers-with-clusterissuer-scope)
- [Use an existing ClusterIssuer](#use-an-existing-clusterissuer)
- [Use an existing namespace-scoped Issuer](#use-an-existing-namespace-scoped-issuer)

## Customize certificate duration for cert-manager

When you deploy the cluster using the default configuration, the Operator triggers the cert-manager to create certificates
with default duration of 90 days.

You can customize the certificate duration. For example, to align certificate lifetimes with your organization’s security and compliance policies.

### Rules and limitations

Check the following rules and limitations for setting up the certificate duration:

1. You can set the duration **only when you create a new cluster**. Updating it in a running cluster is not supported.
2. The TLS certificate duration is subject to the following requirements:

    * The minimum accepted value is 1 hour. Durations below 1 hour are rejected.
    * Do **not** set the duration to exactly 1 hour; the Operator will fail to generate the correct certificate object if you do.
    * By default, cert-manager starts the renewal process when a certificate has one-third of its lifetime remaining, ensuring renewal before expiration. For example, if a certificate is valid for 1 hour, renewal will begin after approximately 40 minutes.

3. Minimum CA certificate duration is 730 hours (approximately 30 days). Do not set the duration to exactly 730 hours; the Operator will fail to generate the correct certificate object if you do.

### Configuration

To set the custom duration, specify the `.spec.tls.certValidityDuration` option in the Custom Resource. This option defines the validity period for TLS certificates

Here's the example configuration:

```yaml
  tls:
    mode: preferTLS
    certValidityDuration: 2160h
    allowInvalidCertificates: true
```

Create a new cluster with this configuration:

```bash
kubectl apply -f deploy/cr.yaml -n <namespace>
```

To verify the duration, you can [check certificates for expiration](tls-update.md#check-your-certificates-for-expiration) at any time. This ensures your certificates are valid and helps you plan for renewals before they expire.

## Operator-managed namespace-scoped issuers (default)

Once you create the database with the Operator and cert-manager is running, the
Operator automatically creates:

* a self-signed CA `Issuer` and CA `Certificate` in the database namespace,
* a signing `Issuer` that references the CA,
* external and internal TLS `Certificate` resources (`<cluster-name>-ssl` and
  `<cluster-name>-ssl-internal`).

cert-manager issues short-lived certificates (90 days by default) and renews them
on schedule. Set [`tls.allowInvalidCertificates`](operator.md#tlsallowinvalidcertificates)
to `true` (the default) for this self-signed setup. 


## Operator-managed issuers with ClusterIssuer scope

!!! note "Version availability: [1.23.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.23.0.md)"

If you want the Operator to manage the CA chain and issue certificates across all namespaces, use the
`ClusterIssuer` resource rather than namespace-scoped `Issuer` resources. 

Configure the Custom Resource as follows:

```yaml
spec:
  tls:
    allowInvalidCertificates: false
    issuerConf:
      kind: ClusterIssuer
      group: cert-manager.io
```

Set the `tls.issuerConf.kind` option to `ClusterIssuer` without pre-creating issuers yourself.
The Operator creates the CA `Certificate` and the `ClusterIssuer` resource in the cert-manager namespace (`cert-manager` by default). The cert-manager generates signed certificates using the ClusterIssuer.

If you installed cert-manager in a custom namespace, you must explicitly define it in the `CERTMANAGER_NAMESPACE` environment variable for the Operator deployment.

## Use an existing ClusterIssuer

!!! note "Version availability: [1.23.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.23.0.md)"

If your cluster already runs cert-manager with a cluster-wide issuer, such as
Smallstep, Let's Encrypt, or an internal CA, you can configure the Operator to
request Percona Server for MongoDB certificates from that issuer instead of creating its own CA chain.

Configure the Custom Resource as follows:

```yaml
spec:
  tls:
    allowInvalidCertificates: false
    issuerConf:
      name: my-org-issuer        # name of your existing ClusterIssuer
      kind: ClusterIssuer
      group: cert-manager.io
```

Replace `my-org-issuer` with the name of your existing `ClusterIssuer`. Set
[`tls.allowInvalidCertificates`](operator.md#tlsallowinvalidcertificates) to
`false` so MongoDB validates certificates against your trusted CA.

When you deploy the cluster, the Operator creates `Certificate` resources that
reference your `ClusterIssuer`. cert-manager signs the resulting Secrets; the
Operator does not create a parallel CA or overwrite your issuer.

!!! note

    The Operator's default RBAC does not grant access to cluster-scoped
    `ClusterIssuer` resources. This is expected: cert-manager resolves the issuer
    when processing `Certificate` objects. You do not need to add extra Operator
    permissions to use an existing `ClusterIssuer`.

## Use an existing namespace-scoped Issuer

To use a cert-manager `Issuer` that already exists in the database namespace,
set [`tls.issuerConf.name`](operator.md#tlsissuerconfname) to that issuer's name.
You can leave `kind` at the default value (`Issuer`).

```yaml
spec:
  tls:
    allowInvalidCertificates: false
    issuerConf:
      name: my-org-issuer        # name of your existing Issuer
      kind: Issuer
      group: cert-manager.io
```

When the issuer name refers to an existing resource, the Operator creates TLS
`Certificate` resources that cert-manager signs through your issuer. It does not
recreate the issuer or its CA chain.

## Pre-create certificates before deployment

If your platform team manages cert-manager objects directly, you can create
`Certificate` (and optionally `ClusterIssuer`) resources before deploying the
cluster. When the Operator starts reconciliation, it preserves user-created
cert-manager resources that are not owned by the Operator.

To use this approach:

1. Create the `Certificate` resources (and issuers, if needed) in the database
   namespace with the names the Operator expects: `<cluster-name>-ssl` and
   `<cluster-name>-ssl-internal`.
2. Configure [`tls.issuerConf`](operator.md#operator-issuerconf-section) in the
   Custom Resource if your certificates are signed by a specific issuer.
3. Deploy the cluster with the Operator.

Alternatively, you can supply TLS material as Kubernetes Secrets and reference
them in [`secrets.ssl` and `secrets.sslInternal`](tls-manual.md#configure-your-cluster)
without using cert-manager at all.

## Operator environment variable

When the Operator manages a CA chain with `tls.issuerConf.kind: ClusterIssuer`,
it stores the intermediate CA `Certificate` in the cert-manager namespace.
By default this namespace is `cert-manager`. If you installed cert-manager
elsewhere, set the [`CERTMANAGER_NAMESPACE`](env-vars-operator.md#certmanager_namespace)
environment variable on the Operator Deployment.

For more details on all cert-manager-related Custom Resource options, see the
[`tls.issuerConf` section](operator.md#operator-issuerconf-section) in the
Operator spec reference.
