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
