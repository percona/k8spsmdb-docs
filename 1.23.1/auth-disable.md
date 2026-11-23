> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Disable authentication

You can disable authentication in Percona Server for MongoDB clusters. This is useful for development, testing, or migration scenarios where you need access to the database without authentication.

Warning

Disabling authentication removes an important security layer. Only disable authentication in trusted environments, such as isolated development or testing clusters. Never disable authentication in production environments without proper security measures.

## When to disable authentication

You might want to disable authentication in the following scenarios:

- **Development and testing**: When you need quick access to the database during development without managing user credentials
- **Migration and data import**: When migrating data from external MongoDB instances that don’t use authentication
- **Troubleshooting**: When debugging authentication-related issues
- **Legacy application compatibility**: When working with applications that don’t support MongoDB authentication

## Before you begin

Export your namespace so the commands below can use it. Replace `<namespace>` with your value:

```
export NAMESPACE=<namespace>
```

## Considerations

Consider the following for disabling authentication

- You must [disable TLS encryption](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/tls-disable.html) first. You cannot disable authentication while TLS is enabled.
- You must disable authentication for each component of your Percona Server for MongoDB cluster separately. This mean you must modify the configuration for each shard and the config server replica set.

## Disable authentication for a new cluster

To disable authentication for a new cluster, follow these steps:

1. Export the namespace where you will deploy your cluster as an environment variable

   ```
   export NAMEPSPACE=my-namespace
   ```

1. Edit the `deploy/cr.yaml` Custom Resource manifest and set the following configuration:

   - Set `tls.mode` to `disabled`
   - Set `unsafeFlags.tls` to `true`
   - Add the `security.authorization: disabled` option to the `configuration` section for each component

   **Non-sharded cluster**

   ```
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

   **Sharded cluster**

   For sharded clusters, you must disable authentication for each component separately: replica sets, config server replica set, and mongos.

   ```
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

   Warning

   Always disable authentication for all components. If you disable authentication for replica sets but not for the config server replica set in a sharded cluster, the cluster enters an error state.

1. Apply the manifest.

   ```
   kubectl apply -f deploy/cr.yaml -n $NAMESPACE
   ```

## Disable authentication for a running cluster

To disable authentication for a running cluster, you must [pause](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/pause.html) the cluster, update the configuration, and then unpause it.

1. Export the namespace where your cluster is running as an environment variable:

   ```
   export NAMEPSPACE=my-namespace
   ```

1. Pause the cluster. Edit the `deploy/cr.yaml` Custom Resource manifest:

   ```
   spec:
     .......
     pause: true
   ```

1. Apply the configuration:

   ```
   kubectl apply -f deploy/cr.yaml -n $NAMESPACE
   ```

1. Wait for the cluster to be paused. Check the status with the `kubectl get psmdb` command:

   ```
   kubectl get psmdb -n $NAMESPACE
   ```

   Expected output

   ```
   NAME              ENDPOINT                                                 STATUS   AGE
   my-cluster-name   my-cluster-name-mongos.default.svc.cluster.local:27017   paused   3m
   ```

1. Disable TLS and authentication by setting the following configuration in the `deploy/cr.yaml` Custom Resource manifest:

   **Non-sharded cluster**

   ```
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

   **Sharded cluster**

   ```
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

1. Apply the changes:

   ```
   kubectl apply -f deploy/cr.yaml -n $NAMESPACE
   ```

1. Resume the cluster. Set the `pause` key to `false` in the Custom Resource manifest:

   ```
   spec:
   ......
      pause: false
   ```

1. Apply the changes:

   ```
   kubectl apply -f deploy/cr.yaml -n $NAMESPACE
   ```

1. Wait for the cluster to be resumed. Check the status with the `kubectl get psmdb` command.

## Re-enable authentication

To re-enable authentication, repeat the same steps as for disabling it (pause the cluster, apply config changes, resume), but **remove** any `security.authorization: disabled` lines from your `deploy/cr.yaml` manifest. Optionally, set `tls.mode` back to your preferred state if you also want to re-enable TLS. Apply the manifest and unpause the cluster.

## Verify authentication is disabled

After disabling authentication, you can connect to the cluster without providing credentials:

**Non-sharded cluster**

```
mongosh "mongodb://my-cluster-name-rs0.<namespace>.svc.cluster.local:27017/?replicaSet=rs0"
```

**Sharded cluster**

```
mongosh "mongodb://my-cluster-name-mongos.<namespace>.svc.cluster.local:27017"
```

If authentication is disabled, you should be able to connect without providing a username or password.
