# Percona Operator for MongoDB

The Percona Operator for MongoDB runs and manages Percona Server for MongoDB inside Kubernetes for you. You describe the database you want (for example how many nodes, where to store backups), and the Operator keeps the cluster running that way: it creates the right pods, handles failures, and applies upgrades when you ask for them.

**Why use it?** You get a production-ready MongoDB cluster on Kubernetes without wiring every detail yourself. The Operator handles provisioning, scaling, backups, and high availability so you can focus on building your application or operating the platform.

[Get started :material-arrow-down:](#get-started){.md-button}
[What's new in version {{release}}](RN/Kubernetes-Operator-for-PSMONGODB-RN{{release}}.md){.md-button}

---

## Get started

Choose how you want to use the Operator:

* **I'm building an application** — I need to connect my app to Percona Server for MongoDB on Kubernetes.  
  [Get started (developer path) :material-arrow-right:](quickstart.md#developer-path)

* **I'm deploying or operating the cluster** — I install, back up, and maintain the database.  
  [Get started (deployment and operations path) :material-arrow-right:](quickstart.md#deployment-and-operations-path)

---

<div data-grid markdown>
<div data-banner markdown>

## :fontawesome-solid-magnifying-glass: Understand the Operator { .title }

Understand how the Operator works, how it’s designed, and how it compares to other ways to run MongoDB on Kubernetes.

* [How the Operator works](how-it-works.md)
* [Features](features.md)
* [Architecture](architecture.md)
* [Compare with other solutions](compare.md)

</div><div data-banner markdown>

## :material-progress-download: Set up the Operator and the database { .title }

Ready to run robust, production-grade Percona Server for MongoDB on Kubernetes? Install the Operator and learn how to easily manage daily operations.

* [Installation](install-overview.md)
* [Manage users](users.md)
* [Configure backups](backups.md)
* [Scale your cluster](scaling.md)
* [Monitor database health](monitoring.md)

</div><div data-banner markdown>

## :material-file-document-multiple: User guides {.title}

Optimize your Kubernetes and database workflows with the Operator.

* [Configure external access to the cluster](expose.md)
* [Configure TLS](TLS.md)
* [Encrypt data at rest](encryption.md)
* [Set up disaster recovery with multi-cluster deployment](replication.md)


</div><div data-banner markdown>

### :fontawesome-solid-user-tie: Manage cluster lifecycle {.title}

Take control of your cluster's lifecycle. Follow these guides to keep your environment running smoothly with minimal downtime.

* [Upgrade](update.md)
* [Pause and resume](pause.md)
* [Migrate data using backups](backups-move-from-external-db.md)

</div><div data-banner markdown>

### :material-book-education: Look up reference materials { .title }

Explore Custom Resource, backup and restore options, certified images and version compatibility.

* [Custom Resource options :material-arrow-right:](operator.md)
* [Backup Resource options](backup-resource-options.md.)
* [Restore Resource options](restore-options.md.)
* [Percona certified images](images.md)
* [Version compatibility matrix](versions.md)

</div>
</div>
