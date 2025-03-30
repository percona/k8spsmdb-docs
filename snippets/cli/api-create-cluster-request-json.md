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
