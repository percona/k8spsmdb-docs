
# Log rotation

`logrotate` is a tool to manage the log file growth. MongoDB logs can grow quickly. Without rotation, logs may fill the filesystem and disrupt the database. `logrotate` ensures predictable log retention and disk usage.

`logrotate` runs in a `logcollector` sidecar container within each database Pod. It reads the log files at the specified path and rotates them according to the set of rules.

By default, `logrotate` in Percona Operator for MongoDB works as follows:


* Rotates the `/data/db/logs/mongod.full.log` daily.
* If the log file exceeds 100 MB, it will be rotated on the next run, regardless of the schedule.
* Keeps up to 7 rotated log files.
* Skips missing or empty log files.
* Leaves rotated logs uncompressed.
* Copies the current file to the rotated file and then truncates this file to zero in place. This avoids the need to restart MongoDB or force it to reopen the log file.
* Ensures pre-rotation scripts run only once per rotation with `sharedscripts`.
* Before rotating, performs the following in the `prerotate` script:

  * Runs the `db.adminCommand({ logRotate: 1 })` command so that MongoDB
  closes its current log and starts a new one.
  * Deletes any `mongod.log.*` files in `/data/db/logs/` that are older than 7 days.

## Configure log rotation

You can customize log rotation if you need different retention, size limits, or want to rotate additional files (for example, audit logs). This gives you predictable disk usage and keeps compliance or troubleshooting logs available for as long as you need.

You can configure log rotation in the following ways:

* Override the default logrotate configuration via the Custom Resource
* Add additional configuration via ConfigMap
* Set a custom log rotation schedule

Regardless of the method you use, after you apply the new configuration, the Operator will restart the database Pods.

### Override the default logrotate configuration

Use the `logcollector.logrotate.configuration` section in the Custom Resource to completely override the default `logrotate` settings. For example, you can configure it to rotate logs when their size is between 100 KB (minimum) and 200 MB (maximum).

!!! important

    You must provide the full `logrotate` configuration because the Operator replaces the default configuration with the one you provide.

Here's an example configuration:

```yaml
spec:
  logcollector:
    logrotate:
      configuration: |
        /data/db/logs/*.log {
           daily
           minsize 100K
           maxsize 200M
           rotate 7
           missingok
           nocompress
           notifempty
           copytruncate
           sharedscripts
           prerotate
               # rotate mongod.log using 'db.adminCommand({ logRotate: 1 })'
               mongosh "mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}:${MONGODB_PORT}/admin" \
                       --eval 'db.adminCommand({ logRotate: 1 })'
               find /data/db/logs/ -type f -name 'mongod.log.*' -mtime +7 -delete
           endscript
        }
```

Apply the configuration:

```bash
kubectl apply -f deploy/cr.yaml -n <namespace>
```

### Add extra logrotate configuration

You can supplement the default logrotate configuration by providing additional options via a ConfigMap or a Secret. Use `logcollector.logrotate.extraConfig.name` to load an additional `.conf` file from a ConfigMap or Secret. The file name must end with `.conf`.

!!! important

    The `mongodb.conf` name is reserved for the main configuration and you must not use it in your custom ConfigMap or Secret.

For example, you want to also rotate audit log files. Here's how to provide this additional configuration.

1. Create a ConfigMap configuration file. For example, `auditlog.yaml`.

    ```yaml
    apiVersion: v1
    kind: ConfigMap
    metadata:
      name: logrotate-custom
    data:
      audit.conf: |
        /data/db/audit/*.json {
           minsize 10K
           maxsize 20K
           rotate 10
           missingok
           nocompress
           notifempty
           sharedscripts
           copytruncate
          }
    ```

2. Create the ConfigMap:

    ```bash
    kubectl apply -f auditlog.yaml
    ```

3. Reference the ConfigMap in your Custom Resource and specify the path to audit logs:

    ```yaml
    spec:
      # ...
      replsets:
      - name: rs0
        size: 1
        configuration: |
          auditLog:
            destination: file
            format: JSON
            path: /data/db/audit/audit.json
      logcollector:
        logrotate:
          extraConfig:
            name: logrotate-custom
    ```

4. Apply the configuration:

    ```bash
    kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

### Set a custom schedule

Starting with version 1.22.0, the default logrotate schedule changed from running once per hour to running once per day.

Use the `logcollector.logrotate.schedule` option in the Custom Resource to set a custom rotation schedule as a cron expression. For example, set the new rotation time to 2:15 a.m every Sunday:

```yaml
spec:
  logcollector:
    logrotate:
      schedule: "0 15 2 * * 0"
```

Apply the configuration:

```bash
kubectl apply -f deploy/cr.yaml -n <namespace>
```
