# Percona Operator for MongoDB API Documentation

Percona Operator for MongoDB provides an [aggregation-layer extension for the Kubernetes API  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/apiserver-aggregation/). Please refer to the
[official Kubernetes API documentation  :octicons-link-external-16:](https://kubernetes.io/docs/reference/) on the API access and usage details.
The following subsections describe the Percona XtraDB Cluster API provided by the Operator.

## Prerequisites


1. Create the namespace name you will use, if not exist:

    ``` {.bash data-prompt="$" }
    $ kubectl create namespace my-namespace-name
    ```

    Trying to create an already-existing namespace will show you a
    self-explanatory error message. Also, you can use the `default` namespace.

    !!! note

        In this document `default` namespace is used in all examples.
        Substitute `default` with your namespace name if you use a different
        one.

2. Prepare:

    ```bash
    # set correct API address
    KUBE_CLUSTER=$(kubectl config view --minify -o jsonpath='{.clusters[0].name}')
    API_SERVER=$(kubectl config view -o jsonpath="{.clusters[?(@.name==\"$KUBE_CLUSTER\")].cluster.server}" | sed -e 's#https://##')

    # create service account and get token
    kubectl apply --server-side -f deploy/crd.yaml -f deploy/rbac.yaml -n default
    KUBE_TOKEN=$(kubectl get secret $(kubectl get serviceaccount percona-server-mongodb-operator -o jsonpath='{.secrets[0].name}' -n default) -o jsonpath='{.data.token}' -n default | base64 --decode )
    ```

## Create new Percona Server for MongoDB cluster

**Description:**

```text
The command to create a new Percona Server for MongoDB cluster
```

**Kubectl Command:**

``` {.bash data-prompt="$" }
$ kubectl apply -f percona-server-mongodb-operator/deploy/cr.yaml
```

**URL:**

```text
https://$API_SERVER/apis/psmdb.percona.com/v{{ apiversion }}/namespaces/default/perconaservermongodbs
```

**Authentication:**

```text
Authorization: Bearer $KUBE_TOKEN
```

**cURL Request:**

``` {.bash data-prompt="$" }
$ curl -k -v -XPOST "https://$API_SERVER/apis/psmdb.percona.com/v{{ apiversion }}/namespaces/default/perconaservermongodbs" \
            -H "Content-Type: application/json" \
            -H "Accept: application/json" \
            -H "Authorization: Bearer $KUBE_TOKEN" \
            -d "@cluster.json"
```

**Request Body (cluster.json):**

??? example

    --8<-- "cli/api-create-cluster-request-json.md"

**Inputs:**

> **Metadata**:


> 1. Name (String, min-length: 1) : `contains name of cluster`

> **Spec**:


> 1. secrets[users] (String, min-length: 1) : `contains name of secret for the users`


> 2. allowUnsafeConfigurations (Boolean, Default: false) : `allow unsafe configurations to run`


> 3. image (String, min-length: 1) : `name of the Percona Server for MongoDB cluster image`

> replsets:


> 1. name (String, min-length: 1) : `name of monogo replicaset`


> 2. size (Integer, min-value: 1) : `contains size of MongoDB replicaset`


> 3. expose[exposeType] (Integer, min-value: 1) : `type of service to expose replicaset`


> 4. arbiter (Object) : `configuration for mongo arbiter`

> mongod:


> 1. net:


>     1. port (Integer, min-value: 0) : `contains mongod container port`


>     2. hostPort (Integer, min-value: 0) : `host port to expose mongod on`


> 2. security:


>     1. enableEncryption (Boolean, Default: true) : `enable encrypting mongod storage`


>     2. encryptionKeySecret (String, min-length: 1) : `name of encryption key secret`


>     3. encryptionCipherMode (String, min-length: 1) : `type of encryption cipher to use`


> 3. setParameter (Object): `configure mongod engineer parameters`


> 4. storage:


>     1. engine (String, min-length: 1, default “wiredTiger”): `name of mongod storage engine`


>     2. inMemory (Object) : `wiredTiger engine configuration`


>     3. wiredTiger (Object) : `wiredTiger engine configuration`

> pmm:


> 1. serverHost (String, min-length: 1) : `service name for monitoring`


> 2. image (String, min-length: 1) : `name of pmm image`

> backup:


> 1. image (String, min-length: 1) : `name of MngoDB backup docker image`


> 2. serviceAccountName (String, min-length: 1) `name of service account to use for backup`


> 3. storages (Object) : `storage configuration object for backup`

**Response:**

??? example

    --8<-- "cli/api-create-cluster-response-json.md"

## List Percona Server for MongoDB clusters

**Description:**

```text
Lists all Percona Server for MongoDB clusters that exist in your kubernetes cluster
```

**Kubectl Command:**

``` {.bash data-prompt="$" }
$ kubectl get psmdb
```

**URL:**

```text
https://$API_SERVER/apis/psmdb.percona.com/v1/namespaces/default/perconaservermongodbs?limit=500
```

**Authentication:**

```text
Authorization: Bearer $KUBE_TOKEN
```

**cURL Request:**

``` {.bash data-prompt="$" }
$ curl -k -v -XGET "https://$API_SERVER/apis/psmdb.percona.com/v1/namespaces/default/perconaservermongodbs?limit=500" \
            -H "Accept: application/json;as=Table;v=v1;g=meta.k8s.io,application/json;as=Table;v=v1beta1;g=meta.k8s.io,application/json" \
            -H "Authorization: Bearer $KUBE_TOKEN"
```

**Request Body:**

```text
None
```

**Response:**

??? example

    --8<-- "cli/api-list-cluster-response-json.md"

## Get status of Percona Server for MongoDB cluster

**Description:**

```text
Gets all information about specified Percona Server for MongoDB cluster
```

**Kubectl Command:**

``` {.bash data-prompt="$" }
$ kubectl get psmdb/my-cluster-name -o json
```

**URL:**

```text
https://$API_SERVER/apis/psmdb.percona.com/v1/namespaces/default/perconaservermongodbs/my-cluster-name
```

**Authentication:**

```text
Authorization: Bearer $KUBE_TOKEN
```

**cURL Request:**

``` {.bash data-prompt="$" }
$ curl -k -v -XGET "https://$API_SERVER/apis/psmdb.percona.com/v1/namespaces/default/perconaservermongodbs/my-cluster-name" \
            -H "Accept: application/json" \
            -H "Authorization: Bearer $KUBE_TOKEN"
```

**Request Body:**

```text
None
```

**Response:**

??? example

    --8<-- "cli/api-get-status-of-cluster-response-json.md"

## Scale up/down Percona Server for MongoDB cluster

**Description:**

```text
Increase or decrease the size of the Percona Server for MongoDB cluster nodes to fit the current high availability needs
```

**Kubectl Command:**

``` {.bash data-prompt="$" }
$ kubectl patch psmdb my-cluster-name --type=merge --patch '{
"spec": {"replsets":{ "size": "5" }
}}'
```

**URL:**

```text
https://$API_SERVER/apis/psmdb.percona.com/v1/namespaces/default/perconaservermongodbs/my-cluster-name
```

**Authentication:**

```text
Authorization: Bearer $KUBE_TOKEN
```

**cURL Request:**

``` {.bash data-prompt="$" }
$ curl -k -v -XPATCH "https://$API_SERVER/apis/psmdb.percona.com/v1/namespaces/default/perconaservermongodbs/my-cluster-name" \
            -H "Authorization: Bearer $KUBE_TOKEN" \
            -H "Content-Type: application/merge-patch+json"
            -H "Accept: application/json" \
            -d '{
                  "spec": {"replsets":{ "size": "5" }
                  }}'
```

**Request Body:**

??? example

    --8<-- "cli/api-scale-cluster-request-json.md"

**Input:**

> **spec**:

> replsets


> 1. size (Int or String, Defaults: 3): `Specify the sie of the replsets cluster to scale up or down to`

**Response:**

??? example

    --8<-- "cli/api-scale-cluster-response-json.md"

## Update Percona Server for MongoDB cluster image

**Description:**

```text
Change the image of Percona Server for MongoDB containers inside the cluster
```

**Kubectl Command:**

``` {.bash data-prompt="$" }
$ kubectl patch psmdb my-cluster-name --type=merge --patch '{
"spec": {"psmdb":{ "image": "percona/percona-server-mongodb-operator:1.4.0-mongod4.2" }
}}'
```

**URL:**

```text
https://$API_SERVER/apis/psmdb.percona.com/v1/namespaces/default/perconaservermongodbs/my-cluster-name
```

**Authentication:**

```text
Authorization: Bearer $KUBE_TOKEN
```

**cURL Request:**

``` {.bash data-prompt="$" }
$ curl -k -v -XPATCH "https://$API_SERVER/apis/psmdb.percona.com/v1/namespaces/default/perconaservermongodbs/my-cluster-name" \
            -H "Authorization: Bearer $KUBE_TOKEN" \
            -H "Accept: application/json" \
            -H "Content-Type: application/merge-patch+json"
            -d '{
              "spec": {"psmdb":{ "image": "percona/percona-server-mongodb-operator:1.4.0-mongod4.2" }
              }}'
```

**Request Body:**

??? example

    --8<-- "cli/api-update-cluster-image-request-json.md"

**Input:**

> **spec**:

> psmdb:


> 1. image (String, min-length: 1) : `name of the image to update for Percona Server for MongoDB`

**Response:**

??? example

    --8<-- "cli/api-update-cluster-image-response-json.md"

## Backup Percona Server for MongoDB cluster

**Description:**

```text
Takes a backup of the Percona Server for MongoDB cluster containers data to be able to recover from disasters or make a roll-back later
```

**Kubectl Command:**

``` {.bash data-prompt="$" }
$ kubectl apply -f percona-server-mongodb-operator/deploy/backup/backup.yaml
```

**URL:**

```text
https://$API_SERVER/apis/psmdb.percona.com/v1/namespaces/default/perconaservermongodbbackups
```

**Authentication:**

```text
Authorization: Bearer $KUBE_TOKEN
```

**cURL Request:**

``` {.bash data-prompt="$" }
$ curl -k -v -XPOST "https://$API_SERVER/apis/psmdb.percona.com/v1/namespaces/default/perconaservermongodbbackups" \
            -H "Accept: application/json" \
            -H "Content-Type: application/json" \
            -d "@backup.json" -H "Authorization: Bearer $KUBE_TOKEN"
```

**Request Body (backup.json):**

??? example

    --8<-- "cli/api-backup-cluster-request-json.md"

**Input:**


1. **metadata**:

> name(String, min-length:1) : `name of backup to create`


2. **spec**:

> 
>     1. psmdbCluster(String, min-length:1) : `name of Percona Server for MongoDB cluster`


>     2. storageName(String, min-length:1) : `name of storage claim to use`

**Response:**

??? example

    --8<-- "cli/api-backup-cluster-response-json.md"

## Restore Percona Server for MongoDB cluster

**Description:**

```text
Restores Percona Server for MongoDB cluster data to an earlier version to recover from a problem or to make a roll-back
```

**Kubectl Command:**

``` {.bash data-prompt="$" }
$ kubectl apply -f percona-server-mongodb-operator/deploy/backup/restore.yaml
```

**URL:**

```text
https://$API_SERVER/apis/psmdb.percona.com/v1/namespaces/default/perconaservermongodbrestores
```

**Authentication:**

```text
Authorization: Bearer $KUBE_TOKEN
```

**cURL Request:**

``` {.bash data-prompt="$" }
$ curl -k -v -XPOST "https://$API_SERVER/apis/psmdb.percona.com/v1/namespaces/default/perconaservermongodbrestores" \
            -H "Accept: application/json" \
            -H "Content-Type: application/json" \
            -d "@restore.json" \
            -H "Authorization: Bearer $KUBE_TOKEN"
```

**Request Body (restore.json):**

??? example

    --8<-- "cli/api-restore-cluster-request-json.md"

**Input:**


1. **metadata**:

> name(String, min-length:1): `name of restore to create`


2. **spec**:

> 
>     1. clusterName(String, min-length:1) : `name of Percona Server for MongoDB cluster`


>     2. backupName(String, min-length:1) : `name of backup to restore from`

**Response:**

??? example

    --8<-- "cli/api-restore-cluster-response-json.md"
