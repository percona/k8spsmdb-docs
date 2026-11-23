> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Configure Vault for system user management

This document guides you through the configuration of the Operator and Vault for system user management. By default, the Operator and Vault communicate over an unencrypted HTTP protocol. You can enable encrypted HTTPS protocol with TLS as an additional security layer to protect the data transmitted between Vault and your Percona Server for MongoDB nodes. HTTPS ensures that sensitive information, such as encryption keys and secrets, cannot be intercepted or tampered with on the network.

## About this guide

1. This guide is provided as a best effort and builds upon procedures described in the official Vault documentation. Since Vault’s setup steps may change in future releases, this document may become outdated; we cannot guarantee ongoing accuracy or responsibility for such changes. For the most up-to-date and reliable information, please always refer to [the official Vault documentation](https://developer.hashicorp.com/vault/tutorials/kubernetes/kubernetes-minikube-tls#kubernetes-minikube-tls).
1. In the following sections we deploy the Vault server in High Availability (HA) mode on Kubernetes via Helm with TLS enabled. The HA setup uses Raft storage backend and consists of 3 replicas for redundancy. Using Helm is not mandatory. Any supported Vault deployment (on-premises, in the cloud, or a managed Vault service) works as long as the Operator can reach it.
1. This guide uses Vault Helm chart version 0.30.0. You may want to change it to the required version by setting the `VAULT_HELM_VERSION` variable.

## Before you begin

Ensure you have the following tools installed:

- `kubectl`- Kubernetes command-line interface
- `helm` - Helm package manager
- `jq` - JSON processor

## Prepare your environment

1. Export the namespaces and other variables as environment variables to simplify further configuration:

   ```
   export NAMESPACE="vault"
   export CLUSTER_NAMESPACE="psmdb"
   export VAULT_HELM_VERSION="0.30.0"
   export SERVICE="vault"
   export CSR_NAME="vault-csr"
   export SECRET_NAME_VAULT="vault-secret"
   export POLICY_NAME="operator"
   export WORKDIR="/tmp/vault"
   ```

1. Create a working directory for certificate and configuration files:

   ```
   mkdir -p /tmp/vault
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

### Enable secrets engine

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

1. Exit the Vault pod:

   ```
   exit
   ```

### Create the access policy for the Operator

Create a policy for accessing the kv engine path and define the required permissions in the `capabilities` parameter:

```
kubectl -n "$NAMESPACE" exec vault-0 -- sh -c "vault policy write $POLICY_NAME - << 'EOF'
path \"secret/psmdb/operator/*\" {
  capabilities = [\"read\"]
}

path \"secret/data/psmdb/operator/*\" {
  capabilities = [\"read\"]
}
EOF"
```

### Configure authentication in Vault

Depending on your Vault setup, configure one of the authentication methods:

- [Kubernetes Service Account authentication](#kubernetes-service-account-authentication)
- [Authentication with Vault token](#authentication-with-vault-token)

#### Kubernetes Service Account authentication

When the Operator authenticates to Vault using the Kubernetes authentication method, it presents a JWT token issued by the Kubernetes API server.

Vault must verify that JWT. To do that, Vault needs two things:

1. The Kubernetes API server URL, so it can call the TokenReview API.
1. The JWT issuer URL, so it can validate the token signature and claims.

The following steps guide you through the setup.

1. Enable the Kubernetes authentication method in Vault:

   ```
   kubectl -n "$NAMESPACE" exec vault-0 -- sh -c "vault auth enable kubernetes"
   ```

   Expected output

   ```
   Success! Enabled kubernetes auth method at: kubernetes/
   ```

1. Configure the Kubernetes endpoint in Vault:

   ```
   kubectl -n "$NAMESPACE" exec vault-0 -- sh -c "vault write auth/kubernetes/config kubernetes_host=https://$KUBERNETES_SERVICE_HOST:$KUBERNETES_SERVICE_PORT"
   ```

   Expected output

   ```
   Success! Data written to: auth/kubernetes/config
   ```

1. Discover the service account issuer and export it as an environment variable:

   ```
   export ISSUER="$(kubectl get --raw /.well-known/openid-configuration | jq -r '.issuer')"
   ```

   Sample output for GKE

   ```
   echo $ISSUER
   https://container.googleapis.com/v1/projects/<project-ID>/locations/<region>/clusters/<kubernetes-cluster-name>
   ```

1. Create a Vault role bound to the Operator Service Account:

   ```
   kubectl -n "$NAMESPACE" exec vault-0 -- sh -c "vault write auth/kubernetes/role/operator \
    bound_service_account_names=percona-server-mongodb-operator \
    bound_service_account_namespaces=$CLUSTER_NAMESPACE \
    policies=operator \
    audience="$ISSUER" \
    ttl=1h"
   ```

   Expected output

   ```
   Success! Data written to: auth/kubernetes/role/operator
   ```

1. Create a RoleBinding resource for your cluster. This grants Vault permission to call the Kubernetes TokenReview API (`system:auth-delegator`), which is required to validate the Operator service account JWT during login. The default service account name is `percona-server-mongodb-operator`.

   ```
   kubectl apply -f - <<EOF
   apiVersion: rbac.authorization.k8s.io/v1
   kind: RoleBinding
   metadata:
       name: role-tokenreview-binding
       namespace: $CLUSTER_NAMESPACE
   roleRef:
       apiGroup: rbac.authorization.k8s.io
       kind: ClusterRole
       name: system:auth-delegator
   subjects:
       - kind: ServiceAccount
         name: percona-server-mongodb-operator
         namespace: $CLUSTER_NAMESPACE
   EOF
   ```

1. Check that a RoleBinding is created:

   ```
   kubectl get rolebindings -n $CLUSTER_NAMESPACE
   ```

   Sample output

   ```
   NAME                                              ROLE                                   AGE
   role-tokenreview-binding                          ClusterRole/system:auth-delegator      16s
   service-account-percona-server-mongodb-operator   Role/percona-server-mongodb-operator   4m39s
   ```

#### Authentication with Vault token

1. Create a non-root token in Vault using the [access policy](#create-the-access-policy-for-the-operator) you created before:

   ```
   kubectl -n "${NAMESPACE}" exec pod/vault-0 -- sh -c "vault token create -policy="operator" -format=json" > "${WORKDIR}/vault-token.json"
   ```

1. Export a token as an environment variable:

   ```
   export NEW_TOKEN=$(jq -r '.auth.client_token' "${WORKDIR}/vault-token.json")
   ```

1. Create a Kubernetes Secret with the token for the namespace where Percona Server for MongoDB is deployed

   ```
   kubectl create secret generic vault-sync-secret \
    --from-literal=token="$NEW_TOKEN" -n $CLUSTER_NAMESPACE
   ```

   Sample output

   ```
   secret/vault-sync-secret created
   ```

## Upload data to Vault

The default path in Vault to store user passwords is `secret/data/psmdb/{role}/{namespace}/{name}/users`, where:

- `{role}` is the role for the Operator that you create in Vault
- `{namespace}` is the namespace where Percona Server for MongoDB is deployed
- `{name}` is the Percona Server for MongoDB cluster name as defined in the Custom Resource

For testing purposes, let’s insert the credentials from the sample `deploy/secrets.yaml` file in the JSON format.

1. Create a file in JSON format:

   ```
   cat <<EOF | tee $WORKDIR/passwords.json
   {
       "MONGODB_USER_ADMIN_USER": "userAdmin",
       "MONGODB_USER_ADMIN_PASSWORD": "strongPass",
       "MONGODB_DATABASE_ADMIN_USER": "dbAdmin",
       "MONGODB_DATABASE_ADMIN_PASSWORD": "strongPass",
       "MONGODB_BACKUP_USER": "backup",
       "MONGODB_BACKUP_PASSWORD": "strongPass",
       "MONGODB_CLUSTER_ADMIN_USER": "clusterAdmin",
       "MONGODB_CLUSTER_ADMIN_PASSWORD": "strongPass",
       "MONGODB_CLUSTER_MONITOR_USER": "clusterMonitor",
       "MONGODB_CLUSTER_MONITOR_PASSWORD": "strongPass"
   }
   EOF
   ```

1. Copy the file to a folder inside the Vault Pod:

   ```
   kubectl cp $WORKDIR/passwords.json $NAMESPACE/vault-0:/tmp/passwords.json
   ```

1. Upload the file in Vault:

   ```
   kubectl exec -it vault-0 -n $NAMESPACE -- /bin/sh -c "vault kv put -mount=secret psmdb/operator/$CLUSTER_NAMESPACE/my-cluster-name/users/ @/tmp/passwords.json"
   ```

   Sample output

   ```
   =========================== Secret Path ===========================
   secret/data/psmdb/operator/psmdb/my-cluster-name/users/databaseAdmin
   ======= Metadata =======
   Key                Value
   ---                -----
   created_time       2026-02-05T14:32:48.376356584Z
   custom_metadata    <nil>
   deletion_time      n/a
   destroyed          false
   version            1
   ```

1. Verify the insertion:

   ```
   kubectl exec -it vault-0 -n $NAMESPACE -- /bin/sh -c "vault kv get -mount=secret psmdb/operator/$CLUSTER_NAMESPACE/my-cluster-name/users"
   ```

   Sample output

   ```
   =========================== Secret Path ===========================
   secret/data/psmdb/operator/psmdb/my-cluster-name/users/databaseAdmin
   ======= Metadata =======
   Key                Value
   ---                -----
   created_time       2026-02-06T11:22:18.96780783Z
   custom_metadata    <nil>
   deletion_time      n/a
   destroyed          false
   version            2

   ================== Data ==================
   Key                                 Value
   ---                                 -----
   MONGODB_BACKUP_PASSWORD             strongPass
   MONGODB_BACKUP_USER                 backup
   MONGODB_CLUSTER_ADMIN_PASSWORD      strongPass
   MONGODB_CLUSTER_ADMIN_USER          clusterAdmin
   MONGODB_CLUSTER_MONITOR_PASSWORD    strongPass
   MONGODB_CLUSTER_MONITOR_USER        clusterMonitor
   MONGODB_DATABASE_ADMIN_PASSWORD     newStrongPass
   MONGODB_DATABASE_ADMIN_USER         dbAdmin
   MONGODB_USER_ADMIN_PASSWORD         strongPass
   MONGODB_USER_ADMIN_USER             userAdmin
   ```

See the [Vault documentation](https://developer.hashicorp.com/vault/docs/commands/kv/put) for more usage examples of manipulating the data.

## Configure the Operator

Now you must configure the Operator to communicate with Vault.

### Create a Secret for Vault (optional)

You can specify what TLS certificate the Operator should use when it connects to Vault over TLS. To do that, you must create a Secret object with this data and reference it in the `tlsSecret` option in the Custom Resource.

If you don’t set the `tlsSecret`, the Operator authenticates to Vault over an unencrypted HTTP protocol.

Create the Secret with the following command. Specify the path to your TLS certificate:

```
kubectl create secret generic my-tls-vault-secret --from-file=ca.crt=$WORKDIR/vault.ca -n $CLUSTER_NAMESPACE
```

### Reference Vault configuration in the Custom Resource

Now, configure Vault in the Custom Resource to make the Operator aware of it.

Specify the following information:

- `endpointURL`: Where your Vault server is running.

- `tlsSecret` (optional): The Secret name that contains TLS certificates for accessing Vault via TLS. This is the Secret object that you created at the previous step

- `reinitInterval` (optional): How often the Operator creates a new Vault client. The default is 30 minutes. See [Control how often the Operator contacts Vault](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/system-users-vault.html#control-how-often-the-operator-contacts-vault).

- `requestInterval` (optional): How often the Operator reads user passwords from Vault. Leave it unset to read Vault on every reconciliation. See [Control how often the Operator contacts Vault](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/system-users-vault.html#control-how-often-the-operator-contacts-vault).

- Specify the Vault-related information for the `syncUsers` subsection:

- `role`: The role you have created for the Operator in Vault

- `mountPath`: The mount path at which you have enabled the secrets engine

- `keyPath`: The path to store user passwords

- `tokenSecret`: The Secret object that contains the authentication token. Specify it if you configured [authentication with Vault tokens](#authentication-with-vault-token)

- Add the Vault configuration to your Custom Resource.

  **Kubernetes authentication**

  ```
  spec:
    vault:
      endpointURL: https://vault.vault.svc.cluster.local:8200
      tlsSecret: my-tls-vault-secret
      syncUsers:
        role: operator
        mountPath: secret
        keyPath: psmdb/operator/psmdb/my-cluster-name/users
  ```

  **Authentication with Vault token**

  ```
  spec:
    vault:
      endpointURL: https://vault.vault.svc.cluster.local:8200
      tlsSecret: my-tls-vault-secret
      syncUsers:
        role: operator
        mountPath: secret
        keyPath: psmdb/operator/psmdb/my-cluster-name/users
        tokenSecret: vault-sync-secret
  ```

## Authenticate in Percona Server for MongoDB to verify password management

To verify that the Operator retrieves passwords from Vault, we’ll do the following:

- deploy a separate `mongo` client Pod
- authenticate in Percona Server for MongoDB with the current password
- change the password in Vault
- authenticate with the new password

Here’s how to do it:

1. Get the connection string from the `<cluster-name>-databaseadmin-conn-str` Secret:

   **sharding is on**

   ```
   kubectl get secret my-cluster-name-databaseadmin-conn-str -n $CLUSTER_NAMESPACE \
     -o jsonpath='{.data.databaseAdmin_mongos_connectionString}' | base64 --decode && echo
   ```

   **sharding is off**

   ```
   kubectl get secret my-cluster-name-databaseadmin-conn-str -n $CLUSTER_NAMESPACE \
     -o jsonpath='{.data.databaseAdmin_rs0_connectionString}' | base64 --decode && echo
   ```

   See [Connection secrets](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/connection-secrets.html) for other key names.

1. Your cluster uses TLS by default, and MongoDB requires a client certificate for any TLS connection. Retrieve the certificate, key, and CA certificate from the `<cluster-name>-ssl` Secret:

   ```
   kubectl get secret my-cluster-name-ssl -n $CLUSTER_NAMESPACE -o jsonpath='{.data.tls\.crt}' | base64 -d > tls.crt
   kubectl get secret my-cluster-name-ssl -n $CLUSTER_NAMESPACE -o jsonpath='{.data.tls\.key}' | base64 -d > tls.key
   kubectl get secret my-cluster-name-ssl -n $CLUSTER_NAMESPACE -o jsonpath='{.data.ca\.crt}' | base64 -d > ca.crt
   cat tls.crt tls.key > client.pem
   ```

1. Spin up a `mongo` client Pod and copy the certificate files into it:

   ```
   kubectl -n $CLUSTER_NAMESPACE run percona-client --image=percona/percona-server-mongodb:8.3.13-4 --restart=Never -- sleep 3600
   kubectl -n $CLUSTER_NAMESPACE cp client.pem percona-client:/tmp/client.pem
   kubectl -n $CLUSTER_NAMESPACE cp ca.crt percona-client:/tmp/ca.crt
   ```

1. Open a shell inside the Pod:

   ```
   kubectl -n $CLUSTER_NAMESPACE exec -it percona-client -- bash -il
   ```

1. Inside the Pod, connect using the connection string from step 1 and the certificate files you copied in:

   ```
   mongosh "<connection-string>" --tlsCertificateKeyFile /tmp/client.pem --tlsCAFile /tmp/ca.crt
   ```

   Expected output

   ```
   .....
   [direct: mongos] admin>
   ```

   If your cluster has TLS disabled, drop the `--tlsCertificateKeyFile`/`--tlsCAFile` flags and connect with just `mongosh "<connection-string>"`.

1. Update the password for the `MONGODB_DATABASE_ADMIN_PASSWORD` user:

   ```
   kubectl exec -it vault-0 -n $NAMESPACE -- /bin/sh -c "vault kv patch -mount=secret psmdb/operator/$CLUSTER_NAMESPACE/my-cluster-name/users MONGODB_DATABASE_ADMIN_PASSWORD="newStrongPass""
   ```

1. Repeat steps 4-5 and connect to Percona Server for MongoDB with this new password. As a result you should be successfully authenticated.

1. When you’re done, delete the client Pod:

   ```
   kubectl delete pod percona-client -n $CLUSTER_NAMESPACE
   ```
