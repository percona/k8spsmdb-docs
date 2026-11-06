# Troubleshoot vertical autoscaling

Use this page when the Operator doesn't read or apply Vertical Pod Autoscaler (VPA) recommendations as you expect. To set up vertical autoscaling, see [Configure vertical autoscaling](scaling-vpa.md). To learn more about VPA, read [Scale automatically with VPA](scaling-vertical.md#scale-automatically-with-vpa).

## Before you start

Export your namespace. Replace `<namespace>` with your value:

```bash
export NAMESPACE=<namespace>
```

Most problems show up in two places. Check them first:

1. The `message` field for each component in `status.vpaStatus`. It says why the Operator isn't applying a recommendation:

    ```bash
    kubectl get psmdb my-cluster-name -n $NAMESPACE -o jsonpath='{.status.vpaStatus}'
    ```

2. The `VPAReady` condition. It says whether the Operator can read VerticalPodAutoscaler objects at all:

    ```bash
    kubectl get psmdb my-cluster-name -n $NAMESPACE -o jsonpath='{.status.conditions[?(@.type=="VPAReady")]}'
    ```

For every status field, see [Custom Resource statuses](cr-statuses.md#vpa-status).


## VPAReady is False with reason APINotInstalled

**Symptom:** The `VPAReady` condition is `False` with the message "spec.vpa.enabled is set but the autoscaling.k8s.io/v1.VerticalPodAutoscaler is not installed in the cluster".

**Cause:** The VPA Custom Resource Definition isn't installed.

**Fix:**

1. [Install VPA](scaling-vpa.md#install-vpa).
2. Wait for the next reconcile. The condition turns `True`.

If you removed the VPA Custom Resource Definition while the Operator was running, the condition stays `True` until the Operator restarts.

## The VPA object carries no recommendation

**Symptom:** The message says the VPA object "exists but carries no recommendation".

**Cause:** The Recommender hasn't produced a recommendation yet, or the object's `targetRef` doesn't point at the component's StatefulSet. A `targetRef` that names the `PerconaServerMongoDB` resource can't be resolved by the Recommender.

**Fix:**

1. Wait a few minutes after the Pods start. The Recommender needs usage history.
2. Check that the Recommender and metrics-server are running.
3. Check that `spec.targetRef` names the StatefulSet, for example `my-cluster-name-rs0`.

## The VPA object has no recommendation for the container

**Symptom:** The message says the VPA object "carries recommendations for [...] but none for container".

**Cause:** The VPA object describes a different workload.

**Fix:** Point `targetRef` at the right StatefulSet, or set `vpa.objectName` on the component to the right object.

## The VPA object is not found

**Symptom:** The message says the VPA object "not found".

**Cause:** No VPA object exists with the name the Operator looks for.

**Fix:** Create the object with the [default name](scaling-vpa.md#create-vpa-objects), or set `vpa.objectName` to the name you used.

## The cluster is in error after a VPA object was deleted

**Symptom:** In `Auto` mode, the cluster goes to the `error` state. The message says the component "is still sized from the last applied recommendation and reconciliation is stopped". The cluster's `status.message` reads `failed to reconcile VPA for component '<container>' in replset '<name>': VerticalPodAutoscaler "<name>" not found`. Changes you make to the Custom Resource aren't applied until you fix this.

**Cause:** The Operator already applied a recommendation from this object, and the object is gone. The Operator stops reconciling rather than guess new resources.

**Fix:** Do one of the following:

* Recreate the VPA object.
* Set `spec.vpa.updateMode: "Off"` to return to the declared resources. This rolls the Pods.

## A new recommendation isn't applied

**Symptom:** `recommended` doesn't change although the VPA object has a newer value. The message names a recommendation waiting for the stabilization window.

**Cause:** The stabilization window since the last accepted recommendation hasn't passed.

**Fix:** Wait until the time in the message, or lower the `vpa.stabilizationWindow` value in the Custom Resource.

## Requests stop growing at a certain value

**Symptom:** `applied` requests stay below `recommended`.

**Cause:** The recommendation is clamped by `maxAllowed`, or, with `vpa.controlledValues: RequestsOnly`, capped at your declared limits.

**Fix:** Raise `maxAllowed`, raise the declared limits, or use `vpa.controlledValues: RequestsAndLimits`.

## Pods restart although inPlaceResize is enabled

**Symptom:** Applied changes recreate Pods instead of resizing them.

**Cause:** A prerequisite isn't met: Kubernetes is earlier than 1.33, `updateStrategy` is other than `SmartUpdate`, `crVersion` is earlier than 1.24.0, or `updateMode` is `Off`. A Pod is also recreated in these cases:

* Anything else in its template changes in the same rollout, such as the image.
* The kubelet rejects the resize or doesn't finish it within 2 minutes.
* The memory limit changes and the storage engine isn't WiredTiger.

Switching `updateMode` between `Auto` and `"Off"` while `inPlaceResize` is on also recreates the `mongod` Pods, because the Operator changes how it passes the WiredTiger cache size.

**Fix:**

1. Check the Operator logs for `recreating pod instead of resizing in place`. The `reason` field names the cause, for example `spec.vpa.inPlaceResize needs spec.vpa.updateMode Auto, this cluster uses Off`.
2. Fix the setting and apply the Custom Resource.

## The message shows an API error

**Symptom:** The component's `message` contains a Kubernetes API error instead of one of the messages on this page.

**Cause:** The Operator can't read the VPA object for another reason, for example missing RBAC permissions.

**Fix:** Fix the cause the error names. For RBAC, see the permissions in [Install VPA](scaling-vpa.md#install-vpa).

## Nothing changes

**Symptom:** `status.vpaStatus` doesn't update.

**Cause:** The cluster is [paused](pause.md). The Operator doesn't read recommendations while it is paused.

**Fix:** Unpause the cluster.

## See also

* [Vertical scaling](scaling-vertical.md) for how the Operator decides what to apply
* [Troubleshoot Pods stuck in Pending](debug-scheduling.md) when new requests don't fit on any node
* [Troubleshoot the Operator](troubleshoot-operator.md) for other problems
