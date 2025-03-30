# Changing MongoDB Options

You may require a configuration change for your application. MongoDB allows
configuring the database with a configuration file, as many other database
management systems do. You can pass options to MongoDB instances in the cluster
in one of the following ways:

* edit the `deploy/cr.yaml` file,
* use a ConfigMap,
* use a Secret object.

You can pass configuration settings separately for **mongod** Pods,
**mongos** Pods, and **Config Server** Pods.

Often there's no need to add custom options, as the Operator takes care of
providing MongoDB with reasonable defaults. Also, attempt to change some
MongoDB options will be ignored: you can't change TLS/SSL options, as it would
break the behavior of the Operator.

## Edit the `deploy/cr.yaml` file

You can add MongoDB configuration options to the
[replsets.configuration](operator.md#replsetsconfiguration),
[sharding.mongos.configuration](operator.md#shardingmongosconfiguration), and
[sharding-configsvrreplset-configuration](operator.md#shardingconfigsvrreplsetconfiguration)
keys of the `deploy/cr.yaml`. Here is an example:

```yaml
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

See the [official manual  :octicons-link-external-16:](https://docs.mongodb.com/manual/reference/configuration-options/)
for the complete list of options, as well as
[specific  :octicons-link-external-16:](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/rate-limit.html)
[Percona  :octicons-link-external-16:](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/inmemory.html)
[Server  :octicons-link-external-16:](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/data_at_rest_encryption.html)
[for MongoDB  :octicons-link-external-16:](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/log-redaction.html)
[documentation pages  :octicons-link-external-16:](https://www.percona.com/doc/percona-server-for-mongodb/LATEST/audit-logging.html).

## Use a ConfigMap

You can use a [ConfigMap  :octicons-link-external-16:](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/)
and the cluster restart to reset configuration options. A ConfigMap allows
Kubernetes to pass or update configuration data inside a containerized
application.

You should give the ConfigMap a specific name, which is composed of your cluster
name and a specific suffix:

* `my-cluster-name-rs0-mongod` for the Replica Set (mongod) Pods,
* `my-cluster-name-cfg-mongod` for the Config Server Pods,
* `my-cluster-name-mongos` for the mongos Pods,

!!! note

    To find the cluster name, you can use the following command:

    ```bash
    $ kubectl get psmdb
    ```

For example, let’s define a `mongod.conf` configuration file and put there
several MongoDB options we used in the previous example:

```yaml
operationProfiling:
  mode: slowOp
systemLog:
  verbosity: 1
```

You can create a ConfigMap from the `mongod.conf` file with the
`kubectl create configmap` command. It has the following syntax:

``` {.bash data-prompt="$" }
$ kubectl create configmap <configmap-name> <resource-type=resource-name>
```

The following example defines `my-cluster-name-rs0-mongod` as the ConfigMap name
and the `mongod.conf` file as the data source:

``` {.bash data-prompt="$" }
$ kubectl create configmap my-cluster-name-rs0-mongod --from-file=mongod.conf=mongod.conf
```

To view the created ConfigMap, use the following command:

``` {.bash data-prompt="$" }
$ kubectl describe configmaps my-cluster-name-rs0-mongod
```

!!! note

    Do not forget to restart Percona Server for MongoDB to ensure the
    cluster has updated the configuration (see details on how to connect in the
    [Install Percona Server for MongoDB on Kubernetes](kubernetes.md)
    page).

## Use a Secret Object

The Operator can also store configuration options in [Kubernetes Secrets  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/).
This can be useful if you need additional protection for some sensitive data.

You should create a Secret object with a specific name, composed of your cluster
name and a specific suffix:

* `my-cluster-name-rs0-mongod` for the Replica Set Pods,
* `my-cluster-name-cfg-mongod` for the Config Server Pods,
* `my-cluster-name-mongos` for the mongos Pods,

!!! note

    To find the cluster name, you can use the following command:

    ```bash
    $ kubectl get psmdb
    ```

Configuration options should be put inside a specific key:

* `data.mongod` key for Replica Set (mongod) and Config Server Pods,
* `data.mongos` key for mongos Pods.

Actual options should be encoded with [Base64  :octicons-link-external-16:](https://en.wikipedia.org/wiki/Base64).

For example, let’s define a `mongod.conf` configuration file and put there
several MongoDB options we used in the previous example:

```yaml
operationProfiling:
  mode: slowOp
systemLog:
  verbosity: 1
```

You can get a Base64 encoded string from your options via the command line as
follows:

=== "in Linux"

    ``` {.bash data-prompt="$" }
    $ cat mongod.conf | base64 --wrap=0
    ```

=== "in macOS"

    ``` {.bash data-prompt="$" }
    $ cat mongod.conf | base64
    ```

!!! note

    Similarly, you can read the list of options from a Base64 encoded
    string:

    ``` {.bash data-prompt="$" }
    $ echo "ICAgICAgb3BlcmF0aW9uUHJvZmlsaW5nOgogICAgICAgIG1vZGU6IHNsb3dPc\
    AogICAgICBzeXN0ZW1Mb2c6CiAgICAgICAgdmVyYm9zaXR5OiAxCg==" | base64 --decode
    ```

Finally, use a yaml file to create the Secret object. For example, you can
create a `deploy/my-mongod-secret.yaml` file with the following contents:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-cluster-name-rs0-mongod
data:
  mongod.conf: "ICAgICAgb3BlcmF0aW9uUHJvZmlsaW5nOgogICAgICAgIG1vZGU6IHNsb3dPc\
   AogICAgICBzeXN0ZW1Mb2c6CiAgICAgICAgdmVyYm9zaXR5OiAxCg=="
```

When ready, apply it with the following command:

``` {.bash data-prompt="$" }
$ kubectl create -f deploy/my-mongod-secret.yaml
```

!!! note

    Do not forget to restart Percona Server for MongoDB to ensure the
    cluster has updated the configuration (see details on how to connect in the
    [Install Percona Server for MongoDB on Kubernetes](kubernetes.md)
    page).
