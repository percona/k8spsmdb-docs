> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# What’s next for developers

You have an application talking to the database. These are the things worth doing before you call it production-ready.

- **[Enable TLS for application connections](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/TLS.html)** — Encrypt traffic between your app and the database.
- **[Create and manage application users](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/app-users.html)** — Use dedicated, least-privilege users instead of the default admin.
- **[Expose the cluster for production access](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/expose.html)** — Connect from outside the cluster (load balancer or ingress) instead of port-forward.
- **[Scale the replica set](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/scaling.html)** — Add nodes for read capacity and high availability; understand how your driver uses secondaries.
- **[Understand backups and restore](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups.html)** — See backup types, point-in-time recovery, and what they mean for your app.
- **[Test your disaster recovery and failover strategies](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/replication-failover.html)** — Practice a failover before you need one.

Operating the cluster rather than building against it? See [What’s next for operators](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/what-next-operations.html).
