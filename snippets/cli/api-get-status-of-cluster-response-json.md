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
