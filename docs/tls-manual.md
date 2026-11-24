# Generate TLS certificates manually

!!! warning

    Manual certificate generation didn't work in Operator version 1.16.0. This issue is fixed starting from version 1.16.1.

You can generate TLS certificates manually instead of using the Operator's automatic certificate generation. This approach gives you full control over certificate properties and is useful for production environments with specific security requirements.

Export your namespace so the commands below can use it. Replace `<namespace>`
with your value:

```bash
export NAMESPACE=<namespace>
```

## What you'll create

When you follow the steps from this guide, you'll generate these certificate files:

* `server.pem` - Server certificate for MongoDB nodes
* `server-key.pem` - Private key for the server certificate  
* `client.pem` - Certificate that `mongod` and `mongos` present to client applications. Despite the file name, it's a server certificate for external connections
* `client-key.pem` - Private key for that certificate
* `pbm.pem` - Client certificate that the Operator and the backup agents present to MongoDB. You need it when backups are enabled
* `pbm-key.pem` - Private key for the PBM client certificate
* `ca.pem` - Certificate Authority certificate
* `ca-key.pem` - Certificate Authority private key

## Certificate requirements

You need to create the following certificates:

1. **External certificates** - for client connections from outside the cluster. This set is mandatory
2. **Internal certificates** - for communication between MongoDB nodes within the cluster. You can omit generating a separate of certificates for internal communication. In this case, the operator reuses the external certificates for both external and internal communication.
3. **PBM client certificate** - for the connections that the Operator and the backup agents make to MongoDB. Starting with version 1.24.0, this certificate is mandatory when backups are enabled and must meet the following requirements:
   
     * It must be a client certificate signed by a CA that the `ca.crt` key of the internal Secret contains. If you follow this guide, that's the same CA as for the other certificates.
     * Its subject must differ from the member certificates: for example, the Operator's own PBM certificate uses the organization `PBM`, while the member certificates use `PSMDB`. MongoDB treats a client whose subject has the same `O`, `OU` and `DC` values as the member certificates as a cluster member.
     * It needs no hostnames.

Generating two separate sets of certificates is not mandatory but highly recommended. Using different certificates for internal and external connections gives you more control and improves security. For example, you can choose to renew or replace external certificates more often than internal ones, or set different expiration dates for each. This makes managing and securing your cluster easier in the long run.

After creating the certificates, you'll create a Kubernetes Secret for each set and reference them in your cluster configuration.

## Prerequisites

Before you start, make sure you have:

* `cfssl` and `cfssljson` tools installed on your system
* Your cluster name and namespace ready
* Access to your Kubernetes cluster

## Procedure

### Generate certificates

Replace `my-cluster-name` and `my-namespace` with your actual cluster name and namespace in the commands below.

=== "Sharded cluster (sharding is enabled)"

    1. Set your cluster variables
    
        ```bash
        CLUSTER_NAME=my-cluster-name
        NAMESPACE=my-namespace
        ```
    
    2. Create the Certificate Authority (CA)
    
        This command creates a root Certificate Authority that will sign all your certificates:
        
        ```bash
        cat <<EOF | cfssl gencert -initca - | cfssljson -bare ca
          {
            "CN": "Root CA",
            "names": [
              {
                "O": "PSMDB"
              }
            ],
            "key": {
              "algo": "rsa",
              "size": 2048
            }
          }
        EOF
        ```
    
    3. Create CA configuration file that defines how the CA will sign certificates:
    
        ```bash
        cat <<EOF > ca-config.json
          {
            "signing": {
              "default": {
                "expiry": "87600h",
                "usages": ["signing", "key encipherment", "server auth", "client auth"]
              }
            }
          }
        EOF
        ```
    
    4. Generate the certificate for internal MongoDB node communication, including all shard components:
    
        ```bash
        cat <<EOF | cfssl gencert -ca=ca.pem  -ca-key=ca-key.pem -config=./ca-config.json - | cfssljson -bare server
          {
            "hosts": [
              "localhost",
              "${CLUSTER_NAME}-rs0",
              "${CLUSTER_NAME}-rs0.${NAMESPACE}",
              "${CLUSTER_NAME}-rs0.${NAMESPACE}.svc.cluster.local",
              "*.${CLUSTER_NAME}-rs0",
              "*.${CLUSTER_NAME}-rs0.${NAMESPACE}",
              "*.${CLUSTER_NAME}-rs0.${NAMESPACE}.svc.cluster.local",
              "${CLUSTER_NAME}-mongos",
              "${CLUSTER_NAME}-mongos.${NAMESPACE}",
              "${CLUSTER_NAME}-mongos.${NAMESPACE}.svc.cluster.local",
              "*.${CLUSTER_NAME}-mongos",
              "*.${CLUSTER_NAME}-mongos.${NAMESPACE}",
              "*.${CLUSTER_NAME}-mongos.${NAMESPACE}.svc.cluster.local",
              "${CLUSTER_NAME}-cfg",
              "${CLUSTER_NAME}-cfg.${NAMESPACE}",
              "${CLUSTER_NAME}-cfg.${NAMESPACE}.svc.cluster.local",
              "*.${CLUSTER_NAME}-cfg",
              "*.${CLUSTER_NAME}-cfg.${NAMESPACE}",
              "*.${CLUSTER_NAME}-cfg.${NAMESPACE}.svc.cluster.local"
            ],
            "names": [
              {
                "O": "PSMDB"
              }
            ],
            "CN": "${CLUSTER_NAME/-rs0}",
            "key": {
              "algo": "rsa",
              "size": 2048
            }
          }
        EOF
        ```
    
        !!! tip "Service per Pod for `mongos`"

            If you set `sharding.mongos.expose.servicePerPod` to `true`, also add the hostnames of the per-Pod `mongos` Services to the `hosts` lists in this step and in step 7. For example, for 3 `mongos` Pods, generate the names and paste the output into the lists, for example after the `"${CLUSTER_NAME}-mongos.${NAMESPACE}.svc.cluster.local",` line. Each line of the output ends with a comma, so don't paste it at the end of a list:

            ```bash
            for i in 0 1 2; do
              printf '"%s",\n' "${CLUSTER_NAME}-mongos-$i" "${CLUSTER_NAME}-mongos-$i.${NAMESPACE}" "${CLUSTER_NAME}-mongos-$i.${NAMESPACE}.svc.cluster.local"
            done
            ```

            See [Hostnames in the certificates](TLS.md#hostnames-in-the-certificates).

    5. Bundle the server certificate with the CA certificate:
    
        ```bash
        cfssl bundle -ca-bundle=ca.pem -cert=server.pem | cfssljson -bare server
        ```
    
    6. Create a Kubernetes Secret for internal cluster communication:
    
        ```bash
        kubectl create secret generic my-cluster-name-ssl-internal --from-file=tls.crt=server.pem --from-file=tls.key=server-key.pem --from-file=ca.crt=ca.pem --type=kubernetes.io/tls -n $NAMESPACE
        ```
    
    7. Generate the certificate for external client connections, including all shard components:
    
        ```bash
        cat <<EOF | cfssl gencert -ca=ca.pem  -ca-key=ca-key.pem -config=./ca-config.json - | cfssljson -bare client
          {
            "hosts": [
              "${CLUSTER_NAME}-rs0",
              "${CLUSTER_NAME}-rs0.${NAMESPACE}",
              "${CLUSTER_NAME}-rs0.${NAMESPACE}.svc.cluster.local",
              "*.${CLUSTER_NAME}-rs0",
              "*.${CLUSTER_NAME}-rs0.${NAMESPACE}",
              "*.${CLUSTER_NAME}-rs0.${NAMESPACE}.svc.cluster.local",
              "${CLUSTER_NAME}-mongos",
              "${CLUSTER_NAME}-mongos.${NAMESPACE}",
              "${CLUSTER_NAME}-mongos.${NAMESPACE}.svc.cluster.local",
              "*.${CLUSTER_NAME}-mongos",
              "*.${CLUSTER_NAME}-mongos.${NAMESPACE}",
              "*.${CLUSTER_NAME}-mongos.${NAMESPACE}.svc.cluster.local",
              "${CLUSTER_NAME}-cfg",
              "${CLUSTER_NAME}-cfg.${NAMESPACE}",
              "${CLUSTER_NAME}-cfg.${NAMESPACE}.svc.cluster.local",
              "*.${CLUSTER_NAME}-cfg",
              "*.${CLUSTER_NAME}-cfg.${NAMESPACE}",
              "*.${CLUSTER_NAME}-cfg.${NAMESPACE}.svc.cluster.local"
            ],
            "names": [
              {
                "O": "PSMDB"
              }
            ],
            "CN": "${CLUSTER_NAME/-rs0}",
            "key": {
              "algo": "rsa",
              "size": 2048
            }
          }
        EOF
        ```
    
    8. Create a Kubernetes Secret for external client connections:
    
        ```bash
        kubectl create secret generic my-cluster-name-ssl --from-file=tls.crt=client.pem --from-file=tls.key=client-key.pem --from-file=ca.crt=ca.pem --type=kubernetes.io/tls -n $NAMESPACE
        ```

    9. If backups are enabled, generate the PBM client certificate. It has no hostnames and is valid only for client authentication:

        ```bash
        cat <<EOF > pbm-config.json
          {
            "signing": {
              "default": {
                "expiry": "87600h",
                "usages": ["signing", "key encipherment", "client auth"]
              }
            }
          }
        EOF
        cat <<EOF | cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=./pbm-config.json - | cfssljson -bare pbm
          {
            "CN": "${CLUSTER_NAME}-pbm",
            "names": [
              {
                "O": "PBM"
              }
            ],
            "key": {
              "algo": "rsa",
              "size": 2048
            }
          }
        EOF
        ```

        `cfssl` warns that the certificate lacks a `hosts` field. That's expected for a client certificate, so you can ignore the warning.

    10. Create a Kubernetes Secret for the PBM client certificate:

        ```bash
        kubectl create secret generic my-cluster-name-pbm --from-file=tls.crt=pbm.pem --from-file=tls.key=pbm-key.pem --type=kubernetes.io/tls -n $NAMESPACE
        ```

        The Secret needs only `tls.crt` and `tls.key`. When `tls.allowInvalidCertificates` is `false`, the backup agent verifies the MongoDB server with the CA from the `my-cluster-name-ssl` Secret.

=== "Replica set only (no sharding)"

    1. Set your cluster variables
    
        ```bash
        CLUSTER_NAME=my-cluster-name
        NAMESPACE=my-namespace
        ```
    
    2. Create the Certificate Authority (CA)
    
        This command creates a root Certificate Authority that will sign all your certificates:
    
        ```bash
        cat <<EOF | cfssl gencert -initca - | cfssljson -bare ca
          {
            "CN": "Root CA",
            "names": [
              {
                "O": "PSMDB"
              }
            ],
            "key": {
              "algo": "rsa",
              "size": 2048
            }
          }
        EOF
        ```
    
    3. Create a CA configuration file that defines how the CA will sign certificates:
    
        ```bash
        cat <<EOF > ca-config.json
          {
            "signing": {
              "default": {
                "expiry": "87600h",
                "usages": ["signing", "key encipherment", "server auth", "client auth"]
              }
            }
          }
        EOF
        ```
    
    4. Generate the certificate for internal MongoDB node communication:
    
        ```bash
        cat <<EOF | cfssl gencert -ca=ca.pem  -ca-key=ca-key.pem -config=./ca-config.json - | cfssljson -bare server
          {
            "hosts": [
              "localhost",
              "${CLUSTER_NAME}-rs0",
              "${CLUSTER_NAME}-rs0.${NAMESPACE}",
              "${CLUSTER_NAME}-rs0.${NAMESPACE}.svc.cluster.local",
              "*.${CLUSTER_NAME}-rs0",
              "*.${CLUSTER_NAME}-rs0.${NAMESPACE}",
              "*.${CLUSTER_NAME}-rs0.${NAMESPACE}.svc.cluster.local"
            ],
            "names": [
              {
                "O": "PSMDB"
              }
            ],
            "CN": "${CLUSTER_NAME/-rs0}",
            "key": {
              "algo": "rsa",
              "size": 2048
            }
          }
        EOF
        ```
    
    5. Bundle the server certificate with the CA certificate:
    
        ```bash
        cfssl bundle -ca-bundle=ca.pem -cert=server.pem | cfssljson -bare server
        ```
    
    6. Create a Kubernetes Secret for internal cluster communication:
    
        ```bash
        kubectl create secret generic my-cluster-name-ssl-internal --from-file=tls.crt=server.pem --from-file=tls.key=server-key.pem --from-file=ca.crt=ca.pem --type=kubernetes.io/tls -n $NAMESPACE
        ```
    
    7. Generate the certificate for external client connections:
    
        ```bash
        cat <<EOF | cfssl gencert -ca=ca.pem  -ca-key=ca-key.pem -config=./ca-config.json - | cfssljson -bare client
          {
            "hosts": [
              "${CLUSTER_NAME}-rs0",
              "${CLUSTER_NAME}-rs0.${NAMESPACE}",
              "${CLUSTER_NAME}-rs0.${NAMESPACE}.svc.cluster.local",
              "*.${CLUSTER_NAME}-rs0",
              "*.${CLUSTER_NAME}-rs0.${NAMESPACE}",
              "*.${CLUSTER_NAME}-rs0.${NAMESPACE}.svc.cluster.local"
            ],
            "names": [
              {
                "O": "PSMDB"
              }
            ],
            "CN": "${CLUSTER_NAME/-rs0}",
            "key": {
              "algo": "rsa",
              "size": 2048
            }
          }
        EOF
        ```
    
    8. Create a Kubernetes Secret for external client connections:
    
        ```bash
        kubectl create secret generic my-cluster-name-ssl --from-file=tls.crt=client.pem --from-file=tls.key=client-key.pem --from-file=ca.crt=ca.pem --type=kubernetes.io/tls -n $NAMESPACE
        ```

    9. If backups are enabled, generate the PBM client certificate. It has no hostnames and is valid only for client authentication:

        ```bash
        cat <<EOF > pbm-config.json
          {
            "signing": {
              "default": {
                "expiry": "87600h",
                "usages": ["signing", "key encipherment", "client auth"]
              }
            }
          }
        EOF
        cat <<EOF | cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=./pbm-config.json - | cfssljson -bare pbm
          {
            "CN": "${CLUSTER_NAME}-pbm",
            "names": [
              {
                "O": "PBM"
              }
            ],
            "key": {
              "algo": "rsa",
              "size": 2048
            }
          }
        EOF
        ```

        `cfssl` warns that the certificate lacks a `hosts` field. That's expected for a client certificate, so you can ignore the warning.

    10. Create a Kubernetes Secret for the PBM client certificate:

        ```bash
        kubectl create secret generic my-cluster-name-pbm --from-file=tls.crt=pbm.pem --from-file=tls.key=pbm-key.pem --type=kubernetes.io/tls -n $NAMESPACE
        ```

        The Secret needs only `tls.crt` and `tls.key`. When `tls.allowInvalidCertificates` is `false`, the backup agent verifies the MongoDB server with the CA from the `my-cluster-name-ssl` Secret.

### Configure your cluster

After creating the Secrets, add them to your cluster configuration in the `deploy/cr.yaml` file:

```yaml
spec:
  secrets:
    ssl: my-cluster-name-ssl          # External certificate secret
    sslInternal: my-cluster-name-ssl-internal  # Internal certificate secret
    sslPBM: my-cluster-name-pbm       # PBM client certificate secret
```

If you name the PBM Secret `<cluster-name>-pbm`, you can omit `secrets.sslPBM`: that's the default.

## Important notes

1. If you only create the external certificate, the Operator will use it for both external and internal communications instead of generating a separate internal certificate.

2. When you provide your own external certificate and backups are enabled, the Operator doesn't generate the PBM client certificate. Create the PBM Secret yourself, or the Operator stops reconciling the cluster. See [Troubleshooting](#troubleshooting).

3. The commands use `rs0` as the replica set name (the default). If you set a different name in the `replsets.name` Custom Resource option, update the commands accordingly.

## Additional resources

* Check the sample certificates in `deploy/ssl-secrets.yaml` for reference
* Review MongoDB certificate requirements in the [upstream documentation :octicons-link-external-16:](https://www.mongodb.com/docs/manual/tutorial/configure-ssl/#member-certificate-requirements)

## Verify the certificates

Confirm the Secrets exist and carry the three expected keys:

```bash
kubectl get secret my-cluster-name-ssl -n $NAMESPACE -o jsonpath='{.data}' | tr ',' '\n'
```

You should see `ca.crt`, `tls.crt`, and `tls.key`. Check the certificate is valid for the
names the cluster uses:

```bash
kubectl get secret my-cluster-name-ssl -n $NAMESPACE -o jsonpath='{.data.tls\.crt}' \
  | base64 -d | openssl x509 -noout -text | grep -A1 'Subject Alternative Name'
```

The SAN list must cover the Pod and Service DNS names of your cluster. A certificate that is
otherwise valid but missing those names produces connection failures that look like TLS
misconfiguration rather than a naming problem.

If backups are enabled, check that the PBM certificate is a client certificate with its own subject:

```bash
kubectl get secret my-cluster-name-pbm -n $NAMESPACE -o jsonpath='{.data.tls\.crt}' \
  | base64 -d | openssl x509 -noout -subject -ext extendedKeyUsage
```

??? example "Sample output"

    ```{.text .no-copy}
    subject=O=PBM, CN=my-cluster-name-pbm
    X509v3 Extended Key Usage:
        TLS Web Client Authentication
    ```

    The subject shows `O=PBM`, and the extended key usage is `TLS Web Client Authentication` only.

## Troubleshooting

### The cluster stops reconciling after you provide your own certificates

**Symptom:** the cluster is in the `error` state. The status message and the Operator log report:

```{.text .no-copy}
TLS secrets handler: "PBM client TLS secret my-cluster-name-pbm is required when custom SSL secret my-cluster-name-ssl is provided and backups are enabled". Please create your TLS secret my-cluster-name-ssl manually or setup cert-manager correctly
```

The database Pods keep running, but the Operator doesn't apply other changes until you fix this.

**Cause:** you created the external Secret yourself, backups are enabled, `crVersion` is 1.24.0 or later, and the PBM client Secret doesn't exist. Starting with version 1.24.0, the Operator doesn't create the PBM certificate when the external certificate comes from you.

**Fix:**

1. Generate the PBM client certificate with the same CA as your external certificate, as described in [Generate certificates](#generate-certificates).
2. Create the Secret with the name from the error message, or set its name in `secrets.sslPBM`.
3. Wait for the next reconciliation. The cluster returns to `ready`. It can take a minute or two, because the Operator retries with a delay.
