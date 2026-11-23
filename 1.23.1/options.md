> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Changing MongoDB options

When you deploy a new Percona Server for MongoDB cluster, the Operator spins it up with the set of defaults that ensure its correct operation. However, your application may need additional configuration of MongoDB. You can define this configuration using the `mongod.conf` configuration file options. You can configure mongod Pods, mongos Pods and config server replica set Pods separately, based on your requirements.\
Then you pass these options to MongoDB instances in the cluster in one of the following ways:

- [Changing MongoDB options](#changing-mongodb-options)
- [Edit the `deploy/cr.yaml` file](#edit-the-deploycryaml-file)
  - [Example](#example)
- [Use a ConfigMap](#use-a-configmap)
- [Use a Secret Object](#use-a-secret-object)

Note that you can’t change options that may break the behavior of the Operator. For example, TLS/SSL options. If you try changing such options, your changes will be ignored.

Some options, such as `enableLocalhostAuthBypass`, can be set via `replsets.configuration` and, for sharded clusters, `sharding.configsvrReplSet.configuration`, but only on running clusters. Setting them before the cluster has bootstrapped prevents initialization. See [Disable localhost authentication bypass](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/auth-bypass-localhost.html) for details.

Important

When you set options through `configuration`, the Operator passes them to the database as-is and does not validate them. If you make a typo, the database will not start. The Operator will not reject the Custom Resource.

## Edit the `deploy/cr.yaml` file

You can add MongoDB configuration options to the following keys of the `deploy/cr.yaml`:

- [replsets.configuration](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#replsetsconfiguration)
- [sharding.mongos.configuration](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#shardingmongosconfiguration)
- [sharding.configsvrReplSet.configuration](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#shardingconfigsvrreplsetconfiguration)

### Example

This example shows how to enable [rate limit for database profiler](https://docs.percona.com/percona-server-for-mongodb/rate-limit.html) and define the default verbosity level for system log:

```
spec:
  ...
  replsets:
    - name: rs0
      size: 3
      configuration: |
        operationProfiling:
          mode: slowOp
        systemLog:
          verbosity: 1
      ...
```

Find the complete list of options in the [official manual](https://docs.mongodb.com/manual/reference/configuration-options/) . Also refer to these pages in Percona Server for MongoDB documentation:

- [Profiling rate limit](https://docs.percona.com/percona-server-for-mongodb/rate-limit.html)
- [Percona memory engine](https://docs.percona.com/percona-server-for-mongodb/LATEST/inmemory.html)
- [Data-at-rest encryption](https://docs.percona.com/percona-server-for-mongodb/data-at-rest-encryption.html)
- [Log redaction](https://docs.percona.com/percona-server-for-mongodb/LATEST/log-redaction.html)
- [Audit logging](https://docs.percona.com/percona-server-for-mongodb/LATEST/audit-logging.html) .

## Use a ConfigMap

You can use a [ConfigMap](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/) and the cluster restart to reset configuration options. A ConfigMap allows Kubernetes to pass or update configuration data inside a containerized application.

You should give the ConfigMap a specific name, which is composed of your cluster name and a specific suffix:

- `my-cluster-name-rs0-mongod` for the Replica Set (mongod) Pods,
- `my-cluster-name-cfg-mongod` for the Config Server Pods,
- `my-cluster-name-mongos` for the mongos Pods,

Note

To find the cluster name, you can use the following command:

```
kubectl get psmdb
```

For example, let’s define a `mongod.conf` configuration file and put there several MongoDB options we used in the previous example:

```
operationProfiling:
  mode: slowOp
systemLog:
  verbosity: 1
```

You can create a ConfigMap from the `mongod.conf` file with the `kubectl create configmap` command. It has the following syntax:

```
kubectl create configmap <configmap-name> <resource-type=resource-name>
```

The following example defines `my-cluster-name-rs0-mongod` as the ConfigMap name and the `mongod.conf` file as the data source:

```
kubectl create configmap my-cluster-name-rs0-mongod --from-file=mongod.conf=mongod.conf
```

To view the created ConfigMap, use the following command:

```
kubectl describe configmaps my-cluster-name-rs0-mongod
```

Note

Do not forget to restart Percona Server for MongoDB to ensure the cluster has updated the configuration (see details on how to connect in the [Install Percona Server for MongoDB on Kubernetes](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/kubernetes.html) page).

## Use a Secret Object

The Operator can also store configuration options in [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/) . This can be useful if you need additional protection for some sensitive data.

You should create a Secret object with a specific name, composed of your cluster name and a specific suffix:

- `my-cluster-name-rs0-mongod` for the Replica Set Pods,
- `my-cluster-name-cfg-mongod` for the Config Server Pods,
- `my-cluster-name-mongos` for the mongos Pods,

Note

To find the cluster name, you can use the following command:

```
kubectl get psmdb
```

Configuration options should be put inside a specific key:

- `data.mongod` key for Replica Set (mongod) and Config Server Pods,
- `data.mongos` key for mongos Pods.

Actual options should be encoded with [Base64](https://en.wikipedia.org/wiki/Base64) .

For example, let’s define a `mongod.conf` configuration file and put there several MongoDB options we used in the previous example:

```
operationProfiling:
  mode: slowOp
systemLog:
  verbosity: 1
```

You can get a Base64 encoded string from your options via the command line as follows:

**in Linux**

```
cat mongod.conf | base64 --wrap=0
```

**in macOS**

```
cat mongod.conf | base64
```

Note

Similarly, you can read the list of options from a Base64 encoded string:

```
echo "ICAgICAgb3BlcmF0aW9uUHJvZmlsaW5nOgogICAgICAgIG1vZGU6IHNsb3dPc\
AogICAgICBzeXN0ZW1Mb2c6CiAgICAgICAgdmVyYm9zaXR5OiAxCg==" | base64 --decode
```

Finally, use a yaml file to create the Secret object. For example, you can create a `deploy/my-mongod-secret.yaml` file with the following contents:

```
apiVersion: v1
kind: Secret
metadata:
  name: my-cluster-name-rs0-mongod
data:
  mongod.conf: "ICAgICAgb3BlcmF0aW9uUHJvZmlsaW5nOgogICAgICAgIG1vZGU6IHNsb3dPc\
   AogICAgICBzeXN0ZW1Mb2c6CiAgICAgICAgdmVyYm9zaXR5OiAxCg=="
```

When ready, apply it with the following command:

```
kubectl create -f deploy/my-mongod-secret.yaml
```

Note

Do not forget to restart Percona Server for MongoDB to ensure the cluster has updated the configuration (see details on how to connect in the [Install Percona Server for MongoDB on Kubernetes](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/kubernetes.html) page).
