# Compare various solutions to deploy MongoDB in Kubernetes

There are multiple ways to deploy and manage MongoDB in Kubernetes. Here we will focus on comparing the following open source solutions:

* [Bitnami Helm chart  :octicons-link-external-16:](https://github.com/bitnami/charts/tree/master/bitnami/mongodb)

* [KubeDB  :octicons-link-external-16:](https://github.com/kubedb)

* [MongoDB Community Operator  :octicons-link-external-16:](https://github.com/mongodb/mongodb-kubernetes-operator)

* [Percona Operator for MongoDB  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/)

## Generic

Here is the review of generic features, such as supported MongoDB versions, open source models and more.

| Feature/Product   | Percona Operator for MongoDB | Bitnami Helm Chart | KubeDB for MongoDB | MongoDB Community Operator         | MongoDB Enterprise Operator  |
|:------------------|:-----------------------------|:-------------------|:-------------------|:-----------------------------------|:-----------------------------|
| Open source model | Apache 2.0                   | Apache 2.0         | Open core          | Open core                          | Open core                    |
| MongoDB versions  | MongoDB 5.0, 6.0, 7.0        | MongoDB 5.0        | MongoDB 3.4, 3.6. 4.0, 4.1, 4.2 | MongoDB 4.2, 4.4, 5.0, 6.0, 7.0| MongoDB 4.2, 4.4, 5.0, 6.0, 7.0|
| Kubernetes conformance | Various versions are tested | No guarantee   | No guarantee       | No guarantee                       | No guarantee                 |
| Cluster-wide mode | Yes                          | Not an operator    | Enterprise only    | Yes                                | Yes                          |
| Network exposure  | Yes                          | Yes                | No, only through manual config | No                     | Yes                          |

## Maintenance

Upgrade and scaling are the two most common maintenance tasks that are executed by database administrators and developers.

| Feature/Product   | Percona Operator for MongoDB | Bitnami Helm Chart | KubeDB for MongoDB | MongoDB Community Operator        | MongoDB Enterprise Operator       |
|:------------------|:-----------------------------|:-------------------|:-------------------|:----------------------------------|:----------------------------------|
| Operator upgrade  | Yes                          | Helm upgrade       | Image change       | Yes                               | Yes                               |
| Database upgrade  | Automated minor, manual major| No                 | Manual minor       | Manual minor and major            | Yes                               |
| Compute scaling   | Horizontal and vertical      | Horizontal and vertical | Enterprise only | Horizontal only                 | Yes                               |
| Storage scaling   | Yes                          | Manual             | Enterprise only    | No                                | Yes                               |

## MongoDB topologies

The next comparison is focused on replica sets, arbiters, sharding and other node types.

| Feature/Product   | Percona Operator for MongoDB | Bitnami Helm Chart | KubeDB for MongoDB | MongoDB Community Operator        | MongoDB Enterprise Operator       |
|:------------------|:-----------------------------|:-------------------|:-------------------|:----------------------------------|:----------------------------------|
| Multi-cluster deployment | Yes                   | No                 | No                 | No                                | Yes                               |
| Sharding          | Yes                          | Yes, another chart | Yes                | No                                | Yes                               |
| Arbiter           | Yes                          | Yes                | Yes                | Yes                               | Yes                               |
| Non-voting nodes  | Yes                          | No                 | No                 | No                                | Yes                               |
| Hidden nodes      | No                           | Yes                | Yes                | Yes                               | Yes                               |
| Network exposure  | Yes                          | Yes                | Manual             | No                                | Yes                               |

## Backups

Here are the backup and restore capabilities of each solution.

| Feature/Product   | Percona Operator for MongoDB | Bitnami Helm Chart | KubeDB for MongoDB | MongoDB Community Operator        | MongoDB Enterprise Operator       |
|:------------------|:-----------------------------|:-------------------|:-------------------|:----------------------------------|:----------------------------------|
| Scheduled backups | Yes                          | No                 | Enterprise only    | No                                | Yes                               |
| Incremental backups | No                         | No                 | Enterprise only    | No                                | No                                |
| Point-in-time recovery | Yes                     | No                 | No                 | No                                | Yes                               |
| Logical backups | Yes                            | No                 | No                 | No                                | Yes                               |
| Physical backups | Yes                           | No                 | No                 | No                                | Yes                               |

## Monitoring

Monitoring is crucial for any operations team.

| Feature/Product   | Percona Operator for MongoDB | Bitnami Helm Chart | KubeDB for MongoDB | MongoDB Community Operator        | MongoDB Enterprise Operator       |
|:------------------|:-----------------------------|:-------------------|:-------------------|:----------------------------------|:----------------------------------|
| Custom exporters  | Yes, through sidecars        | mongodb-exporter as a sidecar | mongodb-exporter as a sidecar | Integrate with prometheus operator |  Integrate with prometheus operator | 
| Percona Monitoring and Management (PMM) | Yes    | No                 | No                 | No                                | No                                |

## Miscellaneous

Finally, let’s compare various features that are not a good fit for other categories.

| Feature/Product   | Percona Operator for MongoDB | Bitnami Helm Chart | KubeDB for MongoDB | MongoDB Community Operator        | MongoDB Enterprise Operator       |
|:------------------|:-----------------------------|:-------------------|:-------------------|:----------------------------------|:----------------------------------|
| Customize MongoDB configuration | Yes            | Yes                | Yes                | No, only some params              | No, only some params              |
| Helm              | Yes                          | Yes                | Yes, for operator only | Yes, for operator only        | Yes, for operator only            |
| SSL/TLS           | Yes                          | Yes                | Enterprise only    | Yes                               | Yes                               |
| Create users/roles| Yes                          | Yes                | No                 | Yes                               | Yes                               |
