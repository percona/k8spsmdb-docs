# Update Percona Operator for MongoDB

You can upgrade Percona Operator for MongoDB to newer versions. The upgrade process consists of these steps:

* Upgrade the Operator  
* Upgrade the database (Percona Server for MongoDB).

## Update scenarios

You can either upgrade both the Operator and the database, or you can upgrade only the database. To decide which scenario to choose, read on.

### Full upgrade (CRD, Operator, and the database). 

When to use this scenario:

* The new Operator version has changes that are required for new features of the database to work
* The Operator has new features or fixes that enhance automation and management.
* Compatibility improvements between the Operator and the database require synchronized updates.

When going on with this scenario, make sure to test it in a staging or testing environment first. Upgrading the Operator may cause performance degradation. 

### Upgrade only the database

When to use this scenario:

* The new version of the database has new features or fixes that are not related to the Operator or other components of your infrastructure
* You have updated the Operator earlier and now want to proceed with the database update.

When choosing this scenario, consider the following:

* Check that the current Operator version supports the new database version.
* Some features may require an Operator upgrade later for full functionality.

## Update strategies

You can chose how you want to update your database cluster when you run an upgrade:

* *Smart Update* is the automated way to update the database cluster. The Operator controls how objects are updated. It restarts Pods in a specific order, with the primary instance updated last to avoid connection issues until the whole cluster is updated to the new settings.

   This update method applies during database upgrades and when making changes like updating a ConfigMap, rotating passwords, or changing resource values. It is the default and recommended way to update. 

* *Rolling Update* is initiated manually and [controlled by Kubernetes  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#update-strategies). The StatefulSet controller in Kubernetes deletes a Pod, updates it, waits till it reports the Ready status and proceeds to the next Pod. The order for Pod update is the same as for Pod termination. However, this order may not be optimal from the Percona Server for
    MongoDB point of view.

* *On Delete* strategy requires [a user to manually delete a Pod to make Kubernetes StatefulSet controller recreate it with the updated configuration :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#update-strategies).

To select an update strategy, set the `updateStrategy` key in the [Custom Resource](operator.md) manifest to one of the following:

* `SmartUpdate`
* `RollingUpdate`
* `OnDelete`

For a manual update of your database cluster using the `RollingUpdate` or `OnDelete` strategies, refer to [the low-level Kubernetes way of database upgrades](update_manually.md) guide.
 
## Update on OpenShift

If you run the Operator on [Red Hat Marketplace :octicons-link-external-16:](https://marketplace.redhat.com) or you run Red Hat certified Operators on [OpenShift :octicons-link-external-16:](https://www.redhat.com/en/technologies/cloud-computing/openshift), you need to do additional steps during the upgrade. See [Upgrade Percona Server for MongoDB on OpenShift](update_openshift.md) for details.
