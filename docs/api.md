# Manage clusters with the Kubernetes API

Percona Operator for MongoDB extends the [Kubernetes API :octicons-link-external-16:](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) with Custom Resources (CRs). You manage database clusters the same way you manage other Kubernetes objects:

* with `kubectl`
* with Kubernetes client libraries in your programming language
* with HTTPS requests to the Kubernetes API server. For example, with `curl`.

This page shows common `kubectl` and `curl` examples for these Custom Resources:

| Kind | Short name | Purpose |
| --- | --- | --- |
| `PerconaServerMongoDB` | `psmdb` | Database cluster definition and desired state |
| `PerconaServerMongoDBBackup` | `psmdb-backup` | On-demand backup request and backup status |
| `PerconaServerMongoDBRestore` | `psmdb-restore` | Restore request and restore status |

For every field and option, see:

* [Custom Resource options](operator.md)
* [Backup Resource options](backup-resource-options.md)
* [Restore options](restore-options.md)
* [Custom resource statuses](cr-statuses.md)

For general Kubernetes API access and authentication, see the [official Kubernetes API documentation :octicons-link-external-16:](https://kubernetes.io/docs/reference/).

## Prerequisites

1. Deploy the Operator and install the CRDs in your cluster. See [Install on Kubernetes](kubectl.md).

2. Create a namespace (or use an existing one) and export it:

    ```bash
    export NAMESPACE=my-namespace-name
    kubectl create namespace $NAMESPACE
    ```

3. Set the API server address:

    ```bash
    # set correct API address
    KUBE_CLUSTER=$(kubectl config view --minify -o jsonpath='{.clusters[0].name}')
    API_SERVER=$(kubectl config view -o jsonpath="{.clusters[?(@.name==\"$KUBE_CLUSTER\")].cluster.server}" | sed -e 's#https://##')
    ```

4. Get the token:
   
    ```bash
    export KUBE_TOKEN=$(kubectl create token percona-server-mongodb-operator -n $NAMESPACE)

    ```

    The `curl` examples below use `https://$API_SERVER` and `Authorization: Bearer $KUBE_TOKEN`. In production, use a dedicated ServiceAccount with the RBAC you need.

!!! warning

    The `-k` flag in the `curl` examples skips TLS certificate verification. Prefer proper trust configuration for production use.

## Cluster lifecycle

### Create a cluster

Create a `PerconaServerMongoDB` object. The usual path is to maintain `deploy/cr.yaml` and apply it. The same object can be posted as JSON to the API.

=== "kubectl"

    ```bash
    kubectl apply -f deploy/cr.yaml -n $NAMESPACE
    ```

=== "curl"

    ```bash
    curl -k -XPOST \
      "https://$API_SERVER/apis/psmdb.percona.com/v{{ apiversion }}/namespaces/$NAMESPACE/perconaservermongodbs" \
      -H "Authorization: Bearer $KUBE_TOKEN" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -d @cluster.json
    ```

    Minimal `cluster.json` shape (expand with the options you need from [Custom Resource options](operator.md)). Update the `"namespace"` field with your value:

    ```json
    {
      "apiVersion": "psmdb.percona.com/v{{ apiversion }}",
      "kind": "PerconaServerMongoDB",
      "metadata": {
        "name": "my-cluster-name",
        "namespace": "my-namespace-name"
      },
      "spec": {
        "image": "percona/percona-server-mongodb:{{ mongodb80recommended }}",
        "replsets": [
          {
            "name": "rs0",
            "size": 3,
            "volumeSpec": {
              "persistentVolumeClaim": {
                "resources": {
                  "requests": {
                    "storage": "3Gi"
                  }
                }
              }
            }
          }
        ],
        "sharding": {
          "enabled": true,
          "configsvrReplSet": {
            "size": 3,
            "volumeSpec": {
              "persistentVolumeClaim": {
                "resources": {
                  "requests": {
                    "storage": "3Gi"
                  }
                }
              }
            }
          },
          "mongos": {
            "size": 3
          }
        },
        "backup": {
          "enabled": true,
          "image": "percona/percona-backup-mongodb:{{ pbmrecommended }}"
        }
      }
    }
    ```

### List clusters

=== "kubectl"

    ```bash
    kubectl get psmdb -n $NAMESPACE
    ```

=== "curl"

    ```bash
    curl -k -XGET \
      "https://$API_SERVER/apis/psmdb.percona.com/v{{ apiversion }}/namespaces/$NAMESPACE/perconaservermongodbs?limit=100" \
      -H "Authorization: Bearer $KUBE_TOKEN" \
      -H "Accept: application/json"
    ```

    Kubernetes list responses can include a `metadata.continue` token when more results remain. Pass it on the next request:

    ```bash
    curl -k -XGET \
      "https://$API_SERVER/apis/psmdb.percona.com/v{{ apiversion }}/namespaces/$NAMESPACE/perconaservermongodbs?limit=100&continue=$CONTINUE_TOKEN" \
      -H "Authorization: Bearer $KUBE_TOKEN" \
      -H "Accept: application/json"
    ```

    See [Kubernetes paginated lists :octicons-link-external-16:](https://kubernetes.io/docs/reference/using-api/api-concepts/#retrieving-large-results-sets-in-chunks) for details.


### Get cluster details and status

=== "kubectl"

    ```bash
    kubectl get psmdb my-cluster-name -n $NAMESPACE -o json
    kubectl get psmdb my-cluster-name -n $NAMESPACE -o jsonpath='{.status.state}{"\n"}{.status.host}{"\n"}'
    ```

=== "curl"

    ```bash
    curl -k -XGET \
      "https://$API_SERVER/apis/psmdb.percona.com/v{{ apiversion }}/namespaces/$NAMESPACE/perconaservermongodbs/my-cluster-name" \
      -H "Authorization: Bearer $KUBE_TOKEN" \
      -H "Accept: application/json"
    ```

Useful fields in the response:

* `status.state` — overall state (`initializing`, `ready`, `error`, `paused`, and others)
* `status.host` — connection endpoint hostname
* `status.ready` / `status.size` — ready Pods versus desired size
* `status.replsets` — per replica set status

Full state values and conditions are documented in [Custom resource statuses](cr-statuses.md).

### Scale a replica set

Prefer a JSON Patch that changes only `size`, so you do not overwrite the rest of the replica set spec.

=== "kubectl"

    ```bash
    kubectl patch psmdb my-cluster-name -n $NAMESPACE --type=json -p='[
      {"op": "replace", "path": "/spec/replsets/0/size", "value": 5}
    ]'
    ```

=== "curl"

    ```bash
    curl -k -XPATCH \
      "https://$API_SERVER/apis/psmdb.percona.com/v{{ apiversion }}/namespaces/$NAMESPACE/perconaservermongodbs/my-cluster-name" \
      -H "Authorization: Bearer $KUBE_TOKEN" \
      -H "Content-Type: application/json-patch+json" \
      -H "Accept: application/json" \
      -d '[
        {"op": "replace", "path": "/spec/replsets/0/size", "value": 5}
      ]'
    ```

Replace `/spec/replsets/0` with the index of the replica set you want to change.

#### Scale to zero 

Setting `replsets[].size` to `0` scales that replica set down. It does **not** delete the `PerconaServerMongoDB` object, and data on Persistent Volume Claims remains unless you delete those volumes separately.

To use a size below the Operator’s safe defaults (including `0`), enable the corresponding unsafe flag, for example `spec.unsafeFlags.replsetSize: true`. See [unsafeFlags](operator.md#operator-unsafeflags-section).

To remove the cluster itself, [delete the Custom Resource](#delete-a-cluster).

### Add a replica set

The following command adds a new shard (deployed as the replica set) to the sharded cluster. This command is available only for sharded clusters. To expand the replica set deployment, see [Scale a replica set](#scale-a-replica-set).

=== "kubectl"

    ```bash
    kubectl patch psmdb my-cluster-name -n $NAMESPACE --type=json -p='[
      {
        "op": "add",
        "path": "/spec/replsets/-",
        "value": {
          "name": "rs1",
          "size": 3,
          "volumeSpec": {
            "persistentVolumeClaim": {
              "resources": {
                "requests": {
                  "storage": "3Gi"
                }
              }
            }
          }
        }
      }
    ]'
    ```

=== "curl"

    ```bash
    curl -k -XPATCH \
      "https://$API_SERVER/apis/psmdb.percona.com/v{{ apiversion }}/namespaces/$NAMESPACE/perconaservermongodbs/my-cluster-name" \
      -H "Authorization: Bearer $KUBE_TOKEN" \
      -H "Content-Type: application/json-patch+json" \
      -H "Accept: application/json" \
      -d '[
        {
          "op": "add",
          "path": "/spec/replsets/-",
          "value": {
            "name": "rs1",
            "size": 3,
            "volumeSpec": {
              "persistentVolumeClaim": {
                "resources": {
                  "requests": {
                    "storage": "3Gi"
                  }
                }
              }
            }
          }
        }
      ]'
    ```

### Remove a replica set

To remove a shard (deployed as a replica set) from a sharded cluster, you must first drain the shard of all data. Follow this process:

1. **Drain the shard:** Use [MongoDB's drain procedure](https://www.mongodb.com/docs/manual/tutorial/remove-shards-from-cluster/) to remove all data and move chunks from the shard you want to remove. Wait until MongoDB reports that the shard is fully drained and safe for removal.

2. **Remove the shard from the cluster:** After the shard is fully drained, remove the replica set from the cluster specification.

Remove by array index (check the current order with `kubectl get psmdb my-cluster-name -o json` first):

=== "kubectl"

    ```bash
    kubectl patch psmdb my-cluster-name -n $NAMESPACE --type=json -p='[
      {"op": "remove", "path": "/spec/replsets/1"}
    ]'
    ```

=== "curl"

    ```bash
    curl -k -XPATCH \
      "https://$API_SERVER/apis/psmdb.percona.com/v{{ apiversion }}/namespaces/$NAMESPACE/perconaservermongodbs/my-cluster-name" \
      -H "Authorization: Bearer $KUBE_TOKEN" \
      -H "Content-Type: application/json-patch+json" \
      -H "Accept: application/json" \
      -d '[
        {"op": "remove", "path": "/spec/replsets/1"}
      ]'
    ```

### Update the MongoDB image

=== "kubectl"

    ```bash
    kubectl patch psmdb my-cluster-name -n $NAMESPACE --type=json -p='[
      {"op": "replace", "path": "/spec/image", "value": "percona/percona-server-mongodb:{{ mongodb80recommended }}"}
    ]'
    ```

=== "curl"

    ```bash
    curl -k -XPATCH \
      "https://$API_SERVER/apis/psmdb.percona.com/v{{ apiversion }}/namespaces/$NAMESPACE/perconaservermongodbs/my-cluster-name" \
      -H "Authorization: Bearer $KUBE_TOKEN" \
      -H "Content-Type: application/json-patch+json" \
      -H "Accept: application/json" \
      -d '[
        {"op": "replace", "path": "/spec/image", "value": "percona/percona-server-mongodb:{{ mongodb80recommended }}"}
      ]'
    ```

### Delete a cluster

Deleting the `PerconaServerMongoDB` Custom Resource deletes the cluster. Finalizers control whether PVCs and related objects are removed. By default, PVCs are kept so you can recreate the cluster without losing data. See [Delete the database cluster](delete.md#delete-the-database-cluster).

=== "kubectl"

    ```bash
    kubectl delete psmdb my-cluster-name -n $NAMESPACE
    ```

=== "curl"

    ```bash
    curl -k -XDELETE \
      "https://$API_SERVER/apis/psmdb.percona.com/v{{ apiversion }}/namespaces/$NAMESPACE/perconaservermongodbs/my-cluster-name" \
      -H "Authorization: Bearer $KUBE_TOKEN" \
      -H "Accept: application/json"
    ```

### Connection details

Starting with Operator version 1.23.0, the Operator creates a Kubernetes Secret with ready-to-use MongoDB connection strings. For the default `databaseAdmin` user, the Secret is named `<cluster-name>-databaseadmin-conn-str`.

Example for a sharded cluster:

=== "kubectl"

    ```bash
    kubectl get secret my-cluster-name-databaseadmin-conn-str -n $NAMESPACE \
      -o jsonpath='{.data.databaseAdmin_mongos_connectionString}' | base64 --decode && echo
    ```

=== "curl"

    ```bash
    curl -k -XGET \
      "https://$API_SERVER/api/v1/namespaces/$NAMESPACE/secrets/my-cluster-name-databaseadmin-conn-str" \
      -H "Authorization: Bearer $KUBE_TOKEN" \
      -H "Accept: application/json" \
      | grep '"databaseAdmin_mongos_connectionString"' \
      | awk -F '"' '{print $4}' \
      | base64 --decode && echo
    ```

For a non-sharded replica set, use the `databaseAdmin_rs0_connectionStringSrv` key instead. See [Connection secrets](connection-secrets.md) for all available keys.

## Backup lifecycle

Backup storage, schedules, and retention live on the cluster Custom Resource under `spec.backup`. On-demand backups are separate `PerconaServerMongoDBBackup` objects. See [Backup and restore](backups.md).

To manage backups, you must configure the backup storage. See [Configure storage for backups](backups-storage.md) for details.

### Configure backup settings and retention

Patch `spec.backup` on the cluster. Example: enable backups, set a schedule, and keep the last 3 successful backups:

```bash
kubectl patch psmdb my-cluster-name -n $NAMESPACE --type=merge -p '{
  "spec": {
    "backup": {
      "enabled": true,
      "storages": {
        "s3-us-west": {
          "type": "s3",
          "s3": {
            "bucket": "my-bucket",
            "region": "us-west-2",
            "credentialsSecret": "my-cluster-name-backup-s3"
          }
        }
      },
      "tasks": [
        {
          "name": "daily-s3",
          "enabled": true,
          "schedule": "0 0 * * *",
          "storageName": "s3-us-west",
          "retention": {
            "type": "count",
            "count": 3,
            "deleteFromStorage": true
          }
        }
      ]
    }
  }
}'
```

For every backup option, see [Custom Resource options](operator.md#operator-backup-section) and [Make scheduled backups](backups-scheduled.md).

!!! note

    A merge patch that replaces `storages` or `tasks` overwrites those objects/arrays. Prefer editing your maintained `deploy/cr.yaml` and applying it when you manage complex backup configuration.

### Create a backup

=== "kubectl"

    ```bash
    kubectl apply -f deploy/backup/backup.yaml -n $NAMESPACE
    ```

    Example Backup object:

    ```yaml
    apiVersion: psmdb.percona.com/v{{ apiversion }}
    kind: PerconaServerMongoDBBackup
    metadata:
      name: backup1
      finalizers:
        - percona.com/delete-backup
    spec:
      clusterName: my-cluster-name
      storageName: s3-us-west
      type: logical
    ```

=== "curl"

    ```bash
    curl -k -XPOST \
      "https://$API_SERVER/apis/psmdb.percona.com/v{{ apiversion }}/namespaces/$NAMESPACE/perconaservermongodbbackups" \
      -H "Authorization: Bearer $KUBE_TOKEN" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -d @backup.json
    ```

    `backup.json`:

    ```json
    {
      "apiVersion": "psmdb.percona.com/v{{ apiversion }}",
      "kind": "PerconaServerMongoDBBackup",
      "metadata": {
        "name": "backup1",
        "finalizers": [
          "percona.com/delete-backup"
        ]
      },
      "spec": {
        "clusterName": "my-cluster-name",
        "storageName": "s3-us-west",
        "type": "logical"
      }
    }
    ```

### List backups and check status

=== "kubectl"

    ```bash
    kubectl get psmdb-backup -n $NAMESPACE
    kubectl get psmdb-backup backup1 -n $NAMESPACE -o jsonpath='{.status.state}{"\n"}{.status.size}{"\n"}{.status.destination}{"\n"}'
    ```

=== "curl"

    ```bash
    curl -k -XGET \
      "https://$API_SERVER/apis/psmdb.percona.com/v{{ apiversion }}/namespaces/$NAMESPACE/perconaservermongodbbackups/backup1" \
      -H "Authorization: Bearer $KUBE_TOKEN" \
      -H "Accept: application/json"
    ```

Useful status fields: `status.state` (`waiting`, `running`, `ready`, `error`, …), `status.size`, `status.destination`, `status.type`, `status.completed`. See [Backup status](cr-statuses.md#perconaservermongodbbackup-status).

## Restore lifecycle

Restores are `PerconaServerMongoDBRestore` objects. You can restore onto the same cluster, onto a new cluster, run point-in-time recovery, or restore selected namespaces (databases/collections). Details and limitations:

* [Restore on the same cluster](backups-restore.md)
* [Restore to a new cluster](backups-restore-to-new-cluster.md)
* [Selective restore](backups-restore.md#selective-restore)

### Restore to the same cluster

=== "kubectl"

    ```bash
    kubectl apply -f deploy/backup/restore.yaml -n $NAMESPACE
    ```

    Example Restore object:

    ```yaml
    apiVersion: psmdb.percona.com/v{{ apiversion }}
    kind: PerconaServerMongoDBRestore
    metadata:
      name: restore1
    spec:
      clusterName: my-cluster-name
      backupName: backup1
    ```

=== "curl"

    ```bash
    curl -k -XPOST \
      "https://$API_SERVER/apis/psmdb.percona.com/v{{ apiversion }}/namespaces/$NAMESPACE/perconaservermongodbrestores" \
      -H "Authorization: Bearer $KUBE_TOKEN" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -d @restore.json
    ```

    `restore.json`:

    ```json
    {
      "apiVersion": "psmdb.percona.com/v{{ apiversion }}",
      "kind": "PerconaServerMongoDBRestore",
      "metadata": {
        "name": "restore1"
      },
      "spec": {
        "clusterName": "my-cluster-name",
        "backupName": "backup1"
      }
    }
    ```

### Restore to a new cluster

1. Create the target `PerconaServerMongoDB` cluster (create flow above).
2. Create a `PerconaServerMongoDBRestore` that points at that cluster and at the backup source (often via `spec.backupSource` when the backup object does not exist in the new environment).

See [Restore to a new cluster](backups-restore-to-new-cluster.md) for storage, Secrets, and `backupSource` examples.

### Selective (partial) restore

For a logical backup, you can restore specific databases or collections with `spec.selective`:

```yaml
apiVersion: psmdb.percona.com/v{{ apiversion }}
kind: PerconaServerMongoDBRestore
metadata:
  name: restore-selective
spec:
  clusterName: my-cluster-name
  backupName: backup1
  selective:
    withUsersAndRoles: true
    namespaces:
      - "db1.collection1"
      - "db2.*"
```

### Check restore status

=== "kubectl"

    ```bash
    kubectl get psmdb-restore -n $NAMESPACE
    kubectl get psmdb-restore restore1 -n $NAMESPACE -o jsonpath='{.status.state}{"\n"}'
    ```

=== "curl"

    ```bash
    curl -k -XGET \
      "https://$API_SERVER/apis/psmdb.percona.com/v{{ apiversion }}/namespaces/$NAMESPACE/perconaservermongodbrestores/restore1" \
      -H "Authorization: Bearer $KUBE_TOKEN" \
      -H "Accept: application/json"
    ```

See [Restore status](cr-statuses.md#perconaservermongodbrestore-status).

