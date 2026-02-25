# Single-namespace and multi-namespace deployment modes

Before you install the Percona Operator for MongoDB, choose how it will be scoped: to a single Kubernetes namespace or to multiple namespaces. That choice determines which installation steps you follow and how you manage clusters afterward.

The Operator supports two deployment patterns:

* **Single-namespace (namespace-scoped)** — The Operator runs in one namespace and manages Percona Server for MongoDB clusters only in that namespace. This is the default and recommended mode.
* **Multi-namespace (cluster-wide)** — One Operator instance manages clusters in multiple namespaces (or all namespaces) in the Kubernetes cluster.

This page explains both modes, when to use which, and where to find the right installation guide.

## Which mode should I choose?

* **Choose single-namespace** if you run one or a few MongoDB clusters in one namespace (for example, one team or one application). You get strong isolation, and each namespace can have its own Operator instance. This is the typical choice for most users.
* **Choose multi-namespace** if a central platform or database team manages MongoDB clusters in many namespaces (for example, dev, staging, and prod) and you want one Operator to handle all of them. You need cluster-admin (or equivalent) privileges to set up the Operator.

If you are unsure, start with single-namespace. You can install a separate Operator per namespace; you do not need cluster-wide mode for multiple clusters as long as each cluster lives in its own namespace with its own Operator.

## Overview

The main differences between the two modes are:

1. **RBAC** — In single-namespace mode the Operator uses Kubernetes `Role` and `RoleBinding` resources, which are scoped to one namespace. In multi-namespace mode it uses `ClusterRole` and `ClusterRoleBinding`, which are cluster-scoped. The manifests are in the [percona-server-mongodb-operator](https://github.com/percona/percona-server-mongodb-operator) repository: `deploy/bundle.yaml` (single-namespace) and `deploy/cw-bundle.yaml` (cluster-wide).
2. **WATCH_NAMESPACE** — In single-namespace mode this environment variable is set to the namespace where the Operator is installed. In multi-namespace mode it is either a comma-separated list of namespaces to watch (for example `psmdb,psmdb-prod`) or an empty string (`""`) to watch all namespaces. See [Configure Operator environment variables](env-vars-operator.md#watch_namespace) for details.

## Single-namespace deployment

In single-namespace mode, each Operator instance is limited to one Kubernetes namespace. 

![image](assets/images/cluster-wide-1.svg)

**Characteristics:**

* Uses `Role` and `RoleBinding` (namespace-scoped RBAC).
* The Operator watches only the namespace where it is deployed.
* You can run multiple Operator instances in different namespaces.
* Strong isolation and clear security boundaries between namespaces.
* If something goes wrong with the Operator, the impact is limited to one namespace.

You install in this mode when you use the standard [bundle](kubernetes.md) or [Helm](helm.md) installation without cluster-wide configuration.

## Multi-namespace (cluster-wide) deployment

In multi-namespace mode, one Operator instance can manage Percona Server for MongoDB clusters in several namespaces. 

![image](assets/images/cluster-wide-2.svg)

**Characteristics:**

* Uses `ClusterRole` and `ClusterRoleBinding` (cluster-scoped RBAC) to access and manage resources across namespaces.
* The Operator watches the namespaces specified in `WATCH_NAMESPACE` (or all namespaces if `WATCH_NAMESPACE` is empty).
* Setting up RBAC for cluster-wide mode requires cluster-admin (or equivalent) privileges.
* A single Operator failure can affect all namespaces it watches, so the blast radius is larger than in single-namespace mode.

!!! note

    If more than one Operator is configured to watch the same namespace, which one will take ownership of the Custom Resources in that namespace is undefined. Avoid having multiple Operators watch the same namespace.


## Installation and configuration

Use the following guides depending on how you install the Operator:

* **Single-namespace:** [Install with kubectl](kubectl.md) or [Install with Helm](helm.md). The default bundle and Helm values use single-namespace mode.
* **Multi-namespace:** [Install in multi-namespace (cluster-wide) mode](cluster-wide.md). You use the `deploy/cw-bundle.yaml` (or equivalent Helm/OLM configuration) and set `WATCH_NAMESPACE` and RBAC subjects as described there.

## Important details

* **Cluster names** — You can use the same cluster name in different namespaces (for example `my-cluster` in both `psmdb-dev` and `psmdb-prod`). Each namespace has its own PerconaServerMongoDB resources.
* **Custom Resource Definitions (CRDs)** — CRDs are cluster-scoped and shared by all Operator instances. Install them once per cluster. Do not delete CRDs while any Operator or Percona Server for MongoDB cluster is still running.
* **WATCH_NAMESPACE when using a list** — When you set `WATCH_NAMESPACE` to a comma-separated list, it must include the namespace where the Operator Pod runs. For example, if the Operator is in `psmdb-operator` and you want it to manage `psmdb` and `psmdb-prod`, set `WATCH_NAMESPACE=psmdb-operator,psmdb,psmdb-prod`. If you omit the Operator’s namespace, it will not manage resources in its own namespace.
* **Recommendation** — Prefer single-namespace mode for better isolation and a smaller blast radius. Use multi-namespace mode only when you need one Operator to manage clusters in several namespaces.
