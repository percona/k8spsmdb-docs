# About multi-cluster and multi-region Percona Operator for MongoDB deployments

MongoDB is built for distributed resilience — and Percona Operator for MongoDB unlocks that power across clusters and regions. 

This section introduces two powerful deployment models — **multi-cluster** and **multi-region**. It also explains how to configure cross-site replication using the Operator. You'll learn how to structure your clusters, understand the roles of Main and Replica sites, and set up secure, synchronized Percona Server for MongoDB clusters across environments with the Operator.

## Deployment models: Multi-cluster vs Multi-region

At a glance, both models involve running Percona Server for MongoDB nodes across multiple environments. But their goals, scope, and setup differ.

*  **Multi-cluster** deployments span multiple Kubernetes clusters, typically within the same cloud provider or region. This model is ideal for high availability, staging/production isolation, or cluster migration.
*  **Multi-region** deployments extend MongoDB across geographically distributed data centers or cloud regions. This setup supports disaster recovery, latency optimization, and jurisdictional data control.

While the underlying mechanics such as replica sets, TLS, and service exposure are similar, multi-region deployments introduce additional complexity around DNS, network reachability, and manual configuration.

### Cross-site replication

To maintain the same set of data in clusters within multi-cluster or multi-region deployment, the Operator uses the cross-site replication. This means that one cluster is the Main site and another one(s) - the Replica site(s).

The following diagram shows how the data is replicated between the sites.

![image](assets/images/replication-pods.svg)

* **Main site**: This is the authoritative cluster. It runs the primary node which accepts the write traffic. The Operator fully controls this site, managing the replica set configuration, backups, user credentials and other operations.
* **Replica site**: These are secondary clusters that host MongoDB nodes and replicate data from the Main site. The Operator deploys this site in passive mode and doesn't control the replica set configuration there. The passive mode is set by the `unmanaged: true` flag in the Custom Resource.

This separation ensures consistency and avoids conflicts when managing distributed deployments.

### Voting members across sites

MongoDB needs an **odd number of voting members** in each replica set for reliable primary elections. When you interconnect Main and Replica sites, you typically add remote members through `replsets.externalNodes` and keep the total voter count odd. Common approaches:

* Add an even number of remote data-bearing members as voting, and one remote member as non-voting (`votes: 0`, `priority: 0`). The main [Interconnect sites](replication-interconnect.md) guide uses this pattern.
* Add an **external arbiter** as a voting member (`arbiterOnly: true`, `votes: 1`, `priority: 0`). The arbiter stores no data and cannot become primary, but it participates in elections. This is useful for a Primary-Secondary-Arbiter (PSA) layout distributed across data centers, or for two data-bearing sites plus a third arbiter site.

For a full example that deploys two data-bearing clusters and an arbiter site, then registers the arbiter on the Main site, see [Splitting a replica set across multiple data centers](replication-multi-dc.md).

## Why to use multi-cluster or multi-region?

Choosing the right topology depends on your goals. Here are common use cases that you can achieve with these models:

* High availability - Spread MongoDB nodes across clusters to avoid single points of failure. If one cluster goes down, others remain operational.
*  Staging vs Production Isolation - Run isolated environments with shared data topology. Test changes safely without impacting production.
*  Cluster migration - Move workloads between clusters or cloud providers with minimal downtime.
*  Disaster recovery - Replicate data across regions to survive outages. Even if an entire data center fails, your application stays online.
*  Geo-distributed applications - Serve users from the nearest region to reduce latency and improve experience.
*  Compliance isolation - Keep data within specific jurisdictions to meet regulatory requirements.

## Next steps

[Plan your deployment](replication-plan-deployment.md){.md-button}
