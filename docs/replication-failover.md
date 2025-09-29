# Fail over services to the Replica site

A disaster can strike at any moment and the Main site may be down or unavailable. In this case, you must fail over the services to the Replica site.

Here's how to do it:

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

7. Connect to the config server replica set Pod and repeat steps 1-6.
8. Connect to the Replica site and check the replica set configuration
9. Reconfigure your MongoDB clients to connect to the Replica site.
