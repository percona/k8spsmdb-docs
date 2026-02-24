# Plan your multi-cluster or multi-region deployment

## Requirements

Regardless of topology, successful deployments share several technical requirements:

* Network connectivity: Every node in both the Main and the Replica sites must be able to reach each other over the network, like in full mesh:

    ![image](assets/images/replication-mesh.svg)

    To make this happen in Kubernetes clusters, you need to expose all Replica Set nodes (including Config Servers) on both sites through a dedicated Service. To learn more, see the [Service per Pod](expose.md#service-per-pod) section in the Exposing the cluster chapter.

* User credentials must be the same in both clusters.

* TLS certificates must be the same in both clusters.

You must have a single _Main_ cluster but you can have multiple _Replica_
clusters as long as you don't have more than 50 members in the Replica Set. This
limitation comes from MongoDB itself, for more information please check [MongoDB
documentation :octicons-link-external-16:](https://www.mongodb.com/docs/manual/core/replica-set-members/#replica-set-members).

## Topologies

The Operator automates configuration of _Main_ and _Replica_ MongoDB sites when you run them on Kubernetes. However, multi-cluster or multi-region deployment
is not bound to Kubernetes. Either _Main_ or _Replica_ can
run outside of Kubernetes, be regular MongoDB and be out of the Operator's
control.

The following topologies are supported:

### Main and Replica clusters on Kubernetes. 

This is the Kubernetes-native deployment. You can automate the cluster management using the [Multi-Cluster Services](replication-mcs.md). 

The Deployment section focuses on this topology and provides the setup steps.

### Main cluster on Kubernetes and Replica cluster outside of Kubernetes.

You can deploy or reuse an existing cluster on Kubernetes as the _Main_ site and have the _Replica_ cluster outside of Kubernetes. 

The setup steps are:

1. Deploy [the _Main_ cluster on a Kubernetes cluster](replication-main.md) (or use an existing one)
2. Export TLS certificates and user Secrets from the main site and use them to configure the Replica site.
3. Deploy the _Replica_ cluster wherever you want. 
4. [Interconnect sites](replication-interconnect.md) by adding nodes from the _Replica_ cluster to the _Main_ cluster as external nodes.

### Main cluster outside of Kubernetes and Replica cluster on Kubernetes

You can deploy or reuse an existing cluster outside of Kubernetes as the _Main_ site and run the _Replica_ cluster on Kubernetes. 

The setup steps are:

1. Deploy the _Main_ cluster wherever you want (or use an existing one)
2. Export the TLS certificates and user credentials from the main site. 
3. Create the Kubernetes Secrets objects: [for TLS certificates](tls-manual.md) and [for User secrets](app-users.md#create-users-via-custom-resource). You will use these Secrets to deploy the Replica site.
4. Deploy the _Replica_ cluster on a Kubernetes cluster using the Secrets you created.
5. Interconnect sites by adding nodes from the _Replica_ cluster to the _Main_ cluster using the MongoDB client.

## Next steps

[Multi-cluster services](replication-mcs.md){.md-button}
[Deploy the Main site](replication-main.md){.md-button}

