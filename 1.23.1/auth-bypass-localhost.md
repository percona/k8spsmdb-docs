> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Disable the localhost authentication bypass

By default, you can connect to Percona Server for MongoDB from `localhost` without authentication to perform administrative actions such as creating the first user. This is called the **localhost exception**. The Operator relies on this exception to bootstrap the cluster.

After the Operator sets up the cluster and creates the system users, Percona Server for MongoDB itself closes the localhost exception. You can make the closure permanent, protecting against scenarios where the exception could otherwise re-open.

The Percona Server for MongoDB parameter `enableLocalhostAuthBypass` controls whether the localhost exception is available. It is `true` by default. To disable it, set it in the `setParameter` block within the custom `configuration` section of the Custom Resource.

## Considerations

Here’s what you need to know before disabling the localhost exception:

1. Never disable the localhost exception when you create a new cluster. Setting `enableLocalhostAuthBypass: false` **before** the Operator creates system users prevents it from initializing the replica set. You will see repeated failures logged in the Operator.
1. Disabling localhost exception means you can no longer use it as a recovery mechanism if you lost all your admin credentials. Therefore, ensure you have working backups of the cluster data and the Kubernetes Secrets containing the cluster credentials. See [Backup and restore](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups.html) and [System users](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/system-users.html).

## Disable localhost authentication bypass on running clusters

Perform the following steps on your **running** cluster. Review the [Considerations](#considerations) section for important information.

1. Confirm that your cluster is running:

   ```
   kubectl -n <namespace> get psmdb <cluster-name> -o jsonpath='{.status.state}'
   ```

   The command should return `ready`. See [Custom resource statuses](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/cr-statuses.html) for other possible values.

1. Edit the `deploy/cr.yaml` Custom Resource manifest and add the `setParameter` block to the `configuration` section for each replica set:

   **Non-sharded cluster**

   ```
   ...
   spec:
     ...
     replsets:
       - name: rs0
         configuration: |
           setParameter:
             enableLocalhostAuthBypass: false
     ...
   ```

   **Sharded cluster**

   For sharded clusters, apply the same block to every shard replica set and to the config server replica set:

   ```
   ...
   spec:
     ...
     replsets:
       - name: rs0
         configuration: |
           setParameter:
             enableLocalhostAuthBypass: false
     sharding:
       configsvrReplSet:
         configuration: |
           setParameter:
             enableLocalhostAuthBypass: false
     ...
   ```

1. Apply the configuration:

   ```
   kubectl apply -f deploy/cr.yaml -n <namespace>
   ```

1. Wait for the Operator to perform a rolling restart. Check the cluster status:

   ```
   kubectl get psmdb <cluster-name> -n <namespace>
   ```

For more information about Percona Server for MongoDB configuration options, see [Changing MongoDB options](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/options.html).

## See also

- [Monitoring and observability](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/monitoring-observability.html)
