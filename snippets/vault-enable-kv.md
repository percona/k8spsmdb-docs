At this step you need to configure Vault and enable secrets within it. To do so you must first authenticate in Vault.

When you started Vault, it generates and starts with a [root token :octicons-link-external-16:](https://developer.hashicorp.com/vault/docs/concepts/tokens) that provides full access to Vault. Use this token to authenticate.

Run the following command on a leader node. The remaining ones will synchronize from the leader.

1. Extract the Vault root token from the file where you saved the init response output:

    ```bash
    cat ${WORKDIR}/vault-init | jq -r ".root_token"
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        hvs.*************Jg9r
        ```

2. Connect to Vault Pod:

    ```bash
    kubectl exec -it vault-0 -n $NAMESPACE -- /bin/sh
    ```

3. Authenticate in Vault with this token:

    ```bash
    vault login hvs.*************Jg9r
    ```

4. Enable the secrets engine at the mount path. The following command enables KV secrets engine v2 at the `secret` mount-path:

    ```bash
    vault secrets enable --version=2 -path=secret kv
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        Success! Enabled the kv secrets engine at: secret/
        ```