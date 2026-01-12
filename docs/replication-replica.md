# Configure the Replica site

When the Operator creates a new cluster, a lot of things are happening, such as
electing the Primary, generating certificates, and picking specific names. This
should not happen on the _Replica_ site. Therefore, you deploy the Replica site in an unmanaged mode.

!!! note

    Setting `unmanaged` to true will not only prevent the Operator from
    controlling the Replica Set configuration, but it will also result in not
    generating certificates and users credentials for new clusters.

For the Main and Replica sites to communicate, they must have the same the user and TLS Secrets.

1. Ensure you have created the same namespace as on the main site and set the context to it so that subsequent commands are executed in that namespace.
     
     ```bash
     kubectl get namespaces
     kubectl config get-contexts
     ```

    ??? example "Sample output"

        ```{.text .no-copy}
        CURRENT   NAME                                                 CLUSTER                                              AUTHINFO                                             NAMESPACE
        *         gke_<MY-PROJECT>_us-central1-a-replica-cluster  gke_<MY-PROJECT>_us-central1-a-replica-cluster   gke_<MY-PROJECT>_us-central1-a-replica-cluster   example
    
2. Create the Secrets from the secrets files you prepared from the main cluster. 

    ```bash
    kubectl apply -f my-cluster-secrets-replica.yaml
    kubectl apply -f replica-cluster-ssl.yml
    kubectl apply -f replica-cluster-ssl-internal.yml
    kubectl apply -f my-cluster-name-mongodb-encryption-key2.yml
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        secret/my-cluster-name-secrets created
        secret/replica-cluster-ssl created
        secret/replica-cluster-ssl-internal created
        secret/my-cluster-name-mongodb-encryption-key created
        ```
    
    Replica will not start if the TLS secrets and the encryption key are not copied. If users are not copied, the replica will join the replica set, but it will be restarting due to failed liveness checks.

3. Prepare the Replica site configuration:

    * Name your cluster. The name must match the names of the Secrets objects you created. For example, `replica-site`
    * Set the `spec.unmanaged` to `true`
    * Enable multi-cluster services in the `spec.multiCluster` subsection.
    * Set the `updateStrategy` key to `RollingUpdate`, because [Smart Updates](update.md#update-strategies) are not allowed on unmanaged clusters. 
    * Reference the Secrets you created in the `spec.Secrets` section
    * Expose the Replica set, config server replica set and mongos Pods with the `ClusterIP` type.

    Also, the Operator versions prior to 1.19.0 did not support [backups](backups.md) on unmanaged clusters, so set `backup.enabled` to `false` for the Operator 1.18.0 and older.

    Here is an example:

    ```yaml
    apiVersion: psmdb.percona.com/v1
    kind: PerconaServerMongoDB
    metadata:
        name: replica-cluster
    spec:
        unmanaged: true
        multiCluster:
            enabled: true
            DNSSuffix: svc.clusterset.local
        updateStrategy: RollingUpdate
        upgradeOptions:
            apply: disabled
            schedule: "0 2 * * *"
        secrets:
            users: my-cluster-name-secrets
            encryptionKey: my-cluster-name-mongodb-encryption-key
            ssl: replica-cluster-ssl
            sslInternal: replica-cluster-ssl-internal
        replsets:
        - name: rs0
            size: 3
            expose:
                enabled: true
                type: ClusterIP
            volumeSpec:
                persistentVolumeClaim:
                    resources:
                        requests:
                            storage: 3Gi

        sharding:
            enabled: true
            configsvrReplSet:
                size: 3
                expose:
                    enabled: true
                    type: ClusterIP
                volumeSpec:
                    persistentVolumeClaim:
                        resources:
                            requests:
                                storage: 3Gi

            mongos:
                size: 1
                expose:
                    type: ClusterIP
    ```

4. Apply the configuration to deploy the Replica site

    ```bash
    kubectl apply -f deploy/cr.yaml
    ```

## Next steps

[Interconnect sites for replication](replication-interconnect.md){.md-button}