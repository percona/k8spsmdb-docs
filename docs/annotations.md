# Labels and annotations

[Labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/)
and [annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/)
are used to attach additional metadata information to Kubernetes resources.

Labels and annotations are rather similar. The difference between them is that
labels are used by Kubernetes to identify and select objects, while annotations
are assigning additional *non-identifying* information to resources.
Therefore, typical role of Annotations is facilitating integration with some
external tools.

## Setting labels and annotations in the Custom Resource

You can set labels and/or annotations as key/value string pairs in the Custom
Resource metadata section of the `deploy/cr.yaml` as follows:

```yaml
apiVersion: psmdb.percona.com/v1
kind: PerconaServerMongoDB
metadata:
  name: my-cluster-name
  annotations:
    percona.com/issue-vault-token: "true"
  labels:
    ...
```

The easiest way to check which labels are attached to a specific object with is
using the additional `--show-labels` option of the `kubectl get` command.
Checking the annotations is not much more difficult: it can be done as in the
following example:

``` {.bash data-prompt="$" }
$ kubectl get pod my-cluster-name-rs0-0 -o jsonpath='{.metadata.annotations}'
```

## <a name="annotations-ignore"></a>Using labels and annotations with objects created by the Operator

You can assign labels and annotations to various objects created by the Operator
(e.g. Services used to expose components of the cluster, Persistent Volume
Claims, etc.) vith `labels` and `annotations` options in the appropriate
subsections of the Custom Resource, as seen in the [Custom Resource options reference](operator.md) and the [deploy/cr.yaml configuration file](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml).

Sometimes various Kubernetes flavors can add their own annotations to the
objects managed by the Operator.

The Operator keeps track of all changes to its objects and can remove
annotations that appeared without its participation. 

If there are no annotations or labels in the Custom Resource `expose`
subsections, the Operator does nothing if new label or annotation added to the
object.

If there is an annotation or a label specified in the Custom Resource `expose`
subsection, the Operator starts to manage annotations and labels for Services
exposing objects in [Service per Pod](expose.md#service-per-pod) mode, if any:
it removes unknown annotations and labels for them.

Still, it is possible to specify which annotations and labels should be
ignored by the Operator by listing them in the `spec.ignoreAnnotations` or
`spec.ignoreLabels` keys of the `deploy/cr.yaml`, as follows:

```yaml

spec:
  ignoreAnnotations:
    - some.custom.cloud.annotation/smth
  ignoreLabels:
    - some.custom.cloud.label/smth
...
```

The Operator will ignore any Service annotation or label, key of which
**starts** with the mentioned above examples. For example, the following
annotations and labels will be ignored after applying the above `cr.yaml`
fragment:

```yaml
annotations:
  some.custom.cloud.annotation/smth: somethinghere
labels:
  some.custom.cloud.label/smth: somethinghere
```

