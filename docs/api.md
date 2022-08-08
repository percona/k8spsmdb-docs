# Percona Operator for MongoDB API Documentation

<style>

.toggle {
     background: none repeat scroll 0 0 #ffebcc;
     padding: 12px;
     max-width: 850px;
     line-height: 24px;
     margin-bottom: 24px;
 }

.toggle .header {
    display: block;
    clear: both;
    cursor: pointer;
}

.toggle .header:after {
    content: " ▶";
}

.toggle .header.open:after {
    content: " ▼";
}
</style>Percona Operator for MongoDB provides an [aggregation-layer extension for the Kubernetes API](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/apiserver-aggregation/). Please refer to the
[official Kubernetes API documentation](https://kubernetes.io/docs/reference/) on the API access and usage details.
The following subsections describe the Percona XtraDB Cluster API provided by the Operator.

## Prerequisites


1. Create the namespace name you will use, if not exist:

```bash
$ kubectl create namespace my-namespace-name
```

Trying to create an already-existing namespace will show you a
self-explanatory error message. Also, you can use the `defalut` namespace.

**NOTE**: In this document `default` namespace is used in all examples.
Substitute `default` with your namespace name if you use a different
one.


2. Prepare:

```yaml
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

```bash
$ kubectl apply -f percona-server-mongodb-operator/deploy/cr.yaml
```

**URL:**

```text
https://$API_SERVER/apis/psmdb.percona.com/v1-12-0/namespaces/default/perconaservermongodbs
```

**Authentication:**

```text
Authorization: Bearer $KUBE_TOKEN
```

**cURL Request:**

```bash
$ curl -k -v -XPOST "https://$API_SERVER/apis/psmdb.percona.com/v1-12-0/namespaces/default/perconaservermongodbs" \
            -H "Content-Type: application/json" \
            -H "Accept: application/json" \
            -H "Authorization: Bearer $KUBE_TOKEN" \
            -d "@cluster.json"
```

**Request Body (cluster.json):**

JSON:

```json
{
   "apiVersion": "psmdb.percona.com/v1-5-0",
   "kind": "PerconaServerMongoDB",
   "metadata": {
      "name": "my-cluster-name"
   },
   "spec": {
      "image": "percona/percona-server-mongodb:4.2.8-8",
      "imagePullPolicy": "Always",
      "allowUnsafeConfigurations": false,
      "updateStrategy": "SmartUpdate",
      "secrets": {
         "users": "my-cluster-name-secrets"
      },
      "pmm": {
         "enabled": false,
         "image": "percona/percona-server-mongodb-operator:1.5.0-pmm",
         "serverHost": "monitoring-service"
      },
      "replsets": [
         {
            "name": "rs0",
            "size": 3,
            "affinity": {
               "antiAffinityTopologyKey": "none"
            },
            "podDisruptionBudget": {
               "maxUnavailable": 1
            },
            "expose": {
               "enabled": false,
               "exposeType": "LoadBalancer"
            },
            "arbiter": {
               "enabled": false,
               "size": 1,
               "affinity": {
                  "antiAffinityTopologyKey": "none"
               }
            },
            "resources": {
               "limits": null
            },
            "volumeSpec": {
               "persistentVolumeClaim": {
                  "storageClassName": "standard",
                  "accessModes": [
                     "ReadWriteOnce"
                  ],
                  "resources": {
                     "requests": {
                        "storage": "3Gi"
                     }
                  }
               }
            }
         }
      ],
      "mongod": {
         "net": {
            "port": 27017,
            "hostPort": 0
         },
         "security": {
            "redactClientLogData": false,
            "enableEncryption": true,
            "encryptionKeySecret": "my-cluster-name-mongodb-encryption-key",
            "encryptionCipherMode": "AES256-CBC"
         },
         "setParameter": {
            "ttlMonitorSleepSecs": 60,
            "wiredTigerConcurrentReadTransactions": 128,
            "wiredTigerConcurrentWriteTransactions": 128
         },
         "storage": {
            "engine": "wiredTiger",
            "inMemory": {
               "engineConfig": {
                  "inMemorySizeRatio": 0.9
               }
            },
            "mmapv1": {
               "nsSize": 16,
               "smallfiles": false
            },
            "wiredTiger": {
               "engineConfig": {
                  "cacheSizeRatio": 0.5,
                  "directoryForIndexes": false,
                  "journalCompressor": "snappy"
               },
               "collectionConfig": {
                  "blockCompressor": "snappy"
               },
               "indexConfig": {
                  "prefixCompression": true
               }
            }
         },
         "operationProfiling": {
            "mode": "slowOp",
            "slowOpThresholdMs": 100,
            "rateLimit": 100
         }
      },
      "backup": {
         "enabled": true,
         "restartOnFailure": true,
         "image": "percona/percona-server-mongodb-operator:1.5.0-backup",
         "serviceAccountName": "percona-server-mongodb-operator",
         "storages": null,
         "tasks": null
      }
   }
}
```

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


> 3. setParameter (Object): `configure mongod enginer paramters`


> 4. storage:


>     1. engine (String, min-length: 1, default “wiredTiger”): `name of mongod storage engine`


>     2. inMemory (Object) : `wiredTiger engine configuration`


>     3. wiredTiger (Object) : `wiredTiger engine configuration`

> pmm:


> 1. serverHost (String, min-length: 1) : `serivce name for monitoring`


> 2. image (String, min-length: 1) : `name of pmm image`

> backup:


> 1. image (String, min-length: 1) : `name of MngoDB backup docker image`


> 2. serviceAccountName (String, min-length: 1) `name of service account to use for backup`


> 3. storages (Object) : `storage configuration object for backup`

**Response:**

JSON

```json
{
   "apiVersion":"psmdb.percona.com/v1-5-0",
   "kind":"PerconaServerMongoDB",
   "metadata":{
      "annotations":{
         "kubectl.kubernetes.io/last-applied-configuration":"{\"apiVersion\":\"psmdb.percona.com/v1-5-0\",\"kind\":\"PerconaServerMongoDB\",\"metadata\":{\"annotations\":{},\"name\":\"my-cluster-name\",\"namespace\":\"default\"},\"spec\":{\"allowUnsafeConfigurations\":false,\"backup\":{\"enabled\":true,\"image\":\"percona/percona-server-mongodb-operator:1.5.0-backup\",\"restartOnFailure\":true,\"serviceAccountName\":\"percona-server-mongodb-operator\",\"storages\":null,\"tasks\":null},\"image\":\"percona/percona-server-mongodb:4.2.8-8\",\"imagePullPolicy\":\"Always\",\"mongod\":{\"net\":{\"hostPort\":0,\"port\":27017},\"operationProfiling\":{\"mode\":\"slowOp\",\"rateLimit\":100,\"slowOpThresholdMs\":100},\"security\":{\"enableEncryption\":true,\"encryptionCipherMode\":\"AES256-CBC\",\"encryptionKeySecret\":\"my-cluster-name-mongodb-encryption-key\",\"redactClientLogData\":false},\"setParameter\":{\"ttlMonitorSleepSecs\":60,\"wiredTigerConcurrentReadTransactions\":128,\"wiredTigerConcurrentWriteTransactions\":128},\"storage\":{\"engine\":\"wiredTiger\",\"inMemory\":{\"engineConfig\":{\"inMemorySizeRatio\":0.9}},\"mmapv1\":{\"nsSize\":16,\"smallfiles\":false},\"wiredTiger\":{\"collectionConfig\":{\"blockCompressor\":\"snappy\"},\"engineConfig\":{\"cacheSizeRatio\":0.5,\"directoryForIndexes\":false,\"journalCompressor\":\"snappy\"},\"indexConfig\":{\"prefixCompression\":true}}}},\"pmm\":{\"enabled\":false,\"image\":\"percona/percona-server-mongodb-operator:1.5.0-pmm\",\"serverHost\":\"monitoring-service\"},\"replsets\":[{\"affinity\":{\"antiAffinityTopologyKey\":\"none\"},\"arbiter\":{\"affinity\":{\"antiAffinityTopologyKey\":\"none\"},\"enabled\":false,\"size\":1},\"expose\":{\"enabled\":false,\"exposeType\":\"LoadBalancer\"},\"name\":\"rs0\",\"podDisruptionBudget\":{\"maxUnavailable\":1},\"resources\":{\"limits\":null},\"size\":3,\"volumeSpec\":{\"persistentVolumeClaim\":{\"accessModes\":[\"ReadWriteOnce\"],\"resources\":{\"requests\":{\"storage\":\"3Gi\"}},\"storageClassName\":\"standard\"}}}],\"secrets\":{\"users\":\"my-cluster-name-secrets\"},\"updateStrategy\":\"SmartUpdate\"}}\n"
      },
      "creationTimestamp":"2020-07-24T14:27:58Z",
      "generation":1,
      "managedFields":[
         {
            "apiVersion":"psmdb.percona.com/v1-5-0",
            "fieldsType":"FieldsV1",
            "fieldsV1":{
               "f:metadata":{
                  "f:annotations":{
                     ".":{

                     },
                     "f:kubectl.kubernetes.io/last-applied-configuration":{

                     }
                  }
               },
               "f:spec":{
                  ".":{

                  },
                  "f:allowUnsafeConfigurations":{

                  },
                  "f:backup":{
                     ".":{

                     },
                     "f:enabled":{

                     },
                     "f:image":{

                     },
                     "f:restartOnFailure":{

                     },
                     "f:serviceAccountName":{

                     },
                     "f:storages":{

                     },
                     "f:tasks":{

                     }
                  },
                  "f:image":{

                  },
                  "f:imagePullPolicy":{

                  },
                  "f:mongod":{
                     ".":{

                     },
                     "f:net":{
                        ".":{

                        },
                        "f:hostPort":{

                        },
                        "f:port":{

                        }
                     },
                     "f:operationProfiling":{
                        ".":{

                        },
                        "f:mode":{

                        },
                        "f:rateLimit":{

                        },
                        "f:slowOpThresholdMs":{

                        }
                     },
                     "f:security":{
                        ".":{

                        },
                        "f:enableEncryption":{

                        },
                        "f:encryptionCipherMode":{

                        },
                        "f:encryptionKeySecret":{

                        },
                        "f:redactClientLogData":{

                        }
                     },
                     "f:setParameter":{
                        ".":{

                        },
                        "f:ttlMonitorSleepSecs":{

                        },
                        "f:wiredTigerConcurrentReadTransactions":{

                        },
                        "f:wiredTigerConcurrentWriteTransactions":{

                        }
                     },
                     "f:storage":{
                        ".":{

                        },
                        "f:engine":{

                        },
                        "f:inMemory":{
                           ".":{

                           },
                           "f:engineConfig":{
                              ".":{

                              },
                              "f:inMemorySizeRatio":{

                              }
                           }
                        },
                        "f:mmapv1":{
                           ".":{

                           },
                           "f:nsSize":{

                           },
                           "f:smallfiles":{

                           }
                        },
                        "f:wiredTiger":{
                           ".":{

                           },
                           "f:collectionConfig":{
                              ".":{

                              },
                              "f:blockCompressor":{

                              }
                           },
                           "f:engineConfig":{
                              ".":{

                              },
                              "f:cacheSizeRatio":{

                              },
                              "f:directoryForIndexes":{

                              },
                              "f:journalCompressor":{

                              }
                           },
                           "f:indexConfig":{
                              ".":{

                              },
                              "f:prefixCompression":{

                              }
                           }
                        }
                     }
                  },
                  "f:pmm":{
                     ".":{

                     },
                     "f:enabled":{

                     },
                     "f:image":{

                     },
                     "f:serverHost":{

                     }
                  },
                  "f:replsets":{

                  },
                  "f:secrets":{
                     ".":{

                     },
                     "f:users":{

                     }
                  },
                  "f:updateStrategy":{

                  }
               }
            },
            "manager":"kubectl",
            "operation":"Update",
            "time":"2020-07-24T14:27:58Z"
         }
      ],
      "name":"my-cluster-name",
      "namespace":"default",
      "resourceVersion":"1268922",
      "selfLink":"/apis/psmdb.percona.com/v1-5-0/namespaces/default/perconaservermongodbs/my-cluster-name",
      "uid":"5207e71a-c83f-4707-b892-63aa93fb615c"
   },
   "spec":{
      "allowUnsafeConfigurations":false,
      "backup":{
         "enabled":true,
         "image":"percona/percona-server-mongodb-operator:1.5.0-backup",
         "restartOnFailure":true,
         "serviceAccountName":"percona-server-mongodb-operator",
         "storages":null,
         "tasks":null
      },
      "image":"percona/percona-server-mongodb:4.2.8-8",
      "imagePullPolicy":"Always",
      "mongod":{
         "net":{
            "hostPort":0,
            "port":27017
         },
         "operationProfiling":{
            "mode":"slowOp",
            "rateLimit":100,
            "slowOpThresholdMs":100
         },
         "security":{
            "enableEncryption":true,
            "encryptionCipherMode":"AES256-CBC",
            "encryptionKeySecret":"my-cluster-name-mongodb-encryption-key",
            "redactClientLogData":false
         },
         "setParameter":{
            "ttlMonitorSleepSecs":60,
            "wiredTigerConcurrentReadTransactions":128,
            "wiredTigerConcurrentWriteTransactions":128
         },
         "storage":{
            "engine":"wiredTiger",
            "inMemory":{
               "engineConfig":{
                  "inMemorySizeRatio":0.9
               }
            },
            "mmapv1":{
               "nsSize":16,
               "smallfiles":false
            },
            "wiredTiger":{
               "collectionConfig":{
                  "blockCompressor":"snappy"
               },
               "engineConfig":{
                  "cacheSizeRatio":0.5,
                  "directoryForIndexes":false,
                  "journalCompressor":"snappy"
               },
               "indexConfig":{
                  "prefixCompression":true
               }
            }
         }
      },
      "pmm":{
         "enabled":false,
         "image":"percona/percona-server-mongodb-operator:1.5.0-pmm",
         "serverHost":"monitoring-service"
      },
      "replsets":[
         {
            "affinity":{
               "antiAffinityTopologyKey":"none"
            },
            "arbiter":{
               "affinity":{
                  "antiAffinityTopologyKey":"none"
               },
               "enabled":false,
               "size":1
            },
            "expose":{
               "enabled":false,
               "exposeType":"LoadBalancer"
            },
            "name":"rs0",
            "podDisruptionBudget":{
               "maxUnavailable":1
            },
            "resources":{
               "limits":null
            },
            "size":3,
            "volumeSpec":{
               "persistentVolumeClaim":{
                  "accessModes":[
                     "ReadWriteOnce"
                  ],
                  "resources":{
                     "requests":{
                        "storage":"3Gi"
                     }
                  },
                  "storageClassName":"standard"
               }
            }
         }
      ],
      "secrets":{
         "users":"my-cluster-name-secrets"
      },
      "updateStrategy":"SmartUpdate"
   }
}
```

## List Percona Server for MongoDB clusters

**Description:**

```text
Lists all Percona Server for MongoDB clusters that exist in your kubernetes cluster
```

**Kubectl Command:**

```bash
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

```bash
$ curl -k -v -XGET "https://$API_SERVER/apis/psmdb.percona.com/v1/namespaces/default/perconaservermongodbs?limit=500" \
            -H "Accept: application/json;as=Table;v=v1;g=meta.k8s.io,application/json;as=Table;v=v1beta1;g=meta.k8s.io,application/json" \
            -H "Authorization: Bearer $KUBE_TOKEN"
```

**Request Body:**

```text
None
```

**Response:**

JSON:

```json
{
   "kind":"Table",
   "apiVersion":"meta.k8s.io/v1",
   "metadata":{
      "selfLink":"/apis/psmdb.percona.com/v1/namespaces/default/perconaservermongodbs",
      "resourceVersion":"1273793"
   },
   "columnDefinitions":[
      {
         "name":"Name",
         "type":"string",
         "format":"name",
         "description":"Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: http://kubernetes.io/docs/user-guide/identifiers#names",
         "priority":0
      },
      {
         "name":"Status",
         "type":"string",
         "format":"",
         "description":"Custom resource definition column (in JSONPath format): .status.state",
         "priority":0
      },
      {
         "name":"Age",
         "type":"date",
         "format":"",
         "description":"Custom resource definition column (in JSONPath format): .metadata.creationTimestamp",
         "priority":0
      }
   ],
   "rows":[
      {
         "cells":[
            "my-cluster-name",
            "ready",
            "37m"
         ],
         "object":{
            "kind":"PartialObjectMetadata",
            "apiVersion":"meta.k8s.io/v1",
            "metadata":{
               "name":"my-cluster-name",
               "namespace":"default",
               "selfLink":"/apis/psmdb.percona.com/v1/namespaces/default/perconaservermongodbs/my-cluster-name",
               "uid":"5207e71a-c83f-4707-b892-63aa93fb615c",
               "resourceVersion":"1273788",
               "generation":1,
               "creationTimestamp":"2020-07-24T14:27:58Z",
               "annotations":{
                  "kubectl.kubernetes.io/last-applied-configuration":"{\"apiVersion\":\"psmdb.percona.com/v1-5-0\",\"kind\":\"PerconaServerMongoDB\",\"metadata\":{\"annotations\":{},\"name\":\"my-cluster-name\",\"namespace\":\"default\"},\"spec\":{\"allowUnsafeConfigurations\":false,\"backup\":{\"enabled\":true,\"image\":\"percona/percona-server-mongodb-operator:1.5.0-backup\",\"restartOnFailure\":true,\"serviceAccountName\":\"percona-server-mongodb-operator\",\"storages\":null,\"tasks\":null},\"image\":\"percona/percona-server-mongodb:4.2.8-8\",\"imagePullPolicy\":\"Always\",\"mongod\":{\"net\":{\"hostPort\":0,\"port\":27017},\"operationProfiling\":{\"mode\":\"slowOp\",\"rateLimit\":100,\"slowOpThresholdMs\":100},\"security\":{\"enableEncryption\":true,\"encryptionCipherMode\":\"AES256-CBC\",\"encryptionKeySecret\":\"my-cluster-name-mongodb-encryption-key\",\"redactClientLogData\":false},\"setParameter\":{\"ttlMonitorSleepSecs\":60,\"wiredTigerConcurrentReadTransactions\":128,\"wiredTigerConcurrentWriteTransactions\":128},\"storage\":{\"engine\":\"wiredTiger\",\"inMemory\":{\"engineConfig\":{\"inMemorySizeRatio\":0.9}},\"mmapv1\":{\"nsSize\":16,\"smallfiles\":false},\"wiredTiger\":{\"collectionConfig\":{\"blockCompressor\":\"snappy\"},\"engineConfig\":{\"cacheSizeRatio\":0.5,\"directoryForIndexes\":false,\"journalCompressor\":\"snappy\"},\"indexConfig\":{\"prefixCompression\":true}}}},\"pmm\":{\"enabled\":false,\"image\":\"percona/percona-server-mongodb-operator:1.5.0-pmm\",\"serverHost\":\"monitoring-service\"},\"replsets\":[{\"affinity\":{\"antiAffinityTopologyKey\":\"none\"},\"arbiter\":{\"affinity\":{\"antiAffinityTopologyKey\":\"none\"},\"enabled\":false,\"size\":1},\"expose\":{\"enabled\":false,\"exposeType\":\"LoadBalancer\"},\"name\":\"rs0\",\"podDisruptionBudget\":{\"maxUnavailable\":1},\"resources\":{\"limits\":null},\"size\":3,\"volumeSpec\":{\"persistentVolumeClaim\":{\"accessModes\":[\"ReadWriteOnce\"],\"resources\":{\"requests\":{\"storage\":\"3Gi\"}},\"storageClassName\":\"standard\"}}}],\"secrets\":{\"users\":\"my-cluster-name-secrets\"},\"updateStrategy\":\"SmartUpdate\"}}\n"
               },
               "managedFields":[
                  {
                     "manager":"kubectl",
                     "operation":"Update",
                     "apiVersion":"psmdb.percona.com/v1-5-0",
                     "time":"2020-07-24T14:27:58Z",
                     "fieldsType":"FieldsV1",
                     "fieldsV1":{
                        "f:metadata":{
                           "f:annotations":{
                              ".":{

                              },
                              "f:kubectl.kubernetes.io/last-applied-configuration":{

                              }
                           }
                        },
                        "f:spec":{
                           ".":{

                           },
                           "f:allowUnsafeConfigurations":{

                           },
                           "f:backup":{
                              ".":{

                              },
                              "f:enabled":{

                              },
                              "f:image":{

                              },
                              "f:serviceAccountName":{

                              }
                           },
                           "f:image":{

                           },
                           "f:imagePullPolicy":{

                           },
                           "f:mongod":{
                              ".":{

                              },
                              "f:net":{
                                 ".":{

                                 },
                                 "f:port":{

                                 }
                              },
                              "f:operationProfiling":{
                                 ".":{

                                 },
                                 "f:mode":{

                                 },
                                 "f:rateLimit":{

                                 },
                                 "f:slowOpThresholdMs":{

                                 }
                              },
                              "f:security":{
                                 ".":{

                                 },
                                 "f:enableEncryption":{

                                 },
                                 "f:encryptionCipherMode":{

                                 },
                                 "f:encryptionKeySecret":{

                                 }
                              },
                              "f:setParameter":{
                                 ".":{

                                 },
                                 "f:ttlMonitorSleepSecs":{

                                 },
                                 "f:wiredTigerConcurrentReadTransactions":{

                                 },
                                 "f:wiredTigerConcurrentWriteTransactions":{

                                 }
                              },
                              "f:storage":{
                                 ".":{

                                 },
                                 "f:engine":{

                                 },
                                 "f:inMemory":{
                                    ".":{

                                    },
                                    "f:engineConfig":{
                                       ".":{

                                       },
                                       "f:inMemorySizeRatio":{

                                       }
                                    }
                                 },
                                 "f:mmapv1":{
                                    ".":{

                                    },
                                    "f:nsSize":{

                                    }
                                 },
                                 "f:wiredTiger":{
                                    ".":{

                                    },
                                    "f:collectionConfig":{
                                       ".":{

                                       },
                                       "f:blockCompressor":{

                                       }
                                    },
                                    "f:engineConfig":{
                                       ".":{

                                       },
                                       "f:cacheSizeRatio":{

                                       },
                                       "f:journalCompressor":{

                                       }
                                    },
                                    "f:indexConfig":{
                                       ".":{

                                       },
                                       "f:prefixCompression":{

                                       }
                                    }
                                 }
                              }
                           },
                           "f:pmm":{
                              ".":{

                              },
                              "f:image":{

                              },
                              "f:serverHost":{

                              }
                           },
                           "f:secrets":{
                              ".":{

                              },
                              "f:users":{

                              }
                           },
                           "f:updateStrategy":{

                           }
                        }
                     }
                  },
                  {
                     "manager":"percona-server-mongodb-operator",
                     "operation":"Update",
                     "apiVersion":"psmdb.percona.com/v1",
                     "time":"2020-07-24T15:04:55Z",
                     "fieldsType":"FieldsV1",
                     "fieldsV1":{
                        "f:spec":{
                           "f:backup":{
                              "f:containerSecurityContext":{
                                 ".":{

                                 },
                                 "f:runAsNonRoot":{

                                 },
                                 "f:runAsUser":{

                                 }
                              },
                              "f:podSecurityContext":{
                                 ".":{

                                 },
                                 "f:fsGroup":{

                                 }
                              }
                           },
                           "f:clusterServiceDNSSuffix":{

                           },
                           "f:replsets":{

                           },
                           "f:runUid":{

                           },
                           "f:secrets":{
                              "f:ssl":{

                              },
                              "f:sslInternal":{

                              }
                           }
                        },
                        "f:status":{
                           ".":{

                           },
                           "f:conditions":{

                           },
                           "f:observedGeneration":{

                           },
                           "f:replsets":{
                              ".":{

                              },
                              "f:rs0":{
                                 ".":{

                                 },
                                 "f:ready":{

                                 },
                                 "f:size":{

                                 },
                                 "f:status":{

                                 }
                              }
                           },
                           "f:state":{

                           }
                        }
                     }
                  }
               ]
            }
         }
      }
   ]
}
```

## Get status of Percona Server for MongoDB cluster

**Description:**

```text
Gets all information about specified Percona Server for MongoDB cluster
```

**Kubectl Command:**

```bash
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

```bash
$ curl -k -v -XGET "https://$API_SERVER/apis/psmdb.percona.com/v1/namespaces/default/perconaservermongodbs/my-cluster-name" \
            -H "Accept: application/json" \
            -H "Authorization: Bearer $KUBE_TOKEN"
```

**Request Body:**

```text
None
```

**Response:**

JSON:

```json
{
   "apiVersion":"psmdb.percona.com/v1",
   "kind":"PerconaServerMongoDB",
   "metadata":{
      "annotations":{
         "kubectl.kubernetes.io/last-applied-configuration":"{\"apiVersion\":\"psmdb.percona.com/v1-5-0\",\"kind\":\"PerconaServerMongoDB\",\"metadata\":{\"annotations\":{},\"name\":\"my-cluster-name\",\"namespace\":\"default\"},\"spec\":{\"allowUnsafeConfigurations\":false,\"backup\":{\"enabled\":true,\"image\":\"percona/percona-server-mongodb-operator:1.5.0-backup\",\"restartOnFailure\":true,\"serviceAccountName\":\"percona-server-mongodb-operator\",\"storages\":null,\"tasks\":null},\"image\":\"percona/percona-server-mongodb:4.2.8-8\",\"imagePullPolicy\":\"Always\",\"mongod\":{\"net\":{\"hostPort\":0,\"port\":27017},\"operationProfiling\":{\"mode\":\"slowOp\",\"rateLimit\":100,\"slowOpThresholdMs\":100},\"security\":{\"enableEncryption\":true,\"encryptionCipherMode\":\"AES256-CBC\",\"encryptionKeySecret\":\"my-cluster-name-mongodb-encryption-key\",\"redactClientLogData\":false},\"setParameter\":{\"ttlMonitorSleepSecs\":60,\"wiredTigerConcurrentReadTransactions\":128,\"wiredTigerConcurrentWriteTransactions\":128},\"storage\":{\"engine\":\"wiredTiger\",\"inMemory\":{\"engineConfig\":{\"inMemorySizeRatio\":0.9}},\"mmapv1\":{\"nsSize\":16,\"smallfiles\":false},\"wiredTiger\":{\"collectionConfig\":{\"blockCompressor\":\"snappy\"},\"engineConfig\":{\"cacheSizeRatio\":0.5,\"directoryForIndexes\":false,\"journalCompressor\":\"snappy\"},\"indexConfig\":{\"prefixCompression\":true}}}},\"pmm\":{\"enabled\":false,\"image\":\"percona/percona-server-mongodb-operator:1.5.0-pmm\",\"serverHost\":\"monitoring-service\"},\"replsets\":[{\"affinity\":{\"antiAffinityTopologyKey\":\"none\"},\"arbiter\":{\"affinity\":{\"antiAffinityTopologyKey\":\"none\"},\"enabled\":false,\"size\":1},\"expose\":{\"enabled\":false,\"exposeType\":\"LoadBalancer\"},\"name\":\"rs0\",\"podDisruptionBudget\":{\"maxUnavailable\":1},\"resources\":{\"limits\":null},\"size\":3,\"volumeSpec\":{\"persistentVolumeClaim\":{\"accessModes\":[\"ReadWriteOnce\"],\"resources\":{\"requests\":{\"storage\":\"3Gi\"}},\"storageClassName\":\"standard\"}}}],\"secrets\":{\"users\":\"my-cluster-name-secrets\"},\"updateStrategy\":\"SmartUpdate\"}}\n"
      },
      "creationTimestamp":"2020-07-24T14:27:58Z",
      "generation":1,
      "managedFields":[
         {
            "apiVersion":"psmdb.percona.com/v1-5-0",
            "fieldsType":"FieldsV1",
            "fieldsV1":{
               "f:metadata":{
                  "f:annotations":{
                     ".":{

                     },
                     "f:kubectl.kubernetes.io/last-applied-configuration":{

                     }
                  }
               },
               "f:spec":{
                  ".":{

                  },
                  "f:allowUnsafeConfigurations":{

                  },
                  "f:backup":{
                     ".":{

                     },
                     "f:enabled":{

                     },
                     "f:image":{

                     },
                     "f:serviceAccountName":{

                     }
                  },
                  "f:image":{

                  },
                  "f:imagePullPolicy":{

                  },
                  "f:mongod":{
                     ".":{

                     },
                     "f:net":{
                        ".":{

                        },
                        "f:port":{

                        }
                     },
                     "f:operationProfiling":{
                        ".":{

                        },
                        "f:mode":{

                        },
                        "f:rateLimit":{

                        },
                        "f:slowOpThresholdMs":{

                        }
                     },
                     "f:security":{
                        ".":{

                        },
                        "f:enableEncryption":{

                        },
                        "f:encryptionCipherMode":{

                        },
                        "f:encryptionKeySecret":{

                        }
                     },
                     "f:setParameter":{
                        ".":{

                        },
                        "f:ttlMonitorSleepSecs":{

                        },
                        "f:wiredTigerConcurrentReadTransactions":{

                        },
                        "f:wiredTigerConcurrentWriteTransactions":{

                        }
                     },
                     "f:storage":{
                        ".":{

                        },
                        "f:engine":{

                        },
                        "f:inMemory":{
                           ".":{

                           },
                           "f:engineConfig":{
                              ".":{

                              },
                              "f:inMemorySizeRatio":{

                              }
                           }
                        },
                        "f:mmapv1":{
                           ".":{

                           },
                           "f:nsSize":{

                           }
                        },
                        "f:wiredTiger":{
                           ".":{

                           },
                           "f:collectionConfig":{
                              ".":{

                              },
                              "f:blockCompressor":{

                              }
                           },
                           "f:engineConfig":{
                              ".":{

                              },
                              "f:cacheSizeRatio":{

                              },
                              "f:journalCompressor":{

                              }
                           },
                           "f:indexConfig":{
                              ".":{

                              },
                              "f:prefixCompression":{

                              }
                           }
                        }
                     }
                  },
                  "f:pmm":{
                     ".":{

                     },
                     "f:image":{

                     },
                     "f:serverHost":{

                     }
                  },
                  "f:secrets":{
                     ".":{

                     },
                     "f:users":{

                     }
                  },
                  "f:updateStrategy":{

                  }
               }
            },
            "manager":"kubectl",
            "operation":"Update",
            "time":"2020-07-24T14:27:58Z"
         },
         {
            "apiVersion":"psmdb.percona.com/v1",
            "fieldsType":"FieldsV1",
            "fieldsV1":{
               "f:spec":{
                  "f:backup":{
                     "f:containerSecurityContext":{
                        ".":{

                        },
                        "f:runAsNonRoot":{

                        },
                        "f:runAsUser":{

                        }
                     },
                     "f:podSecurityContext":{
                        ".":{

                        },
                        "f:fsGroup":{

                        }
                     }
                  },
                  "f:clusterServiceDNSSuffix":{

                  },
                  "f:replsets":{

                  },
                  "f:runUid":{

                  },
                  "f:secrets":{
                     "f:ssl":{

                     },
                     "f:sslInternal":{

                     }
                  }
               },
               "f:status":{
                  ".":{

                  },
                  "f:conditions":{

                  },
                  "f:observedGeneration":{

                  },
                  "f:replsets":{
                     ".":{

                     },
                     "f:rs0":{
                        ".":{

                        },
                        "f:ready":{

                        },
                        "f:size":{

                        },
                        "f:status":{

                        }
                     }
                  },
                  "f:state":{

                  }
               }
            },
            "manager":"percona-server-mongodb-operator",
            "operation":"Update",
            "time":"2020-07-24T15:09:40Z"
         }
      ],
      "name":"my-cluster-name",
      "namespace":"default",
      "resourceVersion":"1274523",
      "selfLink":"/apis/psmdb.percona.com/v1/namespaces/default/perconaservermongodbs/my-cluster-name",
      "uid":"5207e71a-c83f-4707-b892-63aa93fb615c"
   },
   "spec":{
      "allowUnsafeConfigurations":false,
      "backup":{
         "enabled":true,
         "image":"percona/percona-server-mongodb-operator:1.5.0-backup",
         "restartOnFailure":true,
         "serviceAccountName":"percona-server-mongodb-operator",
         "storages":null,
         "tasks":null
      },
      "image":"percona/percona-server-mongodb:4.2.8-8",
      "imagePullPolicy":"Always",
      "mongod":{
         "net":{
            "hostPort":0,
            "port":27017
         },
         "operationProfiling":{
            "mode":"slowOp",
            "rateLimit":100,
            "slowOpThresholdMs":100
         },
         "security":{
            "enableEncryption":true,
            "encryptionCipherMode":"AES256-CBC",
            "encryptionKeySecret":"my-cluster-name-mongodb-encryption-key",
            "redactClientLogData":false
         },
         "setParameter":{
            "ttlMonitorSleepSecs":60,
            "wiredTigerConcurrentReadTransactions":128,
            "wiredTigerConcurrentWriteTransactions":128
         },
         "storage":{
            "engine":"wiredTiger",
            "inMemory":{
               "engineConfig":{
                  "inMemorySizeRatio":0.9
               }
            },
            "mmapv1":{
               "nsSize":16,
               "smallfiles":false
            },
            "wiredTiger":{
               "collectionConfig":{
                  "blockCompressor":"snappy"
               },
               "engineConfig":{
                  "cacheSizeRatio":0.5,
                  "directoryForIndexes":false,
                  "journalCompressor":"snappy"
               },
               "indexConfig":{
                  "prefixCompression":true
               }
            }
         }
      },
      "pmm":{
         "enabled":false,
         "image":"percona/percona-server-mongodb-operator:1.5.0-pmm",
         "serverHost":"monitoring-service"
      },
      "replsets":[
         {
            "affinity":{
               "antiAffinityTopologyKey":"none"
            },
            "arbiter":{
               "affinity":{
                  "antiAffinityTopologyKey":"none"
               },
               "enabled":false,
               "size":1
            },
            "expose":{
               "enabled":false,
               "exposeType":"LoadBalancer"
            },
            "name":"rs0",
            "podDisruptionBudget":{
               "maxUnavailable":1
            },
            "resources":{
               "limits":null
            },
            "size":3,
            "volumeSpec":{
               "persistentVolumeClaim":{
                  "accessModes":[
                     "ReadWriteOnce"
                  ],
                  "resources":{
                     "requests":{
                        "storage":"3Gi"
                     }
                  },
                  "storageClassName":"standard"
               }
            }
         }
      ],
      "secrets":{
         "users":"my-cluster-name-secrets"
      },
      "updateStrategy":"SmartUpdate"
   },
   "status":{
      "conditions":[
         {
            "lastTransitionTime":"2020-07-24T14:28:03Z",
            "status":"True",
            "type":"ClusterInitializing"
         },
         {
            "lastTransitionTime":"2020-07-24T14:28:39Z",
            "status":"True",
            "type":"Error"
         },
         {
            "lastTransitionTime":"2020-07-24T14:28:41Z",
            "status":"True",
            "type":"ClusterInitializing"
         },
         {
            "lastTransitionTime":"2020-07-24T14:28:41Z",
            "status":"True",
            "type":"Error"
         },
         {
            "lastTransitionTime":"2020-07-24T14:29:10Z",
            "status":"True",
            "type":"ClusterReady"
         },
         {
            "lastTransitionTime":"2020-07-24T14:49:46Z",
            "status":"True",
            "type":"ClusterInitializing"
         },
         {
            "lastTransitionTime":"2020-07-24T14:50:00Z",
            "status":"True",
            "type":"ClusterInitializing"
         },
         {
            "lastTransitionTime":"2020-07-24T14:52:31Z",
            "status":"True",
            "type":"ClusterInitializing"
         },
         {
            "lastTransitionTime":"2020-07-24T14:52:43Z",
            "status":"True",
            "type":"Error"
         },
         {
            "lastTransitionTime":"2020-07-24T14:53:01Z",
            "status":"True",
            "type":"ClusterInitializing"
         },
         {
            "lastTransitionTime":"2020-07-24T14:53:05Z",
            "status":"True",
            "type":"ClusterInitializing"
         },
         {
            "lastTransitionTime":"2020-07-24T14:53:05Z",
            "status":"True",
            "type":"ClusterReady"
         }
      ],
      "observedGeneration":1,
      "replsets":{
         "rs0":{
            "ready":3,
            "size":3,
            "status":"ready"
         }
      },
      "state":"ready"
   }
}
```

## Scale up/down Percona Server for MongoDB cluster

**Description:**

```text
Increase or decrease the size of the Percona Server for MongoDB cluster nodes to fit the current high availability needs
```

**Kubectl Command:**

```bash
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

```bash
$ curl -k -v -XPATCH "https://$API_SERVER/apis/psmdb.percona.com/v1/namespaces/default/perconaservermongodbs/my-cluster-name" \
            -H "Authorization: Bearer $KUBE_TOKEN" \
            -H "Content-Type: application/merge-patch+json"
            -H "Accept: application/json" \
            -d '{
                  "spec": {"replsets":{ "size": "5" }
                  }}'
```

**Request Body:**

JSON:

```json
{
"spec": {"replsets":{ "size": "5" }
}}
```

**Input:**

> **spec**:

> replsets


> 1. size (Int or String, Defaults: 3): `Specifiy the sie of the replsets cluster to scale up or down to`

**Response:**

JSON:

```json
{
   "apiVersion":"psmdb.percona.com/v1",
   "kind":"PerconaServerMongoDB",
   "metadata":{
      "annotations":{
         "kubectl.kubernetes.io/last-applied-configuration":"{\"apiVersion\":\"psmdb.percona.com/v1-5-0\",\"kind\":\"PerconaServerMongoDB\",\"metadata\":{\"annotations\":{},\"name\":\"my-cluster-name\",\"namespace\":\"default\"},\"spec\":{\"allowUnsafeConfigurations\":false,\"backup\":{\"enabled\":true,\"image\":\"percona/percona-server-mongodb-operator:1.5.0-backup\",\"restartOnFailure\":true,\"serviceAccountName\":\"percona-server-mongodb-operator\",\"storages\":null,\"tasks\":null},\"image\":\"percona/percona-server-mongodb:4.2.8-8\",\"imagePullPolicy\":\"Always\",\"mongod\":{\"net\":{\"hostPort\":0,\"port\":27017},\"operationProfiling\":{\"mode\":\"slowOp\",\"rateLimit\":100,\"slowOpThresholdMs\":100},\"security\":{\"enableEncryption\":true,\"encryptionCipherMode\":\"AES256-CBC\",\"encryptionKeySecret\":\"my-cluster-name-mongodb-encryption-key\",\"redactClientLogData\":false},\"setParameter\":{\"ttlMonitorSleepSecs\":60,\"wiredTigerConcurrentReadTransactions\":128,\"wiredTigerConcurrentWriteTransactions\":128},\"storage\":{\"engine\":\"wiredTiger\",\"inMemory\":{\"engineConfig\":{\"inMemorySizeRatio\":0.9}},\"mmapv1\":{\"nsSize\":16,\"smallfiles\":false},\"wiredTiger\":{\"collectionConfig\":{\"blockCompressor\":\"snappy\"},\"engineConfig\":{\"cacheSizeRatio\":0.5,\"directoryForIndexes\":false,\"journalCompressor\":\"snappy\"},\"indexConfig\":{\"prefixCompression\":true}}}},\"pmm\":{\"enabled\":false,\"image\":\"percona/percona-server-mongodb-operator:1.5.0-pmm\",\"serverHost\":\"monitoring-service\"},\"replsets\":[{\"affinity\":{\"antiAffinityTopologyKey\":\"none\"},\"arbiter\":{\"affinity\":{\"antiAffinityTopologyKey\":\"none\"},\"enabled\":false,\"size\":1},\"expose\":{\"enabled\":false,\"exposeType\":\"LoadBalancer\"},\"name\":\"rs0\",\"podDisruptionBudget\":{\"maxUnavailable\":1},\"resources\":{\"limits\":null},\"size\":3,\"volumeSpec\":{\"persistentVolumeClaim\":{\"accessModes\":[\"ReadWriteOnce\"],\"resources\":{\"requests\":{\"storage\":\"3Gi\"}},\"storageClassName\":\"standard\"}}}],\"secrets\":{\"users\":\"my-cluster-name-secrets\"},\"updateStrategy\":\"SmartUpdate\"}}\n"
      },
      "creationTimestamp":"2020-07-24T14:27:58Z",
      "generation":4,
      "managedFields":[
         {
            "apiVersion":"psmdb.percona.com/v1-5-0",
            "fieldsType":"FieldsV1",
            "fieldsV1":{
               "f:metadata":{
                  "f:annotations":{
                     ".":{

                     },
                     "f:kubectl.kubernetes.io/last-applied-configuration":{

                     }
                  }
               },
               "f:spec":{
                  ".":{

                  },
                  "f:allowUnsafeConfigurations":{

                  },
                  "f:backup":{
                     ".":{

                     },
                     "f:enabled":{

                     },
                     "f:image":{

                     },
                     "f:serviceAccountName":{

                     }
                  },
                  "f:image":{

                  },
                  "f:imagePullPolicy":{

                  },
                  "f:mongod":{
                     ".":{

                     },
                     "f:net":{
                        ".":{

                        },
                        "f:port":{

                        }
                     },
                     "f:operationProfiling":{
                        ".":{

                        },
                        "f:mode":{

                        },
                        "f:rateLimit":{

                        },
                        "f:slowOpThresholdMs":{

                        }
                     },
                     "f:security":{
                        ".":{

                        },
                        "f:enableEncryption":{

                        },
                        "f:encryptionCipherMode":{

                        },
                        "f:encryptionKeySecret":{

                        }
                     },
                     "f:setParameter":{
                        ".":{

                        },
                        "f:ttlMonitorSleepSecs":{

                        },
                        "f:wiredTigerConcurrentReadTransactions":{

                        },
                        "f:wiredTigerConcurrentWriteTransactions":{

                        }
                     },
                     "f:storage":{
                        ".":{

                        },
                        "f:engine":{

                        },
                        "f:inMemory":{
                           ".":{

                           },
                           "f:engineConfig":{
                              ".":{

                              },
                              "f:inMemorySizeRatio":{

                              }
                           }
                        },
                        "f:mmapv1":{
                           ".":{

                           },
                           "f:nsSize":{

                           }
                        },
                        "f:wiredTiger":{
                           ".":{

                           },
                           "f:collectionConfig":{
                              ".":{

                              },
                              "f:blockCompressor":{

                              }
                           },
                           "f:engineConfig":{
                              ".":{

                              },
                              "f:cacheSizeRatio":{

                              },
                              "f:journalCompressor":{

                              }
                           },
                           "f:indexConfig":{
                              ".":{

                              },
                              "f:prefixCompression":{

                              }
                           }
                        }
                     }
                  },
                  "f:pmm":{
                     ".":{

                     },
                     "f:image":{

                     },
                     "f:serverHost":{

                     }
                  },
                  "f:secrets":{
                     ".":{

                     },
                     "f:users":{

                     }
                  },
                  "f:updateStrategy":{

                  }
               }
            },
            "manager":"kubectl",
            "operation":"Update",
            "time":"2020-07-24T14:27:58Z"
         },
         {
            "apiVersion":"psmdb.percona.com/v1",
            "fieldsType":"FieldsV1",
            "fieldsV1":{
               "f:spec":{
                  "f:backup":{
                     "f:containerSecurityContext":{
                        ".":{

                        },
                        "f:runAsNonRoot":{

                        },
                        "f:runAsUser":{

                        }
                     },
                     "f:podSecurityContext":{
                        ".":{

                        },
                        "f:fsGroup":{

                        }
                     }
                  },
                  "f:clusterServiceDNSSuffix":{

                  },
                  "f:runUid":{

                  },
                  "f:secrets":{
                     "f:ssl":{

                     },
                     "f:sslInternal":{

                     }
                  }
               },
               "f:status":{
                  ".":{

                  },
                  "f:conditions":{

                  },
                  "f:observedGeneration":{

                  },
                  "f:replsets":{
                     ".":{

                     },
                     "f:rs0":{
                        ".":{

                        },
                        "f:ready":{

                        },
                        "f:size":{

                        },
                        "f:status":{

                        }
                     }
                  },
                  "f:state":{

                  }
               }
            },
            "manager":"percona-server-mongodb-operator",
            "operation":"Update",
            "time":"2020-07-24T15:35:14Z"
         },
         {
            "apiVersion":"psmdb.percona.com/v1",
            "fieldsType":"FieldsV1",
            "fieldsV1":{
               "f:spec":{
                  "f:replsets":{
                     ".":{

                     },
                     "f:size":{

                     }
                  }
               }
            },
            "manager":"kubectl",
            "operation":"Update",
            "time":"2020-07-24T15:43:19Z"
         }
      ],
      "name":"my-cluster-name",
      "namespace":"default",
      "resourceVersion":"1279009",
      "selfLink":"/apis/psmdb.percona.com/v1/namespaces/default/perconaservermongodbs/my-cluster-name",
      "uid":"5207e71a-c83f-4707-b892-63aa93fb615c"
   },
   "spec":{
      "allowUnsafeConfigurations":false,
      "backup":{
         "enabled":true,
         "image":"percona/percona-server-mongodb-operator:1.5.0-backup",
         "restartOnFailure":true,
         "serviceAccountName":"percona-server-mongodb-operator",
         "storages":null,
         "tasks":null
      },
      "image":"percona/percona-server-mongodb:4.2.8-8",
      "imagePullPolicy":"Always",
      "mongod":{
         "net":{
            "hostPort":0,
            "port":27017
         },
         "operationProfiling":{
            "mode":"slowOp",
            "rateLimit":100,
            "slowOpThresholdMs":100
         },
         "security":{
            "enableEncryption":true,
            "encryptionCipherMode":"AES256-CBC",
            "encryptionKeySecret":"my-cluster-name-mongodb-encryption-key",
            "redactClientLogData":false
         },
         "setParameter":{
            "ttlMonitorSleepSecs":60,
            "wiredTigerConcurrentReadTransactions":128,
            "wiredTigerConcurrentWriteTransactions":128
         },
         "storage":{
            "engine":"wiredTiger",
            "inMemory":{
               "engineConfig":{
                  "inMemorySizeRatio":0.9
               }
            },
            "mmapv1":{
               "nsSize":16,
               "smallfiles":false
            },
            "wiredTiger":{
               "collectionConfig":{
                  "blockCompressor":"snappy"
               },
               "engineConfig":{
                  "cacheSizeRatio":0.5,
                  "directoryForIndexes":false,
                  "journalCompressor":"snappy"
               },
               "indexConfig":{
                  "prefixCompression":true
               }
            }
         }
      },
      "pmm":{
         "enabled":false,
         "image":"percona/percona-server-mongodb-operator:1.5.0-pmm",
         "serverHost":"monitoring-service"
      },
      "replsets":{
         "size":"5"
      },
      "secrets":{
         "users":"my-cluster-name-secrets"
      },
      "updateStrategy":"SmartUpdate"
   },
   "status":{
      "conditions":[
         {
            "lastTransitionTime":"2020-07-24T14:28:03Z",
            "status":"True",
            "type":"ClusterInitializing"
         },
         {
            "lastTransitionTime":"2020-07-24T14:28:39Z",
            "status":"True",
            "type":"Error"
         },
         {
            "lastTransitionTime":"2020-07-24T14:28:41Z",
            "status":"True",
            "type":"ClusterInitializing"
         },
         {
            "lastTransitionTime":"2020-07-24T14:28:41Z",
            "status":"True",
            "type":"Error"
         },
         {
            "lastTransitionTime":"2020-07-24T14:29:10Z",
            "status":"True",
            "type":"ClusterReady"
         },
         {
            "lastTransitionTime":"2020-07-24T14:49:46Z",
            "status":"True",
            "type":"ClusterInitializing"
         },
         {
            "lastTransitionTime":"2020-07-24T14:50:00Z",
            "status":"True",
            "type":"ClusterInitializing"
         },
         {
            "lastTransitionTime":"2020-07-24T14:52:31Z",
            "status":"True",
            "type":"ClusterInitializing"
         },
         {
            "lastTransitionTime":"2020-07-24T14:52:43Z",
            "status":"True",
            "type":"Error"
         },
         {
            "lastTransitionTime":"2020-07-24T14:53:01Z",
            "status":"True",
            "type":"ClusterInitializing"
         },
         {
            "lastTransitionTime":"2020-07-24T14:53:05Z",
            "status":"True",
            "type":"ClusterInitializing"
         },
         {
            "lastTransitionTime":"2020-07-24T14:53:05Z",
            "status":"True",
            "type":"ClusterReady"
         }
      ],
      "observedGeneration":1,
      "replsets":{
         "rs0":{
            "ready":3,
            "size":3,
            "status":"ready"
         }
      },
      "state":"ready"
   }
}
```

## Update Percona Server for MongoDB cluster image

**Description:**

```text
Change the image of Percona Server for MongoDB containers inside the cluster
```

**Kubectl Command:**

```bash
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

```bash
$ curl -k -v -XPATCH "https://$API_SERVER/apis/psmdb.percona.com/v1/namespaces/default/perconaservermongodbs/my-cluster-name" \
            -H "Authorization: Bearer $KUBE_TOKEN" \
            -H "Accept: application/json" \
            -H "Content-Type: application/merge-patch+json"
            -d '{
              "spec": {"psmdb":{ "image": "percona/percona-server-mongodb-operator:1.4.0-mongod4.2" }
              }}'
```

**Request Body:**

JSON:

```json
{
"spec": { "image ": "percona/percona-server-mongodb:4.2.8-8" }
}}
```

**Input:**

> **spec**:

> psmdb:


> 1. image (String, min-length: 1) : `name of the image to update for Percona Server for MongoDB`

**Response:**

JSON:

```json
{
   "apiVersion":"psmdb.percona.com/v1",
   "kind":"PerconaServerMongoDB",
   "metadata":{
      "annotations":{
         "kubectl.kubernetes.io/last-applied-configuration":"{\"apiVersion\":\"psmdb.percona.com/v1-5-0\",\"kind\":\"PerconaServerMongoDB\",\"metadata\":{\"annotations\":{},\"name\":\"my-cluster-name\",\"namespace\":\"default\"},\"spec\":{\"allowUnsafeConfigurations\":false,\"backup\":{\"enabled\":true,\"image\":\"percona/percona-server-mongodb-operator:1.5.0-backup\",\"restartOnFailure\":true,\"serviceAccountName\":\"percona-server-mongodb-operator\",\"storages\":null,\"tasks\":null},\"image\":\"percona/percona-server-mongodb:4.2.8-8\",\"imagePullPolicy\":\"Always\",\"mongod\":{\"net\":{\"hostPort\":0,\"port\":27017},\"operationProfiling\":{\"mode\":\"slowOp\",\"rateLimit\":100,\"slowOpThresholdMs\":100},\"security\":{\"enableEncryption\":true,\"encryptionCipherMode\":\"AES256-CBC\",\"encryptionKeySecret\":\"my-cluster-name-mongodb-encryption-key\",\"redactClientLogData\":false},\"setParameter\":{\"ttlMonitorSleepSecs\":60,\"wiredTigerConcurrentReadTransactions\":128,\"wiredTigerConcurrentWriteTransactions\":128},\"storage\":{\"engine\":\"wiredTiger\",\"inMemory\":{\"engineConfig\":{\"inMemorySizeRatio\":0.9}},\"mmapv1\":{\"nsSize\":16,\"smallfiles\":false},\"wiredTiger\":{\"collectionConfig\":{\"blockCompressor\":\"snappy\"},\"engineConfig\":{\"cacheSizeRatio\":0.5,\"directoryForIndexes\":false,\"journalCompressor\":\"snappy\"},\"indexConfig\":{\"prefixCompression\":true}}}},\"pmm\":{\"enabled\":false,\"image\":\"percona/percona-server-mongodb-operator:1.5.0-pmm\",\"serverHost\":\"monitoring-service\"},\"replsets\":[{\"affinity\":{\"antiAffinityTopologyKey\":\"none\"},\"arbiter\":{\"affinity\":{\"antiAffinityTopologyKey\":\"none\"},\"enabled\":false,\"size\":1},\"expose\":{\"enabled\":false,\"exposeType\":\"LoadBalancer\"},\"name\":\"rs0\",\"podDisruptionBudget\":{\"maxUnavailable\":1},\"resources\":{\"limits\":null},\"size\":3,\"volumeSpec\":{\"persistentVolumeClaim\":{\"accessModes\":[\"ReadWriteOnce\"],\"resources\":{\"requests\":{\"storage\":\"3Gi\"}},\"storageClassName\":\"standard\"}}}],\"secrets\":{\"users\":\"my-cluster-name-secrets\"},\"updateStrategy\":\"SmartUpdate\"}}\n"
      },
      "creationTimestamp":"2020-07-24T14:27:58Z",
      "generation":5,
      "managedFields":[
         {
            "apiVersion":"psmdb.percona.com/v1-5-0",
            "fieldsType":"FieldsV1",
            "fieldsV1":{
               "f:metadata":{
                  "f:annotations":{
                     ".":{

                     },
                     "f:kubectl.kubernetes.io/last-applied-configuration":{

                     }
                  }
               },
               "f:spec":{
                  ".":{

                  },
                  "f:allowUnsafeConfigurations":{

                  },
                  "f:backup":{
                     ".":{

                     },
                     "f:enabled":{

                     },
                     "f:image":{

                     },
                     "f:serviceAccountName":{

                     }
                  },
                  "f:image":{

                  },
                  "f:imagePullPolicy":{

                  },
                  "f:mongod":{
                     ".":{

                     },
                     "f:net":{
                        ".":{

                        },
                        "f:port":{

                        }
                     },
                     "f:operationProfiling":{
                        ".":{

                        },
                        "f:mode":{

                        },
                        "f:rateLimit":{

                        },
                        "f:slowOpThresholdMs":{

                        }
                     },
                     "f:security":{
                        ".":{

                        },
                        "f:enableEncryption":{

                        },
                        "f:encryptionCipherMode":{

                        },
                        "f:encryptionKeySecret":{

                        }
                     },
                     "f:setParameter":{
                        ".":{

                        },
                        "f:ttlMonitorSleepSecs":{

                        },
                        "f:wiredTigerConcurrentReadTransactions":{

                        },
                        "f:wiredTigerConcurrentWriteTransactions":{

                        }
                     },
                     "f:storage":{
                        ".":{

                        },
                        "f:engine":{

                        },
                        "f:inMemory":{
                           ".":{

                           },
                           "f:engineConfig":{
                              ".":{

                              },
                              "f:inMemorySizeRatio":{

                              }
                           }
                        },
                        "f:mmapv1":{
                           ".":{

                           },
                           "f:nsSize":{

                           }
                        },
                        "f:wiredTiger":{
                           ".":{

                           },
                           "f:collectionConfig":{
                              ".":{

                              },
                              "f:blockCompressor":{

                              }
                           },
                           "f:engineConfig":{
                              ".":{

                              },
                              "f:cacheSizeRatio":{

                              },
                              "f:journalCompressor":{

                              }
                           },
                           "f:indexConfig":{
                              ".":{

                              },
                              "f:prefixCompression":{

                              }
                           }
                        }
                     }
                  },
                  "f:pmm":{
                     ".":{

                     },
                     "f:image":{

                     },
                     "f:serverHost":{

                     }
                  },
                  "f:secrets":{
                     ".":{

                     },
                     "f:users":{

                     }
                  },
                  "f:updateStrategy":{

                  }
               }
            },
            "manager":"kubectl",
            "operation":"Update",
            "time":"2020-07-24T14:27:58Z"
         },
         {
            "apiVersion":"psmdb.percona.com/v1",
            "fieldsType":"FieldsV1",
            "fieldsV1":{
               "f:spec":{
                  "f:backup":{
                     "f:containerSecurityContext":{
                        ".":{

                        },
                        "f:runAsNonRoot":{

                        },
                        "f:runAsUser":{

                        }
                     },
                     "f:podSecurityContext":{
                        ".":{

                        },
                        "f:fsGroup":{

                        }
                     }
                  },
                  "f:clusterServiceDNSSuffix":{

                  },
                  "f:runUid":{

                  },
                  "f:secrets":{
                     "f:ssl":{

                     },
                     "f:sslInternal":{

                     }
                  }
               },
               "f:status":{
                  ".":{

                  },
                  "f:conditions":{

                  },
                  "f:observedGeneration":{

                  },
                  "f:replsets":{
                     ".":{

                     },
                     "f:rs0":{
                        ".":{

                        },
                        "f:ready":{

                        },
                        "f:size":{

                        },
                        "f:status":{

                        }
                     }
                  },
                  "f:state":{

                  }
               }
            },
            "manager":"percona-server-mongodb-operator",
            "operation":"Update",
            "time":"2020-07-24T15:35:14Z"
         },
         {
            "apiVersion":"psmdb.percona.com/v1",
            "fieldsType":"FieldsV1",
            "fieldsV1":{
               "f:spec":{
                  "f:image ":{

                  },
                  "f:replsets":{
                     ".":{

                     },
                     "f:size":{

                     }
                  }
               }
            },
            "manager":"kubectl",
            "operation":"Update",
            "time":"2020-07-27T12:21:39Z"
         }
      ],
      "name":"my-cluster-name",
      "namespace":"default",
      "resourceVersion":"1279853",
      "selfLink":"/apis/psmdb.percona.com/v1/namespaces/default/perconaservermongodbs/my-cluster-name",
      "uid":"5207e71a-c83f-4707-b892-63aa93fb615c"
   },
   "spec":{
      "allowUnsafeConfigurations":false,
      "backup":{
         "enabled":true,
         "image":"percona/percona-server-mongodb-operator:1.5.0-backup",
         "restartOnFailure":true,
         "serviceAccountName":"percona-server-mongodb-operator",
         "storages":null,
         "tasks":null
      },
      "image ":"percona/percona-server-mongodb:4.2.8-8",
      "imagePullPolicy":"Always",
      "mongod":{
         "net":{
            "hostPort":0,
            "port":27017
         },
         "operationProfiling":{
            "mode":"slowOp",
            "rateLimit":100,
            "slowOpThresholdMs":100
         },
         "security":{
            "enableEncryption":true,
            "encryptionCipherMode":"AES256-CBC",
            "encryptionKeySecret":"my-cluster-name-mongodb-encryption-key",
            "redactClientLogData":false
         },
         "setParameter":{
            "ttlMonitorSleepSecs":60,
            "wiredTigerConcurrentReadTransactions":128,
            "wiredTigerConcurrentWriteTransactions":128
         },
         "storage":{
            "engine":"wiredTiger",
            "inMemory":{
               "engineConfig":{
                  "inMemorySizeRatio":0.9
               }
            },
            "mmapv1":{
               "nsSize":16,
               "smallfiles":false
            },
            "wiredTiger":{
               "collectionConfig":{
                  "blockCompressor":"snappy"
               },
               "engineConfig":{
                  "cacheSizeRatio":0.5,
                  "directoryForIndexes":false,
                  "journalCompressor":"snappy"
               },
               "indexConfig":{
                  "prefixCompression":true
               }
            }
         }
      },
      "pmm":{
         "enabled":false,
         "image":"percona/percona-server-mongodb-operator:1.5.0-pmm",
         "serverHost":"monitoring-service"
      },
      "replsets":{
         "size":"5"
      },
      "secrets":{
         "users":"my-cluster-name-secrets"
      },
      "updateStrategy":"SmartUpdate"
   },
   "status":{
      "conditions":[
         {
            "lastTransitionTime":"2020-07-24T14:28:03Z",
            "status":"True",
            "type":"ClusterInitializing"
         },
         {
            "lastTransitionTime":"2020-07-24T14:28:39Z",
            "status":"True",
            "type":"Error"
         },
         {
            "lastTransitionTime":"2020-07-24T14:28:41Z",
            "status":"True",
            "type":"ClusterInitializing"
         },
         {
            "lastTransitionTime":"2020-07-24T14:28:41Z",
            "status":"True",
            "type":"Error"
         },
         {
            "lastTransitionTime":"2020-07-24T14:29:10Z",
            "status":"True",
            "type":"ClusterReady"
         },
         {
            "lastTransitionTime":"2020-07-24T14:49:46Z",
            "status":"True",
            "type":"ClusterInitializing"
         },
         {
            "lastTransitionTime":"2020-07-24T14:50:00Z",
            "status":"True",
            "type":"ClusterInitializing"
         },
         {
            "lastTransitionTime":"2020-07-24T14:52:31Z",
            "status":"True",
            "type":"ClusterInitializing"
         },
         {
            "lastTransitionTime":"2020-07-24T14:52:43Z",
            "status":"True",
            "type":"Error"
         },
         {
            "lastTransitionTime":"2020-07-24T14:53:01Z",
            "status":"True",
            "type":"ClusterInitializing"
         },
         {
            "lastTransitionTime":"2020-07-24T14:53:05Z",
            "status":"True",
            "type":"ClusterInitializing"
         },
         {
            "lastTransitionTime":"2020-07-24T14:53:05Z",
            "status":"True",
            "type":"ClusterReady"
         }
      ],
      "observedGeneration":1,
      "replsets":{
         "rs0":{
            "ready":3,
            "size":3,
            "status":"ready"
         }
      },
      "state":"ready"
   }
}
```

## Backup Percona Server for MongoDB cluster

**Description:**

```text
Takes a backup of the Percona Server for MongoDB cluster containers data to be able to recover from disasters or make a roll-back later
```

**Kubectl Command:**

```bash
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

```bash
$ curl -k -v -XPOST "https://$API_SERVER/apis/psmdb.percona.com/v1/namespaces/default/perconaservermongodbbackups" \
            -H "Accept: application/json" \
            -H "Content-Type: application/json" \
            -d "@backup.json" -H "Authorization: Bearer $KUBE_TOKEN"
```

**Request Body (backup.json):**

JSON:

```json
{
   "apiVersion":"psmdb.percona.com/v1",
   "kind":"PerconaServerMongoDBBackup",
   "metadata":{
      "name":"backup1",
      "namespace":"default"
   },
   "spec":{
      "psmdbCluster":"my-cluster-name",
      "storageName":"s3-us-west"
   }
}
```

**Input:**


1. **metadata**:

> name(String, min-length:1) : `name of backup to create`


2. **spec**:

> 
>     1. psmdbCluster(String, min-length:1) : `name of Percona Server for MongoDB cluster`


>     2. storageName(String, min-length:1) : `name of storage claim to use`

**Response:**

JSON:

```json
{
   "apiVersion":"psmdb.percona.com/v1",
   "kind":"PerconaServerMongoDBBackup",
   "metadata":{
      "annotations":{
         "kubectl.kubernetes.io/last-applied-configuration":"{\"apiVersion\":\"psmdb.percona.com/v1\",\"kind\":\"PerconaServerMongoDBBackup\",\"metadata\":{\"annotations\":{},\"name\":\"backup1\",\"namespace\":\"default\"},\"spec\":{\"psmdbCluster\":\"my-cluster-name\",\"storageName\":\"s3-us-west\"}}\n"
      },
      "creationTimestamp":"2020-07-27T13:45:43Z",
      "generation":1,
      "managedFields":[
         {
            "apiVersion":"psmdb.percona.com/v1",
            "fieldsType":"FieldsV1",
            "fieldsV1":{
               "f:metadata":{
                  "f:annotations":{
                     ".":{

                     },
                     "f:kubectl.kubernetes.io/last-applied-configuration":{

                     }
                  }
               },
               "f:spec":{
                  ".":{

                  },
                  "f:psmdbCluster":{

                  },
                  "f:storageName":{

                  }
               }
            },
            "manager":"kubectl",
            "operation":"Update",
            "time":"2020-07-27T13:45:43Z"
         }
      ],
      "name":"backup1",
      "namespace":"default",
      "resourceVersion":"1290243",
      "selfLink":"/apis/psmdb.percona.com/v1/namespaces/default/perconaservermongodbbackups/backup1",
      "uid":"e695d1c7-898e-44b0-b356-537284f6c046"
   },
   "spec":{
      "psmdbCluster":"my-cluster-name",
      "storageName":"s3-us-west"
   }
}
```

## Restore Percona Server for MongoDB cluster

**Description:**

```text
Restores Percona Server for MongoDB cluster data to an earlier version to recover from a problem or to make a roll-back
```

**Kubectl Command:**

```bash
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

```bash
$ curl -k -v -XPOST "https://$API_SERVER/apis/psmdb.percona.com/v1/namespaces/default/perconaservermongodbrestores" \
            -H "Accept: application/json" \
            -H "Content-Type: application/json" \
            -d "@restore.json" \
            -H "Authorization: Bearer $KUBE_TOKEN"
```

**Request Body (restore.json):**

JSON:

```json
{
   "apiVersion":"psmdb.percona.com/v1",
   "kind":"PerconaServerMongoDBRestore",
   "metadata":{
      "name":"restore1",
      "namespace":"default"
   },
   "spec":{
      "backupName":"backup1",
      "clusterName":"my-cluster-name"
   }
}
```

**Input:**


1. **metadata**:

> name(String, min-length:1): `name of restore to create`


2. **spec**:

> 
>     1. clusterName(String, min-length:1) : `name of Percona Server for MongoDB cluster`


>     2. backupName(String, min-length:1) : `name of backup to restore from`

**Response:**

JSON:

```json
{
   "apiVersion":"psmdb.percona.com/v1",
   "kind":"PerconaServerMongoDBRestore",
   "metadata":{
      "annotations":{
         "kubectl.kubernetes.io/last-applied-configuration":"{\"apiVersion\":\"psmdb.percona.com/v1\",\"kind\":\"PerconaServerMongoDBRestore\",\"metadata\":{\"annotations\":{},\"name\":\"restore1\",\"namespace\":\"default\"},\"spec\":{\"backupName\":\"backup1\",\"clusterName\":\"my-cluster-name\"}}\n"
      },
      "creationTimestamp":"2020-07-27T13:52:56Z",
      "generation":1,
      "managedFields":[
         {
            "apiVersion":"psmdb.percona.com/v1",
            "fieldsType":"FieldsV1",
            "fieldsV1":{
               "f:metadata":{
                  "f:annotations":{
                     ".":{

                     },
                     "f:kubectl.kubernetes.io/last-applied-configuration":{

                     }
                  }
               },
               "f:spec":{
                  ".":{

                  },
                  "f:backupName":{

                  },
                  "f:clusterName":{

                  }
               }
            },
            "manager":"kubectl",
            "operation":"Update",
            "time":"2020-07-27T13:52:56Z"
         }
      ],
      "name":"restore1",
      "namespace":"default",
      "resourceVersion":"1291198",
      "selfLink":"/apis/psmdb.percona.com/v1/namespaces/default/perconaservermongodbrestores/restore1",
      "uid":"17e982fe-ac41-47f4-afba-fea380b0c76e"
   },
   "spec":{
      "backupName":"backup1",
      "clusterName":"my-cluster-name"
   }
}
```
