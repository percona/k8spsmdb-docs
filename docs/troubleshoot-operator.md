# Troubleshoot the Operator

Use this page when the Operator itself is the problem: the installation fails, the Operator Pod doesn't run, the cluster gets no status or doesn't react to your changes, or it stays in `initializing`. For problems with the database Pods, backups or connections, start with [Initial troubleshooting](debug.md).

## Before you start

* Install `kubectl` and configure it for your Kubernetes cluster.
* Know the namespace of the Operator and of the database cluster. They are the same namespace unless you run the Operator in [cluster-wide mode](cluster-wide.md).
* Find the name of the Operator Deployment. It is `percona-server-mongodb-operator` for a `kubectl` installation, and usually ends with `psmdb-operator` for Helm:

    ```bash
    kubectl get deployments -A | grep -E 'percona-server-mongodb-operator|psmdb-operator'
    ```

## `kubectl` can't reach the cluster

**Symptom:** `kubectl` commands time out or fail with a connection error, or they show objects from a different cluster.

**Cause:** `kubectl` isn't configured for this cluster, or the current context in your kubeconfig points to another cluster.

**Fix:**
{.power-number}

1. Check the connection:

    ```bash
    kubectl cluster-info
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        Kubernetes control plane is running at https://<control-plane-ip>:49475
        CoreDNS is running at https://<control-plane-ip>:49475/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy
        ```

2. If the output shows the wrong cluster, check the current context and switch to the right one:

    ```bash
    kubectl config current-context
    kubectl config use-context <context-name>
    ```

3. Run `kubectl cluster-info` again. If it still fails, ask your Kubernetes cluster administrator to check your access.

## The installation fails

### Missing privileges

**Symptom:** `kubectl apply` fails with `forbidden` errors, for example `cannot create resource "customresourcedefinitions"`.

**Cause:** Installing the Operator creates cluster-scoped CustomResourceDefinitions and namespaced RBAC objects. Your account lacks the rights for some of them.

**Fix:**
{.power-number}

1. Check your privileges with the privileges check script. It reports what's missing for each Percona Operator:

    ```bash
    bash <(curl -s https://gist.githubusercontent.com/cshiv/6048bdd0174275b48f633549c69d0844/raw/fd547b783a30b827362ee9f9ec03436f9bc79524/check_priviliges.sh)
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        Checking privileges to install Percona Operators in kubernetes cluster...
        Warning: Unable to check the privileges for resource 'issuers', check if the resource 'issuers' is present in the cluster
        Warning: Unable to check the privileges for resource 'certificates', check if the resource 'certificates' is present in the cluster

        Warning: Some resources are not found in the kubernetes cluster.Check the Warning messages before you proceed
        ------------------------------------------------------------------------------------------
        GOOD TO INSTALL: Percona Operator for PostgreSQL
        https://docs.percona.com/percona-operator-for-postgresql/index.html
        ------------------------------------------------------------------------------------------
        GOOD TO INSTALL: Percona Operator for MySQL based on Percona XtraDB Cluster
        https://docs.percona.com/percona-operator-for-mysql/pxc/index.html
        ------------------------------------------------------------------------------------------
        GOOD TO INSTALL: Percona Operator for MongoDB
        https://docs.percona.com/percona-operator-for-mongodb/index.html
        ```

    If your security policy doesn't allow running a downloaded script, check the privileges with `kubectl auth can-i` instead. Each command prints `yes` or `no`:

    ```bash
    kubectl auth can-i create customresourcedefinitions
    kubectl auth can-i create serviceaccounts -n <namespace>
    kubectl auth can-i create roles -n <namespace>
    kubectl auth can-i create rolebindings -n <namespace>
    kubectl auth can-i create deployments -n <namespace>
    ```

    For [cluster-wide mode](cluster-wide.md), check `clusterroles` and `clusterrolebindings` instead of `roles` and `rolebindings`.

2. If any check fails, ask your Kubernetes cluster administrator to grant the missing privileges or to install the CustomResourceDefinitions for you.

### The CustomResourceDefinition is too long

**Symptom:** `kubectl apply` fails with `metadata.annotations: Too long: must have at most 262144 bytes` for `perconaservermongodbs.psmdb.percona.com`.

**Cause:** A client-side `kubectl apply` stores the whole object in an annotation. The `PerconaServerMongoDB` CustomResourceDefinition is larger than the annotation limit.

**Fix:** Apply the file with server-side apply, as the [installation guides](kubectl.md) do:

```bash
kubectl apply --server-side -f deploy/bundle.yaml -n <namespace>
```

## The Operator Pod isn't running

**Symptom:** The Operator Pod is in `ImagePullBackOff`, `ErrImagePull` or `CrashLoopBackOff`, or its `RESTARTS` count keeps growing.

**Cause:** The node can't pull the Operator image, the CustomResourceDefinitions are missing, or the Operator's service account lacks the RBAC rights it needs.

**Fix:**
{.power-number}

1. Check the Pod state and events:

    ```bash
    kubectl describe pod -l app.kubernetes.io/component=operator -n <operator-namespace>
    ```

    For a Helm installation, use `kubectl get pods -n <operator-namespace>` to find the Pod name.

2. For an image pull error, check the image name and your registry access. See [Use a private registry](custom-registry.md).
3. Read the Operator log. For a crash, `--previous` shows the log of the last run:

    ```bash
    kubectl logs deployment/<operator-deployment> -n <operator-namespace> --previous
    ```

    * A `no matches for kind` error means the CustomResourceDefinitions aren't installed. Apply them with `kubectl apply --server-side -f deploy/crd.yaml`.
    * A `forbidden` error means the Operator's service account lacks a privilege. Check that the Role or ClusterRole and its binding from the bundle were applied in the right namespace.

## The cluster has no status or doesn't react to changes

**Symptom:** `kubectl get psmdb -n <namespace>` shows the cluster with empty `STATUS` and `ENDPOINT` columns, no Pods appear, or changes to the Custom Resource have no effect.

**Cause:** No Operator reconciles this cluster. Either the Operator isn't running, or it doesn't watch the cluster's namespace. An Operator installed with `deploy/bundle.yaml` watches only its own namespace. In cluster-wide mode, the `WATCH_NAMESPACE` environment variable lists the watched namespaces, and an empty value means all namespaces.

**Fix:**
{.power-number}

1. Check that the Operator Pod is running. See [The Operator Pod isn't running](#the-operator-pod-isnt-running).
2. Check which namespaces the Operator watches:

    ```bash
    kubectl get deployment <operator-deployment> -n <operator-namespace> \
      -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="WATCH_NAMESPACE")]}'
    ```

    A `fieldRef` to `metadata.namespace` means the Operator watches only its own namespace.

3. Create the cluster in a watched namespace, or reinstall the Operator in [cluster-wide mode](cluster-wide.md) with the cluster's namespace in `WATCH_NAMESPACE`. See [Single-namespace and multi-namespace deployment modes](namespace-mode.md).

## Options are missing after an Operator upgrade

**Symptom:** After you upgrade the Operator, `kubectl apply` of the Custom Resource prints `unknown field` warnings, and the new options don't stay in the Custom Resource.

**Cause:** The CustomResourceDefinitions are older than the Operator. Kubernetes drops the fields that the installed CustomResourceDefinition doesn't define.

**Fix:** Upgrade the CustomResourceDefinitions to the Operator's version before you use new options. See [Upgrade the Operator and CRD](update-operator.md).

## The cluster is in `error` after cert-manager was uninstalled

**Symptom:** after cert-manager was uninstalled, the cluster status is `error`, and the Operator stops applying changes to the cluster. The database Pods keep running. `status.message` contains:

``` {.text .no-copy}
create ssl by cert-manager: ... the server could not find the requested resource (post issuers.cert-manager.io). Please create your TLS secret <cluster-name>-ssl manually or setup cert-manager correctly
```

The `TLSSecretsReady` condition stays `True`, so check `status.state` and `status.message`.

**Cause:** cert-manager issued the cluster's TLS certificates, and `tls.certManagementPolicy` was `auto` when cert-manager was uninstalled. Starting with version 1.24.0, the Operator reads the cert-manager label on the TLS Secrets and keeps trying to update the certificates through cert-manager. Earlier versions switched to certificates the Operator generates.

**Fix:** let the Operator generate new certificates under a new certificate authority (CA). All database Pods restart at once, so the database is unavailable for a few minutes. Clients need the new CA and client certificates afterwards.
{.power-number}

1. Delete the TLS Secrets, including the CA Secret that cert-manager created. The Operator can't reuse that CA Secret. Skip `<cluster-name>-pbm` if backups are disabled:

    ```bash
    kubectl delete secret <cluster-name>-ssl <cluster-name>-ssl-internal <cluster-name>-ca-cert <cluster-name>-pbm -n <namespace>
    ```

2. Make the Operator reconcile the cluster right away:

    ```bash
    kubectl annotate psmdb <cluster-name> -n <namespace> percona.com/reconcile-trigger="$(date +%s)" --overwrite
    ```

3. Wait until the Operator creates new Secrets:

    ```bash
    kubectl get secret <cluster-name>-ssl <cluster-name>-ssl-internal <cluster-name>-ca-cert -n <namespace>
    ```

4. Delete all database Pods at once. A rolling restart can't work across a CA change, because the old Pods don't trust the new certificates:

    ```bash
    kubectl delete pod -n <namespace> -l app.kubernetes.io/instance=<cluster-name>,app.kubernetes.io/managed-by=percona-server-mongodb-operator
    ```

5. Wait until the cluster is `ready`:

    ```bash
    kubectl get psmdb <cluster-name> -n <namespace> -o jsonpath='{.status.state}'
    ```

6. Give clients the new CA and new client certificates. See [Connect with a client certificate](TLS.md#connect-with-a-client-certificate).

To avoid this state, follow [Migrate from cert-manager to custom TLS certificates](tls-migrate-from-cert-manager.md) before you uninstall cert-manager.

## Cluster stays in `initializing`

The cluster reports `initializing` while any of the conditions in [What `ready` means](cr-statuses.md#what-ready-means) is not met. First find the affected component. Compare `ready` with `size` for each replica set and for `mongos`:

```bash
kubectl get psmdb <cluster-name> -n <namespace> -o jsonpath='{.status.replsets}{"\n"}{.status.mongos}{"\n"}'
```

Then find the matching entry.

### A rollout is pending

**Symptom:** Some Pods still run the previous revision. The Operator logs show `can't start 'SmartUpdate': waiting for running backups to be finished` or `waiting for active jobs to be finished`.

**Cause:** A Smart Update doesn't restart Pods while a backup or restore runs.

**Fix:**

1. List the backups and restores: `kubectl get psmdb-backup,psmdb-restore -n <namespace>`.
2. Wait until they finish. If one is stuck, see [Troubleshoot backups and restores](debug-backup-restore.md).

### A member isn't ready

**Symptom:** A `mongod` Pod is `Running` but not `Ready`, and the replica set reports fewer ready Pods than its size.

**Cause:** The member runs an initial sync, or it is `RECOVERING` because it fell too far behind the other members.

**Fix:**

1. Check the member state in the database log. See [Check the logs](debug-logs.md).
2. For an initial sync, wait. It can take hours for large data sets.
3. For a member that stays `RECOVERING`, see [Health checks and probes](architecture-probes.md#what-this-means-for-users) for why Kubernetes doesn't restart it and what it blocks.

### The PBM agents report an error

**Symptom:** All Pods are ready, but the cluster stays in `initializing`. The Operator logs show `Agent is not OK` with the node, the replica set and the error.

**Cause:** With backups enabled, the cluster is `ready` only when every PBM agent is healthy and can reach the backup storage. Wrong storage credentials or an unreachable endpoint keep it in `initializing`.

**Fix:**

1. Check the error in the `backup-agent` container logs: `kubectl logs <pod-name> -n <namespace> -c backup-agent`.
2. Fix the storage configuration. See [Configure storage for backups](backups-storage.md).

### A PVC resize is in progress

**Symptom:** A replica set stays in `initializing` after you changed the storage size.

**Cause:** The replica set reports `initializing` until the resize of all its PVCs finishes.

**Fix:**

1. Check the PVC events: `kubectl describe pvc <pvc-name> -n <namespace>`.
2. If the resize fails, see [Troubleshooting storage](debug-storage.md).

### No endpoint is assigned

**Symptom:** All Pods are ready, and `status.host` is empty.

**Cause:** The `LoadBalancer` Service of `mongos` or of the exposed replica set waits for the cloud provider to assign an address.

**Fix:**

1. Check the Service: `kubectl get svc -n <namespace>`. An `EXTERNAL-IP` of `<pending>` means no address yet.
2. Check the Service events and your cloud provider's load balancer quota.

### A Pod can't be scheduled

**Symptom:** A Pod stays `Pending`. After a minute, the replica set status shows `error` and the scheduler's message in `status.replsets.<name>.message`.

**Cause:** No node meets the Pod's requirements: the required anti-affinity, the resource requests, or a volume bound to another zone.

**Fix:**

1. Read the reason: `kubectl describe pod <pod-name> -n <namespace>`.
2. Add nodes or relax the scheduling rules. See [Troubleshoot Pod scheduling](debug-scheduling.md).

If the problem started after an upgrade or a `crVersion` change, see [Troubleshoot upgrades and `crVersion`](debug-upgrade.md).

## See also

* [Initial troubleshooting](debug.md) for problems with the database Pods, a quick health check and a symptom table for every layer.
* [System requirements](System-Requirements.md) for the supported platforms and the resources the cluster needs.
* [Upgrade the Operator and CRD](update-operator.md) for the order to follow when you upgrade.
