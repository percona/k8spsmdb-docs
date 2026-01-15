# Disable authentication in Percona Server for MongoDB

You can disable authentication in Percona Server for MongoDB clusters. This is useful for development, testing, or migration scenarios where you need access to the database without authentication.

!!! warning

    Disabling authentication removes an important security layer. Only disable authentication in trusted environments, such as isolated development or testing clusters. Never disable authentication in production environments without proper security measures.

## When to disable authentication

You might want to disable authentication in the following scenarios:

* **Development and testing**: When you need quick access to the database during development without managing user credentials
* **Migration and data import**: When migrating data from external MongoDB instances that don't use authentication
* **Troubleshooting**: When debugging authentication-related issues
* **Legacy application compatibility**: When working with applications that don't support MongoDB authentication

## Considerations

Consider the following for disabling authentication

* You must [disable TLS encryption](tls-disable.md) first. You cannot disable authentication while TLS is enabled.
* You must disable authentication for each component of your Percona Server for MongoDB cluster separately. This mean you must modify the configuration for each shard and the config server replica set.

## Disable authentication for a new cluster

To disable authentication for a new cluster, follow these steps:

1. Export the namespace where you will deploy your cluster as an environment variable

    ```bash
    export NAMEPSPACE=my-namespace
    ```

2. Edit the `deploy/cr.yaml` Custom Resource manifest and set the following configuration:

    * Set `tls.mode` to `disabled`
    * Set `unsafeFlags.tls` to `true`
    * Add the `security.authorization: disabled` option to the `configuration` section for each component

    === "Non-sharded cluster"

        ```yaml
        ...
        spec:
          ...
          unsafeFlags:
            tls: true
          tls:
            mode: disabled
          replsets:
            - name: rs0
              size: 3
              configuration: |
                security:
                  authorization: disabled
          ...
        ```

    === "Sharded cluster"

        For sharded clusters, you must disable authentication for each component separately: replica sets, config server replica set, and mongos.

        ```yaml
        ...
        spec:
          ...
          unsafeFlags:
            tls: true
          tls:
            mode: disabled
          replsets:
            - name: rs0
              size: 3
              configuration: |
                security:
                  authorization: disabled
          sharding:
            configsvrReplSet:
              configuration: |
                security:
                  authorization: disabled
            mongos:
              configuration: |
                security:
                  authorization: disabled
          ...
        ```

        !!! warning

            Always disable authentication for all components. If you disable authentication for replica sets but not for the config server replica set in a sharded cluster, the cluster enters an error state.

3. Apply the manifest. 

    ```bash
    kubectl apply -f deploy/cr.yaml -n $NAMESPACE
    ```

## Disable authentication for a running cluster

To disable authentication for a running cluster, you must [pause](pause.md) the cluster, update the configuration, and then unpause it.

1. Export the namespace where your cluster is running as an environment variable:

    ```bash
    export NAMEPSPACE=my-namespace
    ```
    
2. Pause the cluster. Edit the `deploy/cr.yaml` Custom Resource manifest:

    ```yaml
    spec:
      .......
      pause: true
    ```

3. Apply the configuration:

    ```bash
    kubectl apply -f deploy/cr.yaml -n $NAMESPACE
    ```

4. Wait for the cluster to be paused. Check the status with the `kubectl get psmdb` command:

    ```bash
    kubectl get psmdb -n $NAMESPACE
    ```

    ??? example "Expected output"

        ```{.text .no-copy}
        NAME              ENDPOINT                                                 STATUS   AGE
        my-cluster-name   my-cluster-name-mongos.default.svc.cluster.local:27017   paused   3m
        ```

5. Disable TLS and authentication by setting the following configuration in the `deploy/cr.yaml` Custom Resource manifest:

    === "Non-sharded cluster"

        ```yaml
        ...
        spec:
          ...
          unsafeFlags:
            tls: true
          tls:
            mode: disabled
          replsets:
            - name: rs0
              size: 3
              configuration: |
                security:
                  authorization: disabled
          ...
        ```

    === "Sharded cluster"

        ```yaml
        ...
        spec:
          ...
          unsafeFlags:
            tls: true
          tls:
            mode: disabled
          replsets:
            - name: rs0
              size: 3
              configuration: |
                security:
                  authorization: disabled
          sharding:
            configsvrReplSet:
              configuration: |
                security:
                  authorization: disabled
            mongos:
              configuration: |
                security:
                  authorization: disabled
          ...
        ```

6. Apply the changes:

    ```bash
    kubectl apply -f deploy/cr.yaml -n $NAMESPACE
    ```

7. Resume the cluster. Set the `pause` key to `false` in the Custom Resource manifest:

    ```yaml
    spec:
    ......
       pause: false
    ```

8. Apply the changes:

    ```bash
    kubectl apply -f deploy/cr.yaml -n $NAMESPACE
    ```
    
9. Wait for the cluster to be resumed. Check the status with the `kubectl get psmdb` command.

## Re-enable authentication

To re-enable authentication, repeat the same steps as for disabling it (pause the cluster, apply config changes, resume), but **remove** any `security.authorization: disabled` lines from your `deploy/cr.yaml` manifest. Optionally, set `tls.mode` back to your preferred state if you also want to re-enable TLS. Apply the manifest and unpause the cluster.

## Verify authentication is disabled

After disabling authentication, you can connect to the cluster without providing credentials:

=== "Non-sharded cluster"

    ```bash
    mongosh "mongodb://my-cluster-name-rs0.<namespace>.svc.cluster.local:27017/?replicaSet=rs0"
    ```

=== "Sharded cluster"

    ```bash
    mongosh "mongodb://my-cluster-name-mongos.<namespace>.svc.cluster.local:27017"
    ```

If authentication is disabled, you should be able to connect without providing a username or password.
