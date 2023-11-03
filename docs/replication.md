# Set up Percona Server for MongoDB cross-site replication

The cross-site replication involves configuring one MongoDB site as _Main_, and
another MongoDB site as _Replica_ to allow replication between them:

![image](assets/images/replication-pods.svg)

This feature can be useful in several cases:

- simplify the migration of the MongoDB cluster to and from Kubernetes
- add remote nodes to the replica set for disaster recovery

## Prerequisites

- Every node in _Main_ and _Replica_ clusters need to be reachable through network.
- User credentials should be the same in each cluster.
- TLS certificates should be the same in each cluster.

## Glossary

- **Main cluster**: The cluster which the primary node runs and accepts write
  traffic. It's the **managed cluster** if it's running on Kubernetes.
- **Replica cluster**: The cluster which is configured to replicate from **main
  cluster**. It's the **unmanaged cluster** if it's running on Kubernetes.
- **Managed cluster**: The cluster controlled by operator. The operator controls
  everything from [Replica Set
  configuration](https://www.mongodb.com/docs/manual/reference/replica-configuration/)
  to users credentials. It's the default deployment of the operator.
- **Unmanaged cluster**: The cluster controlled by operator but the operator
  isn't responsible for managing [Replica Set
  configuration](https://www.mongodb.com/docs/manual/reference/replica-configuration/).

## Topologies

The Operator automates configuration of _Main_ and _Replica_ MongoDB sites, but
the feature itself is not bound to Kubernetes. Either _Main_ or _Replica_ can
run outside of Kubernetes, be regular MongoDB and be out of the Operators’
control.

You need to have a single _Main_ cluster but you can have multiple _Replica_
clusters as long as you don't have more than 50 members in Replica Set. This
limitation comes from MongoDB itself, for more information please check [MongoDB
docs](https://www.mongodb.com/docs/manual/core/replica-set-members/#replica-set-members).

### Main and Replica clusters on Kubernetes

If you want both _Main_ and _Replica_ clusters to run on Kubernetes, overall steps will look like:

1. Deploy _Main_ cluster on a Kubernetes cluster (or use an existing one)
2. Get secrets from _Main_ cluster and apply them to namespace in Kubernetes cluster which you'll deploy the _Replica_ cluster
3. Deploy _Replica_ cluster on a Kubernetes cluster
4. Add nodes from _Replica_ cluster to _Main_ cluster as external nodes

### Main cluster on Kubernetes and Replica cluster outside of Kubernetes

If you want _Main_ cluster to run on Kubernetes but _Replica_ cluster outside of Kubernetes, overall steps will look like:

1. Deploy _Main_ cluster on a Kubernetes cluster (or use an existing one)
2. Get TLS secrets from _Main_ cluster to configure _Replica_ cluster
3. Deploy _Replica_ cluster on wherever you want
4. Add nodes from _Replica_ cluster to _Main_ cluster as external nodes

### Main cluster outside of Kubernetes and Replica cluster on Kubernetes

If you want _Main_ cluster to run outside of Kubernetes but _Replica_ cluster on Kubernetes, overall steps will look like:

1. Deploy _Main_ cluster on wherever you want (or use an existing one)
2. Get TLS certificates and create a Kubernetes secret with them
3. Get user credentials and create a Kubernetes secret with them
4. Deploy _Replica_ cluster on a Kubernetes cluster
5. Add nodes from _Replica_ cluster to _Main_ cluster using Mongo client

## Deploying _Main_ cluster on Kubernetes

## Deploying _Replica_ cluster on Kubernetes

## Preparing secrets for _Replica_ on Kubernetes

## Preparing TLS certificates for _Replica_ outside of Kubernetes

## Exposing instances of the MongoDB cluster

You need to expose all Replica Set nodes (including Config Servers) through a
dedicated service to ensure that _Main_ and _Replica_ can reach each other,
like in a full mesh:

![image](assets/images/replication-mesh.svg)

This is done through the `replsets.expose`, `sharding.configsvrReplSet.expose`,
and `sharding.mongos.expose` sections in the `deploy/cr.yaml` configuration file
as follows.

```yaml
spec:
  replsets:
  - rs0:
    expose:
      enabled: true
      exposeType: LoadBalancer
    ...
  sharding:
    configsvrReplSet:
      expose:
        enabled: true
        exposeType: LoadBalancer
      ...
```

The above example is using the LoadBalancer Kubernetes Service object, but there
are other options (ClusterIP, NodePort, etc.).

!!! note

    The above example will create a LoadBalancer per each Replica Set Pod.
    In most cases, this Load Balancer should be internet-facing for cross-region
    replication to work.

To list the endpoints assigned to Pods, list the Kubernetes Service objects by
executing `kubectl get services -l "app.kubernetes.io/instance=CLUSTER_NAME"`
command.
