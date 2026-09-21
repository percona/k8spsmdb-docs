# Try the Operator

This section takes a cluster from nothing to running, monitored, and backed up. Follow it in
order the first time; each step assumes the one before it.

!!! tip "Building an application instead?"

    If someone else runs the cluster and you only need to connect your code to it, start
    with [Integrate your application](get-a-cluster.md) instead. It covers connection strings, application
    users, and driver examples, and does not assume you administer the cluster.

## The path

1. **[Quick install](kubectl.md)** — deploy the Operator and a database cluster with
   `kubectl`. To use Helm instead, see [Install from Helm charts](helm.md).
2. **[Connect and insert sample data](connect.md)** — connect with mongosh from inside the
   cluster and add sample data so later steps have something to work with.
3. **[Take your first backup](backup-tutorial.md)** — configure storage and run your first backup.
4. **[Restore sample data](restore-tutorial.md)** — delete the sample data and restore it from
   your backup.
5. **[Delete the cluster](delete.md)** — remove the evaluation deployment when testing is
   done and you are ready to deploy for production.

[Start with the quick install :material-arrow-right:](kubectl.md){.md-button}

## Beyond the basics

The quick install is deliberately minimal - it is not a production configuration. When you
are ready to run this for real:

* [Installation](System-Requirements.md) covers system requirements, platform-specific setup, and
  multi-namespace deployments.
* [Features](features.md) covers what the Operator can do - backups, high availability,
  security, scaling, upgrades - and the decisions each one involves.
* [What's next for operators](what-next-operations.md) lists the hardening tasks worth doing
  before production.
