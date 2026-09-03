# Deploy and operate

This section takes a cluster from nothing to running, monitored, and backed up. Follow it in
order the first time; each step assumes the one before it.

!!! tip "Building an application instead?"

    If someone else runs the cluster and you only need to connect your code to it, start
    with [Development](get-a-cluster.md) instead. It covers connection strings, application
    users, and driver examples, and does not assume you administer the cluster.

## The path

1. **[Quick install](kubectl.md)** — deploy the Operator and a database cluster with
   `kubectl`. To use Helm instead, see [Install from Helm charts](helm.md).
2. **[Connect to Percona Server for MongoDB](connect.md)** — connect with `mongosh` from
   inside the cluster and confirm the database answers.
3. **[Insert data](data-insert.md)** — add sample data so later steps have something to work
   with.
4. **[Make a backup](backup-tutorial.md)** — configure storage and run your first backup.
5. **[Monitor the database with PMM](monitoring-tutorial.md)** — set up Percona Monitoring
   and Management.

[Start with the quick install :material-arrow-right:](kubectl.md){.md-button}

## Day-to-day operations

* [Pause or restart the cluster](pause.md)
* [Delete the Operator and database](delete.md)

## Beyond the basics

The quick install is deliberately minimal - it is not a production configuration. When you
are ready to run this for real:

* [Install](System-Requirements.md) covers system requirements, platform-specific setup, and
  multi-namespace deployments.
* [Features](features.md) covers what the Operator can do - backups, high availability,
  security, scaling, upgrades - and the decisions each one involves.
* [What's next for operators](what-next-operations.md) lists the hardening tasks worth doing
  before production.
