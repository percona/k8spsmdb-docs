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

## <a name="annotations-ignore"></a>Specifying labels and annotations ignored by the Operator

Sometimes various Kubernetes flavors can add their own annotations to the
objects managed by the Operator.

The Operator keeps track of all changes to its objects and can remove
annotations that appeared without its participation.

If there are no annotations or labels in the Custom Resource, the Operator does
nothing if new label or annotation added to the object.

If there is an annotation or a label specified in the Custom Resource, the
Operator starts to manage annotations and labels. In this case it removes
unknown annotations and labels.

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

!!! note

    The ignorance policy can be overturned by `expose.serviceAnnotations` and `expose.serviceLabels` fields.


    spec.ignoreAnnotations and spec.ignoreLabels are idle when explicitly stated and populated with content (thanks to general annotations/labels ignorance policy)
    Overall ignorance policy is being overturned by .expose.serviceAnnotations .expose.serviceLabels fields.
    Only after permissive annotations/labels policy have been switched to restrictive (by .expose.serviceAnnotations ) spec.ignoreAnnotations and spec.ignoreLabels actually start to work

Generic services like -cfg, -rs, -mongos only accumulate incoming annotations and labels no matter expose.enabled: true or false. The user is to remove obsolete data from service objects manually.
The operator strictly controls annotation/labels only at explicit services like -cfg-N, -rs0-N. They would pop up only if  expose.enabled: true. In such a case the annotations/labels to preserve originate only from

    spec.ignoreAnnotations
    spec.ignoreLabels
    ...expose.serviceAnnotations
    ...expose.serviceLabels.



