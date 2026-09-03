# About monitoring and observability

Knowing that a cluster is healthy takes three different signals: database metrics and
query performance, the state of the Kubernetes objects underneath, and the logs the
components write. The Operator has a separate mechanism for each.

## What to monitor with what

| Signal | Mechanism | Custom Resource field |
|---|---|---|
| Database metrics and query analytics | Percona Monitoring and Management (PMM) | `pmm` |
| Kubernetes objects - Pods, PVCs, StatefulSets | A Kubernetes-layer monitoring stack | none; deployed alongside |
| Component logs | The log collector sidecar | `logcollector` |

## Database monitoring with PMM

PMM runs as a client container beside each database Pod and reports to a PMM Server you
run yourself. It is enabled with `pmm.enabled` and pointed at a server with
`pmm.serverHost`. You can pass extra collection flags for `mongod` and `mongos` through
`pmm.mongodParams` and `pmm.mongosParams`.

See [Monitor with Percona Monitoring and Management (PMM)](monitoring.md).

## Kubernetes-layer monitoring

PMM tells you about the database; it does not tell you that a PVC is full or a Pod is
stuck Pending. For that, monitor the Kubernetes objects themselves - see
[Monitor Kubernetes](monitor-kubernetes.md).

## Logs

Container logs vanish when a Pod is replaced, which is precisely when you most want them.
The `logcollector` section enables a collector that keeps logs beyond the life of the
Pod, and rotation keeps them from filling the volume.

* [Persistent logging](persistent-logging.md)
* [Log rotation](logrotate.md)


## Limitations

* PMM reports on the database. It does not tell you that a PVC is nearly full, that a Pod is
  stuck `Pending`, or that a node is gone - those need
  [Kubernetes-layer monitoring](monitor-kubernetes.md).
* The log collector keeps logs beyond the life of a Pod, but it is not a substitute for a
  retention policy: without rotation, logs grow until the volume fills. See
  [Log rotation](logrotate.md).

## Next steps

* [Monitor with Percona Monitoring and Management (PMM)](monitoring.md)
* [Persistent logging](persistent-logging.md)
* [Initial troubleshooting](debug.md)
