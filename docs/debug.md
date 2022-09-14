# Debug

## Using debug image

For the cases when Pods are failing for some reason or just show abnormal behavior,
the Operator can be used with a special *debug image* of the Percona Server for
MongoDB, which has the following specifics:

* it avoids restarting on fail,
* it contains additional tools useful for debugging (sudo, telnet, gdb,
    mongodb-debuginfo package, etc.),
* extra verbosity is added to the mongodb daemon.

Particularly, using this image is useful if the container entry point fails
(`mongod` crashes). In such a situation, Pod is continuously restarting.
Continuous restarts prevent to get console access to the container,
and so a special approach is needed to make fixes.

To use the debug image instead of the normal one, set the following image name
for the `image` key in the `deploy/cr.yaml` configuration file:

`percona/percona-server-mongodb:{{ mongodb50recommended }}-debug`

The Pod should be restarted to get the new image.

!!! note

    When the Pod is continuously restarting, you may have to delete it
    to apply image changes.
    
## Changing verbosity of logs

You can also change the representation of logs: either use structured representation, which produces a parcing-friendly JSON, or use traditional console-frienldy logging with specific level. Changing representation of logs is possible by editing the `deploy/operator.yml` file, which sets the following environment variables with self-speaking names and values:

```yaml
env:
    ...
    name: LOG_STRUCTURED
    value: 'false'
    name: LOG_LEVEL
    value: INFO
    ...
```
