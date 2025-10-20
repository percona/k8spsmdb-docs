# Percona certified images

This page lists Percona's certified Docker images that you can use with Percona Operator for MongoDB.

To find images for a specific Operator version, see [Retrieve Percona certified images](image-query.md).

**Images released with the Operator version {{release}}**:


--8<-- "Kubernetes-Operator-for-PSMONGODB-RN{{release}}.md:images"

## Image tag format

Image tags have the format:

   `[component_name]-[component_version]`

where:

* `component_name` is the name of the component. For example, `percona-server-mongodb`
* `component_version` is the version of the component. For example, `8.0.4-1`.

Note, that PMM Client images have their own tags. They contain the version
of PMM.

[Find images for previous versions :octicons-link-external-16:](https://docs.percona.com/legacy-documentation/){.md-button}
