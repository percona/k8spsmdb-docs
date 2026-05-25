# Troubleshooting pods stuck in Pending (EKS and PVC binding)

Use this guide when Percona Server for MongoDB pods remain in `Pending` with an event similar to:

```text
0/3 nodes are available: pod has unbound immediate PersistentVolumeClaims
```

The steps apply to Percona Operator for MongoDB deployments on Amazon EKS and to other StatefulSet-based workloads that use PersistentVolumeClaims (PVCs).

## Identify pending pods

List pods in the namespace:

```bash
kubectl get pods -n <namespace>
```

Pods in `Pending` indicate a scheduling or storage issue.

## Inspect pod events

Describe one of the pending pods:

```bash
kubectl describe pod <pod-name> -n <namespace>
```

In the **Events** section, look for:

```text
pod has unbound immediate PersistentVolumeClaims
```

This means the pod cannot start because its PVCs are not bound to PersistentVolumes.

## Check PVC status

List PVCs in the namespace:

```bash
kubectl get pvc -n <namespace>
```

If **STATUS** is `Pending`, Kubernetes cannot create or bind a volume for those claims.

## Check StorageClass configuration

List StorageClasses in the cluster:

```bash
kubectl get storageclass
```

Common causes:

- Only one StorageClass exists (for example, `gp2`).
- No default StorageClass is set.
- PVCs do not specify `storageClassName`.

When PVCs are created without a `storageClassName` and no default StorageClass exists, they remain in `Pending` indefinitely.

## Set a default StorageClass

If the cluster has a single StorageClass (for example, `gp2`), mark it as the default:

```bash
kubectl patch storageclass gp2 \
  -p '{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
```

Verify the change:

```bash
kubectl get storageclass
```

The default StorageClass is marked with `(default)` in the output.

## Delete stuck PVCs

PVCs created before a default StorageClass was set must be recreated. The Operator recreates them automatically after deletion.

Delete individual PVCs:

```bash
kubectl delete pvc <pvc-name> -n <namespace>
```

Or delete all PVCs in the namespace:

```bash
kubectl delete pvc --all -n <namespace>
```

!!! warning

    Deleting PVCs removes the associated data unless you have backups. Only delete PVCs when you understand the data impact.

### If PVC deletion hangs

PVCs often have finalizers that block deletion. Remove them manually:

```bash
kubectl patch pvc <pvc-name> -n <namespace> \
  --type=json -p='[{"op":"remove","path":"/metadata/finalizers"}]'
```

Then delete the PVC:

```bash
kubectl delete pvc <pvc-name> -n <namespace>
```

## Verify PVCs bind

After deletion, wait for the Operator to recreate the PVCs. Check their status:

```bash
kubectl get pvc -n <namespace>
```

**STATUS** should be `Bound`. Once PVCs are bound, the scheduler can place the pods.

## Confirm pods start

When PVCs are bound, pods should move from `Pending` to `ContainerCreating` and then `Running`:

```bash
kubectl get pods -n <namespace>
```

## Validate Operator health

Check Operator logs:

```bash
kubectl logs deploy/psmdb-operator -n <namespace>
```

You should no longer see messages such as `Waiting for the pods...`.

For additional troubleshooting steps, see [Percona Operator troubleshooting](troubleshoot-operator.md) and [Troubleshooting storage](debug-storage.md).

## Summary

Pods remain in `Pending` when:

1. PVCs are created without a `storageClassName`.
2. No default StorageClass exists in the cluster.
3. PVCs cannot bind, so pods cannot be scheduled.

Setting a default StorageClass and recreating the stuck PVCs resolves the issue.
