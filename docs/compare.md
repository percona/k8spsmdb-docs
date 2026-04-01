# Compare various solutions to deploy MongoDB in Kubernetes

There are multiple ways to deploy and manage MongoDB in Kubernetes. Here we will focus on comparing the following open source solutions:

* [Bitnami Helm chart  :octicons-link-external-16:](https://github.com/bitnami/charts/tree/master/bitnami/mongodb)

* [KubeDB  :octicons-link-external-16:](https://github.com/kubedb)

* [MongoDB Controllers for Kubernetes (MCK)  :octicons-link-external-16:](https://github.com/mongodb/mongodb-kubernetes)

* [Percona Operator for MongoDB  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/)

## Generic

Here is the review of generic features, such as supported MongoDB versions, open source models and more.

| Feature/Product   | Percona Operator for MongoDB | Bitnami Helm Chart | KubeDB for MongoDB | MongoDB Controllers for Kubernetes (MCK) | 
|:------------------|:-----------------------------|:-------------------|:-------------------|:-----------------------------------------|
| Open source model | Apache 2.0                   | Apache 2.0         | Open core          | Open core                          |
| Kubernetes conformance | CNCF-certified distributions | No guarantee  | No guarantee       | No guarantee                       |
| Cluster-wide mode | Yes                          | Not an operator    | Enterprise only    | Yes                                |
| Network exposure  | Yes                          | Yes                | No, only through manual config | Yes (Enterprise); limited (Community) |
| Web-based GUI     | [OpenEverest](https://openeverest.io/) | :no_entry_sign: | [kubedb-ui](https://kubedb.com/datasheet/) | [Ops Manager / Cloud Manager](https://www.mongodb.com/products/self-managed/enterprise-advanced/ops-manager) (Enterprise)|

\* Percona Operator relies on [Percona Server for MongoDB](https://www.percona.com/mongodb/software/percona-server-for-mongodb) - a free, enhanced, fully compatible MongoDB software alternative for MongoDB Community Server with enterprise-grade features.

## Maintenance

Upgrade and scaling are the two most common maintenance tasks that are executed by database administrators and developers.

| Feature/Product   | Percona Operator for MongoDB | Bitnami Helm Chart | KubeDB for MongoDB | MongoDB Controllers for Kubernetes (MCK) |
|:------------------|:-----------------------------|:-------------------|:-------------------|:-----------------------------------------|
| Operator upgrade  | Yes                          | Helm upgrade       | Image change       | Yes                               |
| Database upgrade  | Automated minor, manual major| No                 | Manual minor       | Automated (Enterprise via Ops Manager); manual minor and major (Community) |
| Compute scaling   | Horizontal and vertical      | Horizontal and vertical | Horizontal and vertical | Horizontal and vertical (Enterprise); horizontal only (Community) |
| Storage scaling   | Yes                          | Manual             |Yes (Enterprise); No (Community) | Yes (Enterprise); No (Community)                              |

## MongoDB topologies

The next comparison is focused on replica sets, arbiters, sharding and other node types.

| Feature/Product   | Percona Operator for MongoDB | Bitnami Helm Chart | KubeDB for MongoDB | MongoDB Controllers for Kubernetes (MCK) |
|:------------------|:-----------------------------|:-------------------|:-------------------|:-----------------------------------------|
| Multi-cluster deployment | Yes                   | No                 | No                 | Enterprise                        |
| Sharding          | Yes                          | Yes, another chart | Yes                | Enterprise                        |
| Arbiter           | Yes                          | Yes                | Yes                | Yes                               |
| Non-voting nodes  | Yes                          | No                 | No                 | Enterprise                        |
| Hidden nodes      | Yes                          | Yes                | Yes                | Yes                               |
| Split Horizon     | Yes                          | No                 | Yes                | Yes                               |

## Backups

Here are the backup and restore capabilities of each solution.

| Feature/Product   | Percona Operator for MongoDB | Bitnami Helm Chart | KubeDB for MongoDB | MongoDB Controllers for Kubernetes (MCK) |
|:------------------|:-----------------------------|:-------------------|:-------------------|:----------------------------------|
| Scheduled backups | Yes                          | No                 | Enterprise         | Enterprise                        |
| Incremental backups | Yes                        | No                 | Enterprise         | No                                |
| Point-in-time recovery | Yes                     | No                 | Enterprise         | Enterprise                        |
| Logical backups | Yes                            | No                 | No                 | Enterprise                        |
| Physical backups | Yes                           | No                 | Enterprise         | Enterprise                        |

## Monitoring

Monitoring is crucial for any operations team.

| Feature/Product   | Percona Operator for MongoDB | Bitnami Helm Chart | KubeDB for MongoDB | MongoDB Controllers for Kubernetes (MCK) |
|:------------------|:-----------------------------|:-------------------|:-------------------|:----------------------------------|
| Custom exporters  | Yes, through sidecars        | mongodb-exporter as a sidecar | mongodb-exporter as a sidecar | Integrate with prometheus operator |
| Percona Monitoring and Management (PMM) | Yes    | No                 | No                 | No                                |

## Miscellaneous

Finally, let’s compare various features that are not a good fit for other categories.

| Feature/Product   | Percona Operator for MongoDB | Bitnami Helm Chart | KubeDB for MongoDB | MongoDB Controllers for Kubernetes (MCK) |
|:------------------|:-----------------------------|:-------------------|:-------------------|:----------------------------------|
| Customize MongoDB configuration | Yes            | Yes                | Yes                | Limited to some params            |
| Helm              | Yes                          | Yes                | Yes, for operator only | Yes, for operator only        |
| SSL/TLS           | Yes                          | Yes                | Enterprise         | Yes                               |
| Create users/roles| Yes                          | Yes                | No                 | Yes                               |
