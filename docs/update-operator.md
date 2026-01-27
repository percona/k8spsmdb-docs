# Upgrade the Operator and CRD

To update the Operator, you need to update the Custom Resource Definition (CRD) and the Operator deployment. Also we recommend to update the Kubernetes database cluster configuration by updating the Custom Resource and the database components to the latest version. This step ensures that all new features that come with the Operator release work in your environment.

The upgrade process is similar for all installation methods, including Helm and OLM.

## Considerations 

### For Kubernetes Cluster versions and upgrades

1. Before upgrading the Kubernetes cluster, have a disaster recovery plan in place. Ensure that a backup is taken prior to the upgrade, and that point-in-time recovery is enabled to meet your Recovery Point Objective (RPO).

2. Plan your Kubernetes cluster or Operator upgrades with version compatibility in mind.

    The Operator is supported and tested on specific Kubernetes versions. Always refer to the Operator's [release notes](RN/index.md) to verify the supported Kubernetes platforms.

    Note that while the Operator might run on unsupported or untested Kubernetes versions, this is not recommended. Doing so can cause various issues, and in some cases, the Operator may fail if deprecated API versions have been removed.

3. During a Kubernetes cluster upgrade, you must also upgrade the `kubelet`. It is advisable to drain the nodes hosting the database Pods during the upgrade process.

4. During the `kubelet` upgrade, nodes transition between `Ready` and `NotReady` states. Also, in some scenarios, older nodes may be replaced entirely with new nodes. Ensure that nodes hosting database or proxy pods are functioning correctly and remain in a stable state after the upgrade.

5. Regardless of the upgrade approach, pods will be rescheduled or recycled. Plan your Kubernetes cluster upgrade accordingly to minimize downtime and service disruption.

### For the Operator upgrades

1. The Operator version has three digits separated by a dot (`.`) in the format `major.minor.patch`. Here's how you can understand the version `1.18.0`:

    * `1` - major version
    * `18` - minor version
    * `0` - patch version

    You can only upgrade the Operator to the nearest `major.minor` version. For example, from `1.18.0` to `1.19.0`. To upgrade to a newer version, which differs from the current `minor.major` version by more than one, you need to make several incremental upgrades sequentially. For example, to upgrade the Operator from `1.17.0` to `1.19.1`, you need to first upgrade it to `1.18.0`, and then to `1.19.1`.

    Patch versions don't influence the upgrade, so you can safely move from `1.18.0` to `1.19.1`.

    Check the [Release notes index](RN/index.md) for the list of the Operator versions.

2. CRD supports **the last 3 minor versions of the Operator**. This means it is compatible with the newest Operator version and the two previous minor versions. If the Operator is older than the CRD by no more than two versions, you should be able to continue using the old Operator version. But updating the CRD and Operator is the recommended path.

3. Starting from version 1.14.0, the Operator configures replica set members
    using local fully-qualified domain names (FQDN). Before this version, if you [exposed a replica set](expose.md), it
    used the exposed IP addresses in the replica set configuration. Therefore, if you upgrade to version 1.14.0 and your replica set is exposed, the
    replica set configuration [will change to use FQDN](expose.md#controlling-hostnames-in-replset-configuration).
    To prevent such reconfiguration, set the
    `clusterServiceDNSMode` Custom Resource option to `External` before the
    upgrade.

4. Starting with version 1.12.0, the Operator no longer has a separate API version for each release in CRD. Instead, the CRD has the API version `v1`. Therefore, if you installed the CRD when the Operator version was **older than 1.12.0**, you must update the API version in the CRD manually to run the upgrade. To check your CRD version, use the following command:

    ```bash
    kubectl get crd perconaservermongodbs.psmdb.percona.com -o yaml | yq .status.storedVersions
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        - v1-11-0
        - v1
        ```

    If the CRD version is other than `v1` or has several entries, run the manual update.
        
5. Starting from the Operator version 1.15.0, the `spec.mongod` section (deprecated since 1.12.0) is finally removed from the Custom Resource configuration. If you have encryption disabled using the deprecated `mongod.security.enableEncryption` option, you need to set encryption as disabled via the [custom configuration](options.md) before the upgrade:

    ```yaml
    spec:
      ...
      replsets:
        - name: rs0
          ...
          configuration: |
            security:
              enableEncryption: false
            ...
    ```

6. Starting from the Operator version 1.16.0, MongoDB 4.4 support in the
    Operator has reached its end-of-life. Make sure that you have a supported
    MongoDB version before upgrading the Operator to 1.16.0 (you can use
    [major version upgrade functionality](update-major.md)) to fix it.

7. The Operator versions 1.19.0 and 1.19.1 have a recommended MongoDB version set to 7.0 because point-in-time recovery may fail on MongoDB 8.0 if sharding is enabled and the Operator version is 1.19.x. Therefore, upgrading to Operator 1.19.0/1.19.1 is not recommended for sharded MongoDB 8.0 clusters.

## Update guides

[Update manually](update-crd-manual.md){.md-button}
[Update via Helm](update-crd-helm.md){.md-button}
[Update via OLM](update-crd-olm.md){.md-button}

