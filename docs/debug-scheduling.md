# Troubleshoot Pod scheduling

Use this page when `kubectl get pods` shows `Pending` for one or more database Pods.

A database Pod stays `Pending` and never starts. Kubernetes has not chosen a node for it, so the cluster does not become ready. The Operator has already created the Pod. The Kubernetes scheduler is what selects a node, so restarting the Operator leaves the Pod `Pending`.

The Pod's events name every node the scheduler rejected, and why. Fix that reason in the Custom Resource or in the cluster.

Refer to the sections below for the steps.

For other Pod states, see [Check the Pods](debug.md#check-the-pods).

## Find the reason

1. List the Pods and note which ones are `Pending`:

    ```bash
    kubectl get pods -n <namespace> -o wide
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        NAME                    READY   STATUS    RESTARTS   AGE   NODE
        my-cluster-name-rs0-0   4/4     Running   0          12m   node-1
        my-cluster-name-rs0-1   4/4     Running   0          11m   node-2
        my-cluster-name-rs0-2   0/4     Pending   0          10m   <none>
        ```

    A `Pending` Pod has `<none>` in the `NODE` column. The `READY` count depends on the enabled sidecars, such as the backup agent and the log collector.

2. Read the events of the `Pending` Pod:

    ```bash
    kubectl describe pod <pod-name> -n <namespace>
    ```

    Look at the `Events` section at the bottom. The scheduler records a `FailedScheduling` event with the reason:

    ??? example "Sample output"

        ```{.text .no-copy}
        Events:
          Type     Reason            Age   From               Message
          ----     ------            ----  ----               -------
          Warning  FailedScheduling  25s   default-scheduler  0/4 nodes are available: 4 Insufficient memory. no new claims to deallocate, preemption: 0/4 nodes are available: 4 Preemption is not helpful for scheduling.
        ```

    The exact wording depends on the Kubernetes version. Newer versions add a clause about preemption (`preemption: ...`) at the end. You can ignore it. The reason is in the part before it.

3. Read the whole message. It lists every node and groups the nodes by the reason each was rejected. The number before each reason is how many nodes it applies to, and different nodes can fail for different reasons:

    ```{.text .no-copy}
    0/4 nodes are available: 2 node(s) didn't match pod topology spread constraints, 2 node(s) were unschedulable.
    ```

    To place the Pod, you must fix the reason for at least one node.

4. Check the Custom Resource. While a Pod is `Pending`, `kubectl get psmdb` reports the state `initializing`. The scheduler's message is in the status of the replica set, after the next reconcile:

    ```bash
    kubectl get psmdb <cluster-name> -n <namespace> -o jsonpath='{.status.replsets.rs0.message}'
    ```

    Replace `rs0` with the name of the replica set that the Pod belongs to.

!!! note

    If the `Events` section is empty, the events have expired (Kubernetes keeps them for about an hour by default). Delete the `Pending` Pod. The StatefulSet recreates it, and the scheduler records a fresh event.

Each component is scheduled with its own settings. A change under `replsets` doesn't affect the config server or `mongos` Pods. Apply the fix to the section that the `Pending` Pod belongs to.

## Event messages at a glance

| The event says | What it means | Go to |
| --- | --- | --- |
| `Insufficient cpu` or `Insufficient memory` | No node has enough unreserved CPU or memory for the Pod's requests | [Not enough CPU or memory](#not-enough-cpu-or-memory) |
| `didn't match pod anti-affinity rules` or <br> `didn't satisfy existing pods anti-affinity rules` | There are fewer nodes (or zones) than replica set members | [Not enough nodes or zones](#not-enough-nodes-or-zones-for-anti-affinity) |
| `had untolerated taint(s)` | The nodes are tainted and the Pod has no matching toleration | [Taints, labels, or selectors block the Pod](#taints-labels-or-selectors-block-the-pod) |
| `didn't match Pod's node affinity/selector` | No node has the labels the Pod requires | [Taints, labels, or selectors block the Pod](#taints-labels-or-selectors-block-the-pod) |
| `didn't match pod topology spread constraints` | A `DoNotSchedule` spread constraint can't be met | [Taints, labels, or selectors block the Pod](#taints-labels-or-selectors-block-the-pod) |
| `were unschedulable` | The node is cordoned | [A node is cordoned](#a-node-is-cordoned) |
| `pod has unbound immediate PersistentVolumeClaims`, <br> `didn't find available persistent volumes to bind`, <br> `persistentvolumeclaim "<name>" not found`, <br> `is being deleted`, or <br> `binding volumes: context deadline exceeded` | The Pod's volume claim doesn't exist, can't get a volume, or is being deleted | [PVC is missing or unbound](#pvc-is-missing-or-unbound) |
| `didn't match PersistentVolume's node affinity` (older Kubernetes versions: `had volume node affinity conflict`) | The volume is pinned to a node or zone where the Pod can't run | [Volume node affinity conflict](#volume-node-affinity-conflict) |
| `Pod didn't trigger scale-up` (reason `NotTriggerScaleUp`) | The cluster autoscaler has no node group that would fit the Pod | [The autoscaler does not add a node](#the-autoscaler-does-not-add-a-node) |

## Apply the fix

How the Pod picks up a fix depends on where you make it.

* **A fix in the Kubernetes cluster** (uncordon a node, remove a taint, add a node or a label) is picked up by the scheduler on its own. The `Pending` Pod schedules within seconds.
* **A fix in the Custom Resource** (requests, affinity, tolerations, `nodeSelector`, storage) changes the StatefulSet, but not the Pod that is already `Pending`. [Smart Update](update.md#smart-update) waits for all Pods to be ready before it replaces any of them, and a `Pending` Pod never becomes ready. Apply the change, then delete the `Pending` Pod:

    ```bash
    kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

    Before deleting the Pod, inspect its StatefulSet with `kubectl get statefulset <statefulset-name> -n <namespace> -o yaml`. Wait until `spec.template` contains the corrected requests or scheduling constraints. Then delete the Pod:

    ```bash
    kubectl delete pod <pending-pod> -n <namespace>
    ```

    The StatefulSet recreates the Pod with the new settings. Delete only the `Pending` Pod. It never started, so no data is lost.

## Not enough CPU or memory

**Meaning.** The scheduler compares the Pod's resource *requests* with what is still unreserved on each node. It adds up the requests of all containers in the Pod, including sidecars such as the log collector, and ignores `limits` and the current load. A node can be idle and still be full on paper.

**Fix.**

1. Compare the requests with the free capacity. In the output, check the `Allocatable` and `Allocated resources` sections. The `Non-terminated Pods` table shows the requests of every Pod on the node:

    ```bash
    kubectl describe node <node-name>
    ```

2. Do one of the following:

    * Add a node, or use larger nodes.
    * Lower the requests in the Custom Resource. Check what your cluster can afford before you do, as the database needs enough memory to run:

        ```yaml
        spec:
          replsets:
          - name: rs0
            resources:
              requests:
                cpu: 300m
                memory: 1Gi
        ```

3. Apply the change and delete the `Pending` Pod, as described in [Apply the fix](#apply-the-fix).

If other workloads should give way to the database Pods, you can also set `priorityClassName`. See [Priority Classes](constraints.md#priority-classes). For sizing, see [Scaling](scaling.md).

## Not enough nodes or zones for anti-affinity

**Meaning.** By default, the Operator keeps replica set members on different nodes (`antiAffinityTopologyKey: kubernetes.io/hostname`). When every schedulable node already runs a member, the next Pod has nowhere to go. In the following example, two of four nodes are cordoned, and the other two already run members:

```{.text .no-copy}
0/4 nodes are available: 2 node(s) didn't match pod anti-affinity rules, 2 node(s) were unschedulable.
```

With `topology.kubernetes.io/zone`, each member needs a node in its own zone, so three members need nodes in three zones.

If you set `affinity.advanced`, the Operator ignores `antiAffinityTopologyKey`. Check the rules under `advanced` instead. Only `required...` rules can keep a Pod `Pending`. A `preferred...` rule never does.

**Fix.**

1. Add a node (or a zone) so that every member gets its own. This is the right fix for production, because the spread is what lets the replica set survive the loss of one node.
2. For a test cluster that has to run on fewer nodes, turn the rule off in `deploy/cr.yaml`:

    ```yaml
    spec:
      replsets:
      - name: rs0
        affinity:
          antiAffinityTopologyKey: "none"
    ```

    Apply the full `cr.yaml`, then delete the `Pending` Pod, as described in [Apply the fix](#apply-the-fix). A merge patch with this snippet replaces the whole `replsets` list, and the API server rejects it.

    Don't use `none` in production. Several members can then land on the same node, and one node failure can take down the majority of the replica set.

See [Affinity and anti-affinity](constraints.md#affinity-and-anti-affinity) for all valid values.

## Taints, labels, or selectors block the Pod

**Meaning.** The scheduler rejected the nodes for one or more of these reasons:

* The node is tainted, and the Pod has no toleration for the taint.
* The Pod asks for a node label (`nodeSelector` or node affinity) that no node has.
* A `DoNotSchedule` spread constraint can't be met.

**Fix.**

1. Check the taints and labels of the nodes. Newer Kubernetes versions print only `had untolerated taint(s)` in the event, without the key and the value, so list the taints from the nodes:

    ```bash
    kubectl get nodes -o custom-columns=NAME:.metadata.name,TAINTS:.spec.taints
    kubectl get nodes --show-labels
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        NAME     TAINTS
        node-1   [map[effect:NoSchedule key:dedicated value:mongodb]]
        node-2   <none>
        ```

2. Compare them with the Custom Resource:

    ```bash
    kubectl get psmdb <cluster-name> -n <namespace> -o yaml
    ```

    Check `nodeSelector`, `affinity`, `tolerations` and `topologySpreadConstraints` under the section that the Pod belongs to.

3. Either label or untaint the node, or change the Custom Resource so that the Pod matches. For example, add a toleration for a dedicated node pool. A change to the node needs no further steps. A change to the Custom Resource needs the Pod to be deleted, as described in [Apply the fix](#apply-the-fix). See [Tolerations](constraints.md#tolerations), [Node selector](constraints.md#node-selector) and [Topology Spread Constraints](constraints.md#topology-spread-constraints).

## A node is cordoned

**Meaning.** A cordoned node accepts no new Pods. It is marked `SchedulingDisabled`. It's normal during a node drain or upgrade. However, it becomes a problem if the node was cordoned and forgotten. The message usually combines `were unschedulable` with other reasons, as in the examples above.

**Fix.**

1. Find the cordoned nodes:

    ```bash
    kubectl get nodes
    ```

2. If no maintenance is running on the node, make it schedulable again:

    ```bash
    kubectl uncordon <node-name>
    ```

    The `Pending` Pod schedules on its own. If a drain is still in progress, wait for it to finish.

## Storage problems

Database Pods keep their data on PersistentVolumeClaims (PVCs). If the volume can't be provided, or is in a place the Pod can't reach, the Pod stays `Pending`.

### PVC is missing or unbound

**Meaning.** The scheduler can't place a Pod whose PVC doesn't exist or can't get a volume. The event of the Pod names the claim, but not the cause:

| The event says | What it means |
| --- | --- |
| `pod has unbound immediate PersistentVolumeClaims` | The PVC has no volume yet and its StorageClass binds immediately |
| `didn't find available persistent volumes to bind` | No free volume matches the claim. For example, the StorageClass has no provisioner |
| `persistentvolumeclaim "<name>" not found` | The PVC isn't in the Pod's namespace |
| `persistentvolumeclaim "<name>" is being deleted` | The PVC is being replaced, for example when you recreate a member. This state is temporary |
| `binding volumes: context deadline exceeded` | The provisioner didn't create the volume in time |

**Fix.**

1. Check the claims. The cause is in the events of the PVC, not in the events of the Pod:

    ```bash
    kubectl get pvc -n <namespace>
    kubectl describe pvc <pvc-name> -n <namespace>
    ```

    The PVC of a member is named `mongod-data-<pod-name>`, for example `mongod-data-my-cluster-name-rs0-2`. Look for a `ProvisioningFailed` event:

    ??? example "Sample output"

        ```{.text .no-copy}
        Warning  ProvisioningFailed  storageclass.storage.k8s.io "does-not-exist" not found
        ```

2. Fix what the PVC events report: the StorageClass name (`kubectl get sc` lists the existing ones), the default StorageClass, the provisioner, or the namespace quota.

A PVC with a StorageClass that waits for the first consumer stays `Pending` until the Pod is scheduled. That alone isn't an error. Changing `storageClassName` in the Custom Resource doesn't change PVCs that already exist.

See [Troubleshooting storage](debug-storage.md) for quota and CSI issues.

### Volume node affinity conflict

**Meaning.** A PersistentVolume is pinned to certain nodes, and the Pod can only run where the volume can be attached. The Pod waits when the place where the volume lives is not available:

* Local storage (local-path, hostPath, OpenEBS hostpath, local CSI drivers) is pinned to the node that created the volume. The Pod waits if that node is cordoned, drained, or gone.
* Cloud disks are pinned to a zone. The Pod waits if no schedulable node is available in that zone.

The event looks like this:

```{.text .no-copy}
0/4 nodes are available: 1 node(s) were unschedulable, 3 node(s) didn't match PersistentVolume's node affinity.
```

Older Kubernetes versions say `had volume node affinity conflict`.

The PVC still shows `Bound`, so look at the volume instead:

```bash
kubectl get pvc mongod-data-<pod-name> -n <namespace>
kubectl describe pv <pv-name>
```

??? example "Sample output"

    ```{.text .no-copy}
    Node Affinity:
      Required Terms:
        Term 0:        kubernetes.io/hostname in [node-1]
    ```

**Fix.**

1. If the node or zone can come back, bring it back: uncordon the node, finish the drain, or add a node in that zone. The Pod schedules on its own and keeps its data.
2. If the node or zone is gone for good, recreate the member. The Operator creates a new, empty volume on an available node, and the member runs an initial sync from the other members. **Do this for one member at a time, and only while the rest of the replica set is healthy and keeps a majority.** This applies to config server members too. The data on the member's volume is deleted:

    ```bash
    kubectl delete pvc mongod-data-<pod-name> -n <namespace> --wait=false
    kubectl delete pod <pod-name> -n <namespace>
    ```

    The `--wait=false` option keeps the first command from blocking while a running Pod still uses the claim. If the Pod is already `Pending`, deleting the claim can be enough: the StatefulSet recreates it, and the Pod schedules on its own.

3. Wait until the new member is `SECONDARY` before you touch another one. Open [mongosh](connection-secrets.md#open-an-interactive-shell-with-mongosh), connecting to the affected shard or config server replica set (`cfg`), not through `mongos`. Authenticate as a user authorized to run `replSetGetStatus`, then run `rs.status()` to check the recreated member. `kubectl get psmdb` can show `ready` before the initial sync finishes. If you recreate two members of a three-member replica set at once, there is no majority: the primary steps down, and writes fail until one of the members finishes the sync.

## The autoscaler does not add a node

**Meaning.** The Pod stays `Pending` although the cluster has a cluster autoscaler. The autoscaler adds a node only if some node group would fit the Pod. Look for the event:

```bash
kubectl get events -n <namespace> --field-selector reason=NotTriggerScaleUp
```

The message starts with `Pod didn't trigger scale-up:` and gives the reason why a new node would not help, for example `max node group size reached`. On some platforms, such as GKE, the reason after the colon can be empty. Check the status or the logs of the cluster autoscaler for the reason.

**Fix.** Check that at least one node group has the labels, taints and zone that the Pod requires, that its machine size is large enough for the Pod's requests, and that it hasn't reached its maximum size. Then fix the node group, or the Pod's constraints, as described above.

## Verify recovery

1. Check that the Pod is scheduled and running:

    ```bash
    kubectl get pods -n <namespace> -o wide
    ```

    The `STATUS` is `Running`, the `READY` column is full (for example `4/4`), and `NODE` shows a node name.

2. Check the cluster state:

    ```bash
    kubectl get psmdb -n <namespace>
    ```

    The `STATUS` changes from `initializing` to `ready`. For a recreated member, also check `rs.status()` in [mongosh](connection-secrets.md#open-an-interactive-shell-with-mongosh): the member must be `SECONDARY` or `PRIMARY`, because `ready` can appear before the initial sync finishes.

3. Check that no new `FailedScheduling` events appear:

    ```bash
    kubectl get events -n <namespace> --field-selector reason=FailedScheduling
    ```

## See also

* [Control Pod scheduling](constraints.md)
* [Troubleshoot the Operator installation issues](troubleshoot-operator.md)
* [Troubleshooting storage](debug-storage.md)
