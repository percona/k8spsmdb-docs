# Set up the primary site

## Before you start

Clone the repository with all manifests and source code. You'll need it to edit configuration files for the database clusters, Secrets, backups and restores. Run the following command:

```bash
git clone -b v{{ release }} https://github.com/percona/percona-server-mongodb-operator
```

Make sure to clone the correct branch. The branch name is the same as the Operator release version. 

## Install the Operator and Percona Server for MongoDB

1. Create a namespace and export it as an environment variable. Replace the `$PRIMARY_NAMESPACE` with your desired value.

    ```bash
    kubectl create namespace $PRIMARY_NAMESPACE
    export PRIMARY_NAMESPACE=$PRIMARY_NAMESPACE
	```

2. Use the [Quickstart guide](kubectl.md) to install the Operator and then deploy Percona Server for MongoDB. 

    You now have the `my-cluster-name` database cluster up and running.


## Export the database Secrets

While on the primary site, export the Secrets objects that store user credentials and certificates. Both the primary and the replica sites must have the same values. This enables the Operator to restore the backup from the primary on the replica site.

1. List the Secrets objects. 

    ```bash
    kubectl get secrets -n $PRIMARY_NAMESPACE
    ```

    ??? example "Expected output"

        ```{.text .no-copy}
        my-cluster-name-secrets              Opaque              6      5m43s
        my-cluster-name-ssl                  kubernetes.io/tls   3      5m42s
        my-cluster-name-ssl-internal         kubernetes.io/tls   3      5m40s
        my-cluster-name-mongodb-encryption-key   Opaque          1      5m41s
        ```

    The files we are interested in are `my-cluster-name-secrets`, `my-cluster-name-ssl`, `my-cluster-name-ssl-internal`, and `my-cluster-name-mongodb-encryption-key` (if you use data-at-rest encryption) where `my-cluster-name` is the name of your cluster.

2. Export the Secrets. You'll need them later to set up the replica site. The replica must have the same users and certificates as the primary site to replicate data from it. The following commands export each Secret to a file. Feel free to use your names and namespace:
    
    ```bash
    kubectl get secret my-cluster-name-secrets -n $PRIMARY_NAMESPACE -o yaml > psmdb-secrets.yaml
    kubectl get secret my-cluster-name-ssl -n $PRIMARY_NAMESPACE -o yaml > psmdb-ssl.yaml
    kubectl get secret my-cluster-name-ssl-internal -n $PRIMARY_NAMESPACE -o yaml > psmdb-ssl-internal.yaml
    kubectl get secret my-cluster-name-mongodb-encryption-key -n $PRIMARY_NAMESPACE -o yaml > psmdb-encryption-key.yaml
    ```

3. Edit each exported file: remove the `annotations`, `creationTimestamp`, `resourceVersion`, `selfLink`, and `uid` metadata fields.  


## Create a backup from the primary site

We will use this backup to deploy the replica site.

1. Configure the backup storage. Use the [Configure storage for backups tutorial](backups-storage.md) for the steps.

2. [Make an on-demand backup](backups-ondemand.md) on the primary site.
3. View the information about a backup:

    ```bash
    kubectl get psmdb-backup -n $PRIMARY_NAMESPACE
    ```

    ??? example "Expected output"

		```{.text .no-copy}
		NAME      CLUSTER           STORAGE      DESTINATION                               TYPE      SIZE       STATUS   COMPLETED   AGE
		backup1   my-cluster-name   s3-us-west   s3://mybucket/2025-03-18T10:55:43Z   logical   105.44MB   ready    3m25s       4m4s
		```