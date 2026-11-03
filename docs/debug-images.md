# Special debug images

For the cases when Pods are failing for some reason or just show abnormal behavior,
the Operator can be used with a special *debug image* of the Percona Server for
MongoDB, which has the following specifics:

* it avoids restarting on fail,
* it contains additional tools useful for debugging (sudo, telnet, gdb,
    mongodb-debuginfo package, etc.),
* extra verbosity is added to the mongodb daemon.

Debug images are published for Percona Server for MongoDB 5.0 and 6.0.
They are not published for 7.0 or 8.0. Operator 1.24.0 does not support
6.0, so use a debug image only on a cluster that still runs an Operator
release that includes 6.0. The newest 6.0 debug tag is `6.0.12-9-debug`.

Particularly, using this image is useful if the container entry point fails
(`mongod` crashes). In such a situation, Pod is continuously restarting.
Continuous restarts prevent to get console access to the container,
and so a special approach is needed to make fixes.

To use the debug image instead of the normal one, set the following image name
for the `image` key in the `deploy/cr.yaml` configuration file:

`percona/percona-server-mongodb:6.0.12-9-debug`

The Pod should be restarted to get the new image.

!!! note

    When the Pod is continuously restarting, you may have to delete it
    to apply image changes.

