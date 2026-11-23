> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Configure data-at-rest encryption using HashiCorp Vault with TLS

This guide walks you through deploying and configuring HashiCorp Vault to work with Percona Operator for MongoDB to enable [data-at-rest encryption](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/encryption.html) using HTTPS protocol.

By default, Percona Server for MongoDB and Vault communicate over an unencrypted HTTP protocol. You can enable encrypted HTTPS protocol with TLS as an additional security layer to protect the data transmitted between Vault and your Percona Server for MongoDB nodes. HTTPS ensures that sensitive information, such as encryption keys and secrets, cannot be intercepted or tampered with on the network.

Important

You can enable data at rest encryption with HashiCorp Vault only when you create a new cluster. This is because Percona Server for MongoDB doesn’t allow enabling / disabling or changing encryption settings for a running cluster. Every time you restart the server, the encryption settings must be the same. When you define Vault configuration for a cluster, the Operator uses that instead of the default encryption key Secret.

## Assumptions

1. This guide is provided as a best effort and builds upon procedures described in the official Vault documentation. Since Vault’s setup steps may change in future releases, this document may become outdated; we cannot guarantee ongoing accuracy or responsibility for such changes. For the most up-to-date and reliable information, please always refer to [the official Vault documentation](https://developer.hashicorp.com/vault/tutorials/kubernetes/kubernetes-minikube-tls#kubernetes-minikube-tls).
1. In the following sections we deploy the Vault server in High Availability (HA) mode on Kubernetes via Helm with TLS enabled. The HA setup uses Raft storage backend and consists of 3 replicas for redundancy. Using Helm is not mandatory. Any supported Vault deployment (on-premises, in the cloud, or a managed Vault service) works as long as the Operator can reach it.
1. This guide uses Vault Helm chart version 0.30.0. You may want to change it to the required version by setting the `VAULT_HELM_VERSION` variable.

## Prerequisites

Before you begin, ensure you have the following tools installed:

- `kubectl`- Kubernetes command-line interface
- `helm` - Helm package manager
- `jq` - JSON processor

## Prepare your environment

1. Export the namespace and other variables as environment variables to simplify further configuration:

   ```
   export NAMESPACE="vault"
   export CLUSTER_NAMESPACE="psmdb"
   export VAULT_HELM_VERSION="0.30.0"
   export SERVICE="vault"
   export CSR_NAME="vault-csr"
   export SECRET_NAME_VAULT="vault-secret"
   export POLICY_NAME="psmdb-policy"
   export WORKDIR="/tmp/vault"
   ```

1. Create a working directory for configuration files:

   ```
   mkdir -p $WORKDIR
   ```

1. It is a good practice to isolate workloads in Kubernetes using namespaces. Create namespaces with the following command:

   - For Vault server:

   ```
   kubectl create namespace vault
   ```

   - For Percona Server for MongoDB cluster:

   ```
   kubectl create namespace psmdb
   ```

## Generate TLS certificates

To use TLS, you’ll need the following certificates:

- A private key for the Vault server
- A certificate for the Vault server signed by the Kubernetes CA
- The Kubernetes CA certificate

These files store sensitive information. Make sure to keep them in a secure location.

### Generate the private key

Generate a private key for the Vault server:

```
openssl genrsa -out ${WORKDIR}/vault.key 2048
```

### Create the Certificate Signing Request (CSR)

A Certificate Signing Request (CSR) is a file that contains information about your server and the certificate you need. You create it using your private key, and then submit it to Kubernetes to get a certificate signed by the Kubernetes Certificate Authority (CA). The signed certificate proves your server’s identity and enables secure TLS connections.

1. Create the Certificate Signing Request configuration file:

   Specify the certificate details that Kubernetes needs to sign your certificate:

   - **Request settings** (`[req]`): References the sections for certificate extensions and distinguished name. The distinguished name section is left empty as Kubernetes will populate it automatically.
   - **Certificate extensions** (`[v3_req]`): Defines how the certificate can be used. `serverAuth` allows the certificate for server authentication, while `keyUsage` specifies the cryptographic operations the certificate supports (non-repudiation, digital signature, and key encipherment).
   - **Subject Alternative Names** (`[alt_names]`): Lists all DNS names and IP addresses where your Vault service can be accessed. This includes the service name, fully qualified domain names (FQDNs) for different Kubernetes DNS contexts (namespace-scoped, cluster-scoped with `.svc`, and fully qualified with `.svc.cluster.local`), and the localhost IP address.

   ```
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

1. Generate the CSR. The following command creates the Certificate Signing Request file using your private key and the configuration file.

   The `-subj` parameter specifies the distinguished name directly: the Common Name (CN) identifies your Vault service using the Kubernetes node naming convention (`system:node:${SERVICE}.${NAMESPACE}.svc`), and the Organization (O) field is set to `system:nodes`, which Kubernetes requires to recognize and sign the certificate. The command combines these subject fields with the certificate extensions defined in the configuration file to produce the complete CSR.

   ```
   openssl req -new -key $WORKDIR/vault.key \
     -subj "/CN=system:node:${SERVICE}.${NAMESPACE}.svc;/O=system:nodes" \
     -out $WORKDIR/server.csr -config $WORKDIR/csr.conf
   ```

### Issue the certificate

To get your certificate signed by Kubernetes, you need to submit the CSR through the Kubernetes API. The CSR file you generated with OpenSSL must be wrapped in a Kubernetes CertificateSigningRequest resource.

1. Create the CSR YAML file to send it to Kubernetes:

   This YAML file creates a Kubernetes CertificateSigningRequest object that contains your CSR. The file embeds the base64-encoded CSR content and specifies:

   - The signer name (`kubernetes.io/kubelet-serving`) that tells Kubernetes which CA should sign the certificate
   - The groups field (`system:authenticated`) that identifies who can approve this CSR
   - The certificate usages that define how the certificate can be used (digital signature, key encipherment, and server authentication)

   ```
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

1. Create the CertificateSigningRequest (CSR) object:

   ```
   kubectl create -f ${WORKDIR}/csr.yaml
   ```

1. Approve the CSR in Kubernetes:

   ```
   kubectl certificate approve ${CSR_NAME}
   ```

1. Confirm the certificate was issued:

   ```
   kubectl get csr ${CSR_NAME}
   ```

   Sample output

   ```
   NAME        AGE   SIGNERNAME                      REQUESTOR       REQUESTEDDURATION   CONDITION
   vault-csr   16s   kubernetes.io/kubelet-serving   minikube-user   <none>              Approved,Issued
   ```

### Retrieve the certificates

After Kubernetes approves and signs your CSR, you need to retrieve the signed certificate and the Kubernetes CA certificate. These certificates are required to configure TLS for your Vault server.

1. Retrieve the signed certificate from the CertificateSigningRequest object. The certificate is base64-encoded in Kubernetes, so you decode it and save it to a file.

   ```
   kubectl get csr ${CSR_NAME} -o jsonpath='{.status.certificate}' | base64 -d > $WORKDIR/vault.crt
   ```

1. Retrieve Kubernetes CA certificate:

   This command retrieves the Kubernetes cluster’s Certificate Authority (CA) certificate from your `kubeconfig` file. The CA certificate is needed to verify that the signed certificate is valid and was issued by the Kubernetes CA. The command uses `kubectl config view` with flags to get the raw, flattened configuration and extract the CA certificate data, which is also base64-encoded.

   ```
   kubectl config view \
     --raw \
     --minify \
     --flatten \
     -o jsonpath='{.clusters[].cluster.certificate-authority-data}' \
     | base64 -d > ${WORKDIR}/vault.ca
   ```

### Store certificates in Kubernetes secrets

Create a TLS secret in Kubernetes to store the certificates and key:

```
kubectl create secret generic ${SECRET_NAME_VAULT} \
  --namespace ${NAMESPACE} \
  --from-file=vault.key=$WORKDIR/vault.key \
  --from-file=vault.crt=$WORKDIR/vault.crt \
  --from-file=vault.ca=$WORKDIR/vault.ca
```

## Install Vault with TLS

For this setup, we install Vault in Kubernetes using the [Helm 3 package manager](https://helm.sh/) in High Availability (HA) mode with Raft storage backend and with TLS enabled.

1. Add and update the Vault Helm repository:

   ```
   helm repo add hashicorp https://helm.releases.hashicorp.com
   helm repo update
   ```

1. Install Vault with TLS enabled:

   ```
   helm upgrade --install ${SERVICE} hashicorp/vault \
     --disable-openapi-validation \
     --version ${VAULT_HELM_VERSION} \
     --namespace ${NAMESPACE} \
     --set "global.enabled=true" \
     --set "global.tlsDisable=false" \
     --set "global.platform=kubernetes" \
     --set server.extraEnvironmentVars.VAULT_CACERT=/vault/userconfig/${SECRET_NAME_VAULT}/vault.ca \
     --set "server.extraEnvironmentVars.VAULT_TLSCERT=/vault/userconfig/${SECRET_NAME_VAULT}/vault.crt" \
     --set "server.extraEnvironmentVars.VAULT_TLSKEY=/vault/userconfig/${SECRET_NAME_VAULT}/vault.key" \
     --set "server.volumes[0].name=userconfig-${SECRET_NAME_VAULT}" \
     --set "server.volumes[0].secret.secretName=${SECRET_NAME_VAULT}" \
     --set "server.volumes[0].secret.defaultMode=420" \
     --set "server.volumeMounts[0].mountPath=/vault/userconfig/${SECRET_NAME_VAULT}" \
     --set "server.volumeMounts[0].name=userconfig-${SECRET_NAME_VAULT}" \
     --set "server.volumeMounts[0].readOnly=true" \
     --set "server.ha.enabled=true" \
     --set "server.ha.replicas=3" \
     --set "server.ha.raft.enabled=true" \
     --set "server.ha.raft.setNodeId=true" \
     --set-string "server.ha.raft.config=cluster_name = \"vault-integrated-storage\"
   ui = true
   listener \"tcp\" {
     tls_disable = 0
     address = \"[::]:8200\"
     cluster_address = \"[::]:8201\"
     tls_cert_file = \"/vault/userconfig/${SECRET_NAME_VAULT}/vault.crt\"
     tls_key_file  = \"/vault/userconfig/${SECRET_NAME_VAULT}/vault.key\"
     tls_client_ca_file = \"/vault/userconfig/${SECRET_NAME_VAULT}/vault.ca\"
   }
   storage \"raft\" {
     path = \"/vault/data\"
   }
   disable_mlock = true
   service_registration \"kubernetes\" {}"
   ```

   This command does the following:

   - Installs HashiCorp Vault in High Availability (HA) mode with secure TLS enabled in your Kubernetes cluster.
   - Configures Vault pods to use certificates from a Kubernetes Secret via volume mounts for secure HTTPS communication between Vault and clients.
   - Sets up Raft as the backend storage with three replicas for fault tolerance, and configures the Vault TCP listener to enforce TLS with your specified certificate files. Sample output

   ```
   NAME: vault
   LAST DEPLOYED: Wed Aug 20 12:55:38 2025
   NAMESPACE: vault
   STATUS: deployed
   REVISION: 1
   NOTES:
   Thank you for installing HashiCorp Vault!

   Now that you have deployed Vault, you should look over the docs on using
   Vault with Kubernetes available here:

   https://developer.hashicorp.com/vault/docs
   ```

1. Retrieve the Pod name where Vault is running:

   ```
   kubectl -n $NAMESPACE get pod -l app.kubernetes.io/name=${SERVICE} -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}'
   ```

   Sample output

   ```
   vault-0
   vault-1
   vault-2
   ```

## Initialize and unseal Vault

1. After Vault is installed, you need to initialize it. Run the following command to initialize the first pod:

   ```
   kubectl exec -it pod/vault-0 -n $NAMESPACE -- vault operator init -key-shares=1 -key-threshold=1 -format=json > ${WORKDIR}/vault-init
   ```

   The command does the following:

   - Connects to the Vault Pod
   - Initializes Vault server with TLS enabled
   - Creates 1 unseal key share which is required to unseal the server
   - Outputs the init response to a local file. The file includes unseal keys and root token.

1. Vault is started in a sealed state. In this state Vault can access the storage but it cannot decrypt data. In order to use Vault, you need to unseal it.

   Retrieve the unseal key from the file:

   ```
   unsealKey=$(jq -r ".unseal_keys_b64[]" < ${WORKDIR}/vault-init)
   ```

   Now, unseal Vault. Run the following command:

   ```
   kubectl exec -it pod/vault-0 -n $NAMESPACE -- vault operator unseal "$unsealKey"
   ```

   Sample output

   ```
   Key                     Value
   ---                     -----
   Seal Type               shamir
   Initialized             true
   Sealed                  false
   Total Shares            1
   Threshold               1
   Version                 1.19.0
   Build Date              2025-03-04T12:36:40Z
   Storage Type            raft
   Cluster Name            vault-integrated-storage
   Cluster ID              ed275c91-e227-681b-5aaa-f7a9fc19e37e
   Removed From Cluster    false
   HA Enabled              true
   HA Cluster              <https://vault-0.vault-internal:8201>
   HA Mode                 active
   Active Since            2025-12-15T13:36:42.542059059Z
   Raft Committed Index    37
   Raft Applied Index      37
   ```

1. Add the remaining Pods to the Vault cluster. If you have another secret name, replace the `vault-secret` with your value in the following for loop:

   ```
   for POD in vault-1 vault-2; do
     kubectl -n "$NAMESPACE" exec $POD -- sh -c '
       vault operator raft join -address=https://${HOSTNAME}.vault-internal:8200 \
         -leader-ca-cert="$(cat /vault/userconfig/vault-secret/vault.ca)" \
         -leader-client-cert="$(cat /vault/userconfig/vault-secret/vault.crt)" \
         -leader-client-key="$(cat /vault/userconfig/vault-secret/vault.key)" \
         https://vault-0.vault-internal:8200;
     '
   done
   ```

   The command connects to each Vault Pod (`vault-1` and `vault-2`) and issues the `vault operator raft join` command, which: * Joins the Pods to the Vault Raft cluster, enabling HA mode. * Uses the necessary TLS certificates to securely connect to the cluster leader (`vault-0`). * Ensures all nodes participate in the Raft consensus and share storage responsibilities.

   Sample output

   ```
   Key       Value
   ---       -----
   Joined    true
   ```

1. Unseal the remaining Pods. Use this for loop:

   ```
   for POD in vault-1 vault-2; do
       kubectl -n "$NAMESPACE" exec $POD -- sh -c "
           vault operator unseal \"$unsealKey\"
       "
   done
   ```

   Expected output

   ```
   Key                     Value
   ---                     -----
   Seal Type               shamir
   Initialized             true
   Sealed                  true
   Total Shares            1
   Threshold               1
   Unseal Progress         0/1
   Unseal Nonce            n/a
   Version                 1.19.0
   Build Date              2025-03-04T12:36:40Z
   Storage Type            raft
   Removed From Cluster    false
   HA Enabled              true
   ```

## Configure Vault

At this step you need to configure Vault and enable secrets within it. To do so you must first authenticate in Vault.

When you started Vault, it generates and starts with a [root token](https://developer.hashicorp.com/vault/docs/concepts/tokens) that provides full access to Vault. Use this token to authenticate.

Run the following command on a leader node. The remaining ones will synchronize from the leader.

1. Extract the Vault root token from the file where you saved the init response output:

   ```
   cat ${WORKDIR}/vault-init | jq -r ".root_token"
   ```

   Sample output

   ```
   hvs.*************Jg9r
   ```

1. Connect to Vault Pod:

   ```
   kubectl exec -it vault-0 -n $NAMESPACE -- /bin/sh
   ```

1. Authenticate in Vault with this token:

   ```
   vault login hvs.*************Jg9r
   ```

1. Enable the secrets engine at the mount path. The following command enables KV secrets engine v2 at the `secret` mount-path:

   ```
   vault secrets enable --version=2 -path=secret kv
   ```

   Sample output

   ```
   Success! Enabled the kv secrets engine at: secret/
   ```

1. (Optional) You can also enable audit. This is not mandatory, but useful:

   ```
   vault audit enable file file_path=/vault/vault-audit.log
   ```

   Expected output

   ```
   Success! Enabled the file audit device at: file/
   ```

1. Exit the Vault Pod:

   ```
   exit
   ```

## Create a non-root token

Using the root token for authentication is not recommended, as it poses significant security risks. Instead, you should create a dedicated, non-root token for the Operator to use when accessing Vault. The permissions for this token are controlled by an access policy. Before you create a token you must first create the access policy.

1. Create a policy for accessing the kv engine path and define the required permissions in the `capabilities` parameter:

   ```
   kubectl -n "$NAMESPACE" exec vault-0 -- sh -c "
     vault policy write $POLICY_NAME - <<EOF
   path \"secret/data/*\" {
     capabilities = [\"create\", \"read\", \"update\", \"delete\", \"list\"]
   }
   path \"secret/metadata/*\" {
     capabilities = [\"read\"]
   }
   path \"secret/*\" {
     capabilities = [\"read\"]
   }
   EOF
   "
   ```

1. Now create a token with a policy.

   ```
   kubectl -n "${NAMESPACE}" exec pod/vault-0 -- vault token create -policy="${POLICY_NAME}" -format=json > "${WORKDIR}/vault-token.json"
   ```

1. Export the non-root token as an environment variable:

   ```
   export NEW_TOKEN=$(jq -r '.auth.client_token' "${WORKDIR}/vault-token.json")
   ```

1. Verify the token:

   ```
   echo "New Vault Token: $NEW_TOKEN"
   ```

   Sample output

   ```
   hvs.CAESINO******************************************T2Y
   ```

## Create a Secret for Vault

To enable Vault for the Operator, create a Secret object for it using the Vault token and the path to TLS certificates. Note that you must create the Secret in the namespace where the Operator and the database cluster is running.

Run the following command:

```
kubectl create secret generic my-cluster-name-vault --from-literal=token=$NEW_TOKEN --from-file=ca.crt=${WORKDIR}/vault.ca -n $CLUSTER_NAMESPACE
```

Check that the Secret is created:

```
kubectl get secret -n $CLUSTER_NAMESPACE
```

## Deploy the Operator

Follow the [Quickstart](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/quickstart.html) guide to install the Operator Deployment.

Check that it is up and running with this command:

```
kubectl get deploy -n $CLUSTER_NAMESPACE
```

Sample output

```
NAME                              READY   UP-TO-DATE   AVAILABLE   AGE
percona-server-mongodb-operator   1/1     1            1           162m
```

## Reference the Secret in your Custom Resource manifest

Now, reference the Vault Secret in the Operator Custom Resource manifest. You also need the following Vault-related information:

- A Vault server name and port. If Vault is deployed in a separate namespace, use the fully qualified name in the format `<service-name>.<namespace>.svc.cluster.local`.
- Path to the token file. When you apply the new configuration, the Operator creates the required directories and places the token file there.
- Path to TLS certificates
- Contents of the `ca.cert` certificate file
- The secrets mount path in the format `<mount-path>/data/dc/<cluster name>/<path>`, where:
- the `<cluster name>` is your real cluster name
- the `<path>` is where keys are stored. Specify the `rs0` value when you add options to the `replsets.configuration` and `replsets.nonvoting.configuration` sections. Specify the `cfg` value when you add options to the `sharding.configsvrReplSet.configuration` section.

Note

In a sharded cluster, you must specify the Vault configuration in both `replsets.configuration` and `sharding.configsvrReplSet.configuration` sections.

1. Modify your `deploy/cr.yaml` as follows:

   1. Set the `secrets.vault` key to the name of your Secret created on the previous step.

   1. Add Vault-specific options to the `replsets.configuration`, `replsets.nonvoting.configuration`, and `sharding.configsvrReplSet.configuration` keys:

      ```
      secrets:
        vault: my-cluster-name-vault
      ...
      replsets:
      - name: rs0
        size: 3
      ...
        configuration: |
           security:
             enableEncryption: true
             vault:
               serverName: vault.vault.svc.cluster.local
               port: 8200
               tokenFile: /etc/mongodb-vault/token
               secret: secret/data/dc/<cluster name>/rs0
               serverCAFile: /etc/mongodb-vault/ca.crt
             ...
      sharding:
        configsvrReplSet:
          ...
          configuration: |
            security:
              enableEncryption: true
              vault:
                serverName: vault.vault.svc.cluster.local
                port: 8200
                tokenFile: /etc/mongodb-vault/token
                secret: secret/data/dc/<cluster name>/cfg
                serverCAFile: /etc/mongodb-vault/ca.crt
               ...
      ```

1. Apply your modified `cr.yaml` file:

   ```
   kubectl apply -f deploy/cr.yaml -n $CLUSTER_NAMESPACE
   ```

## Verify encryption

Check that the encryption is enabled. Execute into a Percona Server for MongoDB Pod as as a user with sufficient administrative privileges (`databaseAdmin` or `clusterAdmin`) and run the following command against the `admin` database:

```
db.serverStatus().encryptionAtRest
```

Expected output

```
{
  encryptionEnabled: true,
  encryptionCipherMode: 'AES256-CBC',
  encryptionKeyId: {
    vault: { path: 'secret/data/dc/my-cluster-name/rs0', version: '4' }
  }
}
```
