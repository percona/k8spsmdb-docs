# `crVersion` behavior

Use this page to understand what the Operator does with each `crVersion` value before you change it.

## What `crVersion` does

The `spec.crVersion` option in the Custom Resource sets the behavior level of a cluster. The Operator compares it against its own feature thresholds to decide which features, defaults, and StatefulSet settings to apply. That is why `crVersion` is more than a label: when you change it in either direction, the Operator updates the StatefulSets and the database Pods roll.

Check the value of a running cluster:

```bash
kubectl get psmdb <cluster-name> -n <namespace> -o jsonpath='{.spec.crVersion}'
```

??? example "Sample output"
    
    ```text
    {{release}}
    ```

### How the Operator handles different values

| Value in the Custom Resource | What happens |
| --- | --- |
| A released Operator version, for example `{{release}}` | The Operator manages the cluster with the behavior of that version. |
| Omitted | On the first reconcile, the Operator writes its own version into the Custom Resource and logs `Set CR version`. The value then stays fixed: a later Operator upgrade does not change it and does not roll the Pods. |
| Older than the Operator | The Operator reconciles the cluster normally and does not reject the value, even outside the [supported version window](update.md#why-the-stages-can-be-separated). The Operator uses the [init image](#init-image) that matches `crVersion`. |
| Newer than the Operator or a pre-release, for example `9.9.9` or `1.24.0-beta` | The Operator accepts the value without a warning. Unless you set `initImage`, the init container image tag equals that value, so the Pods stay in `Init:ErrImagePull` because the tag does not exist. |
| A two-part string, for example `"1.2"` | The Operator accepts it and treats it as `1.2.0`, a very old behavior level. Always use the full `major.minor.patch` version. |
| An unquoted two-part number, for example `1.24` | YAML reads it as a number, and the Kubernetes API server rejects the Custom Resource with `spec.crVersion in body must be of type string`. |
| A string that is not a version, for example `abc` | The Kubernetes API server accepts it, but the Operator cannot parse it. Every reconcile fails, the Operator log shows `malformed version: abc`, and the cluster stays in the `initializing` state with no `status.message`. Other clusters managed by the same Operator are not affected. The cluster recovers once you set a valid version. |

### Why to set `crVersion` explicitly

Omitting `crVersion` works, but we recommend setting it explicitly in your manifest. With an explicit value, you decide when the cluster behavior changes and when the Pods roll.

When your manifest omits the option, the value the Operator filled in lives only in the live Custom Resource. Some ways of re-applying the manifest remove it. The Operator then sets `crVersion` to its own version, which rolls the Pods and moves the cluster to the new behavior at a time you didn't plan.

If you deploy with CI tools like Argo CD, an omitted `crVersion` also makes the cluster drift from Git. See [Keep Argo CD in sync with `crVersion`](#keep-argo-cd-in-sync-with-crversion).

### Re-apply a manifest that omits `crVersion`

The following table shows what happens to a running cluster when you re-apply a manifest without `crVersion`, with a newer Operator installed:

| Command | Result |
| --- | --- |
| `kubectl apply -f`, and your manifest never contained `crVersion` | The value is kept. Pods don't roll. |
| `kubectl apply -f`, and the previously applied manifest contained `crVersion` | The value is removed, the Operator sets it to its own version, and the Pods roll. |
| `kubectl apply --server-side -f`, and your manifest never contained `crVersion` | The value is kept. Pods don't roll. |
| `kubectl apply --server-side -f`, and you previously applied `crVersion` with server-side apply | The value is removed, the Operator sets it to its own version, and the Pods roll. |
| `kubectl replace -f` | The value is removed, the Operator sets it to its own version, and the Pods roll. |
| `kubectl edit`, deleting the `crVersion` line | The value is removed, the Operator sets it to its own version, and the Pods roll. |
| Delete the Custom Resource and create it again | The new Custom Resource gets the Operator's own version. |

### Keep Argo CD in sync with `crVersion`

If the manifest in Git omits `crVersion`, the Operator adds the field to the live Custom Resource. Git then no longer matches the cluster:

* With manual sync, Argo CD shows the application as out of sync all the time.
* With automated sync, Argo CD and the Operator can keep undoing each other's changes.

To avoid this, use one of these options:

1. Set `crVersion` explicitly in the manifest in Git. We recommend this option because you can still upgrade the cluster by changing `crVersion` in Git.
2. Tell Argo CD to ignore the field. Add the following to your Argo CD `Application`:

    ```yaml
    spec:
      ignoreDifferences:
        - group: psmdb.percona.com
          kind: PerconaServerMongoDB
          jsonPointers:
            - /spec/crVersion
      syncPolicy:
        syncOptions:
          - RespectIgnoreDifferences=true
    ```

    By default, `ignoreDifferences` only affects the out-of-sync check. The `RespectIgnoreDifferences=true` option makes sync skip the ignored field as well. See [Diff customization :octicons-link-external-16:](https://argo-cd.readthedocs.io/en/stable/user-guide/diffing/) and [Sync options :octicons-link-external-16:](https://argo-cd.readthedocs.io/en/latest/user-guide/sync-options/) in the Argo CD documentation.

    With this option, Argo CD removes `crVersion` from the manifest before it applies it, so changing `crVersion` in Git doesn't change the cluster. To upgrade the cluster, change `crVersion` directly in the cluster, for example with `kubectl patch`.

### Init image

The `mongo-init` init container copies the entrypoint scripts and helper binaries from the Operator image into the database Pods. If you don't set [`initImage`](operator.md#initimage) and `crVersion` differs from the Operator version, the Operator builds the init image name from its own image and replaces the tag with `crVersion`. For example, Operator `1.23.1` running a cluster with `crVersion: 1.22.0` uses `percona/percona-server-mongodb-operator:1.22.0`.

That image tag must exist in the registry you pull from. If you use a [custom registry](custom-registry.md), mirror the Operator image tags that match the `crVersion` of your clusters, or set `initImage` explicitly.

## See also

* [Update Percona Operator for MongoDB](update.md)
* [Upgrade the Operator and CRD](update-operator.md)
* [`crVersion` option reference](operator.md#crversion)
* [Troubleshoot upgrades and `crVersion` problems](debug-upgrade.md)
