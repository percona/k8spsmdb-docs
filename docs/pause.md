# Pause and resume the cluster

Pausing stops all database Pods and keeps the data. Clients can't connect while the cluster is paused. Pause the cluster when you need it down for a while, for example during maintenance of the Kubernetes infrastructure or to [update expired TLS certificates](tls-update.md#update-certificates-with-downtime). To remove the cluster for good, [delete it](delete.md#delete-the-database-cluster) instead.

## Before you start

* Check that no backup is running. The Operator doesn't pause the cluster until running backups finish:

    ```bash
    kubectl get psmdb-backup -n <namespace>
    ```

    Backups in the `ready`, `error` or `waiting` state don't delay the pause.

* Stop the applications that write to the cluster, or make sure they can handle the outage.

## Pause the cluster

Set `spec.pause` to `true`. Replace `my-cluster-name` with the name of your cluster:

```bash
kubectl patch psmdb my-cluster-name -n <namespace> --type=merge --patch '{"spec": {"pause": true}}'
```

You can also set `pause: true` in your `deploy/cr.yaml` file and apply it with `kubectl apply -f deploy/cr.yaml -n <namespace>`.

## What happens during a pause

The Operator stops the cluster in an order that keeps the data consistent:

1. If a backup is running, the Operator waits until it finishes. Until then, the cluster stays `ready`, and the Operator logs `cluster will pause after all backups finished`.
2. In a sharded cluster, the Operator stops the `mongos` Pods first, so clients can't connect during the shutdown.
3. It stops the `mongot` search Pods, and the arbiter, non-voting and hidden members.
4. In each replica set, it makes the Pod with the index 0, for example `my-cluster-name-rs0-0`, the primary. It then stops the other members one Pod at a time. The primary stops last, so the member that starts first on resume has the latest data.
5. In a sharded cluster, the config server replica set stops after all shards.

While the cluster is paused:

* PVCs and the data on them stay in place.
* The Operator doesn't run Smart Updates, change the backup configuration, or manage the balancer.
* The `status.state` field is `stopping` while Pods shut down, and `paused` when all of them have stopped.

The Operator also pauses the cluster by itself when you turn sharding on or off with backups enabled. See [Turning sharding on and off](sharding.md#turning-sharding-on-and-off).

## Verify the pause

1. Check the cluster state:

    ```bash
    kubectl get psmdb -n <namespace>
    ```

    The `STATUS` column shows `paused`.

2. Check that no database Pods are left:

    ```bash
    kubectl get pods -n <namespace> -l app.kubernetes.io/instance=my-cluster-name
    ```

    The output has no `mongod`, `mongos` or `mongot` Pods.

## Resume the cluster

Set `spec.pause` back to `false`:

```bash
kubectl patch psmdb my-cluster-name -n <namespace> --type=merge --patch '{"spec": {"pause": false}}'
```

The Operator starts the Pods again with their existing PVCs. The state changes to `initializing`, and then to `ready` when all members are up and the [conditions for `ready`](cr-statuses.md#what-ready-means) are met.

## Troubleshooting

**Symptom:** The cluster stays `ready` after you set `pause: true`.

**Cause:** A backup is running. The Operator waits for it to finish.

**Fix:**

1. Check the Operator logs for `cluster will pause after all backups finished`.
2. Run `kubectl get psmdb-backup -n <namespace>` and wait until the backup reaches the `ready` or `error` state. The pause then starts on its own.

**Symptom:** The cluster stays in `stopping`.

**Cause:** A Pod doesn't terminate, or the Operator can't make the Pod with the index 0 the primary. The Operator logs `deleting rs pods` with the replica set name and the reason, for example `waiting first pod to become primary`.

**Fix:**

1. Check which Pods are still running with `kubectl get pods -n <namespace>`.
2. Check the Operator logs for the `deleting rs pods` messages.
3. If a Pod is stuck in `Terminating`, check its events with `kubectl describe pod <pod-name> -n <namespace>`.

For other problems, see [Initial troubleshooting](debug.md).

## See also

* [Update certificates with downtime](tls-update.md#update-certificates-with-downtime) uses a pause to replace expired TLS certificates.
* [Custom Resource statuses](cr-statuses.md) explains every value of `status.state` and the conditions behind it.
* [How the Operator reacts to changes](architecture-reconciliation.md#what-happens-when-i-change-a-field) shows how other Custom Resource changes affect the Pods.
