# Monitor Kubernetes 

Monitoring the state of the database is crucial to timely identify and react to performance issues. [Percona Monitoring and Management (PMM) solution enables you to do just that](monitoring.md).

However, the database state also depends on the state of the Kubernetes cluster itself. Hence it’s important to have metrics that can depict the state of the Kubernetes cluster.

This document describes how to set up monitoring of the Kubernetes cluster health. This setup has been tested with the [PMM server](https://docs.percona.com/percona-monitoring-and-management/details/architecture.html#pmm-server) as the centralized data storage and the Victoria Metrics Kubernetes monitoring stack as the metrics collector. These steps may also apply if you use another Prometheus-compatible storage.

## Considerations

In this setup, we use [Victoria Metrics Kubernetes monitoring stack](https://github.com/VictoriaMetrics/helm-charts/tree/master/charts/victoria-metrics-k8s-stack) Helm chart. When customizing the chart's values, consider the following:

* Since we use the PMM Server for monitoring, there is no need to store the data in Victoria Metrics Operator. Therefore, the Victoria Metrics Helm chart is installed with the `vmsingle.enabled` and `vmcluster.enabled` parameters set to `false` in this setup.
* The Prometheus node exporter is not installed by default since it requires privileged containers with the access to the host file system. If you need the metrics for Nodes, enable the Prometheus node exporter by setting the `prometheus-node-exporter.enabled` flag in the Victoria Metrics Helm chart to `true`.
* [Check all the role-based access control (RBAC) rules](https://helm.sh/docs/topics/rbac/) of the `victoria-metrics-k8s-stack` chart and the dependencies chart, and modify them based on your requirements. 

## Pre-requisites

To set up monitoring of Kubernetes, you need the following:

1. PMM Server up and running. You can run PMM Server as a Docker image, a virtual appliance, or on an AWS instance. Please refer to the [official PMM documentation](https://docs.percona.com/percona-monitoring-and-management/setting-up/server/index.html) for the installation instructions.

2. [Helm v3](https://docs.helm.sh/using_helm/#installing-helm).
3. [kubectl](https://kubernetes.io/docs/tasks/tools/).

## Procedure

### Set up authentication in PMM Server

To access the PMM Server resources and perform actions on the server, configure authentication.

1. Get the PMM API key. The key must have the role "Admin".

    === "From PMM UI" 

        [Generate the PMM API key](https://docs.percona.com/percona-monitoring-and-management/details/api.html#api-keys-and-authentication){.md-button} 

    === "From command line"

        You can query your PMM Server installation for the API
        Key using `curl` and `jq` utilities. Replace `<login>:<password>@<server_host>` placeholders with your real PMM Server login, password, and hostname in the following command:

        ``` {.bash data-prompt="$" }
        $ API_KEY=$(curl --insecure -X POST -H "Content-Type: application/json" -d '{"name":"operator", "role": "Admin"}' "https://<login>:<password>@<server_host>/graph/api/auth/keys" | jq .key)
        ```

    !!! note

        The API key is not rotated. 

2. Encode the API key with base64.

    === "in Linux" 

        ````{.bash data-prompt="$" }
        $ echo -n <API-key> | base64 --wrap=0
        ````

    === "in macOS"   
        ```{.bash data-prompt="$" }
        $ echo -n <API-key> | base64 
        ```

3. Create the Namespace where you want to set up monitoring. The following command creates the Namespace `monitoring-system`. You can specify a different name. In the latter steps, specify your namespace instead of the `<namespace>` placeholder.
    
    ```{.bash data-prompt="$" }
    $ kubectl create namespace monitoring-system
    ```

4. Create the YAML file for the [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/) and specify the base64-encoded API key value within. Let's name this file `pmm-api-vmoperator.yaml`.

    ```yaml title="pmm-api-vmoperator.yaml"
    apiVersion: v1
    data:
      api_key: <base-64-encoded-API-key>
    kind: Secret
    metadata:
      name: pmm-token-vmoperator
      #namespace: default
    type: Opaque
    ```

5. Create the Secrets object using the YAML file you created previously. Replace the `<filename>` placeholder with your value.

    ```{.bash data-prompt="$" }
    $ kubectl apply -f pmm-api-vmoperator.yaml -n <namespace>
    ```

6. Check that the secret is created. The following command checks the secret for the resource named `pmm-token-vmoperator` (as defined in the `metadata.name` option in the secrets file). If you defined another resource name, specify your value.  

   ```{.bash data-prompt="$" }
   $ kubectl get secret pmm-token-vmoperator -n <namespace>
   ```

### Create a ConfigMap to mount for `kube-state-metrics` 

The [`kube-state-metrics` (KSM)](https://github.com/kubernetes/kube-state-metrics) is a simple service that listens to the Kubernetes API server and generates metrics about the state of various objects - Pods, Deployments, Services and Custom Resources. 

To define what metrics the `kube-state-metrics` should capture, create the [ConfigMap](https://github.com/kubernetes/kube-state-metrics/blob/main/docs/customresourcestate-metrics.md#configuration) and mount it to a container. 

Use the [example `configmap.yaml` configuration file](https://github.com/Percona-Lab/k8s-monitoring/blob/main/vm-operator-k8s-stack/ksm-configmap.yaml) to create the ConfigMap.

```{.bash data-prompt="$" }
$ kubectl apply -f https://raw.githubusercontent.com/Percona-Lab/k8s-monitoring/main/vm-operator-k8s-stack/ksm-configmap.yaml -n <namespace>
```

As a result, you have the `customresource-config-ksm` ConfigMap created. 

### Install the Victoria Metrics Kubernetes monitoring stack

1. Add the dependency repositories of [victoria-metrics-k8s-stack](https://github.com/VictoriaMetrics/helm-charts/blob/master/charts/victoria-metrics-k8s-stack) chart. 

    ```{.bash data-prompt="$" }
    $ helm repo add grafana https://grafana.github.io/helm-charts
    $ helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    ```

2. Add the Victoria Metrics Kubernetes monitoring stack repository.

    ```{.bash data-prompt="$" }
    $ helm repo add vm https://victoriametrics.github.io/helm-charts/
    ```

3. Update the repositories.

    ```{.bash data-prompt="$" }
    $ helm repo update
    ```

4. Install the Victoria Metrics kubernetes monitoring stack helm chart. You need to specify the following configuration:

    * the URL to access the PMM server in the `externalVM.write.url` option in the format `<PMM-SERVER-URL>/victoriametrics/api/v1/write`. The URL can contain either the IP address or the hostname of the PMM server.
    * the unique name or an ID of the Kubernetes cluster in the `vmagent.spec.externalLabels.k8s_cluster_id` option. Ensure to set different values if you are sending metrics from multiple Kubernetes clusters to the same PMM Server. 

    === "Command line"

        Use the following command to install the Victoria Metrics Operator and pass the required configuration. The `vm-k8s` value command is the Release name. You can use a different name. Replace the `<namespace>` placeholder with your value. The Namespace must be the same as the Namespace for the Secret and ConfigMap:

        ```{.bash data-prompt="$" }
        $ helm install vm-k8s vm/victoria-metrics-k8s-stack \
         -f https://raw.githubusercontent.com/Percona-Lab/k8s-monitoring/main/vm-operator-k8s-stack/values.yaml \
         --set externalVM.write.url=<PMM-SERVER-URL>/victoriametrics/api/v1/write \
         --set vmagent.spec.externalLabels.k8s_cluster_id=<UNIQUE-CLUSTER-IDENTIFER/NAME> \
         -n <namespace>
        ```

        To illustrate, say your PMM Server URL is `https://pmm-example.com`, the cluster ID is `test-cluster` and the Namespace is `monitoring-system`. Then the command would look like this:

        ```{.bash .no-copy }
        $ helm install vm-k8s vm/victoria-metrics-k8s-stack \
         -f https://raw.githubusercontent.com/Percona-Lab/k8s-monitoring/main/vm-operator-k8s-stack/values.yaml \
         --set externalVM.write.url=https://pmm-example.com/victoriametrics/api/v1/write \
         --set vmagent.spec.externalLabels.k8s_cluster_id=test-cluster> \
         -n monitoring-system
        ```

    === "Configuration file" 

         1. Edit the [`values.yaml`](https://raw.githubusercontent.com/Percona-Lab/k8s-monitoring/main/vm-operator-k8s-stack/values.yaml) 

            ```yaml
            externalVM:
              write:
                # Replace PMM-SERVER-URL with valid URL of PMM Server
                url: "https://<PMM-SERVER-URL>//victoriametrics/api/v1/write"

            ....

            vmagent:
              # spec for VMAgent crd
              # https://docs.victoriametrics.com/operator/api.html#vmagentspec
              spec:
                selectAllByDefault: true
                image:
                  tag: v1.91.3
                scrapeInterval: 25s
                externalLabels:
                  k8s_cluster_id: <cluster-name>
            ```     

            Optionally, check the rest of the file and make changes. For example, if you plan to gather metrics for Nodes with the Prometheus node exporter, set the `prometheus-node-exporter.enabled` option to `true`.

         2. Run the following command to install the Victoria Metrics kubernetes monitoring stack. The `vm-k8s` value is the Release name. You can use a different name. Replace the `<namespace>` placeholder with your value. The Namespace must be the same as the Namespace for the Secret and ConfigMap.

             ```
             $ kubectl apply -f values.yaml -n <namespace>
             ``` 

        !!! note     

            The example `values.yaml` file is taken from the `victoria-metrics-k8s-stack` version 0.17.5. The fields and default values may differ in newer releases of the `victoria-metrics-k8s-stack` helm chart. Please check them if you are using a different version of the `victoria-metrics-k8s-stack` helm chart.

5. Validate the successful installation by checking the Pods. 

    ```{.bash data-prompt="$" }
    $ kubectl get pods -n <namespace>
    ```

    ??? example "Sample output" 

        ```{.text .no-copy}
        NAME                                                        READY   STATUS    RESTARTS   AGE
        vm-k8s-grafana-5f6bdb8c7c-d5bw5                             3/3     Running   0          90m
        vm-k8s-kube-state-metrics-57c5977d4f-6jtbj                  1/1     Running   0          81m
        vm-k8s-prometheus-node-exporter-kntfk                       1/1     Running   0          90m
        vm-k8s-prometheus-node-exporter-mjrvj                       1/1     Running   0          90m
        vm-k8s-prometheus-node-exporter-v98c8                       1/1     Running   0          90m
        vm-k8s-victoria-metrics-operator-6b7f4f786d-sctp8           1/1     Running   0          90m
        vmagent-vm-k8s-victoria-metrics-k8s-stack-fbc86c9db-rz8wk   2/2     Running   0          90m    
        ```
        
        What Pods are running depends on the configuration chosen in values used while installing `victoria-metrics-k8s-stack` chart.

## Verify metrics capture

1. Connect to the PMM server.
2. Click **Explore** and switch to the **Code** mode.
3. Check that the required metrics are captured, type the following in the Metrics browser dropdown:

    * [cadvisor](https://github.com/google/cadvisor/blob/master/docs/storage/prometheus.md):

       ![image](assets/images/cadvisor.svg)

    * kubelet:

       ![image](assets/images/kubelet.svg)

    * [kube-state-metrics](https://github.com/kubernetes/kube-state-metrics/tree/main/docs) metrics that also include Custom resource metrics for the Operator and database deployed in your Kubernetes cluster:

      ![image](assets/images/psmdb_metric.svg)

