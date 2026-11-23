> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Use Docker images from a custom registry

Using images from a private Docker registry may required for privacy, security or other reasons. In these cases, Percona Operator for MongoDB allows the use of a custom registry This following example of the Operator deployed in the OpenShift environment demonstrates the process:

1. Log into the OpenShift and create a project.

   ```
   oc login
   ```

   Expected output

   ```
   Authentication required for https://192.168.1.100:8443 (openshift)
   Username: admin
   Password:
   Login successful.
   ```

   ```
   oc new-project psmdb
   ```

   Expected output

   ```
   Now using project "psmdb" on server "https://192.168.1.100:8443".
   ```

1. You need obtain the following objects to configure your custom registry access:

   - A user token
   - the registry IP address

   You can view the token with the following command:

   ```
   oc whoami -t
   ```

   Expected output

   ```
   ADO8CqCDappWR4hxjfDqwijEHei31yXAvWg61Jg210s
   ```

   The following command returns the registry IP address:

   ```
   kubectl get services/docker-registry -n default
   ```

   Expected output

   ```
   NAME              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
   docker-registry   ClusterIP   172.30.162.173   <none>        5000/TCP   1d
   ```

1. Use the user token and the registry IP address to login to the registry:

   ```
   docker login -u admin -p ADO8CqCDappWR4hxjfDqwijEHei31yXAvWg61Jg210s 172.30.162.173:5000
   ```

   Expected output

   ```
   Login Succeeded
   ```

1. Use the Docker commands to pull the needed image by its SHA digest:

   ```
   docker pull docker.io/perconalab/percona-server-mongodb@sha256:991d6049059e5eb1a74981290d829a5fb4ab0554993748fde1e67b2f46f26bf0
   ```

   Expected output

   ```
   Trying to pull repository docker.io/perconalab/percona-server-mongodb ...
   sha256:991d6049059e5eb1a74981290d829a5fb4ab0554993748fde1e67b2f46f26bf0: Pulling from docker.io/perconalab/percona-server-mongodb
   Digest: sha256:991d6049059e5eb1a74981290d829a5fb4ab0554993748fde1e67b2f46f26bf0
   Status: Image is up to date for docker.io/perconalab/percona-server-mongodb@sha256:991d6049059e5eb1a74981290d829a5fb4ab0554993748fde1e67b2f46f26bf0
   ```

   You can find correct names and SHA digests in the [current list of the Operator-related images officially certified by Percona](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/images.html).

1. The following method can push an image to the custom registry for the example OpenShift `psmdb` project:

   ```
   docker tag \
       docker.io/perconalab/percona-server-mongodb@sha256:991d6049059e5eb1a74981290d829a5fb4ab0554993748fde1e67b2f46f26bf0 \
       172.30.162.173:5000/psmdb/percona-server-mongodb:7.0.43-23
   docker push 172.30.162.173:5000/psmdb/percona-server-mongodb:7.0.43-23
   ```

1. Verify the image is available in the OpenShift registry with the following command:

   ```
   oc get is
   ```

   Expected output

   ```
   NAME                              DOCKER REPO                                                             TAGS             UPDATED
   percona-server-mongodb            docker-registry.default.svc:5000/psmdb/percona-server-mongodb  7.0.43-23  2 hours ago
   ```

1. When the custom registry image is available, edit the the `image:` option in `deploy/operator.yaml` configuration file with a Docker Repo + Tag string (it should look like `docker-registry.default.svc:5000/psmdb/percona-server-mongodb:7.0.43-23`)

   Note

   If the registry requires authentication, you can specify the `imagePullSecrets` option for all images.

1. Repeat steps 3-5 for other images, and update corresponding options in the `deploy/cr.yaml` file.

   Note

   Don’t forget to set [upgradeoptions.apply](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#upgradeoptionsapply) option to `Disabled`. Otherwise [Smart Upgrade functionality](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update.html#update-strategies) will try using the image recommended by the Version Service instead of the custom one.

   Note

   If a cluster’s `crVersion` is older than the Operator and you don’t set `initImage`, the Operator pulls the Operator image tag that matches `crVersion` for the init container. For example, Operator 1.23.1 running a cluster with `crVersion: 1.22.0` uses the `1.22.0` tag. Push that tag to your registry too, or set `initImage` explicitly. See [Init image](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-crversion.html#init-image).

1. Now follow the standard Percona Operator for MongoDB [installation instruction](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/System-Requirements.html#installation-guidelines).

## See also

- [What `crVersion` does](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/update-crversion.html#what-crversion-does)
- [Troubleshooting](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug.html) - environment variables, reconciliation concurrency, and hook scripts are exactly what gets tuned in response to an observed problem
