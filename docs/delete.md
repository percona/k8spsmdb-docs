# Delete Percona Operator for MongoDB

To delete Percona Operator for MongoDB from Kubernetes environment means to delete the database Distribution cluster, then delete the [CustomRecourceDefinitions (CRDs))](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/#customresourcedefinitions) and the [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) related to the Operator. Afterwards you can clean up the resources such as [PersistentVolumeClaims (PVC)](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) and Secrets.

Here's the sequence of steps to do it:

1. Delete the Distribution cluster:

    ```{.bash data-prompt="$"}
    $ kubectl delete psmdb <cluster_name> -n <namespace>
    ```

    It may take a while to stop and delete the cluster. 

2. List the CRDs:

    ```{.bash data-prompt="$"}
    $ kubectl get crd 
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        allowlistedv2workloads.auto.gke.io                   2023-09-07T14:15:30Z
        allowlistedworkloads.auto.gke.io                     2023-09-07T14:15:29Z
        audits.warden.gke.io                                 2023-09-07T14:15:32Z
        backendconfigs.cloud.google.com                      2023-09-07T14:15:41Z
        capacityrequests.internal.autoscaling.gke.io         2023-09-07T14:15:25Z
        frontendconfigs.networking.gke.io                    2023-09-07T14:15:41Z
        managedcertificates.networking.gke.io                2023-09-07T14:15:41Z
        memberships.hub.gke.io                               2023-09-07T14:15:30Z
        perconaservermongodbbackups.psmdb.percona.com                    2023-09-07T14:28:59Z
        perconaservermongodbrestores.psmdb.percona.com                   2023-09-07T14:29:02Z
        perconaservermongodbs.psmdb.percona.com                   2023-09-07T14:29:03Z
        serviceattachments.networking.gke.io                 2023-09-07T14:15:44Z
        servicenetworkendpointgroups.networking.gke.io       2023-09-07T14:15:43Z
        storagestates.migration.k8s.io                       2023-09-07T14:15:53Z
        storageversionmigrations.migration.k8s.io            2023-09-07T14:15:53Z
        updateinfos.nodemanagement.gke.io                    2023-09-07T14:15:55Z
        volumesnapshotclasses.snapshot.storage.k8s.io        2023-09-07T14:15:52Z
        volumesnapshotcontents.snapshot.storage.k8s.io       2023-09-07T14:15:52Z
        volumesnapshots.snapshot.storage.k8s.io              2023-09-07T14:15:52Z
        ```

2. Delete the `percona*.psmdb.percona.com` CRDs

    ```{.bash data-prompt="$"}
    $ kubectl delete perconaservermongodbbackups.psmdb.percona.com perconaservermongodbrestores.psmdb.percona.com perconaservermongodbs.psmdb.percona.com
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        customresourcedefinition.apiextensions.k8s.io "perconaservermongodbbackups.psmdb.percona.com" deleted
        customresourcedefinition.apiextensions.k8s.io "perconaservermongodbrestores.psmdb.percona.com" deleted
        customresourcedefinition.apiextensions.k8s.io "perconaservermongodbs.psmdb.percona.com" deleted
        ```

3. List the deployments. Replace the `<namespace>` placeholder with your namespace.
    
    ```{.bash data-prompt="$"}
    $ kubectl get deploy -n <namespace>
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        NAME                              READY   UP-TO-DATE   AVAILABLE   AGE
        percona-server-mongodb-operator   1/1     1            1           17m
        ```

4. Delete the `percona-*` deployment

    ```{.bash data-prompt="$"}
    $ kubectl delete deploy percona-server-mongodb-operator -n <namespace>
    ```

5. Check that the Operator is deleted by listing the Pods. As a result you should have no Pods 

    ```{.bash data-prompt="$"}
    $ kubectl get pods -n <namespace>
    ``` 

    ??? example "Sample output"

        ```{.text .no-copy}
        No resources found in <namespace> namespace.
        ```

6. Clean up the resources. Get the list of PVCs:

    ```{.bash data-prompt="$"}
    $ kubectl get pvc -n <namespace>
    ```

    ??? example "Sample output"

    ```{.text .no-copy}
    mongod-data-my-cluster-name-cfg-0   Bound    pvc-0bb5febf-ca01-4a02-89f2-655916cfb52e   3Gi        RWO            standard       38m
    mongod-data-my-cluster-name-rs0-0   Bound    pvc-a094041a-969e-42a6-9327-a136778d1271   3Gi        RWO            standard       38m
    ```

7. Delete PVCs:

    ```{.bash data-prompt="$"}
    $ kubectl delete pvc mongod-data-my-cluster-name-cfg-0 mongod-data-my-cluster-name-rs0-0 -n <namespace>
    ```

8. Get Secrets:

    ```{.bash data-prompt="$"}
    $ kubectl get secrets -n <namespace>
    ```

9. Delete the Secret:
    
    ```{.bash data-prompt="$"}
    $ kubectl delete secret <secret_name> -n <namespace>
    ```
