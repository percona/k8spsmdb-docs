# Initial troubleshooting

Percona Operator for MongoDB uses [Custom Resources  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) to manage options for the various components of the cluster.

* `PerconaServerMongoDB` Custom Resource with Percona Server for MongoDB options (it has handy `psmdb` shortname also),

* `PerconaServerMongoDBBackup` and `PerconaServerMongoDBRestore` Custom Resources contain options for Percona Backup for MongoDB used to backup Percona Server for MongoDB and to restore it from backups (`psmdb-backup` and `psmdb-restore` shortnames are available for them).

The first thing you can check for the Custom Resource is to query it with `kubectl get` command:


```bash
kubectl get psmdb
```

??? example "Expected output"

    ``` {.text .no-copy}
    NAME              ENDPOINT                                           STATUS   AGE
    my-cluster-name   my-cluster-name-mongos.default.svc.cluster.local   ready    5m26s
    ```

The Custom Resource should have `Ready` status.

!!! note

    You can check which Percona’s Custom Resources are present and get some information about them as follows:

    ```bash
    kubectl api-resources | grep -i percona
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        perconaservermongodbbackups       psmdb-backup    psmdb.percona.com/v1                   true         PerconaServerMongoDBBackup
        perconaservermongodbrestores      psmdb-restore   psmdb.percona.com/v1                   true         PerconaServerMongoDBRestore
        perconaservermongodbs             psmdb           psmdb.percona.com/v1                   true         PerconaServerMongoDB
        ```

## Check the Pods

If Custom Resource is not getting `Ready` status, it makes sense to check
individual Pods. You can do it as follows:

```bash
kubectl get pods
```

???+ example "Expected output"

    --8<-- "cli/kubectl-get-pods-response.md"

The above command provides the following insights:

* `READY` indicates how many containers in the Pod are ready to serve the
    traffic. In the above example, `my-cluster-name-rs0-0` Pod has all two
    containers ready (2/2). For an application to work properly, all containers
    of the Pod should be ready.
* `STATUS` indicates the current status of the Pod. The Pod should be in a
    `Running` state to confirm that the application is working as expected. You
    can find out other possible states in the [official Kubernetes documentation  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-phase).
* `RESTARTS` indicates how many times containers of Pod were restarted. This is
    impacted by the [Container Restart Policy  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#restart-policy).
    In an ideal world, the restart count would be zero, meaning no issues from
    the beginning. If the restart count exceeds zero, it may be reasonable to
    check why it happens.
* `AGE`: Indicates how long the Pod is running. Any abnormality in this value
    needs to be checked.

You can find more details about a specific Pod using the
`kubectl describe pods <pod-name>` command.

```bash
kubectl describe pods my-cluster-name-rs0-0
```

??? example "Expected output"

    ``` {.text .no-copy}
    ...
    Name:         my-cluster-name-rs0-0
    Namespace:    default
    ...
    Controlled By:  StatefulSet/my-cluster-name-rs0
    Init Containers:
     mongo-init:
    ...
    Containers:
     mongod:
    ...
       Restart Count:  0
       Limits:
         cpu:     300m
         memory:  500M
       Requests:
         cpu:      300m
         memory:   500M
       Liveness:   exec [/opt/percona/mongodb-healthcheck k8s liveness --ssl --sslInsecure --sslCAFile /etc/mongodb-ssl/ca.crt --sslPEMKeyFile /tmp/tls.pem --startupDelaySeconds 7200] delay=60s timeout=10s period=30s #success=1 #failure=4
       Readiness:  tcp-socket :27017 delay=10s timeout=2s period=3s #success=1 #failure=8
       Environment Variables from:
         internal-my-cluster-name-users  Secret  Optional: false
       Environment:
    ...
       Mounts:
    ...
    Volumes:
    ...
    Events:                      <none>
    ```

This gives a lot of information about containers, resources, container status
and also events. So, describe output should be checked to see any abnormalities.

## Check logs

Logs help you pinpoint startup failures, crash loops, configuration issues, and performance problems. They include timestamps, error messages, and component-specific context that you won't see in Pod status alone. See the [Check logs](debug-logs.md) section for more information about logs and how to check them.