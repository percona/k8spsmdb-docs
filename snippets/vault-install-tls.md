## Install Vault with TLS

For this setup, we install Vault in Kubernetes using the [Helm 3 package manager :octicons-link-external-16:](https://helm.sh/) in High Availability (HA) mode with Raft storage backend and with TLS enabled.

1. Add and update the Vault Helm repository:

    ```bash
    helm repo add hashicorp https://helm.releases.hashicorp.com
    helm repo update
    ```

2. Install Vault with TLS enabled:

    ```bash
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
    
    * Installs HashiCorp Vault in High Availability (HA) mode with secure TLS enabled in your Kubernetes cluster.
    * Configures Vault pods to use certificates from a Kubernetes Secret via volume mounts for secure HTTPS communication between Vault and clients.
    * Sets up Raft as the backend storage with three replicas for fault tolerance, and configures the Vault TCP listener to enforce TLS with your specified certificate files.
    

    ??? example "Sample output"

        ```{.text .no-copy}
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

4. Retrieve the Pod name where Vault is running:

    ```bash
    kubectl -n $NAMESPACE get pod -l app.kubernetes.io/name=${SERVICE} -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}'
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        vault-0
        vault-1
        vault-2
        ```

## Initialize and unseal Vault

1. After Vault is installed, you need to initialize it. Run the following command to initialize the first pod:

    ```bash
    kubectl exec -it pod/vault-0 -n $NAMESPACE -- vault operator init -key-shares=1 -key-threshold=1 -format=json > ${WORKDIR}/vault-init
    ```

    The command does the following:

    * Connects to the Vault Pod
    * Initializes Vault server with TLS enabled
    * Creates 1 unseal key share which is required to unseal the server
    * Outputs the init response to a local file. The file includes unseal keys and root token.

2. Vault is started in a sealed state. In this state Vault can access the storage but it cannot decrypt data. In order to use Vault, you need to unseal it.

    Retrieve the unseal key from the file:

    ```bash
    unsealKey=$(jq -r ".unseal_keys_b64[]" < ${WORKDIR}/vault-init)
    ```

    Now, unseal Vault. Run the following command:

    ```bash
    kubectl exec -it pod/vault-0 -n $NAMESPACE -- vault operator unseal "$unsealKey"
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
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

3. Add the remaining Pods to the Vault cluster. If you have another secret name, replace the `vault-secret` with your value in the following for loop:

    ```bash
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

    The command connects to each Vault Pod (`vault-1` and `vault-2`) and issues the `vault operator raft join` command, which:
    * Joins the Pods to the Vault Raft cluster, enabling HA mode.
    * Uses the necessary TLS certificates to securely connect to the cluster leader (`vault-0`).
    * Ensures all nodes participate in the Raft consensus and share storage responsibilities.

    ??? example "Sample output"

        ```{.text .no-copy}
        Key       Value
        ---       -----
        Joined    true
        ```

4. Unseal the remaining Pods. Use this for loop:

    ```bash
    for POD in vault-1 vault-2; do
        kubectl -n "$NAMESPACE" exec $POD -- sh -c "
            vault operator unseal \"$unsealKey\"
        "
    done
    ```
    
    ??? example "Expected output"

        ```{.text .no-value}
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
