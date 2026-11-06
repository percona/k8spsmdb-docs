# Configure vertical autoscaling

!!! note "Version added: [1.24.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.24.0.md)"

Set up the Operator to size CPU and memory from Vertical Pod Autoscaler (VPA) recommendations: install VPA, start in observe mode, then switch to automatic mode. For how the Operator decides what to apply, see [Scale automatically with VPA](scaling-vertical.md#scale-automatically-with-vpa).

## Before you start

* A running cluster deployed with the Operator 1.24.0 or later, with `crVersion` 1.24.0 or later. To deploy one, see [Install the Operator](kubectl.md).
* `updateStrategy: SmartUpdate` in the Custom Resource. It is the default.
* [metrics-server :octicons-link-external-16:](https://github.com/kubernetes-sigs/metrics-server) running in the Kubernetes cluster. The VPA Recommender needs it to read Pod usage. [Install it :octicons-link-external-16:](https://github.com/kubernetes-sigs/metrics-server#installation) if it's not running in your cluster.
* `resources` set for each component you want VPA to manage. See [Vertical scaling](scaling-vertical.md#scale-by-hand).

Export your namespace. Replace `<namespace>` with your value:

```bash
export NAMESPACE=<namespace>
```

## Install VPA

The Operator doesn't ship VPA. Install the VPA Custom Resource Definition and the VPA Recommender from the upstream [kubernetes/autoscaler :octicons-link-external-16:](https://github.com/kubernetes/autoscaler/tree/master/vertical-pod-autoscaler) repository. Install only the Recommender. The Updater and Admission Controller would change Pods behind the Operator's back.

Replace `<vpa-release-tag>` with the VPA release you use:

```bash
VPA_RAW=https://raw.githubusercontent.com/kubernetes/autoscaler/<vpa-release-tag>/vertical-pod-autoscaler/deploy
kubectl apply -f $VPA_RAW/vpa-v1-crd-gen.yaml
kubectl apply -f $VPA_RAW/vpa-rbac.yaml
kubectl apply -f $VPA_RAW/recommender-deployment.yaml
```

Check that the Custom Resource Definition is established and the Recommender is running:

```bash
kubectl wait crd/verticalpodautoscalers.autoscaling.k8s.io --for=condition=Established --timeout=60s
kubectl rollout status deployment/vpa-recommender -n kube-system
```

The Operator's RBAC already lets it read VPA objects. If you deployed the Operator with your own RBAC, add `get`, `list` and `watch` on `verticalpodautoscalers` in the `autoscaling.k8s.io` API group. For in-place resize, also add `patch` on `pods/resize`, and `get` and `list` on `controllerrevisions` in the `apps` API group.

## Create VPA objects

Create one VPA object for each component you want the Operator to manage. Each object must:

* target the component's StatefulSet, not the `PerconaServerMongoDB` resource. The Recommender can't resolve a Custom Resource as a target.
* keep `updatePolicy.updateMode: "Off"`.
* use the name the Operator looks for: `<cluster-name>-<component>-vpa`. For other names, see [Use your own VPA object names](#use-your-own-vpa-object-names).

This example covers the replica set `rs0` of the cluster `my-cluster-name`:

```yaml title="vpa-rs0.yaml"
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: my-cluster-name-rs0-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: StatefulSet
    name: my-cluster-name-rs0
  updatePolicy:
    updateMode: "Off"
```

Create the VPA object:

```bash
kubectl apply -f vpa-rs0.yaml -n $NAMESPACE
```

For the other components, change the name and the target in the configuration file:

| Component | VPA object name | Target StatefulSet | Container |
|---|---|---|---|
| Replica set `rs0` | `my-cluster-name-rs0-vpa` | `my-cluster-name-rs0` | `mongod` |
| Non-voting members of `rs0` | `my-cluster-name-rs0-nv-vpa` | `my-cluster-name-rs0-nv` | `mongod-nv` |
| Hidden members of `rs0` | `my-cluster-name-rs0-hidden-vpa` | `my-cluster-name-rs0-hidden` | `mongod-hidden` |
| Config server replica set | `my-cluster-name-cfg-vpa` | `my-cluster-name-cfg` | `mongod` |
| `mongos` | `my-cluster-name-mongos-vpa` | `my-cluster-name-mongos` | `mongos` |

The Operator reads the recommendation for the container in the last column and ignores recommendations for sidecar containers.

Check that the VPA objects are created successfully:

```bash
kubectl get vpa -n $NAMESPACE
```

??? example "Sample output"

    ```text
    NAME                         MODE   CPU   MEM        PROVIDED   AGE
    my-cluster-name-cfg-vpa      Off    11m   65536k     True       47m
    my-cluster-name-mongos-vpa   Off    11m   87381333   True       33m
    my-cluster-name-rs0-vpa      Off    11m   65536k     True       49m
    ```

The `CPU` and `MEM` columns show the first container in the recommendation, which can be a sidecar. To see the values for the database container, read `status.vpaStatus` as shown in [Observe recommendations](#observe-recommendations).

The first recommendation usually appears a few minutes after the Pods have been running, once metrics-server has some history.

## Observe recommendations

Enable VPA in the observe mode. The Operator records recommendations but doesn't change any Pods. Edit `deploy/cr.yaml`:

```yaml
spec:
  vpa:
    enabled: true
    updateMode: "Off"
```

Keep the quotes around `"Off"`. Without them, YAML reads `Off` as the boolean `false` and the Custom Resource is rejected.

Apply it:

```bash
kubectl apply -f deploy/cr.yaml -n $NAMESPACE
```

Read what the Operator sees for each component:

```bash
kubectl get psmdb my-cluster-name -n $NAMESPACE -o jsonpath='{.status.vpaStatus}' | jq
```

??? example "Sample output"

    ```{.json .no-copy}
    {
      "rs0": {
        "lastObservedAt": "2026-11-05T10:12:40Z",
        "message": "recommendation recorded only, spec.vpa.updateMode is Off",
        "recommended": {
          "cpu": "250m",
          "memory": "1Gi"
        }
      }
    }
    ```

Memory values from the VPA Recommender are in bytes, for example `351198544`.

Keep observe mode on long enough to cover your normal load pattern, for example a full business week. Compare `recommended` with your declared `resources` and decide on safe bounds.

## Apply recommendations automatically

Switch to `Auto` and set bounds and a stabilization window:

```yaml
spec:
  vpa:
    enabled: true
    updateMode: Auto
    controlledValues: RequestsOnly
    minAllowed:
      cpu: 500m
      memory: 2Gi
    maxAllowed:
      cpu: "4"
      memory: 16Gi
    stabilizationWindow: 2h
```

The Custom Resource is rejected if `spec.vpa.minAllowed` exceeds `spec.vpa.maxAllowed`. Component-level bounds aren't validated: if a component's `minAllowed` exceeds its `maxAllowed`, `maxAllowed` wins. The `stabilizationWindow` default is `5m`. To choose `controlledValues` and the window, see [Vertical scaling](scaling-vertical.md#requests-limits-and-the-wiredtiger-cache).

Apply the change:

```bash
kubectl apply -f deploy/cr.yaml -n $NAMESPACE
```

The Operator applies the current recommendation and rolls the Pods through Smart Update.

!!! warning

    Setting `updateMode` back to `Off` returns every component to its declared `resources` and rolls the Pods again. To stop new changes without a restart, keep `Auto` and raise `stabilizationWindow`.

## Resize Pods in place

In-place resize needs `updateStrategy: SmartUpdate`, `crVersion` 1.24.0 or later and `updateMode: Auto`.

```yaml
spec:
  vpa:
    enabled: true
    updateMode: Auto
    inPlaceResize: true
    stabilizationWindow: 15m
```

Turning `inPlaceResize` on or off causes one rolling restart of the `mongod` Pods, because the Operator changes how it passes the WiredTiger cache size to `mongod`. `mongos` Pods aren't restarted. For the same reason, switching `updateMode` between `Auto` and `"Off"` while `inPlaceResize` is on also restarts the `mongod` Pods. After that, applied changes don't restart Pods, so a shorter stabilization window is fine.

## Override settings per component

Each component can override the bounds and the stabilization window. A non-empty component `minAllowed` or `maxAllowed` map replaces the corresponding map in `spec.vpa` entirely; omitted resources don't inherit their global bounds. Repeat every resource bound you want to retain, as shown below. Supported sections are `replsets[]`, `replsets[].nonvoting`, `replsets[].hidden`, `sharding.configsvrReplSet` and `sharding.mongos`:

```yaml
spec:
  replsets:
  - name: rs0
    vpa:
      minAllowed:
        cpu: 500m
        memory: 4Gi
      stabilizationWindow: 4h
  sharding:
    mongos:
      vpa:
        maxAllowed:
          cpu: "2"
          memory: 16Gi
```

### Use your own VPA object names

Set `vpa.objectName` on a component when its VPA object doesn't follow the default name. For example, Goldilocks names its objects `goldilocks-<statefulset-name>`:

```yaml
spec:
  replsets:
  - name: rs0
    vpa:
      objectName: goldilocks-my-cluster-name-rs0
```

## Turn off vertical autoscaling

Set `spec.vpa.enabled: false` and apply the Custom Resource. The Operator stops reading recommendations, clears `status.vpaStatus` and returns every component to its declared `resources`, which rolls the Pods. You can then delete the VPA objects.

## Verify

1. Check that the Operator can read VPA:

    ```bash
    kubectl get psmdb my-cluster-name -n $NAMESPACE -o jsonpath='{.status.conditions[?(@.type=="VPAReady")]}' | jq
    ```

    The condition must show `"status": "True"`.

2. Check what the Operator applied:

    ```bash
    kubectl get psmdb my-cluster-name -n $NAMESPACE -o jsonpath='{.status.vpaStatus}' | jq
    ```

    In `Auto` mode, each component shows `applied` resources and a `lastAppliedAt` time. If a component has no `message` field, it follows the latest recommendation.

3. Check that the Pods run with the applied resources:

    ```bash
    kubectl get pod my-cluster-name-rs0-0 -n $NAMESPACE -o jsonpath='{.spec.containers[?(@.name=="mongod")].resources}' | jq
    ```

4. Check that the cluster is `ready`:

    ```bash
    kubectl get psmdb -n $NAMESPACE
    ```

For every status field, see [Custom Resource statuses](cr-statuses.md).

## Troubleshooting

If the Operator doesn't read or apply recommendations as you expect, see [Troubleshoot vertical autoscaling](debug-vpa.md).

## See also

* [Vertical scaling](scaling-vertical.md) for how the Operator decides what to apply
* [Custom Resource options](operator.md#operator-vpa-section) for every `vpa` option and its default
