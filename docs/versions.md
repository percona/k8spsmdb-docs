# Versions compatibility

Versions of the cluster components and platforms tested with different Operator releases are shown below. Other version combinations may also work but have not been tested.

Cluster components:

| Operator | [MongoDB  :octicons-link-external-16:](https://www.percona.com/mongodb/software/percona-server-for-mongodb) | [Percona Backup for MongoDB  :octicons-link-external-16:](https://www.percona.com/mongodb/software/percona-backup-for-mongodb) | 
|:--------|:--------|:-----|
| [1.19.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.19.0.md) | 6.0 - 8.0          | 2.8.0 |
| [1.18.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.18.0.md) | 5.0 - 7.0          | 2.7.0 |
| [1.17.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.17.0.md) | 5.0 - 7.0          | 2.5.0 |
| [1.16.2](RN/Kubernetes-Operator-for-PSMONGODB-RN1.16.2.md) | 5.0 - 7.0          | 2.4.1 |
| [1.16.1](RN/Kubernetes-Operator-for-PSMONGODB-RN1.16.1.md) | 5.0 - 7.0          | 2.4.1 |
| [1.16.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.16.0.md) | 5.0 - 7.0          | 2.4.1 |
| [1.15.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.15.0.md) | 4.4 - 6.0          | 2.3.0 |
| [1.14.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.14.0.md) | 4.4 - 6.0          | 2.0.4, 2.0.5 |
| [1.13.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.13.0.md) | 4.2 - 5.0          | 1.8.1 |
| [1.12.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.12.0.md) | 4.2 - 5.0          | 1.7.0 |
| [1.11.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.11.0.md) | 4.0, 4.2, 4.4, 5.0 | 1.6.1 |
| [1.10.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.10.0.md) | 4.0, 4.2, 4.4, 5.0 | 1.6.0 |
| [1.9.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.9.0.md)   | 4.0, 4.2, 4.4      | 1.5.0 |
| [1.8.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.8.0.md)   | 3.6, 4.0, 4.2, 4.4 | 1.4.1 |
| [1.7.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.7.0.md)   | 3.6, 4.0, 4.2, 4.4 | 1.4.1 |
| [1.6.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.6.0.md)   | 3.6, 4.0, 4.2      | 1.3.4 |
| [1.5.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.5.0.md)   | 3.6, 4.0, 4.2      | 1.3.1 |
| [1.4.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.4.0.md)   | 3.6, 4.0, 4.2      | 1.1.0 |
| [1.3.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.3.0.md)   | 3.6, 4.0           | 0.4.0 |
| [1.2.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.2.0.md)   | 3.6, 4.0           | 0.4.0 |
| [1.1.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.1.0.md)   | 3.6, 4.0           | 0.4.0 |

Platforms:

| Operator | [GKE  :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine)         | [EKS  :octicons-link-external-16:](https://aws.amazon.com)         | [Openshift  :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift) | [AKS  :octicons-link-external-16:](https://azure.microsoft.com/en-us/services/kubernetes-service/) | [Minikube  :octicons-link-external-16:](https://github.com/kubernetes/minikube)                          |
|:--------|:------------|:------------|:------------|:------------|:----------------------------------|
| [1.19.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.19.0.md) | 1.28 - 1.30 | 1.29 - 1.31 | 4.14.44 - 4.17.11 | 1.28 - 1.31 | 1.34.0 |
| [1.18.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.18.0.md) | 1.28 - 1.30 | 1.28 - 1.31 | 4.13.52 - 4.17.3 | 1.28 - 1.31 | 1.34.0 |
| [1.17.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.17.0.md) | 1.27 - 1.30 | 1.28 - 1.30 | 4.13.48 - 4.16.9 | 1.28 - 1.30 | 1.33.1 |
| [1.16.2](RN/Kubernetes-Operator-for-PSMONGODB-RN1.16.2.md) | 1.26 - 1.29 | 1.26 - 1.29 | 4.12.56 - 4.15.11 | 1.27 - 1.29 | 1.33 |
| [1.16.1](RN/Kubernetes-Operator-for-PSMONGODB-RN1.16.1.md) | 1.26 - 1.29 | 1.26 - 1.29 | 4.12.56 - 4.15.11 | 1.27 - 1.29 | 1.33 |
| [1.16.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.16.0.md) | 1.26 - 1.29 | 1.26 - 1.29 | 4.12.56 - 4.15.11 | 1.27 - 1.29 | 1.33 |
| [1.15.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.15.0.md) | 1.24 - 1.28 | 1.24 - 1.28 | 4.11 - 4.13 | 1.25 - 1.28 | 1.31.2 |
| [1.14.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.14.0.md) | 1.22 - 1.25 | 1.22 - 1.24 | 4.10 - 4.12 | 1.23 - 1.25 | 1.29 |
| [1.13.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.13.0.md) | 1.21 - 1.23 | 1.21 - 1.23 | 4.10 - 4.11 | 1.22 - 1.24 | 1.26 |
| [1.12.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.12.0.md) | 1.19 - 1.22 | 1.19 - 1.22 | 4.7 - 4.10  | - | 1.23 |
| [1.11.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.11.0.md) | 1.19 - 1.22 | 1.18 - 1.22 | 4.7 - 4.9   | - | 1.22 |
| [1.10.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.10.0.md) | 1.17 - 1.21 | 1.16 - 1.21 | 4.6 - 4.8   | - | 1.22 |
| [1.9.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.9.0.md)   | 1.17 - 1.21 | 1.16-1.20   | 4.7         | - | 1.20 |
| [1.8.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.8.0.md)   | 1.16 - 1.20 | 1.19        | 3.11, 4.7   | - | 1.19 |
| [1.7.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.7.0.md)   | 1.15 - 1.17 | 1.15        | 3.11, 4.5   | - | 1.10 |
| [1.6.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.6.0.md)   | 1.15 - 1.17 | 1.15        | 3.11, 4.5   | - | 1.10 |
| [1.5.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.5.0.md)   | 1.15 - 1.17 | 1.15        | 3.11, 4.5   | - | 1.18 |
| [1.4.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.4.0.md)   | 1.13, 1.15  | 1.15        | 3.11, 4.2   | - | 1.16 |
| [1.3.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.3.0.md)   | 1.11, 1.14  | -           | 3.11, 4.1   | - | 1.12 |
| [1.2.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.2.0.md)   | -           | -           | 3.11, 4.0   | - | -    |
| [1.1.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.1.0.md)   | -           | -           | 3.11, 4.0   | - | -    |

More detailed information about the cluster components for the current version of the Operator can be found [in the system requirements](System-Requirements.md) and [in the list of certified images](images.md). For previous releases of the Operator, you can check the same pages [in the documentation archive  :octicons-link-external-16:](https://docs.percona.com/legacy-documentation/).
