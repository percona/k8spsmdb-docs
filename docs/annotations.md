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
Claims, etc.) with labels and annotations options in the appropriate subsections
of the Custom Resource, as seen in the [Custom Resource options reference](operator.md)
and the [deploy/cr.yaml configuration file](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml).

Sometimes various Kubernetes flavors can add their own annotations to the
objects managed by the Operator.

The Operator keeps track of all changes to its objects and can remove
annotations that appeared without its participation.

If there are no annotations or labels in the Custom Resource expose subsections,
the Operator does nothing if a new label or annotation is added to the object.

If the [Service per Pod](expose.md#service-per-pod) mode is not used, the
Operator **won't remove any annotations and labels** from any Services related
to *this expose subsection*. Though, it is still possible to add annotations and
labels via the Custom Resource in this case. Use the appropriate
`expose.serviceAnnotations` and `expose.serviceLabels` fields.

Else, if the [Service per Pod](expose.md#service-per-pod) mode is active, the
Operator removes unknown annotations and labels from Services
*created by the Operator for Pods*. Yet it is still possible to specify which
annotations and labels should be preserved (not wiped out) by the Operator. List
them in the `spec.ignoreAnnotations` or `spec.ignoreLabels` fields of the
`deploy/cr.yaml`, as follows:

```yaml

spec:
  ignoreAnnotations:
    - some.custom.cloud.annotation/smth
  ignoreLabels:
    - some.custom.cloud.label/smth
...
```

The Operator will keep any Service annotation or label, key of which
**starts** with the specified string. For example, the following annotations and
labels will be **not removed** after applying the above `cr.yaml` fragment:

```yaml
kind: Service
apiVersion: v1
metadata:
  name: my-cluster-name-cfg
  ...
  labels:
    some.custom.cloud.label/smth: somethinghere
    ...
  annotations:
    some.custom.cloud.annotation/smth: somethinghere
    ...
```

