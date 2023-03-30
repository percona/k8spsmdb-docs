# Monitoring

Percona Monitoring and Management (PMM) [provides an excellent solution](https://www.percona.com/doc/percona-monitoring-and-management/2.x/index.html)
of monitoring Percona Server for MongoDB.

!!! note

    Only PMM 2.x versions are supported by the Operator.

PMM is a client/server application. *PMM Client* runs on each node with the
database you wish to monitor: it collects needed metrics and sends gathered data
to *PMM Server*. As a user, you connect to PMM Server to see database metrics on
a number of dashboards.

That’s why PMM Server and PMM Client need to be installed separately.

## Installing PMM Server

PMM Server runs as a *Docker image*, a *virtual appliance*, or on an *AWS instance*.
Please refer to the [official PMM documentation](https://www.percona.com/doc/percona-monitoring-and-management/2.x/setting-up/server/index.html)
for the installation instructions.

## Installing PMM Client

The following steps are needed for the PMM client installation in your
Kubernetes-based environment:


1. The PMM client installation is initiated by updating the `pmm` section in the
    [deploy/cr.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml)
    file.
    * set `pmm.enabled=true`
    * set the `pmm.serverHost` key to your PMM Server hostname.
    * authorize PMM Client within PMM Server in one of two ways:
    
        === "with token-based authorization (recommended)"
            <a name="operator-monitoring-client-token"></a>
            [Acquire the API Key from your PMM Server](https://docs.percona.com/percona-monitoring-and-management/details/api.html#api-keys-and-authentication) and set ``PMM_SERVER_API_KEY`` in the [deploy/secrets.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/secrets.yaml) secrets file to this obtained API Key value. Keep in mind that you need an API Key with the "Admin" role. The API Key won't be rotated automatically.

        === "with password-based authorization"
            check that the `PMM_SERVER_USER` key in the [deploy/secrets.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/secrets.yaml) secrets file contains your PMM Server user name (`admin` by default), and make sure the `PMM_SERVER_PASSWORD` key in the [deploy/secrets.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/secrets.yaml) secrets file contains the password specified for the PMM Server during its installation.

            *Password-based authorization method is deprecated since the Operator 1.13.0.*

        !!! note

            You use `deploy/secrets.yaml` file to *create* Secrets Object.
            The file contains all values for each key/value pair in a convenient
            plain text format. But the resulting Secrets contain passwords
            stored as base64-encoded strings. If you want to *update* password
            field, you’ll need to encode the value into base64 format. To do
            this, you can run `echo -n "password" | base64 --wrap=0` (or just
            `echo -n "password" | base64` in case of Apple macOS) in your local
            shell to get valid values. For example, setting the PMM Server API
            Key to `new_key` in the `my-cluster-name-secrets` object can be done
            with the following command:

            === "in Linux"

                ```bash
                $ kubectl patch secret/my-cluster-name-secrets -p '{"data":{"PMM_SERVER_API_KEY": '$(echo -n new_key | base64 --wrap=0)'}}'
                ```

            === "in macOS"

                ```bash
                $ kubectl patch secret/my-cluster-name-secrets -p '{"data":{"PMM_SERVER_API_KEY": '$(echo -n new_key | base64)'}}'
                ```

        Apply changes with the `kubectl apply -f deploy/secrets.yaml` command.

    * Starting from the Operator version 1.12.0, MongoDB operation profiling is
        disabled by default, and you
        [should enable it](https://docs.percona.com/percona-monitoring-and-management/setting-up/client/mongodb.html#set-profiling-in-the-configuration-file)
        to make [PMM Query Analytics](https://docs.percona.com/percona-monitoring-and-management/using/query-analytics.html)
        work. You can pass options to MongoDB [in several ways](options.md#operator-configmaps),
        for example in the `configuration` subsection of the `deploy/cr.yaml`:

        ```yaml
        spec:
          ...
          replsets:
            - name: rs0
              size: 3
              configuration: |
                operationProfiling:
                  slowOpThresholdMs: 200
                  mode: slowOp
                  rateLimit: 100
        ```

    * you can also use `pmm.mongodParams` and `pmm.mongosParams` keys to 
        specify additional parameters for the
        [pmm-admin add mongodb](https://www.percona.com/doc/percona-monitoring-and-management/2.x/setting-up/client/mongodb.html#adding-mongodb-service-monitoring)
        command for `mongod` and `mongos` Pods respectively, if needed.

        !!! note

            Please take into account that Operator automatically manages
            common MongoDB Service Monitoring parameters mentioned in the
            officiall `pmm-admin add mongodb` [documentation](https://www.percona.com/doc/percona-monitoring-and-management/2.x/setting-up/client/mongodb.html#adding-mongodb-service-monitoring),
            such like username, password, service-name, host, etc. Assigning values
            to these parameters is not recommended and can negatively affect the
            functionality of the PMM setup carried out by the Operator.

        When done, apply the edited `deploy/cr.yaml` file:

        ```bash
        $ kubectl apply -f deploy/cr.yaml
        ```

2. Check that corresponding Pods are not in a cycle of stopping and restarting.
    This cycle occurs if there are errors on the previous steps:

    ```bash
    $ kubectl get pods
    $ kubectl logs my-cluster-name-rs0-0 -c pmm-client
    ```
