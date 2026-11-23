> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Disable TLS

You can run Percona Server for MongoDB without TLS. For example, for testing or demonstration purposes. However, we recommend that you have the TLS protocol enabled.

You can start a new cluster without TLS or disable the TLS protocol for a running cluster. See the corresponding sections for steps.

Export your namespace so the commands below can use it. Replace `<namespace>` with your value:

```
export NAMESPACE=<namespace>
```

## Disable TLS for a new cluster

To disable TLS protocol for a new cluster, edit the `deploy/cr.yaml` Custom Resource manifest as follows:

- set the `tls.mode` key to `disabled`
- set the `unsafeFlags.tls` to `true`.

```
...
spec:
  ...
  unsafeFlags:
    tls: true
    ...
  tls:
    mode: disabled
```

Apply the manifest:

```
kubectl apply -f deploy/cr.yaml -n <namespace>
```

## Disable TLS for a running cluster

To disable TLS protocol for a running cluster, follow these steps:

1. Pause the cluster. Since the cluster is running, run the `kubectl patch` command to update the cluster configuration. Replace the `<namespace>` placeholder with your namespace. For example, for the cluster with the name `my-cluster-name`, the command is:

   ```
   kubectl patch psmdb my-cluster-name -n <namespace> --type json -p='[{"op":"add","path":"/spec/pause","value":true}]'
   ```

1. Wait for the cluster to be paused. Check the status with the `kubectl get psmdb` command:

   ```
   kubectl get psmdb -n <namespace>
   ```

   Expected output

   ```
   NAME              ENDPOINT                                                 STATUS   AGE
   my-cluster-name   my-cluster-name-mongos.default.svc.cluster.local:27017   paused   3m
   ```

1. Disable the TLS protocol by setting the following configuration in the `deploy/cr.yaml` Custom Resource manifest:

   ```
   ...
   spec:
     ...
     unsafeFlags
       tls: true
       ...
     tls:
       mode: disabled
   ```

1. Apply the changes:

   ```
   kubectl apply -f deploy/cr.yaml -n <namespace>
   ```

1. Now resume the cluster with the `kubectl patch` command:

   ```
   kubectl patch psmdb my-cluster-name -n <namespace> --type json -p='[{"op":"add","path":"/spec/pause","value":false}]'
   ```

1. Wait for the cluster to be resumed. Check the status with the `kubectl get psmdb` command.

## Re-enable TLS

To re-enable TLS protocol for a running cluster, follow these steps:

1. Pause the cluster. Edit the `deploy/cr.yaml` Custom Resource manifest and set `spec.pause` key to `true`:

   ```
   spec:
     pause: true
   ```

1. Apply the changes:

   ```
   kubectl apply -f deploy/cr.yaml -n <namespace>
   ```

1. Wait for the cluster to be paused. Check the status with the `kubectl get psmdb` command:

   ```
   kubectl get psmdb -n <namespace>
   ```

1. Enable the TLS protocol by setting the following configuration in the `deploy/cr.yaml` Custom Resource manifest:

   ```
   ...
   spec:
     ...
     unsafeFlags
       tls: false
       ...
     tls:
       mode: preferTLS
   ```

1. Apply the changes:

   ```
   kubectl apply -f deploy/cr.yaml -n <namespace>
   ```

1. Now resume the cluster. Edit the `deploy/cr.yaml` Custom Resource manifest and set the `spec.pause` key to `false`:

   ```
   spec:
     pause: false
   ```

1. Apply the changes:

   ```
   kubectl apply -f deploy/cr.yaml -n <namespace>
   ```

1. Wait for the cluster to be resumed. Check the status with the `kubectl get psmdb` command.

Note

If you also need to disable authentication in addition to TLS, see [Disable authentication](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/auth-disable.html). Note that TLS must be disabled before you can disable authentication.

## Verify TLS is disabled

Confirm the mode took effect and the cluster came back:

```
kubectl get psmdb -n $NAMESPACE -o jsonpath='{.items[*].spec.tls.mode}'
kubectl get psmdb -n $NAMESPACE
```

The mode must read `disabled` and the cluster must reach `ready`. Disabling TLS restarts the database Pods, so a cluster that stays in `initializing` means the rollout has not finished yet - check Pod status before changing anything else.
