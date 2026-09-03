# What's next?

You have an application talking to the database. These are the things worth doing before you call it production-ready.

* **[Enable TLS for application connections](TLS.md)** — Encrypt traffic between your app and the database.
* **[Create and manage application users](app-users.md)** — Use dedicated, least-privilege users instead of the default admin.
* **[Expose the cluster for production access](expose.md)** — Connect from outside the cluster (load balancer or ingress) instead of port-forward.
* **[Scale the replica set](scaling.md)** — Add nodes for read capacity and high availability; understand how your driver uses secondaries.
* **[Understand backups and restore](backups.md)** — See backup types, point-in-time recovery, and what they mean for your app.
* **[Test your disaster recovery and failover strategies](replication-failover.md)** — Practise a failover before you need one.

Operating the cluster rather than building against it? See
[What's next for operators](what-next-operations.md).
