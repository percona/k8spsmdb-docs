# Delete Percona Operator for MongoDB

To delete Percona Operator for MongoDB from Kubernetes environment means to delete the database Distribution cluster, then delete the [CustomRecourceDefinitions (CRDs))](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/#customresourcedefinitions) and the [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) related to the Operator. Afterwards you can clean up the resources such as [PersistentVolumeClaims (PVC)](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) and Secrets.

Choose the instructions relevant to the way you installed the Operator. 

=== "kubectl"

    To delete the Operator, do the following:
    {.power-number}

    1. Delete the Distribution cluster:

        ```{.bash data-prompt="$"}
        $ kubectl delete psmdb <cluster_name> -n <namespace>
        ```

        It may take a while to stop and delete the cluster. 

        ??? example "Sample output"

            ```{.text .no-copy}
            perconaservermongodb.psmdb.percona.com "my-cluster-name" deleted
            ```

    2. Delete the Operator

        ```{.bash data-prompt="$"}
        $ kubectl delete -f deploy/bundle.yaml -n pmo
        ```

        This deletes CRDs and the deployment of the Operator

        ??? example "Sample output"

            ```{.text .no-copy}
            customresourcedefinition.apiextensions.k8s.io "perconaservermongodbbackups.psmdb.percona.com" deleted
            customresourcedefinition.apiextensions.k8s.io "perconaservermongodbrestores.psmdb.percona.com" deleted
            customresourcedefinition.apiextensions.k8s.io "perconaservermongodbs.psmdb.percona.com" deleted
            role.rbac.authorization.k8s.io "percona-server-mongodb-operator" deleted
            serviceaccount "percona-server-mongodb-operator" deleted
            rolebinding.rbac.authorization.k8s.io "service-account-percona-server-mongodb-operator" deleted
            deployment.apps "percona-server-mongodb-operator" deleted
            ```

    3. Clean up the resources. Get the list of PVCs:

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

    4. Delete PVCs:    

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

    5. Get Secrets:    

        ```{.bash data-prompt="$"}
        $ kubectl get secrets -n <namespace>
        ```    

    6. Delete the Secret:
        
        ```{.bash data-prompt="$"}
        $ kubectl delete secret <secret_name> -n <namespace>
        ```

=== "Helm"

    To delete the Operator, do the following:
    {.power-number}

    1. Delete the deployed Percona Server for MongoDB cluster:

        ```{.bash data-prompt="$"}
        $ kubectl delete psmdb <cluster_name> --namespace <namespace>
        ```

    2. List the Helm charts:

        ```{.bash data-prompt="$"}
        $ helm list -n <namespace>
        ```

        ??? example "Sample output"

            ```{.text .no-copy}
            cluster1    <namespace>         1           2023-10-31 10:18:10.763049 +0100 CET    deployed    psmdb-db-1.14.4         {{release}}
            my-op       <namespace>         1           2023-10-31 10:15:18.41444 +0100 CET     deployed    psmdb-operator-1.14.3   {{release}}
            ```

    3. Delete the [release object](https://helm.sh/docs/intro/using_helm/#three-big-concepts) for Percona Server for MongoDB 

        ```{.bash data-prompt="$"}
        $ helm uninstall cluster1 --namespace <namespace>
        ```

    4. Delete the [release object](https://helm.sh/docs/intro/using_helm/#three-big-concepts) for the Operator 

        ```{.bash data-prompt="$"}
        $ helm uninstall my-op --namespace <namespace>
        ```
    
    4. Clean up the resources. Get the list of PVCs:

        ```{.bash data-prompt="$"}
        $ kubectl get pvc -n <namespace>
        ```    

        ??? example "Sample output"

            ```{.text .no-copy}
            mongod-data-cluster1-psmdb-db-cfg-0   Bound    pvc-bf769563-090f-4b44-a596-dcf6814f420f   3Gi        RWO            standard-rwo   4m13s
            mongod-data-cluster1-psmdb-db-cfg-1   Bound    pvc-b81bad29-680d-40a4-a8ee-067a3a33f71f   3Gi        RWO            standard-rwo   3m38s
            mongod-data-cluster1-psmdb-db-cfg-2   Bound    pvc-e9815354-ec45-4724-82b1-91f7c46e2760   3Gi        RWO            standard-rwo   2m59s
            mongod-data-cluster1-psmdb-db-rs0-0   Bound    pvc-2d2b2d83-b425-41a6-97eb-1002ac249a77   3Gi        RWO            standard-rwo   4m13s
            mongod-data-cluster1-psmdb-db-rs0-1   Bound    pvc-01526d26-a27e-4d38-966b-855425e51bad   3Gi        RWO            standard-rwo   3m31s
            mongod-data-cluster1-psmdb-db-rs0-2   Bound    pvc-2139f09c-da61-4da6-9e8a-aed73407f5bb   3Gi        RWO            standard-rwo   3m3s
            ```

    5. Get the list of labels associated with PVCs:

        ```{.bash data-prompt="$"}
        $ kubectl describe pvc <pvc_name> -n <namespace>
        ```

        ??? example "Sample output"

            ```{.text .no-copy}
            Name:          mongod-data-cluster1-psmdb-db-cfg-0
            Namespace:     <namespace>
            StorageClass:  standard-rwo
            Status:        Bound
            Volume:        pvc-fb5fc9ed-36fd-4805-b1b8-299bb0fd1cc8
            Labels:        app.kubernetes.io/component=cfg
                           app.kubernetes.io/instance=cluster1-psmdb-db
                           app.kubernetes.io/managed-by=percona-server-mongodb-operator
                           app.kubernetes.io/name=percona-server-mongodb
                           app.kubernetes.io/part-of=percona-server-mongodb
                           app.kubernetes.io/replset=cfg
            ```

    6. Delete PVCs. Replace the <label_name> placeholder with the label name. The `app.kubernetes.io/instance=cluster1-psmdb-db` from the previous example is associated with every PVC. 

        ```{.bash data-prompt="$"}
        $ delete pvc -l <label_name> -n <namespace>
        ```

        ??? example "Sample output"

            ```{.text .no-copy}
            persistentvolumeclaim "mongod-data-cluster1-psmdb-db-cfg-0" deleted
            persistentvolumeclaim "mongod-data-cluster1-psmdb-db-cfg-1" deleted
            persistentvolumeclaim "mongod-data-cluster1-psmdb-db-cfg-2" deleted
            persistentvolumeclaim "mongod-data-cluster1-psmdb-db-rs0-0" deleted
            persistentvolumeclaim "mongod-data-cluster1-psmdb-db-rs0-1" deleted
            persistentvolumeclaim "mongod-data-cluster1-psmdb-db-rs0-2" deleted
            ```
    
    5. Get Secrets:    

        ```{.bash data-prompt="$"}
        $ kubectl get secrets -n <namespace>
        ```    

    6. Delete the Secret:
        
        ```{.bash data-prompt="$"}
        $ kubectl delete secret <secret_name> -n <namespace>
        ```