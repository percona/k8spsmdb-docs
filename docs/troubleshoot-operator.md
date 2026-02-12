# Percona Operator troubleshooting

This section provides information on how to troubleshoot issues when you install Percona Operator for MongoDB.

Make sure you have CLI tool `kubectl` installed to interact with Kubernetes API.


## Check connection to Kubernetes cluster

It may happen that `kubectl` you installed locally is not connected to your Kubernetes cluster. 

To check connectivity to your Kubernetes API, run the following command:

```bash
kubectl cluster-info
```    

If you see the output similar to the following, it means that `kubectl` is connected to your Kubernetes cluster:    

??? example "Sample output"    

    ```{.text .no-copy}
    Kubernetes control plane is running at https://<control-plane-ip>:49475
    CoreDNS is running at https://<control-plane-ip>:49475/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy 
    ```

If multiple Kubernetes configurations are present in `kubeconfig`, check if you have set the correct context. If the context is wrong, switch it.

Here's how:
{.power-number}

1. Check the current context:

    ```bash
    kubectl config current-context # Get the current Context
    ```       

2. Switch the context :

    ```bash
    kubectl config use-context <Context-To-Be-Used>
    ```   

3. Run the `kubectl cluster-info` command again to verify that `kubectl` is connected to your Kubernetes cluster.
    
If you are still running into issues, check with your Kubernetes cluster administrator to resolve the connectivity or configuration issues. 
    

## Troubleshoot Operator installation issues 

1. Check the Operator logs

    ```bash
    kubectl logs deploy/<operator-deployment-name>
    ``` 

2. Installing the Operator requires specific privileges, such as the ability to create custom resource definitions and other Kubernetes objects.

    To verify that you have the necessary privileges, download and run the following script:

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

    If you have insufficient permissions, the script will show you which ones are missing for installing a particular Operator. In this case, contact the Kubernetes cluster administrator.

3. If you have the necessary privileges but the installation is still failing, review the Kubernetes Events for more details. Keep in mind that Kubernetes Events are retained for only 60 minutes.

    ```bash
    kubectl get events --sort-by=".lastTimestamp"
    ```  

    Events provide good information about affinity issues, resource issues etc.


## Troubleshooting database cluster issues

1. The Operator deployment must be in the `Running` state for the database cluster to function properly. Check the Operator Pod for restarts to identify potential issues.

    ```bash
    kubectl get pod <operator-pod-name>
    ```  

2. Check the status of the database cluster

    ```bash
    kubectl get psmdb <database-cluster-name>
    ```  
    
    The cluster should typically be in the `Running` state. It may briefly enter the `initializing` state while reconciling changes. If the cluster remains in the `initializing` state for an extended period, investigate further to identify any underlying issues.

    Additionally, you can describe the database cluster and search for the information in the `State` and `State Description` fields:

    ```bash
    kubectl describe psmdb <database-cluster-name>
    ```

3. Check the Operator logs

    ```bash
    kubectl logs deploy/<operator-deployment-name>
    ```  

4. Check the events

    ```bash
    kubectl get events --sort-by=".lastTimestamp"
    ```  

    Events can provide information like storage class issues, PVC binding issues etc

 5. Check for the PVC, PV. Both of them should be in `Bound` status

    ```bash
    kubectl get pvc
    ```  

    ```bash
    kubectl get pv
    ```  

6. Check for logs of database pods / `mongos` pods

    ```bash
    kubectl logs <database-pod-name>
    ```  

    ```bash
    kubectl logs <mongos-pod-name>
    ```  

    To check logs of `init` containers or other sidecar containers, use the option `-c` with the container name:

    ```bash
    kubectl logs <mongos-pod-name> -c mongo-init
    ```    

7. Check for error details. Run the `kubectl describe` command:

   ```bash
   kubectl describe <database-pod-name>
    ```  

    ```bash
    kubectl describe <mongos-pod-name>
    ```  
    
    Check the information in the `Status` section. The `State` and `State Description` fields explain why the Pod reports errors.

8. To run commands inside a container, use the `kubectl exec` command:

    ```bash
    kubectl exec <pod-name> -- <command>
    ```  

    If you need an interactive shell to run multiple commands, use the `-it` flag for an interactive terminal:

    ```bash
    kubectl exec -it <pod-name> -- sh
    ```

9. If the pods are not running, it may not be possible to execute commands or open an interactive shell. In such cases, consider using a `sleep-forever` script to prevent the containers from restarting repeatedly. 
   
   See the [Avoid the restart-on-fail loop for Percona Server for MongoDB containers](debug-shell.md#avoid-the-restart-on-fail-loop-for-percona-server-for-mongodb-containers) section for steps.
