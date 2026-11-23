> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Configure concurrency for a cluster reconciliation

Reconciliation is the process by which the Operator continuously compares the desired state with the actual state of the cluster. The desired state is defined in a Kubernetes custom resource, like PerconaServerMongoDB.

If the actual state does not match the desired state, the Operator takes actions to bring the system into alignment. This means creating, updating, or deleting Kubernetes resources (Pods, Services, ConfigMaps, etc.) or performing database-specific operations like scaling, backups, or failover.

Reconciliation is triggered by a variety of events, including:

- Changes to the cluster configuration
- Changes to the cluster state
- Changes to the cluster resources

You can tune reconciliation behavior with these environment variables in the `percona-server-mongodb-operator` Deployment:

- `MAX_CONCURRENT_RECONCILES` — how many clusters the Operator can reconcile in parallel
- `RECONCILE_INTERVAL` — how long the Operator waits before re-queuing reconciliation for each cluster
- `BACKUP_RECONCILE_INTERVAL` and `RESTORE_RECONCILE_INTERVAL` — how often the Operator rechecks backups and restores that are in progress.

See [Configure Operator environment variables](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/env-vars-operator.html) for the full list of supported values and defaults.

## Configure concurrent reconciliation workers

By default, the Operator has one reconciliation worker. This means that if you deploy or update 2 clusters at the same time, the Operator will reconcile them sequentially.

The `MAX_CONCURRENT_RECONCILES` environment variable controls the number of concurrent workers that can reconcile resources in Percona Server for MongoDB clusters in parallel.

Thus, to extend the previous example, if you set the number of reconciliation workers to `2`, the Operator will reconcile both clusters in parallel. This also helps you with benchmarking the Operator performance.

The general recommendation is to set the number of concurrent workers equal to the number of Percona Server for MongoDB clusters. When the number of workers is greater, the excessive workers will remain idle.

### Set the number of reconciliation workers

1. Check the index of the `MAX_CONCURRENT_RECONCILES` environment variable using the following command:

   ```
   kubectl get deployment percona-server-mongodb-operator -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="MAX_CONCURRENT_RECONCILES")].value}'
   ```

   Sample output

   ```
   1
   ```

1. To set a new value and verify it’s been updated, run the following command:

   ```
   kubectl patch deployment percona-server-mongodb-operator \
   --type='strategic' \
   -o yaml \
   -p='{
       "spec": {
           "template": {
               "spec": {
                   "containers": [
                       {
                           "name": "percona-server-mongodb-operator",
                           "env": [
                               {
                                   "name": "MAX_CONCURRENT_RECONCILES",
                                   "value": "2"
                               }
                           ]
                       }
                   ]
               }
           }
       }
   }'\
   -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="MAX_CONCURRENT_RECONCILES")].value}'
   ```

The command does the following:

- Patches the deployment to update the `MAX_CONCURRENT_RECONCILES` environment variable
- Sets the value to `2`.
- Outputs the result

You can set the value to any number greater than 0.

Sample output

```
2
```

## Configure the reconciliation interval

After each reconcile loop, the Operator schedules the next one after an interval. Each kind of object has its own interval:

| Environment variable         | What the Operator rechecks                                                                  | Default |
| ---------------------------- | ------------------------------------------------------------------------------------------- | ------- |
| `RECONCILE_INTERVAL`         | Each cluster                                                                                | `5s`    |
| `BACKUP_RECONCILE_INTERVAL`  | Backups that are waiting, running or being canceled. Available starting with version 1.24.0 | `5s`    |
| `RESTORE_RECONCILE_INTERVAL` | Restores that are in progress. Available starting with version 1.24.0                       | `5s`    |

Increasing a value reduces Kubernetes API traffic from the Operator. This can be useful in large environments where the default interval generates more requests than needed. For example, raise `BACKUP_RECONCILE_INTERVAL` if you run many backups and want cluster changes to stay fast.

A longer interval also means that the Operator notices changes later. Backup and restore status updates arrive up to one interval late. A restore goes through several steps, so a long `RESTORE_RECONCILE_INTERVAL` can make restores take noticeably longer.

All three variables accept a Go duration string, such as `30s` or `1m`. Values below `5s`, zero, negative, or invalid duration strings fall back to `5s`.

### Set the reconciliation interval

1. Check the current value:

   ```
   kubectl -n <namespace> get deployment percona-server-mongodb-operator -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="RECONCILE_INTERVAL")].value}'
   ```

   Sample output

   ```
   5s
   ```

1. To set a new value and verify it’s been updated, run the following command:

   ```
   kubectl -n <namespace> patch deployment percona-server-mongodb-operator \
   --type='strategic' \
   -o yaml \
   -p='{
       "spec": {
           "template": {
               "spec": {
                   "containers": [
                       {
                           "name": "percona-server-mongodb-operator",
                           "env": [
                               {
                                   "name": "RECONCILE_INTERVAL",
                                   "value": "30s"
                               }
                           ]
                       }
                   ]
               }
           }
       }
   }'\
   -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="RECONCILE_INTERVAL")].value}'
   ```

The command does the following:

- Patches the deployment to update the `RECONCILE_INTERVAL` environment variable
- Sets the value to `30s`
- Outputs the result

To change `BACKUP_RECONCILE_INTERVAL` or `RESTORE_RECONCILE_INTERVAL`, use the same command with that variable name. Changing the Deployment restarts the Operator Pod, and the new value applies from then on.

Sample output

```
30s
```
