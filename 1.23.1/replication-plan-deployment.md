> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Plan your multi-cluster or multi-region deployment

## Requirements

Regardless of topology, successful deployments share several technical requirements:

- Network connectivity: Every node in both the Main and the Replica sites must be able to reach each other over the network, like in full mesh:

  To make this happen in Kubernetes clusters, you need to expose all Replica Set nodes (including Config Servers) on both sites through a dedicated Service. To learn more, see the [Service per Pod](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/expose.html#service-per-pod) section in the Exposing the cluster chapter.

- User credentials must be the same in both clusters.

- TLS certificates must be the same in both clusters.

You must have a single *Main* cluster but you can have multiple *Replica* clusters as long as you don’t have more than 50 members in the Replica Set. This limitation comes from MongoDB itself, for more information please check [MongoDB documentation](https://www.mongodb.com/docs/manual/core/replica-set-members/#replica-set-members) .

## Topologies

The Operator automates configuration of *Main* and *Replica* MongoDB sites when you run them on Kubernetes. However, multi-cluster or multi-region deployment is not bound to Kubernetes. Either *Main* or *Replica* can run outside of Kubernetes, be regular MongoDB and be out of the Operator’s control.

The following topologies are supported:

### Main and Replica clusters on Kubernetes.

This is the Kubernetes-native deployment. You can automate the cluster management using the [Multi-Cluster Services](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/replication-mcs.html).

The Deployment section focuses on this topology and provides the setup steps.

### Main cluster on Kubernetes and Replica cluster outside of Kubernetes.

You can deploy or reuse an existing cluster on Kubernetes as the *Main* site and have the *Replica* cluster outside of Kubernetes.

The setup steps are:

1. Deploy [the *Main* cluster on a Kubernetes cluster](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/replication-main.html) (or use an existing one)
1. Export TLS certificates and user Secrets from the main site and use them to configure the Replica site.
1. Deploy the *Replica* cluster wherever you want.
1. [Interconnect sites](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/replication-interconnect.html) by adding nodes from the *Replica* cluster to the *Main* cluster as external nodes.

### Main cluster outside of Kubernetes and Replica cluster on Kubernetes

You can deploy or reuse an existing cluster outside of Kubernetes as the *Main* site and run the *Replica* cluster on Kubernetes.

The setup steps are:

1. Deploy the *Main* cluster wherever you want (or use an existing one)
1. Export the TLS certificates and user credentials from the main site.
1. Create the Kubernetes Secrets objects: [for TLS certificates](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/tls-manual.html) and [for User secrets](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/app-users.html#create-users-via-custom-resource). You will use these Secrets to deploy the Replica site.
1. Deploy the *Replica* cluster on a Kubernetes cluster using the Secrets you created.
1. Interconnect sites by adding nodes from the *Replica* cluster to the *Main* cluster using the MongoDB client.

## Next steps

[Multi-cluster services](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/replication-mcs.html) [Deploy the Main site](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/replication-main.html)
