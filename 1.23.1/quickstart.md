> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Try the Operator

This section takes a cluster from nothing to running, monitored, and backed up. Follow it in order the first time; each step assumes the one before it.

Building an application instead?

If someone else runs the cluster and you only need to connect your code to it, start with [Integrate your application](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/get-a-cluster.html) instead. It covers connection strings, application users, and driver examples, and does not assume you administer the cluster.

## The path

1. **[Quick install](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/kubectl.html)** — deploy the Operator and a database cluster with `kubectl`. To use Helm instead, see [Install from Helm charts](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/helm.html).
1. **[Connect and insert sample data](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/connect.html)** — connect with mongosh from inside the cluster and add sample data so later steps have something to work with.
1. **[Take your first backup](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backup-tutorial.html)** — configure storage and run your first backup.
1. **[Restore sample data](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/restore-tutorial.html)** — delete the sample data and restore it from your backup.
1. **[Delete the cluster](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/delete.html)** — remove the evaluation deployment when testing is done and you are ready to deploy for production.

[Start with the quick install](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/kubectl.html)

## Beyond the basics

The quick install is deliberately minimal - it is not a production configuration. When you are ready to run this for real:

- [Installation](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/System-Requirements.html) covers system requirements, platform-specific setup, and multi-namespace deployments.
- [Features](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/features.html) covers what the Operator can do - backups, high availability, security, scaling, upgrades - and the decisions each one involves.
- [What’s next for operators](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/what-next-operations.html) lists the hardening tasks worth doing before production.
