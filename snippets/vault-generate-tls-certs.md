## Generate TLS certificates 

To use TLS, you'll need the following certificates:

* A private key for the Vault server
* A certificate for the Vault server signed by the Kubernetes CA
* The Kubernetes CA certificate

These files store sensitive information. Make sure to keep them in a secure location.

### Generate the private key

Generate a private key for the Vault server:

```bash
openssl genrsa -out ${WORKDIR}/vault.key 2048
```

### Create the Certificate Signing Request (CSR)

A Certificate Signing Request (CSR) is a file that contains information about your server and the certificate you need. You create it using your private key, and then submit it to Kubernetes to get a certificate signed by the Kubernetes Certificate Authority (CA). The signed certificate proves your server's identity and enables secure TLS connections.

1. Create the Certificate Signing Request configuration file:

    Specify the certificate details that Kubernetes needs to sign your certificate:

    * **Request settings** (`[req]`): References the sections for certificate extensions and distinguished name. The distinguished name section is left empty as Kubernetes will populate it automatically.
    * **Certificate extensions** (`[v3_req]`): Defines how the certificate can be used. `serverAuth` allows the certificate for server authentication, while `keyUsage` specifies the cryptographic operations the certificate supports (non-repudiation, digital signature, and key encipherment).
    * **Subject Alternative Names** (`[alt_names]`): Lists all DNS names and IP addresses where your Vault service can be accessed. This includes the service name, fully qualified domain names (FQDNs) for different Kubernetes DNS contexts (namespace-scoped, cluster-scoped with `.svc`, and fully qualified with `.svc.cluster.local`), and the localhost IP address.

    ```bash
    cat > "${WORKDIR}/csr.conf" <<'EOF'
    [req]
    default_bits = 2048
    prompt = no
    encrypt_key = yes
    default_md = sha256
    distinguished_name = kubelet_serving
    req_extensions = v3_req
    [ kubelet_serving ]
    O = system:nodes
    CN = system:node:*.vault.svc.cluster.local
    [ v3_req ]
    basicConstraints = CA:FALSE
    keyUsage = nonRepudiation, digitalSignature, keyEncipherment, dataEncipherment
    extendedKeyUsage = serverAuth, clientAuth
    subjectAltName = @alt_names
    [alt_names]
    DNS.1 =*.vault-internal
    DNS.2 = *.vault-standby
    DNS.3 =*.vault-internal.vault.svc.cluster.local
    DNS.4 = *.vault-standby.vault.svc.cluster.local
    DNS.5 =*.vault
    DNS.6 = vault.vault.svc.cluster.local
    IP.1 = 127.0.0.1
    EOF
    ```

2. Generate the CSR. The following command creates the Certificate Signing Request file using your private key and the configuration file.

    The `-subj` parameter specifies the distinguished name directly: the Common Name (CN) identifies your Vault service using the Kubernetes node naming convention (`system:node:${SERVICE}.${NAMESPACE}.svc`), and the Organization (O) field is set to `system:nodes`, which Kubernetes requires to recognize and sign the certificate. The command combines these subject fields with the certificate extensions defined in the configuration file to produce the complete CSR.

    ```bash
    openssl req -new -key $WORKDIR/vault.key \
      -subj "/CN=system:node:${SERVICE}.${NAMESPACE}.svc;/O=system:nodes" \
      -out $WORKDIR/server.csr -config $WORKDIR/csr.conf
    ```

### Issue the certificate

To get your certificate signed by Kubernetes, you need to submit the CSR through the Kubernetes API. The CSR file you generated with OpenSSL must be wrapped in a Kubernetes CertificateSigningRequest resource.

1. Create the CSR YAML file to send it to Kubernetes:

    This YAML file creates a Kubernetes CertificateSigningRequest object that contains your CSR. The file embeds the base64-encoded CSR content and specifies:

    * The signer name (`kubernetes.io/kubelet-serving`) that tells Kubernetes which CA should sign the certificate
    * The groups field (`system:authenticated`) that identifies who can approve this CSR
    * The certificate usages that define how the certificate can be used (digital signature, key encipherment, and server authentication)

    ```bash
    cat > $WORKDIR/csr.yaml <<EOF
    apiVersion: certificates.k8s.io/v1
    kind: CertificateSigningRequest
    metadata:
      name: ${CSR_NAME}
    spec:
      groups:
      - system:authenticated
      request: $(cat $WORKDIR/server.csr | base64 | tr -d '\n')
      signerName: kubernetes.io/kubelet-serving
      usages:
      - digital signature
      - key encipherment
      - server auth
    EOF
    ```

2. Create the CertificateSigningRequest (CSR) object:

    ```bash
    kubectl create -f ${WORKDIR}/csr.yaml
    ```

3. Approve the CSR in Kubernetes:

    ```bash
    kubectl certificate approve ${CSR_NAME}
    ```

4. Confirm the certificate was issued:

    ```bash
    kubectl get csr ${CSR_NAME}
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        NAME        AGE   SIGNERNAME                      REQUESTOR       REQUESTEDDURATION   CONDITION
        vault-csr   16s   kubernetes.io/kubelet-serving   minikube-user   <none>              Approved,Issued
        ```

### Retrieve the certificates

After Kubernetes approves and signs your CSR, you need to retrieve the signed certificate and the Kubernetes CA certificate. These certificates are required to configure TLS for your Vault server.

1. Retrieve the signed certificate from the CertificateSigningRequest object. The certificate is base64-encoded in Kubernetes, so you decode it and save it to a file.

    ```bash
    kubectl get csr ${CSR_NAME} -o jsonpath='{.status.certificate}' | base64 -d > $WORKDIR/vault.crt
    ```

2. Retrieve Kubernetes CA certificate:

    This command retrieves the Kubernetes cluster's Certificate Authority (CA) certificate from your `kubeconfig` file. The CA certificate is needed to verify that the signed certificate is valid and was issued by the Kubernetes CA. The command uses `kubectl config view` with flags to get the raw, flattened configuration and extract the CA certificate data, which is also base64-encoded.

    ```bash
    kubectl config view \
      --raw \
      --minify \
      --flatten \
      -o jsonpath='{.clusters[].cluster.certificate-authority-data}' \
      | base64 -d > ${WORKDIR}/vault.ca
    ```

### Store certificates in Kubernetes secrets

Create a TLS secret in Kubernetes to store the certificates and key:

```bash
kubectl create secret generic ${SECRET_NAME_VAULT} \
  --namespace ${NAMESPACE} \
  --from-file=vault.key=$WORKDIR/vault.key \
  --from-file=vault.crt=$WORKDIR/vault.crt \
  --from-file=vault.ca=$WORKDIR/vault.ca
```

