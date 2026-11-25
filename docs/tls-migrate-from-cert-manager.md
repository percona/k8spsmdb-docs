# Migrate from cert-manager to custom TLS certificates

When cert-manager is installed in the cluster and your Percona Server for MongoDB Custom Resource does not reference custom TLS Secrets, the Percona Operator for MongoDB creates cert-manager `Issuer` and `Certificate` resources and delegates certificate issuance and renewal to cert-manager when it creates a new cluster. The Operator does not perform its own built-in certificate rotation in that mode.

If you prefer **not** to use cert-manager in your environment, you can instead supply Kubernetes Secrets with your own TLS material and point the Custom Resource at them. This guide describes how to move an **existing** cluster from cert-manager-managed certificates to custom certificates **without rotating the cluster CA**, so clients and replicas that already trust the current CA keep working.

!!! warning

    Uninstall cert-manager only after the policy change. If you remove it first, the Operator keeps trying to update certificates through cert-manager. Those updates fail with `the server could not find the requested resource (post issuers.cert-manager.io)`, the cluster status changes to `error`, and the Operator stops applying changes to the cluster.

    Database Pods keep running, but the cluster doesn't return to `ready` on its own. The recovery issues new certificates under a new certificate authority (CA) and restarts all database Pods at once. See [The cluster is in `error` after cert-manager was uninstalled](troubleshoot-operator.md#the-cluster-is-in-error-after-cert-manager-was-uninstalled).

Set the cluster name and namespace for the commands on this page:

```bash
export CLUSTER_NAME=<cluster-name>
export NAMESPACE=<namespace>
```

## Stop the Operator from managing certificates

Do this while cert-manager is still installed. Repeat it for every Percona Server for MongoDB cluster that uses cert-manager.

1. Set [`tls.certManagementPolicy`](operator.md#tlscertmanagementpolicy) to `userProvidedOnly`:

    ```bash
    kubectl patch psmdb "${CLUSTER_NAME}" -n "${NAMESPACE}" --type merge \
      -p '{"spec":{"tls":{"certManagementPolicy":"userProvidedOnly"}}}'
    ```

2. Wait until the cluster is `ready`:

    ```bash
    kubectl get psmdb "${CLUSTER_NAME}" -n "${NAMESPACE}" -o jsonpath='{.status.state}'
    ```

    The output is `ready`. The Pods are not restarted, and the TLS Secrets stay the same.

    The Operator log contains the following line. It repeats on every reconcile:

    ``` {.text .no-copy}
    certManagementPolicy is userProvidedOnly, skipping automatic certificate management
    ```

    Read the log with:

    ```bash
    kubectl logs deploy/percona-server-mongodb-operator -n "${NAMESPACE}"
    ```

    In [cluster-wide mode](cluster-wide.md) the Operator runs in a different namespace. For a Helm installation, the Deployment name usually ends with `psmdb-operator`. See [Troubleshoot the Operator](troubleshoot-operator.md#before-you-start).

## Uninstall cert-manager

Skip this step if any Percona Server for MongoDB cluster, or any other application, still uses cert-manager.

Remove cert-manager the same way you installed it. For a manifest install, delete that manifest. Replace the version in this command if you installed a different one:

```bash
kubectl delete -f https://github.com/jetstack/cert-manager/releases/download/v{{ certmanagerrecommended }}/cert-manager.yaml
```

If you installed cert-manager with Helm, uninstall that Helm release instead.

The cluster stays `ready`. Every few minutes, the Operator log then reports errors that it can no longer list cert-manager resources:

``` {.text .no-copy}
failed to list *v1.Certificate: the server could not find the requested resource (get certificates.cert-manager.io)
failed to list *v1.Issuer: the server could not find the requested resource (get issuers.cert-manager.io)
```

These messages don't affect the cluster. They stop the next time the Operator Pod restarts, for example when you upgrade the Operator.

## Remove cert-manager metadata from the Secrets

The Secrets `${CLUSTER_NAME}-ssl`, `${CLUSTER_NAME}-ssl-internal`, `${CLUSTER_NAME}-pbm` and `${CLUSTER_NAME}-ca-cert` still carry cert-manager labels and annotations. You can leave them. To remove that metadata without changing the Secrets, run the following commands. They need `jq`. Skip `${CLUSTER_NAME}-pbm` when backups are disabled:

```bash
for s in "${CLUSTER_NAME}-ssl" "${CLUSTER_NAME}-ssl-internal" "${CLUSTER_NAME}-pbm" "${CLUSTER_NAME}-ca-cert"; do
  kubectl label secret "$s" -n "${NAMESPACE}" controller.cert-manager.io/fao-
  kubectl annotate secret "$s" -n "${NAMESPACE}" $(kubectl get secret "$s" -n "${NAMESPACE}" -o json \
    | jq -r '.metadata.annotations | keys[] | select(startswith("cert-manager.io/")) + "-"')
done
```

The cluster stays `ready`, and the Pods are not restarted. From now on the Operator treats these Secrets as your own, and the log no longer shows the `certManagementPolicy is userProvidedOnly` line.

Don't delete `${CLUSTER_NAME}-ca-cert`. It holds the CA certificate in `tls.crt` and its private key in `tls.key`. You need them to sign new certificates under the same CA.

## Renew the certificates

cert-manager no longer renews these certificates. Replace them before they expire. Check the expiry date of the certificates and of the CA:

```bash
kubectl get secret "${CLUSTER_NAME}-ssl" -n "${NAMESPACE}" -o jsonpath='{.data.tls\.crt}' \
  | base64 -d | openssl x509 -noout -enddate
kubectl get secret "${CLUSTER_NAME}-ssl" -n "${NAMESPACE}" -o jsonpath='{.data.ca\.crt}' \
  | base64 -d | openssl x509 -noout -enddate
```

The CA that the Operator-managed issuer created expires one year after the cluster was created.

### Renew the certificates under the same CA

You sign new certificates with the CA from the `${CLUSTER_NAME}-ca-cert` Secret and put them into the existing Secrets. The Secret names don't change, so you don't need to change the Custom Resource. This procedure needs `openssl`.

1. Extract the CA certificate and its private key:

    ```bash
    kubectl get secret "${CLUSTER_NAME}-ca-cert" -n "${NAMESPACE}" -o jsonpath='{.data.tls\.crt}' | base64 -d > ca.crt
    kubectl get secret "${CLUSTER_NAME}-ca-cert" -n "${NAMESPACE}" -o jsonpath='{.data.tls\.key}' | base64 -d > ca.key
    ```

2. Read the hostnames of the current certificate. The new certificates must list the same Subject Alternative Names:

    ```bash
    SANS=$(kubectl get secret "${CLUSTER_NAME}-ssl" -n "${NAMESPACE}" -o jsonpath='{.data.tls\.crt}' \
      | base64 -d | openssl x509 -noout -ext subjectAltName | tail -n +2 | tr -d ' ')
    echo "${SANS}"
    ```

    The output is a comma-separated list such as `DNS:localhost,DNS:my-cluster-name-rs0,...`.

3. Sign new certificates for `${CLUSTER_NAME}-ssl` and `${CLUSTER_NAME}-ssl-internal`. Set `-days` to the validity you need, but not past the expiry date of the CA:

    ```bash
    cat > server.ext <<EOF
    basicConstraints=CA:FALSE
    keyUsage=digitalSignature,keyEncipherment
    extendedKeyUsage=serverAuth,clientAuth
    subjectAltName=${SANS}
    EOF

    for s in ssl ssl-internal; do
      openssl req -new -newkey rsa:2048 -nodes -keyout "$s.key" \
        -subj "/O=PSMDB/CN=${CLUSTER_NAME}" -out "$s.csr"
      openssl x509 -req -in "$s.csr" -CA ca.crt -CAkey ca.key -CAcreateserial \
        -days 90 -sha256 -extfile server.ext -out "$s.crt"
    done
    ```

    ??? example "Sample output"
        
        ```{.text .no-copy}
        Certificate request self-signature ok
        subject=O=PSMDB, CN=my-cluster-name
        ```

4. If backups are enabled, sign a new client certificate for `${CLUSTER_NAME}-pbm`:

    ```bash
    cat > pbm.ext <<EOF
    basicConstraints=CA:FALSE
    keyUsage=digitalSignature,keyEncipherment
    extendedKeyUsage=clientAuth
    EOF

    openssl req -new -newkey rsa:2048 -nodes -keyout pbm.key \
      -subj "/O=PBM/CN=${CLUSTER_NAME}-pbm" -out pbm.csr
    openssl x509 -req -in pbm.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
      -days 90 -sha256 -extfile pbm.ext -out pbm.crt
    ```

    ??? example "Sample output"
        
        ```{.text .no-copy}
        Certificate request self-signature ok
        subject=O=PBM, CN=my-cluster-name-pbm
        ```

5. Put the new certificates into the Secrets. Keep the same `ca.crt`:

    ```bash
    for s in ssl-internal ssl; do
      kubectl create secret generic "${CLUSTER_NAME}-$s" -n "${NAMESPACE}" --type=kubernetes.io/tls \
        --from-file=ca.crt=ca.crt --from-file=tls.crt="$s.crt" --from-file=tls.key="$s.key" \
        --dry-run=client -o yaml | kubectl apply -f -
    done
    kubectl create secret generic "${CLUSTER_NAME}-pbm" -n "${NAMESPACE}" --type=kubernetes.io/tls \
      --from-file=tls.crt=pbm.crt --from-file=tls.key=pbm.key \
      --dry-run=client -o yaml | kubectl apply -f -
    ```

    Skip the `${CLUSTER_NAME}-pbm` command if backups are disabled.

6. Wait until the cluster is `ready`. The Operator restarts the database Pods one at a time, and clients that trust the CA stay connected:

    ```bash
    kubectl wait psmdb "${CLUSTER_NAME}" -n "${NAMESPACE}" \
      --for=jsonpath='{.status.state}'=ready --timeout=10m
    ```

7. Check the new expiry date with the command from the start of this section. 
   
     ```bash
    kubectl get secret "${CLUSTER_NAME}-ssl" -n "${NAMESPACE}" -o jsonpath='{.data.tls\.crt}' \
      | base64 -d | openssl x509 -noout -enddate
    kubectl get secret "${CLUSTER_NAME}-ssl" -n "${NAMESPACE}" -o jsonpath='{.data.ca\.crt}' \
      | base64 -d | openssl x509 -noout -enddate
    ```

    Then delete the local files. `ca.key` and the `*.key` files are private keys:

    ```bash
    rm -f ca.key ca.crt ca.srl server.ext pbm.ext \
      ssl.key ssl.csr ssl.crt ssl-internal.key ssl-internal.csr ssl-internal.crt \
      pbm.key pbm.csr pbm.crt
    ```

To move to a new CA, follow [Update certificates without downtime](tls-update.md#update-certificates-without-downtime). [`tls.certValidityDuration`](operator.md#tlscertvalidityduration) applies only while cert-manager manages the certificates.

## Next steps

[Update certificates](tls-update.md){.md-button}

## See also

* [Configure TLS using cert-manager](tls-cert-manager.md)
* [Configure the TLS certificate management policy](tls-cert-management-policy.md)
