# Delete Percona Operator for MongoDB

You may have different reasons to clean up your Kubernetes environment: moving from trial deployment to a production one, testing experimental configurations and the like. In either case, you need to remove some (or all) of these objects:

* Percona Distribution for MongoDB cluster managed by the Operator
* Percona Operator for MongoDB itself
* Custom Resource Definition deployed with the Operator
* Resources like PVCs and Secrets

## Delete the database cluster

To delete the database cluster means to delete the Custom Resource associated with it.

!!! note

    There are two [finalizers  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/#finalizers) defined in the Custom Resource, which are related to cluster deletion:

    * `percona.com/delete-psmdb-pods-in-order`: if present, ensures the proper Pods deletion order at cluster deletion (on by default).
    * `percona.com/delete-psmdb-pvc`: if present, [Persistent Volume Claims  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) for the database cluster Pods are deleted along with the cluster deletion.

    Second one is off by default in the `deploy/cr.yaml` configuration file, allowing you to recreate the cluster without losing data. Also, you can [delete TLS-related objects and PVCs manually](#clean-up-resources), if needed. 

The steps are the following:
{.power-number}

1. List the Custom Resources. Replace the `<namespace>` placeholder with your value

    ```{.bash data-prompt="$"}
    $ kubectl get psmdb -n <namespace>
    ```

2. Delete the Custom Resource with the name of your cluster

    ```{.bash data-prompt="$"}
    $ kubectl delete psmdb <cluster_name> -n <namespace>
    ```

    It may take a while to stop and delete the cluster. 

    ??? example "Sample output"

        ```{.text .no-copy}
        perconaservermongodb.psmdb.percona.com "my-cluster-name" deleted
        ```

3. Check that the cluster is deleted by listing the Custom Resources again:

    ```{.bash data-prompt="$"}
    $ kubectl get psmdb -n <namespace>
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        No resources found in <namespace> namespace.
        ```

## Delete the Operator

Choose the instructions relevant to the way you installed the Operator.

### Use kubectl

To uninstall the Operator, delete the [Deployments  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) related to it.
{.power-number}

1. List the deployments. Replace the `<namespace>` placeholder with your namespace.

    ```{.bash data-prompt="$"}
    $ kubectl get deploy -n <namespace>
    ```

2. Delete the `percona-*` deployment

    ```{.bash data-prompt="$"}
    $ kubectl delete deploy percona-server-mongodb-operator -n <namespace>
    ```

3. Check that the Operator is deleted by listing the Pods. As a result you should have no Pods related to it.

    ```{.bash data-prompt="$"}
    $ kubectl get pods -n <namespace>
    ```
    
    ??? example "Sample output"

        ```{.text .no-copy}
        No resources found in <namespace> namespace.
        ```

4. If you are not just deleting the Operator and MongoDB cluster from a specific namespace, but want to clean up your entire Kubernetes environment, you can also delete the [CustomRecourceDefinitions (CRDs)  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/#customresourcedefinitions).

    <i warning>:material-alert: Warning:</i> CRDs in Kubernetes are non-namespaced but are available to the whole environment. This means that you shouldn’t delete CRDs if you still have the Operator and database cluster in some namespace.

    Get the list of CRDs. 

    ```{.bash data-prompt="$"}
    $ kubectl get crd
    ```

5. Delete the `percona*.psmdb.percona.com` CRDs

    ```{.bash data-prompt="$"}
    $ kubectl delete crd perconaservermongodbbackups.psmdb.percona.com perconaservermongodbrestores.psmdb.percona.com perconaservermongodbs.psmdb.percona.com
    ``` 

    ??? example "Sample output"

        ```{.text .no-copy}
        customresourcedefinition.apiextensions.k8s.io "perconaservermongodbbackups.psmdb.percona.com" deleted
        customresourcedefinition.apiextensions.k8s.io "perconaservermongodbrestores.psmdb.percona.com" deleted
        customresourcedefinition.apiextensions.k8s.io "perconaservermongodbs.psmdb.percona.com" deleted
        ```

### Use Helm

To delete the Operator, do the following:
{.power-number}

1. List the Helm charts:

    ```{.bash data-prompt="$"}
    $ helm list -n <namespace>
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        cluster1    <namespace>         1           2023-10-31 10:18:10.763049 +0100 CET    deployed    psmdb-db-1.14.4         {{release}}
        my-op       <namespace>         1           2023-10-31 10:15:18.41444 +0100 CET     deployed    psmdb-operator-1.14.3   {{release}}
        ```

2. Delete the [release object  :octicons-link-external-16:](https://helm.sh/docs/intro/using_helm/#three-big-concepts) for Percona Server for MongoDB 

    ```{.bash data-prompt="$"}
    $ helm uninstall cluster1 --namespace <namespace>
    ```

3. Delete the [release object  :octicons-link-external-16:](https://helm.sh/docs/intro/using_helm/#three-big-concepts) for the Operator 

    ```{.bash data-prompt="$"}
    $ helm uninstall my-op --namespace <namespace>
    ```

## Clean up resources
 
By default, TLS-related objects and data volumes remain in Kubernetes environment after you delete the cluster to allow you to recreate it without losing the data. If you wish to delete them, do the following:
{.power-number}

1. Delete Persistent Volume Claims.

    1. List PVCs. Replace the `<namespace>` placeholder with your namespace:

        ```{.bash data-prompt="$"}
        $ kubectl get pvc -n <namespace>
        ```    

        ??? example "Sample output"    

            ```{.text .no-copy}
            NAME                                STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
            mongod-data-my-cluster-name-cfg-0   Bound    pvc-245641fe-b172-439b-8c9c-cba5ea4ccd80   3Gi        RWO            standard-rwo   10m
            mongod-data-my-cluster-name-cfg-1   Bound    pvc-4ff7c3c4-b91c-4938-a52e-591fd559f4a4   3Gi        RWO            standard-rwo   9m19s
            mongod-data-my-cluster-name-cfg-2   Bound    pvc-acbff4a3-784a-48e7-ad4b-8b00239982d3   3Gi        RWO            standard-rwo   8m36s
            mongod-data-my-cluster-name-rs0-0   Bound    pvc-0a56e9ab-e22b-47ce-95de-a55f2676456a   3Gi        RWO            standard-rwo   10m
            mongod-data-my-cluster-name-rs0-1   Bound    pvc-cd075679-a7f5-4182-a8ce-341db1fb12d3   3Gi        RWO            standard-rwo   9m19s
            mongod-data-my-cluster-name-rs0-2   Bound    pvc-9ff0d41d-c739-494d-a45c-576f3a1fb590   3Gi        RWO            standard-rwo   8m26s
            ```

    2. Delete PVCs related to your cluster. The following command deletes PVCs for the `my-cluster-name` cluster:

        ```{.bash data-prompt="$"}
        $ kubectl delete pvc mongod-data-my-cluster-name-cfg-0 mongod-data-my-cluster-name-cfg-1 mongod-data-my-cluster-name-cfg-2 mongod-data-my-cluster-name-rs0-0 mongod-data-my-cluster-name-rs0-1 mongod-data-my-cluster-name-rs0-2 -n <namespace>
        ```    

        ??? example "Sample output"       

            ```{.text .no-copy}
            persistentvolumeclaim "mongod-data-my-cluster-name-cfg-0" deleted persistentvolumeclaim "mongod-data-my-cluster-name-cfg-1" deleted
            persistentvolumeclaim "mongod-data-my-cluster-name-cfg-2" deleted
            persistentvolumeclaim "mongod-data-my-cluster-name-rs0-0" deleted
            persistentvolumeclaim "mongod-data-my-cluster-name-rs0-1" deleted
            persistentvolumeclaim "mongod-data-my-cluster-name-rs0-2" deleted
            ```    

2. Delete the Secrets

    1. List Secrets:

        ```{.bash data-prompt="$"}
        $ kubectl get secrets -n <namespace>
        ```    

    2. Delete the Secret:
        
        ```{.bash data-prompt="$"}
        $ kubectl delete secret <secret_name> -n <namespace>
        ```

