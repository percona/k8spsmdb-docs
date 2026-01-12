# Apply MCS to an existing cluster

You can turn on MCS for the **already-existing non-MCS cluster**. To do this:

- Restart the Operator after editing the `multiCluster` subsection
    keys and applying `deploy/cr.yaml`. Find the Operator’s Pod name in the
    output of the `kubectl get pods` command (it will be something like
    `percona-server-mongodb-operator-d859b69b6-t44vk`) and delete it as follows:

    ```bash
    kubectl delete percona-server-mongodb-operator-d859b69b6-t44vk
    ```

- If you are enabling MCS for a running cluster after upgrading from the
    Operator version `1.11.0` or below, you need rotating multi-domain (SAN)
    certificates. Do this by [pausing the cluster](pause.md) and
    deleting [TLS Secrets](TLS.md).
