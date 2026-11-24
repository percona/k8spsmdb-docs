# Troubleshoot upgrades and `crVersion` problems

Use this page when a cluster misbehaves after an upgrade, after you changed `crVersion`, or after you re-applied a manifest. Find your symptom:

- [Troubleshoot upgrades and `crVersion` problems](#troubleshoot-upgrades-and-crversion-problems)
    - [Pods stuck in `Init:ErrImagePull`](#pods-stuck-in-initerrimagepull)
    - [Cluster stuck in `initializing` with `malformed version` in the log](#cluster-stuck-in-initializing-with-malformed-version-in-the-log)
    - [API server rejects `crVersion`](#api-server-rejects-crversion)
    - [Pods restarted after you re-applied a manifest](#pods-restarted-after-you-re-applied-a-manifest)
    - [Argo CD shows the application as out of sync](#argo-cd-shows-the-application-as-out-of-sync)
    - [None of these match](#none-of-these-match)
    - [See also](#see-also)

For what the Operator does with each `crVersion` value, see [`crVersion` behavior](update-crversion.md).

## Pods stuck in `Init:ErrImagePull`

**Impact:** The affected Pods can't start, because the init container image doesn't exist in your registry. Check how many Pods are affected with `kubectl get pods -n <namespace>`.

**Cause:** `crVersion` is newer than the Operator or is a pre-release value, or the Operator image tag that matches `crVersion` is missing from your registry. Unless you set `initImage`, the Operator uses `crVersion` as the tag of the init container image.

**Check:** Describe the Pod and look at the `mongo-init` container image in the Events:

```bash
kubectl describe pod <pod-name> -n <namespace>
```

**Fix:** Set `crVersion` to a released version that is not newer than the Operator. With a custom registry, mirror the Operator image tag that matches `crVersion`, or set [`initImage`](operator.md#initimage). See [Init image](update-crversion.md#init-image).

## Cluster stuck in `initializing` with `malformed version` in the log

**Impact:** Every reconcile of this cluster fails until you fix the value. The Operator stops managing this cluster until you fix the value. On a running cluster, the Operator Pod can also restart once, which briefly affects all clusters it manages. The `kubectl get psmdb <cluster-name> -n <namespace>` shows the last state (for example, `ready`).

**Cause:** `crVersion` is not a version string, for example `abc`. The Kubernetes API server accepts it, but the Operator can't parse it. The cluster status keeps its last value: empty for a new cluster, `ready` for a running one.

**Check:** Look for `malformed version` in the Operator log:

```bash
kubectl logs deploy/<operator-deployment-name> -n <namespace>
```

**Fix:** Set a valid `major.minor.patch` value. The cluster recovers once the value is valid. For example:

```bash
kubectl patch psmdb <cluster-name> -n <namespace> --type merge -p '{"spec":{"crVersion":"<version>"}}'
```

## API server rejects `crVersion`

**Impact:** None. The Kubernetes API server refuses the Custom Resource, so the cluster is not changed.

**Cause:** You wrote an unquoted two-part number such as `1.24`. YAML reads it as a number, and the error is `spec.crVersion in body must be of type string`.

**Fix:** Quote the value and use the full `major.minor.patch` version, for example `"1.24.0"`.

## Pods restarted after you re-applied a manifest

**Impact:** The Operator moved the cluster to its own version, and the Pods roll. With the default [Smart Update](update.md#update-strategies) strategy, the Operator restarts Pods one at a time and updates the primary last.

**Cause:** Your manifest omits `crVersion`, and re-applying it removed the value. Whether this happens depends on how you applied the manifest. See [Re-apply a manifest that omits `crVersion`](update-crversion.md#re-apply-a-manifest-that-omits-crversion).

**Check:** Read the current value:

```bash
kubectl get psmdb <cluster-name> -n <namespace> -o jsonpath='{.spec.crVersion}'
```

**Fix:** Decide which version the cluster should run, and set `crVersion` explicitly in your manifest. Changing it again rolls the Pods again.

## Argo CD shows the application as out of sync

**Impact:** The cluster keeps running. With automated sync, Argo CD and the Operator can keep undoing each other's changes.

**Cause:** The manifest in Git omits `crVersion`, and the Operator adds the field to the live Custom Resource.

**Fix:** See [Keep Argo CD in sync with `crVersion`](update-crversion.md#keep-argo-cd-in-sync-with-crversion).

## None of these match

Compare the `crVersion` of the cluster with the version of the Operator:

```bash
kubectl get psmdb <cluster-name> -n <namespace> -o jsonpath='{.spec.crVersion}'
```

```bash
kubectl get deploy <operator-deployment-name> -n <namespace> -o jsonpath='{.spec.template.spec.containers[0].image}'
```

Then check the cluster state and the Operator log:

```bash
kubectl get psmdb <cluster-name> -n <namespace>
```

```bash
kubectl logs deploy/<operator-deployment-name> -n <namespace>
```

For general checks of the cluster, see [Troubleshooting database cluster issues](troubleshoot-operator.md#troubleshooting-database-cluster-issues).

## See also

* [Update Percona Operator for MongoDB](update.md)
* [`crVersion` behavior](update-crversion.md)
* [Custom resource statuses](cr-statuses.md)
