# Exec into the containers

If you want to examine the contents of a container "in place" using remote access to it, you can use the `kubectl exec` command. It allows you to run any command or just open an interactive shell session in the container. Of course, you can have shell access to the container only if container supports it and has a “Running” state.

In the following examples we will access the container `mongod` of the `my-cluster-name-rs0-0` Pod.

* Run `date` command:

    ``` {.bash data-prompt="$" }
    $ kubectl exec -ti my-cluster-name-rs0-0 -c mongod -- date
    ```

    ??? example "Expected output"

        ``` {.text .no-copy}
        Thu Nov 24 10:01:17 UTC 2022
        ```

    You will see an error if the command is not present in a container. For
    example, trying to run the `time` command, which is not present in the
    container, by executing `kubectl exec -ti my-cluster-name-rs0-0 -c mongod -- time`
    would show the following result:
    
    ``` {.text .no-copy}
    OCI runtime exec failed: exec failed: unable to start container process: exec: "time": executable file not found in $PATH: unknown
command terminated with exit code 126
    ```

* Print `/var/log/mongo/mongod.log` file to a terminal:

    ``` {.bash data-prompt="$" }
    $ kubectl exec -ti my-cluster-name-rs0-0 -c mongod -- cat /var/log/mongo/mongod.log
    ```

* Similarly, opening an Interactive terminal, executing a pair of commands in
    the container, and exiting it may look as follows:

    ```{.bash data-prompt="$" data-prompt-second="[mongodb@my-cluster-name-rs0-0 db]$"}
    $ kubectl exec -ti my-cluster-name-rs0-0 -c mongod -- bash
    [mongodb@my-cluster-name-rs0-0 db]$ cat /etc/hostname
    my-cluster-name-rs0-0
    [mongodb@my-cluster-name-rs0-0 db]$ ls /var/log/mongo/mongod.log
    /var/log/mongo/mongod.log
    [mongodb@my-cluster-name-rs0-0 db]$ exit
    exit
    $
    ```

