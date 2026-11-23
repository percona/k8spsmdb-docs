> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Configure the TLS certificate management policy

Version added: 1.23.0

You can control how the Operator behaves when it cannot find TLS Secrets.

The Operator expects and uses the following Secrets for TLS communication. They are referenced in the following Custom Resource options:

- `spec.secrets.ssl` - the Secret with the certificates for communication between client applications and the cluster.
- `spec.secrets.sslInternal` - the Secret with the certificates for communication between Percona Server for MongoDB instances in the cluster and for internal authorization.
- `spec.secrets.sslPBM` - the Secret with the client certificate that the Operator and the backup agents present to the cluster. Starting with version 1.24.0, the Operator needs it when backups are enabled.

To learn more, see [TLS Certificates](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/TLS.html#tls-certificates)

The Operator has two policies to manage TLS certificates. You define a policy via the `spec.tls.certManagementPolicy` option in the Custom Resource:

- `auto` (default) - the Operator creates new certificates, either self-signed or via cert-manager, and restarts the database Pods. The new certificates have a new CA so client applications must reconnect to use it.

  That works well for dev clusters and for setups where the Operator fully owns certificate creation.

- `userProvidedOnly` - the Operator skips creating new certificates. The certificate lifecycle management is fully under your control and you are responsible for restoring the access to the Secret.

  This policy is useful if you manage TLS certificates outside the Operator, such as through Kubernetes Secrets synced from AWS Secrets Manager or via [External Secrets Operator](https://external-secrets.io/) . Using this approach prevents an unexpected certificate regeneration with a different CA, which can otherwise cause clients that rely on the original CA to lose connectivity, potentially leading to service outages.

## When to use each policy

| Your setup                                                                                                                    | Recommended policy |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Operator self-signed certificates or Operator-driven cert-manager                                                             | `auto` (default)   |
| [Manually generated certificates](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/tls-manual.html) in production | `userProvidedOnly` |
| External Secrets or GitOps-managed `<cluster>-ssl`, `<cluster>-ssl-internal` and `<cluster>-pbm` Secrets                      | `userProvidedOnly` |
| You own rotation and must avoid surprise CA changes on Secret loss                                                            | `userProvidedOnly` |

The following table explains how the Operator responds under each policy when it cannot access TLS Secrets.

| Situation                                   | `auto`                                          | `userProvidedOnly`                                                 |
| ------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------ |
| Cluster created without TLS Secrets         | Operator creates Secrets and starts the cluster | Cluster stays in `initializing` until you create Secrets           |
| TLS Secret deleted while cluster is running | Operator may create new Secrets and roll Pods   | Pods keep running; Operator logs an error; `TLSSecretsReady=False` |
| TLS Secrets restored                        | Normal operation                                | `TLSSecretsReady=True`; no forced restart from this policy alone   |

If you provide your own external Secret in the `secrets.ssl` option and the PBM client Secret is missing, the Operator doesn’t set `TLSSecretsReady=False` under either policy. The cluster goes to the `error` state with the message `PBM client TLS secret <name> is required when custom SSL secret <name> is provided and backups are enabled`. Pods keep running.

## Configuration

### Prerequisites

Ensure you have:

1. Created the TLS Secrets in the cluster namespace, or that your sync tool created them before the database Pods must start. When backups are enabled, this includes the PBM client Secret. See [Generate TLS certificates manually](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/tls-manual.html).

1. Referenced the Secret names in the Custom Resource:

   ```
   spec:
     secrets:
       ssl: my-cluster-name-ssl
       sslInternal: my-cluster-name-ssl-internal
       sslPBM: my-cluster-name-pbm
   ```

1. Run Percona Operator for MongoDB version 1.23.0 or later.

### Configure the certificate management policy

1. Edit the `deploy/cr.yaml` Custom Resource manifest and configure the `spec.tls.certManagementPolicy` option:

   ```
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
       sslPBM: my-cluster-name-pbm
     replsets:
     - name: rs0
       size: 3
   ```

1. Apply the manifest:

   ```
   kubectl apply -f deploy/cr.yaml -n <namespace>
   ```

For Helm installations, set the equivalent value in your Helm values file for `tls.certManagementPolicy`.

Note

Do not set the `userProvidedOnly` value if you expect the Operator to bootstrap TLS for you. With this policy, missing Secrets at deploy time leave the cluster in the `initializing` state until the Secrets exist.

## Monitor the cluster state

If a TLS Secret is missing and `spec.tls.certManagementPolicy` is set to `userProvidedOnly`, the Operator updates the `TLSSecretsReady` cluster condition to `False` and sets the reason to `TLSSecretNotFound`.

To check the condition, run:

```
kubectl -n <namespace> get psmdb my-cluster-name -o jsonpath='{range .status.conditions[?(@.type=="TLSSecretsReady")]}{.status}{"\n"}{.reason}{"\n"}{.message}{"\n"}{end}'
```

Sample output when a Secret is missing

```
False
TLSSecretNotFound
TLS secret my-cluster-name-ssl is missing, certManagementPolicy is userProvidedOnly
```

The cluster may still show Pods as running while `TLSSecretsReady` is `False`. If the missing Secret is the PBM client Secret, the cluster state is also `error`. Treat this as a **degraded** state: MongoDB continues with certificates already mounted in Pods, but you should restore the Secrets promptly.

Check Operator logs for errors mentioning `certManagementPolicy is userProvidedOnly`.

See [Custom resource statuses](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/cr-statuses.html#conditions) for more on cluster conditions.

## Restore TLS Secrets

1. Confirm which Secret is missing:

   ```
   kubectl -n <namespace> get secret my-cluster-name-ssl my-cluster-name-ssl-internal my-cluster-name-pbm
   ```

1. Recreate or re-sync the Secret (from backup, External Secrets, or your certificate pipeline).

1. Wait for the next reconciliation cycle, then verify:

   ```
   kubectl -n <namespace> get psmdb my-cluster-name -o jsonpath='{.status.conditions[?(@.type=="TLSSecretsReady")].status}'
   ```

   The output should be `True`.

Under `userProvidedOnly`, restoring Secrets does not by itself force a rolling restart. Pods continue using the certificates already loaded until you [update certificates](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/tls-update.html) intentionally.

## Switch between policies

### Change to userProvidedOnly

Safe when TLS Secrets already exist and you want to prevent automatic regeneration if they are lost later. Apply the updated Custom Resource; no immediate Pod restart is required solely for this change.

### Change to auto

If TLS Secrets are **missing** when you switch to `auto`, the Operator creates new certificates. That may change the CA and trigger a rolling restart. Only switch back to `auto` if you intentionally want the Operator to take over certificate creation again.

There is no Operator guardrail that blocks `userProvidedOnly` → `auto` when Secrets are absent. Plan the switch and client CA trust accordingly.

## Rotate certificates with userProvidedOnly

Certificate rotation remains your responsibility:

1. Update the TLS Secrets with new certificate material (same Secret names).
1. Follow the steps in [Update certificates](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/tls-update.html) for your certificate source.
1. Confirm `TLSSecretsReady=True` after all Secrets are valid.

The Operator picks up new Secret content and reconciles Pods according to its normal TLS update flow.
