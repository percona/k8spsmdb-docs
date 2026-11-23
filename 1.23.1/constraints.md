> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Control Pod scheduling

The Operator does a good job of automatically assigning new Pods to nodes to achieve balanced distribution across the cluster. There are situations when you must ensure that Pods land on specific nodes: for example, for the speed of an SSD-equipped machine, or to reduce costs by choosing nodes in the same availability zone. There are also situations where the concern isn’t placement at all, but survival - making sure routine Kubernetes maintenance doesn’t take down more of the database than it has to.

The appropriate (sub)sections (`replsets`, `replsets.arbiter`, `backup`, etc.) of the [deploy/cr.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) file contain the keys which can be used to do assign pods to nodes.

## Choose your approach

| Goal                                                                                                           | Use                         | Where                                                       |
| -------------------------------------------------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------- |
| Bind Pods to specific hardware (SSD nodes, a GPU node pool)                                                    | Node selector               | [Node selector](#node-selector)                             |
| Spread replica set members across nodes, zones, or regions so infrastructure loss doesn’t take down a majority | Affinity and anti-affinity  | [Affinity and anti-affinity](#affinity-and-anti-affinity)   |
| Protect the database from being evicted for a less important workload                                          | Priority Classes            | [Priority Classes](#priority-classes)                       |
| Limit how many Pods a voluntary disruption (node drain, cluster upgrade) can take down at once                 | Pod Disruption Budget       | [Pod Disruption Budgets](#pod-disruption-budgets)           |
| Balance Pods across zones or nodes with finer control than simple anti-affinity                                | Topology Spread Constraints | [Topology Spread Constraints](#topology-spread-constraints) |
| Allow Pods onto nodes that are otherwise off-limits (tainted, dedicated)                                       | Tolerations                 | [Tolerations](#tolerations)                                 |

## Node selector

The `nodeSelector` contains one or more key-value pairs. If the node is not labeled with each key-value pair from the Pod’s `nodeSelector`, the Pod will not be able to land on it.

The following example binds the Pod to any node having a self-explanatory `disktype: ssd` label:

```
replsets:
  nodeSelector:
    disktype: ssd
```

## Affinity and anti-affinity

Affinity attracts Pods to nodes that already run Pods with specific labels; anti-affinity repels them. Use affinity to keep Pods with heavy data exchange on the same node or availability zone and cut cross-node traffic. Use anti-affinity to spread Pods across different nodes or zones, so the loss of one doesn’t take several replica set members down together.

Percona Operator for MongoDB provides two approaches for doing this:

- simple way to set anti-affinity for Pods, built-in into the Operator,
- more advanced approach based on using standard Kubernetes constraints.

### Simple approach - use antiAffinityTopologyKey of the Percona Operator for MongoDB

Percona Operator for MongoDB provides an `antiAffinityTopologyKey` option, which may have one of the following values:

- `kubernetes.io/hostname` - Pods will avoid residing within the same host,
- `topology.kubernetes.io/zone` - Pods will avoid residing within the same zone,
- `topology.kubernetes.io/region` - Pods will avoid residing within the same region,
- `none` - no constraints are applied.

The following example forces Percona Server for MongoDB Pods to avoid occupying the same node:

```
replsets:
  affinity:
    antiAffinityTopologyKey: "kubernetes.io/hostname"
```

### Advanced approach - use standard Kubernetes constraints

The previous method can be used without special knowledge of the Kubernetes way of assigning Pods to specific nodes. Still, in some cases, more complex tuning may be needed. In this case, the `advanced` option placed in the [deploy/cr.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) file turns off the effect of the `antiAffinityTopologyKey` and allows the use of the standard Kubernetes affinity constraints of any complexity:

```
replsets:
  affinity:
    advanced:
      podAffinity:
        requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchExpressions:
            - key: security
              operator: In
              values:
              - S1
          topologyKey: failure-domain.beta.kubernetes.io/zone
      podAntiAffinity:
        preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          podAffinityTerm:
            labelSelector:
              matchExpressions:
              - key: security
                operator: In
                values:
                - S2
            topologyKey: kubernetes.io/hostname
      nodeAffinity:
        requiredDuringSchedulingIgnoredDuringExecution:
          nodeSelectorTerms:
          - matchExpressions:
            - key: kubernetes.io/e2e-az-name
              operator: In
              values:
              - e2e-az1
              - e2e-az2
        preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 1
          preference:
            matchExpressions:
            - key: another-node-label-key
              operator: In
              values:
              - another-node-label-value
```

See explanation of the advanced affinity options [in Kubernetes documentation](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#inter-pod-affinity-and-anti-affinity-beta-feature) .

## Priority Classes

Pods may belong to a *priority class*. This lets the scheduler distinguish more and less important Pods when needed - for example, when a higher-priority Pod cannot be scheduled without evicting a lower-priority one first.

Without a `priorityClassName` set, MongoDB Pods carry Kubernetes’ default priority and are exactly as evictable as anything else in the cluster. In a resource-constrained cluster, nothing protects the database from being bumped for a less critical workload unless you set this explicitly.

To use it, add one or more PriorityClasses to your Kubernetes cluster, then set `priorityClassName` in the [deploy/cr.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) file:

```
replsets:
  priorityClassName: high-priority
```

See the [Kubernetes Pods Priority and Preemption documentation](https://kubernetes.io/docs/concepts/configuration/pod-priority-preemption) to find out how to define and use priority classes in your cluster.

## Pod Disruption Budgets

Affinity and anti-affinity covered above only control *where* Pods land - they do nothing to stop a *voluntary* disruption. A `kubectl drain` during a node upgrade, or a cluster autoscaler action, can evict two anti-affinitized replica set members back to back, breaking quorum through routine maintenance instead of hardware failure. A [Pod Disruption Budget](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/) is what limits how many Pods can go down at once during such *voluntary disruptions* - the specific gap anti-affinity leaves open. The `maxUnavailable` and `minAvailable` options in the [deploy/cr.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml) file set these limits.

For the standard 3-member data-bearing replica set, losing 2 members at once breaks quorum - you need a majority of the 3 to elect a primary - so `maxUnavailable: 1` is the most you can afford to lose there:

```
replsets:
  podDisruptionBudget:
    maxUnavailable: 1
```

Don’t copy `1` onto a different member count. The right number scales with how many voting members you actually have - see [Manage voting members in replica set](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/arbiter.html#manage-voting-members-in-replica-set) to work out your own voting member count for arbiter, hidden, and non-voting members before you set this on a 5- or 7-member set.

**Verify the current budget.** Check how many disruptions the cluster currently allows:

```
export NAMESPACE=<namespace>
kubectl get pdb -n $NAMESPACE
```

### Where you can set priorityClassName and podDisruptionBudget

Both options are configurable per component, but not uniformly. The following table reflects what’s configurable.

| Component                   | `priorityClassName`                                                                                                  | `podDisruptionBudget`                                                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `replsets` (data-bearing)   | [Yes](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#replsetspriorityclassname)          | [Yes](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#replsetspoddisruptionbudgetmaxunavailable)          |
| `replsets.nonvoting`        | [Yes](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#replsetsnonvotingpriorityclassname) | [Yes](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#replsetsnonvotingpoddisruptionbudgetmaxunavailable) |
| `replsets.hidden`           | [Yes](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#replsetshiddenpriorityclassname)    | [Yes](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#replsetshiddenpoddisruptionbudgetmaxunavailable)    |
| `replsets.arbiter`          | [Yes](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#replsetsarbiterpriorityclassname)   | No                                                                                                                                   |
| `sharding.configsvrReplSet` | No                                                                                                                   | No                                                                                                                                   |
| `sharding.mongos`           | [Yes](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#shardingmongospriorityclassname)    | No                                                                                                                                   |
| `backup`                    | No                                                                                                                   | No                                                                                                                                   |

## Topology Spread Constraints

*Topology Spread Constraints* allow you to control how Pods are distributed across the cluster based on regions, zones, nodes, and other topology specifics. This can be useful for both high availability and resource efficiency.

Pod topology spread constraints are controlled by the `topologySpreadConstraints` subsection, which can be put into `replsets`, `sharding.configsvrReplSet`, and `sharding.mongos` sections of the `deploy/cr.yaml` configuration file as follows:

```
replsets:
  topologySpreadConstraints:
    - labelSelector:
        matchLabels:
          app.kubernetes.io/name: percona-server-mongodb
      maxSkew: 1
      topologyKey: kubernetes.io/hostname
      whenUnsatisfiable: DoNotSchedule
```

You can see the explanation of these affinity options [in Kubernetes documentation](https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/) .

## Tolerations

*Tolerations* allow Pods having them to be able to land onto nodes with matching *taints*. Toleration is expressed as a `key` with and `operator`, which is either `exists` or `equal` (the equal variant requires a corresponding `value` for comparison).

Toleration should have a specified `effect`, such as the following:

- `NoSchedule` - less strict
- `PreferNoSchedule`
- `NoExecute`

When a *taint* with the `NoExecute` effect is assigned to a Node, any Pod configured to not tolerating this *taint* is removed from the node. This removal can be immediate or after the `tolerationSeconds` interval. The following example defines this effect and the removal interval:

```
replsets:
  tolerations:
  - key: "node.alpha.kubernetes.io/unreachable"
    operator: "Exists"
    effect: "NoExecute"
    tolerationSeconds: 6000
```

The [Kubernetes Taints and Toleratins](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/) contains more examples on this topic.

## See also

- [Scaling and storage](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling-about.html)
- [Disaster recovery and multi-site](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/replication.html)
