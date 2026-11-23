> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# What’s next for operators

The cluster is running. These are the tasks that keep it running.

- **[Configure backups](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-configure.html)** — Set up storage, then [run scheduled backups](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-scheduled.html) and define retention.
- **[Restore from a backup](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore.html)** — Restore on the same cluster or [provision a new cluster from a backup](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-restore.html#restore-on-a-new-cluster).
- **[Monitor the database and Kubernetes](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/monitoring.html)** — Use PMM [to monitor the database](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/monitoring.html) and [Kubernetes](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/monitor-kubernetes.html) health and performance for full observability.
- **[Set up persistent logging](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/persistent-logging.html)** — Retain and rotate logs for troubleshooting.
- **[Scale the cluster](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling.html)** — Add replica set members or plan for [sharding](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/sharding.html) when you need more capacity.
- **[Upgrade the Operator and database](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update.html)** — Keep the [Operator](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-operator.html) and [Percona Server for MongoDB](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-db.html) up to date.
- **Secure your data** — [Encrypt client and server-side traffic](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/TLS.html) either with the [cert-manager](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/tls-cert-manager.html) or [manual certificates](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/tls-manual.html). Configure [data-at-rest encryption](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/encryption.html) to ensure data safety when it is written on disk.
- **[Control Pod placement](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/constraints.html)** — Use affinity and anti-affinity so Pods run on the right nodes.
- **[Plan multi-region or disaster recovery](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/replication-plan-deployment.html)** — Replicate across sites and [fail over](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/replication-failover.html) when needed.
- **[Remove a deployment](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/delete.html)** — Delete a test cluster or decommission an environment.

You can also operate the Operator and database via the [Open Everest](https://openeverest.io/docs/) web interface. Navigate to the **Get started with Open Everest** guide in the Open Everest documentation to try it.

Building an application against the cluster rather than operating it? See [What’s next for developers](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/what-next.html).
