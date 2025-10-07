# Configure the Main site 

This guide shows you how to set up the Main Percona Server for MongoDB site for a multi-cluster deployment. The steps focus on Kubernetes with [multi-cluster Services enabled on Google Kubernetes Engine](replication-mcs-gke.md), but you can also use them for a standard Kubernetes environment.

{% include "assets/fragments/replication-before-you-start.txt" %}

## Initial preparation

When you manage multiple clusters, creating a separate kubeconfig file for each one helps you avoid accidentally running commands on the wrong cluster. This keeps your environments organized and reduces the risk of making changes in the wrong place.

1. Create a `kubeconfig` file and export it as an environment variable

    * For the `main` cluster:

       ```bash
       export KUBECONFIG=./main_config gcloud container clusters get-credentials main-cluster --zone us-central1-a
       ```

    * For the `replica` cluster:

       ```bash
       export KUBECONFIG=./replica_config gcloud container clusters get-credentials replica-cluster --zone us-central1-a
       ```

2. Set the context for the clusters from their respective kubeconfig files.

    * On the `main` cluster:

       ```{.bash data-prompt="$"}
       $ kubectl --kubeconfig main_config config set-context $(kubectl config current-context)
       ```

    * On the `replica` cluster:

       ```{.bash data-prompt="$"}
       $ kubectl --kubeconfig replica_config config set-context $(kubectl config current-context)
       ```

3. Grant your Google Cloud user permissions to manage clusters. To do this, create a ClusterRoleBinding binding of the `cluster-admin` ClusterRole to your account for each cluster. Specify different names for each cluster to avoid naming collision:

    * On the `main` cluster:

       ```{.bash data-prompt="$"}
       $ kubectl --kubeconfig main_config create clusterrolebinding cluster-admin-binding-main --clusterrole cluster-admin --user $(gcloud config get-value core/account)
       ```

    * On the `replica` cluster:

       ```{.bash data-prompt="$"}
       $ kubectl --kubeconfig replica_config create clusterrolebinding cluster-admin-binding-replica --clusterrole cluster-admin --user $(gcloud config get-value core/account)
       ```

4. Create the same namespace on both clusters and set the context to point to this namespace. The namespace must be the same because it is a part of the shared DNS used to identify and resolve services across clusters.

    Run this command on both clusters to create the `example` namespace. Use your own value:

    ```{.bash data-prompt="$"}
    $ kubectl create namespace example
    $ kubectl config set-context --current --namespace=example
    ```

## Install the Operator and Percona Server for MongoDB

1. Install the Operator deployment:

    ```{.bash data-prompt="$"}
    $ kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v{{ release }}/deploy/bundle.yaml -n <namespace>
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        customresourcedefinition.apiextensions.k8s.io/perconaservermongodbs.psmdb.percona.com serverside-applied
        customresourcedefinition.apiextensions.k8s.io/perconaservermongodbbackups.psmdb.percona.com serverside-applied
        customresourcedefinition.apiextensions.k8s.io/perconaservermongodbrestores.psmdb.percona.com serverside-applied
        role.rbac.authorization.k8s.io/percona-server-mongodb-operator serverside-applied
        serviceaccount/percona-server-mongodb-operator serverside-applied
        rolebinding.rbac.authorization.k8s.io/service-account-percona-server-mongodb-operator serverside-applied
        deployment.apps/percona-server-mongodb-operator serverside-applied
        ```
        
        As the result you will have the Operator Pod up and running.

2. Prepare Percona Server for MongoDB configuration on the main cluster to include the following:

    * Name your cluster to differentiate the main and replica one. For example, name it `main-cluster`.

    * Replica set, config server replica set and mongos Pods are exposed with the ClusterIP Service type. This type is required by the multi-cluster services as the nodes will communicate internally

    * Multi-cluster services are enabled. Learn more about [preparing the Operator for multi-services](replication-mcs.md#configure-the-operator-to-use-multi-cluster-services)
    
       The sample configuration looks like this:

       ```yaml title="cr-main.yaml"
       apiVersion: psmdb.percona.com/v1
       kind: PerconaServerMongoDB
       metadata:
         name: main-cluster
       updateStrategy: SmartUpdate
       multiCluster:
         enabled: true
         DNSSuffix: svc.clusterset.local
       upgradeOptions:
         versionServiceEndpoint: https://check.percona.com
         apply: disabled
         schedule: "0 2 * * *"
         setFCV: false
       secrets:
         users: my-cluster-name-secrets
         encryptionKey: my-cluster-name-mongodb-encryption-key
       ...
       replsets:
       - name: rs0
         size: 3
         expose:
           enabled: true
           type: ClusterIP
       ....
       sharding:
         enabled: true
         configsvrReplSet:
           size: 3
           expose:
             enabled: true
             type: ClusterIP
           volumeSpec:
             persistentVolumeClaim:
               resources:
                 requests:
                   storage: 3Gi

       mongos:
         size: 3
         expose:
           type: ClusterIP
       ```

3. Apply the configuration to deploy Percona Server for MongoDB:

    ```{.bash data-prompt="$"}
    $ kubectl apply -f cr-main.yaml
    ```

## Export the cluster secrets and certificates to be copied from Main to Replica

The _Main_ and _Replica_ sites must have the same same users
credentials and TLS certificates to be able to communicate with each other. To do this, export the Secrets from the `main` cluster and recreate them on the `replica` cluster. 

1. List the Secrets objects:

    ```{.bash data-prompt="$"}
    $ kubectl get secrets
    ```
   
   The Secrets you are interested in are the following:

   * `main-cluster-name-ssl` - SSL certificates for client connections,

   * `main-cluster-name-ssl-internal` - SSL certificates for replication,

   * `my-cluster-name-secrets` - user credentials,

   * `my-cluster-name-mongodb-encryption-key` - encryption key file.

2. Export each Secret to a file:

    ```{.bash data-prompt="$" }
    $ kubectl get secret my-cluster-name-secrets -o yaml > my-cluster-secrets.yml
    $ kubectl get secret main-cluster-ssl  -o yaml > main-cluster-ssl.yml
    $ kubectl get secret main-cluster-ssl-internal -o yaml > main-cluster-ssl-internal.yml
    $ kubectl get secret my-cluster-name-mongodb-encryption-key -o yaml > my-cluster-name-mongodb-encryption-key.yml
    ```

3. Remove the `annotations`, `creationTimestamp`, `resourceVersion`,
`selfLink`, and `uid` metadata fields from the resulting file to make it
ready for the `replica` site.

    Use the following scripts:

    ```{.bash data-prompt="$" }
    $ yq eval 'del(.metadata.ownerReferences, .metadata.annotations, .metadata.creationTimestamp, .metadata.resourceVersion, .metadata.selfLink, .metadata.uid)' my-cluster-secrets.yml > my-cluster-secrets-replica.yaml
    sed -i '' 's/main-cluster/replica-cluster/g' my-cluster-secrets-replica.yaml

    $ yq eval 'del(.metadata.ownerReferences, .metadata.annotations, .metadata.creationTimestamp, .metadata.resourceVersion, .metadata.selfLink, .metadata.uid)' main-cluster-ssl.yml > replica-cluster-ssl.yml
    sed -i '' 's/main-cluster/replica-cluster/g' replica-cluster-ssl.yml

    $ yq eval 'del(.metadata.ownerReferences, .metadata.annotations, .metadata.creationTimestamp, .metadata.resourceVersion, .metadata.selfLink, .metadata.uid)' main-cluster-ssl-internal.yml > replica-cluster-ssl-internal.yml
    sed -i '' 's/main-cluster/replica-cluster/g' replica-cluster-ssl-internal.yml

    
    $ yq eval 'del(.metadata.ownerReferences, .metadata.annotations, .metadata.creationTimestamp, .metadata.resourceVersion, .metadata.selfLink, .metadata.uid)' my-cluster-name-mongodb-encryption-key.yml > my-cluster-name-mongodb-encryption-key2.yml
    sed -i '' 's/main-cluster/replica-cluster/g' my-cluster-name-mongodb-encryption-key2.yml
    ```

    The commands do the following for each file:

    * Remove metadata fields that are unique to the original cluster (like annotations, timestamps, and IDs) from the Secret YAML file, making it suitable for use in the replica cluster

    * Update the Secret file by replacing all instances of "main-cluster" with "replica-cluster", so the secret matches the replica cluster's naming.

    You will need to further apply these secrets on Replica.

## Next steps

[Configure Replica site](replication-replica.md){.md-button}