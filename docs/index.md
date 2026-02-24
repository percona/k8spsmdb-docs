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

## Featured topics

Pick the topic that matches what you need to do:

<div data-grid markdown><div data-banner markdown>

## :fontawesome-solid-magnifying-glass: Discover the Operator { .title }

Understand how the Operator works, how it’s designed, and how it compares to other ways to run MongoDB on Kubernetes.

[How the Operator works :material-arrow-right:](how-it-works.md){ .md-button }

</div><div data-banner markdown>

## :material-file-document-multiple: User guides { .title }

Optimize your Kubernetes and database workflows with the Operator.

[User guides :material-arrow-right:](.md){ .md-button }

</div><div data-banner markdown>

### :material-frequently-asked-questions: Troubleshooting { .title }

Diagnose and fix issues with the Operator, the cluster, storage, or logs.

[Troubleshooting :material-arrow-right:](debug.md){.md-button}

</div><div data-banner markdown>

### :material-book-education: Reference { .title }

Explore Custom Resource, backup and restore options, certified images and version compatibility.

[Custom Resource options :material-arrow-right:](operator.md){ .md-button }

</div>
</div>
