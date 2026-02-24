# What's next?

You've finished the first steps. Use the tasks below to go deeper—whether you're hardening your application or running the Operator in production environment.

## If you're building an application

Move beyond the basics and get production-ready:

* **[Enable TLS for application connections](TLS.md)** — Encrypt traffic between your app and the database.
* **[Create and manage application users](app-users.md)** — Use dedicated, least-privilege users instead of the default admin.
* **[Expose the cluster for production access](expose.md)** — Connect from outside the cluster (load balancer or ingress) instead of port-forward.
* **[Scale the replica set](scaling.md)** — Add nodes for read capacity and high availability; understand how your driver uses secondaries.
* **[Understand backups and restore](backups.md)** — See how scheduled backups and point-in-time recovery work and what they mean for your app.
* **[Test your disaster recovery and failover strategies]()** - 

## If you're operating the cluster

Run the database and Operator reliably in production:

* **[Set up scheduled backups](backups-scheduled.md)** — Automate backups and define retention.
* **[Restore from a backup](backups-restore.md)** — Restore on the same cluster or [provision a new cluster from a backup](backups-restore-to-new-cluster.md).
* **[Scale the cluster](scaling.md)** — Add replica set members or plan for [sharding](sharding.md) when you need more capacity.
* **[Upgrade the Operator and database](update.md)** — Keep the [Operator](update-operator.md) and [Percona Server for MongoDB](update-db.md) up to date.
* **Secure your data** — [Encrypt client and server-side traffic](TLS.md) either with the [cert-manager](tls-cert-manager.md) or [manual certificates](tls-manual.md). Configure [data-at-rest encryption](encryption.md) to ensure data safety when it is written on disk.
* **[Control Pod placement](constraints.md)** — Use affinity and anti-affinity so Pods run on the right nodes.
* **[Monitor the database and Kubernetes](monitoring.md)** — Use [PMM for the database](monitoring.md) and [Kubernetes monitoring](monitor-kubernetes.md) for full observability.
* **[Set up persistent logging](persistent-logging.md)** — Retain and rotate logs for troubleshooting.
* **[Plan multi-region or disaster recovery](replication-plan-deployment.md)** — Replicate across sites and [fail over](replication-failover.md) when needed.
* **[Remove a deployment](delete.md)** — Delete a test cluster or decommission an environment.

You can also operate the Operator and database via the [Open Everest](https://openeverest.io/docs/) web interface. See [Get started with Percona Everest](https://docs.percona.com/everest/quickstart-guide/quick-install.html) to try it.
