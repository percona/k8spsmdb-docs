# Operator security builds

!!! note "Version added: [1.24.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.24.0.md)"

The Operator has access to your cluster's credentials and other sensitive configuration. A vulnerability in the Operator image is a path to that data, even when your MongoDB cluster itself is fully patched. Security builds close that gap on a release you already run, without waiting for the next Operator version.

This page covers patching your current Operator version. To move to a newer Operator version, see [Upgrade the Operator and CRD](update-operator.md).

## Understand a security build

A security build is a new Operator image that fixes a High or Critical vulnerability in a release you already run.

Each Operator release gets a dedicated security branch (for example, `security/1.24.0`), created from that release the first time a security build runs. Every later build starts from this same branch, so earlier fixes carry forward.

A scan of the Operator image runs every week. When it finds a High or Critical Common Vulnerabilities and Exposures (CVE) in a Go dependency, the Go version or a library that ships with Go, the build moves the affected dependency or toolchain to a version that includes the fix.

Before a fix reaches you:

* The candidate image is scanned again, and the fix is submitted as a pull request for review.
* Once the pull request is merged, the final image is rebuilt from the merged commit, so the published image matches the reviewed source.
* The rebuilt image goes through a final Trivy scan and the Operator end-to-end (E2E) test suite before publication.

A security build rebuilds **only the Operator image**. Percona Server for MongoDB, Percona Backup for MongoDB, and the other component images stay on the versions from the original release. Vulnerabilities in those images are outside a security build.

## Read the image tags

Each release is published with these tags. The following table uses version `1.24.0`. Later releases follow the same pattern:

| Tag | What it points to | When to use |
| --- | --- | --- |
| `1.24.0` | The original release image. This is the default tag, and the only one listed in the [Version Service](image-query.md). | Use this tag for a standard deployment or upgrade. |
| `1.24.0-1` | The same release image, published with a numbered tag. | Use this tag when you want the release image and a fixed digest. |
| `1.24.0-2`, `1.24.0-3`, and later numbers | Security builds for the original release. They stay on Operator 1.24.0. Each numbered tag is a separate, immutable image. The first security build is `1.24.0-2`. | Use a numbered tag when you want a specific security build and you need that choice to stay fixed. |
| `1.24.0-latest` | The newest image for this release. This tag is mutable. It moves from `1.24.0-2` to `1.24.0-3` and so on. | Use this tag when you want the newest image for this release and you are ready for the tag to move. A digest names one image. A digest you copy from this tag today still names that image after the tag moves. |

Look up digests for numbered security-build tags (`1.24.0-2`, `1.24.0-3`, ...) on [Docker Hub :octicons-link-external-16:](https://hub.docker.com/r/percona/percona-server-mongodb-operator/tags). The Version Service lists the original release tag only.

## Switch to a security build

Set the Operator image to the security tag you chose. The examples use `1.24.0-2`. Replace that tag with the one you picked.

You stay on Operator 1.24.0. Leave the Custom Resource Definitions and the database Custom Resource unchanged. The image change does not restart your database Pods.

This procedure is the same on all [supported platforms](System-Requirements.md#officially-supported-platforms) except OpenShift.

On OpenShift, it works when you installed the Operator with a community bundle or with Helm.

The OpenShift Certified Operator and Operator Lifecycle Manager (OLM) bundles do not include security builds yet. If you installed through one of those bundles, keep the image the bundle provides.


## Security build lifecycle

Security builds for a release continue until the next Operator release. Security builds for 1.24.0 stop when Operator 1.25.0 is released. Those images stay available and keep the same digest.

After Operator 1.25.0 is released, new fixes land in security builds for 1.25.0.

## See also

* [Upgrade the Operator and CRD](update-operator.md)

