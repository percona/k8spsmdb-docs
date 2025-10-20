# Fail over services to the Replica site

Failing over services to the Replica site ensures your applications remain available if the Main site needs maintenance or becomes unavailable. You might need to do this during planned maintenance windows or in response to unexpected outages. The following sections explain how to handle both planned and unplanned failover scenarios.

## Planned services switchover

You can switch over services to the Replica site while doing some planned maintenance on the Main site. 

Here's how to do it:
{.power-number}

1. Set the Main site to the unmanaged mode and change the Update strategy to RollingUpdate. Modify the `deploy/cr-main.yaml` file:

    ```yaml
    spec:
      unmanaged: true
      updateStrategy: RollingUpdate
    ```

2. Apply the configuration:

    ```{.bash data-prompt="$" }
    kubectl apply -f deploy/cr-main.yaml
    ```

3. Put the Replica site in the managed mode:

    ```yaml
    spec:
      unmanaged: false
      updateStrategy: SmartUpdate
    ```

4. Apply the configuration:

    ```{.bash data-prompt="$" }
    kubectl apply -f deploy/cr-replica.yaml
    ```
  
5. Connect to one of the Replica site Pods and check the replica set status. You should see that it has re-elected the new primary.

## Fail over services in a disaster recovery scenario

A disaster can strike at any moment and the Main site may be down or unavailable. In this case, you must fail over the services to the Replica site.

Here's how to do it:
{.power-number}

1. Connect to one of the replica set Pods on the Replica site. Since you will be reconfiguring the replica set, you must connect as the MongoDB `clusterAdmin` user:

    ```{.bash data-prompt="$" }
    $ kubectl exec -it replica-cluster-rs0-0 -- mongosh -u clusterAdmin -p <clusterAdminPassword>
    ```

2. Check the current replica set status:

    ```
    rs.status().members
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        {
            _id: 0,
            name: 'main-cluster-rs0-0.psmdb.svc.clusterset.local:27017',
            health: 0,
            state: 8,
            stateStr: '(not reachable/healthy)',
            uptime: 0,
            ...
          },
        ```

3. Retrieve and store the current configuration in the variable:

    ```
    cfg = rs.config()
    ```

4. Override the member array to include the surviving members - the ones from the Replica site. For the following command replace the member indexes with the ones you got from the `rs.config()` output:

    ```
    cfg.members = [cfg.members[3], cfg.members[4], cfg.members[5]]
    ```

5. Reconfigure the replica set passing the updated member list:

    ```
    rs.reconfig(cfg, {force: true})
    ```

6. Check the updated configuration:

    ```
    rs.status().members
    ```
    
    ??? example "Sample output"

        ```{.text .no-copy}
        {
            _id: 3,
            name: 'replica-cluster-rs0-0.psmdb.svc.clusterset.local:27017',
            health: 1,
            state: 1,
            stateStr: 'PRIMARY'
          },
          {
            _id: 4,
            name: 'replica-cluster-rs0-1.psmdb.svc.clusterset.local:27017',
            health: 1,
            state: 2,
            stateStr: 'SECONDARY'
          },
          {
            _id: 5,
            name: 'replica-cluster-rs0-2.psmdb.svc.clusterset.local:27017',
            health: 1,
            state: 2,
            stateStr: 'SECONDARY'
          }
        ```

7. Repeat steps 1-6 for every shard's replica set in your sharded cluster. 
8. Connect to the config server replica set Pod and repeat steps 1-6.
9. Connect to the Replica site and check the replica set configuration
10. Reconfigure your MongoDB clients to connect to the Replica site.
