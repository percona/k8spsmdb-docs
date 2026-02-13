## Install Vault

For this setup, we install Vault in Kubernetes using the [Helm 3 package manager :octicons-link-external-16:](https://helm.sh/) in High Availability (HA) mode with Raft storage backend.

1. Add and update the Vault Helm repository:

    ```bash
    helm repo add hashicorp https://helm.releases.hashicorp.com
    helm repo update
    ```

2. Install Vault in HA mode:

    ```bash
    helm upgrade --install ${SERVICE} hashicorp/vault \
      --disable-openapi-validation \
      --version ${VAULT_HELM_VERSION} \
      --namespace ${NAMESPACE} \
      --set "global.enabled=true" \
      --set "global.tlsDisable=true" \
      --set "global.platform=kubernetes" \
      --set "server.ha.enabled=true" \
      --set "server.ha.replicas=3" \
      --set "server.ha.raft.enabled=true" \
      --set "server.ha.raft.setNodeId=true" \
      --set-string "server.ha.raft.config=cluster_name = \"vault-integrated-storage\"
    ui = true
    listener \"tcp\" {
      tls_disable = 1
      address = \"[::]:8200\"
      cluster_address = \"[::]:8201\"
    }
    storage \"raft\" {
      path = \"/vault/data\"
    }
    disable_mlock = true
    service_registration \"kubernetes\" {}"
    ```

    This command does the following:

    * Installs HashiCorp Vault in High Availability (HA) mode without TLS in your Kubernetes cluster
    * Sets up Raft as the backend storage with three replicas for fault tolerance
    * Configures the Vault TCP listener for HTTP communication (port 8200)

    ??? example "Sample output"

        ```{.text .no-copy}
        NAME: vault
        LAST DEPLOYED: Wed Feb 11 17:06:00 2026
        NAMESPACE: vault
        STATUS: deployed
        REVISION: 1
        NOTES:
        Thank you for installing HashiCorp Vault!
        ....
        ```

3. Wait for all Vault pods to be running:

    ```bash
    kubectl wait --for=condition=Ready pod -l app.kubernetes.io/name=${SERVICE} -n $NAMESPACE --timeout=300s
    ```

4. Retrieve the Pod names where Vault is running:

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
    * Initializes Vault server
    * Creates 1 unseal key share which is required to unseal the server
    * Outputs the init response to a local file. The file includes unseal keys and a root token.

2. Vault is started in a sealed state. In this state Vault can access the storage but it cannot decrypt data. In order to use Vault, you need to unseal it.

    Retrieve the unseal key from the file:

    ```bash
    unsealKey=$(jq -r ".unseal_keys_b64[]" < ${WORKDIR}/vault-init)
    ```

    Now, unseal the first Vault pod:

    ```bash
    kubectl exec -it pod/vault-0 -n $NAMESPACE -- vault operator unseal "$unsealKey"
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        Key             Value
        ---             -----
        Seal Type       shamir
        Initialized     true
        Sealed          false
        Total Shares    1
        Threshold      1
        Version         1.20.1
        Build Date      2025-07-24T13:33:51Z
        Storage Type    raft
        Cluster Name    vault-cluster-55062a37
        Cluster ID      37d0c2e4-8f47-14f7-ca49-905b66a1804d
        HA Enabled      true
        ```

3. Add the remaining Pods to the Vault cluster. Run the following for loop:

    ```bash
    for POD in vault-1 vault-2; do
      kubectl -n "$NAMESPACE" exec $POD -- sh -c '
        vault operator raft join http://vault-0.vault-internal:8200
      '
    done
    ```

    The command connects to each Vault Pod (`vault-1` and `vault-2`) and issues the `vault operator raft join` command, which:

    * Joins the Pods to the Vault Raft cluster, enabling HA mode
    * Connects to the cluster leader (`vault-0`) over HTTP
    * Ensures all nodes participate in the Raft consensus and share storage responsibilities

    ??? example "Sample output"

        ```{.text .no-copy}
        Key                     Value
        ---                     -----
        Joined Raft cluster     true
        Leader Address          http://vault-0.vault-internal:8200
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

        ```{.text .no-copy}
        Key                Value
        ---                -----
        Seal Type          shamir
        Initialized        true
        Sealed             false
        Total Shares       1
        Threshold          1
        Version            1.20.1
        Build Date         2025-07-24T13:33:51Z
        Storage Type       raft
        HA Enabled         true
        ```
