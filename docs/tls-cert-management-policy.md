# Configure the TLS certificate management policy

!!! note "Version added: 1.23.0"

You can control what the Operator does when it loses access to TLS Secrets.

The Operator expects and uses two Secrets for TLS communication. They are referenced in the following Custom Resource options:

* `spec.secrets.ssl` - the Secret with the certificates for communication between client applications and the cluster.
* `spec.secrets.sslInternal` - the Secret with the certificates for communication between Percona Server for MongoDB instances in the cluster and for internal authorization.

To learn more, see [TLS Certificates](TLS.md#tls-certificates)

The Operator has two policies to manage TLS certificates when it cannot find the TLS Secrets. You define a policy via the `spec.tls.certManagementPolicy` option in the Custom Resource:

* `auto` (default) - the Operator creates new certificates, either self-signed or via cert-manager, and restarts the database Pods. The new certificates have a new CA so client applications must reconnect to use it. 
  
    That works well for dev clusters and for setups where the Operator fully owns certificate creation.

* `userProvidedOnly` - the Operator skips creating new certificates. The certificate lifecycle management is fully under your control and you are responsible for restoring the access to the Secret.  
  
    This policy is useful if you manage TLS certificates outside the Operator, such as through Kubernetes Secrets synced from AWS Secrets Manager or via[External Secrets Operator :octicons-link-external-16:](https://external-secrets.io/), as it prevents a service outage. The new certificates have the new CA and clients that still trust the previous CA, can lose connectivity to the cluster.


## When to use each policy

| Your setup | Recommended policy |
|------------|-------------------|
| Operator self-signed certificates or Operator-driven cert-manager | `auto` (default) |
| [Manually generated certificates](tls-manual.md) in production | `userProvidedOnly` |
| External Secrets or GitOps-managed `<cluster>-ssl` / `<cluster>-ssl-internal` Secrets | `userProvidedOnly` |
| You own rotation and must avoid surprise CA changes on Secret loss | `userProvidedOnly` |

The following table explains how the Operator responds under each policy when it cannot access TLS Secrets.

| Situation | `auto` | `userProvidedOnly` |
|-----------|--------|-------------------|
| Cluster created without TLS Secrets | Operator creates Secrets and starts the cluster | Cluster stays in `initializing` until you create Secrets |
| TLS Secret deleted while cluster is running | Operator may create new Secrets and roll Pods | Pods keep running; Operator logs an error; `TLSSecretsReady=False` |
| TLS Secrets restored | Normal operation | `TLSSecretsReady=True`; no forced restart from this policy alone |

## Configuration

### Prerequisites

Ensure you have:

1. Created both TLS Secrets in the cluster namespace, or that your sync tool created them before the database Pods must start. See [Generate TLS certificates manually](tls-manual.md).
2. Referenced the Secret names in the Custom Resource:

    ```yaml
    spec:
      secrets:
        ssl: my-cluster-name-ssl
        sslInternal: my-cluster-name-ssl-internal
    ```

3. Run Percona Operator for MongoDB version 1.23.0 or later.

### Configure the certificate management policy

1. Edit the `deploy/cr.yaml` Custom Resource manifest and configure the  `spec.tls.certManagementPolicy` option:

    ```yaml
    apiVersion: psmdb.percona.com/v1
    kind: PerconaServerMongoDB
    metadata:
      name: my-cluster-name
    spec:
      tls:
        mode: preferTLS
        certManagementPolicy: userProvidedOnly
      secrets:
        ssl: my-cluster-name-ssl
        sslInternal: my-cluster-name-ssl-internal
      replsets:
      - name: rs0
        size: 3
    ```

2. Apply the manifest:

    ```bash
    kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

For Helm installations, set the equivalent value in your Helm values file for `tls.certManagementPolicy`.

!!! note

    Do not set the `userProvidedOnly` value if you expect the Operator to bootstrap TLS for you. With this policy, missing Secrets at deploy time leave the cluster in the `initializing` state until the Secrets exist.


## Monitor the cluster state

If a TLS Secret is missing and `spec.tls.certManagementPolicy` is set to `userProvidedOnly`, the Operator updates the `TLSSecretsReady` cluster condition to `False` and sets the reason to `TLSSecretNotFound`.

To check the condition, run:

```bash
kubectl -n <namespace> get psmdb my-cluster-name -o jsonpath='{range .status.conditions[?(@.type=="TLSSecretsReady")]}{.status}{"\n"}{.reason}{"\n"}{.message}{"\n"}{end}'
```

??? example "Sample output when a Secret is missing"

    ```{.text .no-copy}
    False
    TLSSecretNotFound
    TLS secret my-cluster-name-ssl is missing, certManagementPolicy is userProvidedOnly
    ```

The cluster may still show Pods as running while `TLSSecretsReady` is `False`. Treat this as a **degraded** state: MongoDB continues with certificates already mounted in Pods, but you should restore the Secrets promptly.

Check Operator logs for errors mentioning `certManagementPolicy is userProvidedOnly`.

See [Custom resource statuses](cr-statuses.md#tlssecretsready) for more on cluster conditions.

## Restore TLS Secrets

1. Confirm which Secret is missing:

    ```bash
    kubectl get secret my-cluster-name-ssl my-cluster-name-ssl-internal
    ```

2. Recreate or re-sync the Secret (from backup, External Secrets, or your certificate pipeline).

3. Wait for the next reconciliation cycle, then verify:

    ```bash
    kubectl -n <namespace> get psmdb my-cluster-name -o jsonpath='{.status.conditions[?(@.type=="TLSSecretsReady")].status}'
    ```

    The output should be `True`.

Under `userProvidedOnly`, restoring Secrets does not by itself force a rolling restart. Pods continue using the certificates already loaded until you [update certificates](tls-update.md) intentionally.

## Switch between policies

### Change to userProvidedOnly

Safe when TLS Secrets already exist and you want to prevent automatic regeneration if they are lost later. Apply the updated Custom Resource; no immediate Pod restart is required solely for this change.

### Change to auto

If TLS Secrets are **missing** when you switch to `auto`, the Operator creates new certificates. That may change the CA and trigger a rolling restart. Only switch back to `auto` if you intentionally want the Operator to take over certificate creation again.

There is no Operator guardrail that blocks `userProvidedOnly` → `auto` when Secrets are absent. Plan the switch and client CA trust accordingly.

## Rotate certificates with userProvidedOnly

Certificate rotation remains your responsibility:

1. Update the TLS Secrets with new certificate material (same Secret names).
2. Follow the steps in [Update certificates](tls-update.md) for your certificate source.
3. Confirm `TLSSecretsReady=True` after both Secrets are valid.

The Operator picks up new Secret content and reconciles Pods according to its normal TLS update flow.
