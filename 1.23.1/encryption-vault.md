> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Configure data-at-rest encryption using HashiCorp Vault without TLS

This guide walks you through deploying and configuring HashiCorp Vault to work with Percona Operator for MongoDB to enable [data-at-rest encryption](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/encryption.html) using HTTP protocol.

If you want to add an extra layer of security for communication between Percona Server for MongoDB and the Vault server, you can also set up HashiCorp Vault with TLS enabled. For details, see the [guide for configuring Vault with TLS](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/encryption-vault-tls.html).

Important

You can enable data at rest encryption with HashiCorp Vault only when you create a new cluster. This is because Percona Server for MongoDB doesn’t allow enabling / disabling or changing encryption settings for a running cluster. Every time you restart the server, the encryption settings must be the same. When you define Vault configuration for a cluster, the Operator uses that instead of the default encryption key Secret.

## Assumptions

1. This guide is provided as a best effort and builds upon procedures described in the official Vault documentation. Since Vault’s setup steps may change in future releases, this document may become outdated; we cannot guarantee ongoing accuracy or responsibility for such changes. For the most up-to-date and reliable information, please always refer to [the official Vault documentation](https://developer.hashicorp.com/vault/tutorials/kubernetes/kubernetes-minikube-tls#kubernetes-minikube-tls).
1. In the following sections we deploy the Vault server in High Availability (HA) mode on Kubernetes via Helm with TLS enabled. The HA setup uses Raft storage backend and consists of 3 replicas for redundancy. Using Helm is not mandatory. Any supported Vault deployment (on-premises, in the cloud, or a managed Vault service) works as long as the Operator can reach it.
1. This guide uses Vault Helm chart version 0.30.0. You may want to change it to the required version by setting the `VAULT_HELM_VERSION` variable.

## Prerequisites

Before you begin, ensure you have the following tools installed:

- `kubectl` - Kubernetes command-line interface
- `helm` - Helm package manager
- `jq` - JSON processor

## Prepare your environment

1. Export the namespace and other variables as environment variables to simplify further configuration:

   ```
   export NAMESPACE="vault" 
   export CLUSTER_NAMESPACE="psmdb" # The namespace where the database cluster will be deployed
   export VAULT_HELM_VERSION="0.30.0"
   export SERVICE="vault"
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

## Install Vault

For this setup, we install Vault in Kubernetes using the [Helm 3 package manager](https://helm.sh/) in High Availability (HA) mode with Raft storage backend.

1. Add and update the Vault Helm repository:

   ```
   helm repo add hashicorp https://helm.releases.hashicorp.com
   helm repo update
   ```

1. Install Vault in HA mode:

   ```
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

   - Installs HashiCorp Vault in High Availability (HA) mode without TLS in your Kubernetes cluster
   - Sets up Raft as the backend storage with three replicas for fault tolerance
   - Configures the Vault TCP listener for HTTP communication (port 8200) Sample output

   ```
   NAME: vault
   LAST DEPLOYED: Wed Feb 11 17:06:00 2026
   NAMESPACE: vault
   STATUS: deployed
   REVISION: 1
   NOTES:
   Thank you for installing HashiCorp Vault!

   Now that you have deployed Vault, you should look over the docs on using
   Vault with Kubernetes available here:

   https://developer.hashicorp.com/vault/docs

   Your release is named vault. To learn more about the release, try:

     $ helm status vault
     $ helm get manifest vault
   ```

1. Wait for all Vault pods to be running:

   ```
   kubectl wait --for=jsonpath='{.status.phase}'=Running pod \
   -l app.kubernetes.io/name=${SERVICE} -n $NAMESPACE --timeout=300s
   ```

1. Retrieve the Pod names where Vault is running:

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
   - Initializes Vault server
   - Creates 1 unseal key share which is required to unseal the server
   - Outputs the init response to a local file. The file includes unseal keys and a root token.

1. Vault is started in a sealed state. In this state Vault can access the storage but it cannot decrypt data. In order to use Vault, you need to unseal it.

   Retrieve the unseal key from the file:

   ```
   unsealKey=$(jq -r ".unseal_keys_b64[]" < ${WORKDIR}/vault-init)
   ```

   Now, unseal the first Vault pod:

   ```
   kubectl exec -it pod/vault-0 -n $NAMESPACE -- vault operator unseal "$unsealKey"
   ```

   Sample output

   ```
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

1. Add the remaining Pods to the Vault cluster. Run the following for loop:

   ```
   for POD in vault-1 vault-2; do
     kubectl -n "$NAMESPACE" exec $POD -- sh -c '
       vault operator raft join http://vault-0.vault-internal:8200
     '
   done
   ```

   The command connects to each Vault Pod (`vault-1` and `vault-2`) and issues the `vault operator raft join` command, which:

   - Joins the Pods to the Vault Raft cluster, enabling HA mode
   - Connects to the cluster leader (`vault-0`) over HTTP
   - Ensures all nodes participate in the Raft consensus and share storage responsibilities Sample output

   ```
   Key                     Value
   ---                     -----
   Joined Raft cluster     true
   Leader Address          http://vault-0.vault-internal:8200
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
   export NEW_TOKEN=$(jq -r '.auth.client_token' "${WORKDIR}/vault-token.json") && echo "$NEW_TOKEN"
   ```

   Sample output

   ```
   hvs.CAESINO******************************************T2Y
   ```

## Create a Secret for Vault

To enable Vault for the Operator, create a Secret object for it using the Vault token. Note that you must create the Secret in the namespace where the Operator and the database cluster is running.

Run the following command:

```
kubectl create secret generic my-cluster-name-vault --from-literal=token=$NEW_TOKEN -n $CLUSTER_NAMESPACE
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

- A Vault server name and port. If Vault is deployed in a separate namespace, use the fully qualified name in the format `<service-name>.<namespace>.svc.cluster.local` (`vault.vault.svc.cluster.local` in our example)

- Path to the token file. When you apply the new configuration, the Operator creates the required directories and places the token file there.

- The secrets mount path in the format `<mount-path>/data/dc/<cluster name>/<path>`, where:

  - the `<cluster name>` is your real cluster name.
  - the `<path>` is where encryption keys are stored. Specify the replica set name value (`rs0` in our example) when you add options to the `replsets.configuration` section. Specify the `cfg` value when you add options to the `sharding.configsvrReplSet.configuration` section.

Note

In a sharded cluster, you must specify the Vault configuration in both `replsets.configuration` and `sharding.configsvrReplSet.configuration` sections. If you use arbiter, non-voting and / or hidden nodes and want to encrypt the data there, specify the Vault configuration for these members too.

1. Modify your `deploy/cr.yaml` as follows:

   1. Set the `secrets.vault` key to the name of your Secret created on the previous step.

   1. Add Vault-specific options to the `replsets.configuration`, `replsets.nonvoting.configuration`, and `sharding.configsvrReplSet.configuration` keys:

      ```
      ...
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
               disableTLSForTesting: true
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
                disableTLSForTesting: true
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
