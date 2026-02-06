# Configure Vault for system user management

This document guides you through the configuration of the Operator and Vault for system user management. By default, the Operator and Vault communicate over an unencrypted HTTP protocol. You can enable encrypted HTTPS protocol with TLS as an additional security layer to protect the data transmitted between Vault and your PXC nodes. HTTPS ensures that sensitive information, such as encryption keys and secrets, cannot be intercepted or tampered with on the network.

## Assumptions

1. This guide is provided as a best effort and builds upon procedures described in the official Vault documentation. Since Vault's setup steps may change in future releases, this document may become outdated; we cannot guarantee ongoing accuracy or responsibility for such changes. For the most up-to-date and reliable information, please always refer to [the official Vault documentation](https://developer.hashicorp.com/vault/tutorials/kubernetes/kubernetes-minikube-tls#expose-the-vault-service-and-retrieve-the-secret-via-the-api).
2. In the following sections we deploy the Vault server in High Availability (HA) mode on Kubernetes via Helm with TLS enabled. The HA setup uses Raft storage backend and consists of 3 replicas for redundancy. Using Helm is not mandatory. Any supported Vault deployment (on-premises, in the cloud, or a managed Vault service) works as long as the Operator can reach it.
3. This guide uses Vault Helm chart version 0.30.0. You may want to change it to the required version by setting the `VAULT_HELM_VERSION` variable.

## Prerequisites

Before you begin, ensure you have the following tools installed:

* `kubectl`- Kubernetes command-line interface
* `helm` - Helm package manager
* `jq` - JSON processor

## Prepare your environment

1. Export the namespaces and other variables as environment variables to simplify further configuration:

    ```bash
    export NAMESPACE="vault"
    export CLUSTER_NAMESPACE="psmdb"
    export VAULT_HELM_VERSION="0.30.0"
    export SERVICE="vault"
    export CSR_NAME="vault-csr"
    export SECRET_NAME_VAULT="vault-secret"
    export POLICY_NAME="operator"
    export WORKDIR="/tmp/vault"
    ```

2. Create a working directory for certificate and configuration files:

    ```bash
    mkdir -p /tmp/vault
    ```

3. It is a good practice to isolate workloads in Kubernetes using namespaces. Create namespaces with the following command:

    * For Vault server:
    
       ```bash
       kubectl create namespace vault
       ```

    * For Percona Server for MongoDB cluster:

       ```bash
       kubectl create namespace psmdb
       ```
       

---8<--- "vault-generate-tls-certs.md"

---8<--- "vault-install-tls.md"

## Configure Vault

### Enable secrets engine

---8<--- "vault-enable-kv.md"

5. Exit the Vault pod:

    ```bash
    exit
    ```

### Create the access policy for the Operator

Create a policy for accessing the kv engine path and define the required permissions in the `capabilities` parameter:

```bash
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

* [Kubernetes Service Account authentication](#kubernetes-service-account-authentication)
* [Authentication with Vault token](#authentication-with-vault-token)

#### Kubernetes Service Account authentication

When the Operator authenticates to Vault using the Kubernetes authentication method, it presents a JWT token issued by the Kubernetes API server.

Vault must verify that JWT. To do that, Vault needs two things:

1. The Kubernetes API server URL, so it can call the TokenReview API.
2. The JWT issuer URL, so it can validate the token signature and claims.

The following steps guide you through the setup.


1. Enable the Kubernetes authentication method in Vault:

    ```bash
    kubectl -n "$NAMESPACE" exec vault-0 -- sh -c "vault auth enable kubernetes"
    ```

    ??? example "Expected output"

        ```{.text .no-copy}
        Success! Enabled kubernetes auth method at: kubernetes/
        ```

2. Configure the Kubernetes endpoint in Vault:

     ```bash
     kubectl -n "$NAMESPACE" exec vault-0 -- sh -c "vault write auth/kubernetes/config kubernetes_host=https://$KUBERNETES_SERVICE_HOST:$KUBERNETES_SERVICE_PORT"
     ```

    ??? example "Expected output"

        ```{.text .no-copy}
        Success! Data written to: auth/kubernetes/config
        ```

3. Discover the service account issuer and export it as an environment variable:

    ```bash
    export ISSUER="$(kubectl get --raw /.well-known/openid-configuration | jq -r '.issuer')"
    ```

    ??? example "Sample output for GKE"

        ```{.text .no-copy}
        echo $ISSUER
        https://container.googleapis.com/v1/projects/<project-ID>/locations/<region>/clusters/<kubernetes-cluster-name>
        ```

4. Create a Vault role bound to the Operator Service Account:

    ```bash
    kubectl -n "$NAMESPACE" exec vault-0 -- sh -c "vault write auth/kubernetes/role/operator \
     bound_service_account_names=percona-server-mongodb-operator \
     bound_service_account_namespaces=$CLUSTER_NAMESPACE \
     policies=operator \
     audience="$ISSUER" \
     ttl=1h"
    ```

    ??? example "Expected output"

        ```{.text .no-copy}
        Success! Data written to: auth/kubernetes/role/operator
        ```

4. Create a RoleBinding resource for your cluster. This grants Vault permission to call the Kubernetes TokenReview API (`system:auth-delegator`), which is required to validate the Operator service account JWT during login. The default service account name is `percona-server-mongodb-operator`.

    ```bash
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

5. Check that a RoleBinding is created:

    ```bash
    kubectl get rolebindings -n $CLUSTER_NAMESPACE
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        NAME                                              ROLE                                   AGE
        role-tokenreview-binding                          ClusterRole/system:auth-delegator      16s
        service-account-percona-server-mongodb-operator   Role/percona-server-mongodb-operator   4m39s
        ```

#### Authentication with Vault token

1. Create a non-root token in Vault using the [access policy](#create-the-access-policy-for-the-operator) you created before:

    ```bash
    kubectl -n "${NAMESPACE}" exec pod/vault-0 -- sh -c "vault token create -policy="operator" -format=json" > "${WORKDIR}/vault-token.json"
    ```

2. Export a token as an environment variable:

    ```bash
    export NEW_TOKEN=$(jq -r '.auth.client_token' "${WORKDIR}/vault-token.json")
    ```

3. Create a Kubernetes Secret with the token for the namespace where Percona Server for MongoDB is deployed

    ```bash
    kubectl create secret generic vault-sync-secret \
     --from-literal=token="$NEW_TOKEN" -n $CLUSTER_NAMESPACE
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        secret/vault-sync-secret created
        ```

## Upload data to Vault

The default path in Vault to store user passwords is `secret/data/psmdb/{role}/{namespace}/{name}/users`, where:

* `{role}` is the role for the Operator that you create in Vault
* `{namespace}` is the namespace where Percona Server for MongoDB is deployed
* `{name}` is the Percona Server for MongoDB cluster name as defined in the Custom Resource

For testing purposes, let's insert the credentials from the sample `deploy/secrets.yaml` file in the JSON format.

1. Create a file in JSON format:

    ```bash
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

2. Copy the file to a folder inside the Vault Pod:

    ```bash
    kubectl cp $WORKDIR/passwords.json $NAMESPACE/vault-0:/tmp/passwords.json
    ```

3. Upload the file in Vault:

    ```bash
    kubectl exec -it vault-0 -n $NAMESPACE -- /bin/sh -c "vault kv put -mount=secret psmdb/operator/$CLUSTER_NAMESPACE/my-cluster-name/users/ @/tmp/passwords.json"
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
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

3. Verify the insertion:

    ```bash
    kubectl exec -it vault-0 -n $NAMESPACE -- /bin/sh -c "vault kv get -mount=secret psmdb/operator/$CLUSTER_NAMESPACE/my-cluster-name/users/databaseAdmin"
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
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

If you don't set the `tokenSecret`, the Operator authenticates to Vault over an unencrypted HTTP protocol. 

Create the Secret with the following command. Replace the token value with your token:

```bash
kubectl create secret generic my-tls-vault-secret --from-file=ca.crt=$WORKDIR/vault.ca -n $CLUSTER_NAMESPACE
```

### Reference Vault configuration in the Custom Resource

Now, configure Vault in the Custom Resource to make the Operator aware of it.

Specify the following information:

* `endpointURL`: Where your Vault server is running.
* `tlsSecret` (optional): The Secret name that contains TLS certificates for accessing Vault via TLS. This is the Secret object you created at the previous step
* Specify the Vault-related information for the `syncUsers` subsection:

   * `role`: The role you have created for the Operator in Vault
   * `mountPath`: The mount path at which you have enabled the secrets engine
   * `keyPath`: The path to store user passwords
   * `tokenSecret`: The Secret object that contains the authentication token. Specify it if you configured [authentication with Vault tokens](#authentication-with-vault-token)

2. Add the Vault configuration to your Custom Resource.

    === "Kubernetes authentication"

        ```yaml
        spec:
          vault:
            endpointUrl: https://vault.vault.svc.cluster.local:8200
            tlsSecret: my-tls-vault-secret
            syncUsers:
              role: operator
              mountPath: /secret/operator/psmdb/system
              keyPath: psmdb/operator/namespace/my-cluster-name/users
        ```

    === "Authentication with Vault token"

        ```yaml
        spec:
          vault:
            endpointUrl: https://vault.vault.svc.cluster.local:8200
            tlsSecret: my-tls-vault-secret
            syncUsers:
              role: operator
              mountPath: /secret/operator/psmdb/system
              keyPath: psmdb/operator/namespace/my-cluster-name/users
              tokenSecret: vault-token-operator
        ```

## Authenticate in Percona Server for MongoDB to verify password management

To verify that the Operator retrieves passwords from Vault, we'll do the following:

* deploy a separate  `mongo` client Pod
* authenticate in Percona Server for MongoDB with the current password
* change the password in Vault
* authenticate with the new password

Here's how to do it:

1. Get the user credentials from the Secret `<cluster-name>-secrets`. Run the following commands to retrieve the username and password for the database admin user:

    ```bash
    kubectl get secret my-cluster-name-secrets -n $CLUSTER_NAMESPACE -o yaml -o jsonpath='{.data.MONGODB_DATABASE_ADMIN_USER}' | base64 --decode | tr '\n' ' ' && echo " "
    kubectl get secret my-cluster-name-secrets -n $CLUSTER_NAMESPACE -o yaml -o jsonpath='{.data.MONGODB_DATABASE_ADMIN_PASSWORD}' | base64 --decode | tr '\n' ' ' && echo " "
    ```
    
2. Spin up a `mongo` client Pod:

    ```bash
    kubectl -n $CLUSTER_NAMESPACE run -i --rm --tty percona-client --image=percona/percona-server-mongodb:{{ mongodb80recommended }} --restart=Never -- bash -il
    ```

3. Inside the Pod, run the following command:

    === "sharding is on"

        ```
        mongosh "mongodb://<databaseAdminUser>:<databaseAdminPassword>@my-cluster-name-mongos.<namespace>.svc.cluster.local/admin?ssl=false"
        ```

    === "sharding is off"

        ```
        mongosh  "mongodb://<databaseAdminUser>:<databaseAdminPassword>@my-cluster-name-rs0.<namespace>.svc.cluster.local/admin?replicaSet=rs0&ssl=false"
        ```

        ??? example "Expected output"

            ```{.text .no-copy}
            .....
            [direct: mongos] admin>
            ```

4. Update the password for the `MONGODB_DATABASE_ADMIN_PASSWORD` user:

    ```bash
    kubectl exec -it vault-0 -n $NAMESPACE -- /bin/sh -c "vault kv patch -mount=secret psmdb/operator/$CLUSTER_NAMESPACE/my-cluster-name/users MONGODB_DATABASE_ADMIN_PASSWORD="newStrongPass""
    ```

5. Repeat steps 2-3 and connect to Percona Server for MongoDB with this new password. As a result you should be successfully authenticated.