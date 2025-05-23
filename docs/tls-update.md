# Update certificates

If a cert-manager is used, it should take care of
updating the certificates. If you generate certificates manually,
you should take care of updating them in proper time.

TLS certificates issued by cert-manager are short-term ones, valid for 3 months.
They are reissued automatically on schedule and without downtime.

![image](assets/images/certificates.svg)

## Check your certificates for expiration

1. First, check the necessary secrets names (`my-cluster-name-ssl` and
    `my-cluster-name-ssl-internal` by default):

    ``` {.bash data-prompt="$" }
    $ kubectl get certificate
    ```

    You will have the following response:

    ``` {.text .no-copy}
    NAME                           READY   SECRET                         AGE
    my-cluster-name-ssl            True    my-cluster-name-ssl            49m
    my-cluster-name-ssl-internal   True    my-cluster-name-ssl-internal   49m
    ```

   This command is available if you have cert-manager installed; if not, you can still check the necessary secrets names with `kubectl get secrets` command.

2. Optionally you can also check that the certificates issuer is up and running:

    ``` {.bash data-prompt="$" }
    $ kubectl get issuer
    ```

    The response should be as follows:

    ``` {.text .no-copy}
    NAME                              READY   AGE
    my-cluster-name-psmdb-issuer      True    61m
    my-cluster-name-psmdb-ca-issuer   True    61m
    ```
    
    Again, this command is provided by cert-manager; if you don't have it installed, you can still use `kubectl get secrets`.

    !!! note

        The presence of two issuers has the following meaning. The
        `my-cluster-name-psmdb-ca-issuer` issuer is used to create a self signed
        CA certificate (`my-cluster-name-ca-cert`), and then the
        `my-cluster-name-psmdb-issuer` issuer is used to create SSL certificates
        (`my-cluster-name-ssl` and `my-cluster-name-ssl-internal`) signed by
        the `my-cluster-name-ca-cert` CA certificate.

3. Now use the following command to find out the certificates validity dates,
    substituting Secrets names if necessary:

    ``` {.bash data-prompt="$" }
    $ {
      kubectl get secret/my-cluster-name-ssl-internal -o jsonpath='{.data.tls\.crt}' | base64 --decode | openssl x509 -noout -dates
      kubectl get secret/my-cluster-name-ssl -o jsonpath='{.data.ca\.crt}' | base64 --decode | openssl x509 -noout -dates
      }
    ```

    The resulting output will be self-explanatory:

    ``` {.text .no-copy}
    notBefore=Apr 25 12:09:38 2022 GMT notAfter=Jul 24 12:09:38 2022 GMT
    notBefore=Apr 25 12:09:38 2022 GMT notAfter=Jul 24 12:09:38 2022 GMT
    ```

## Update certificates without downtime

If you don’t use cert-manager and have *created certificates manually*,
you can follow the next steps to perform a no-downtime update of these
certificates *if they are still valid*.

!!! note

    For already expired certificates, follow the alternative way.

Having non-expired certificates, you can roll out new certificates (both CA and TLS) with the Operator
as follows.

1. Generate a new CA certificate (`ca.pem`). Optionally you can also generate
    a new TLS certificate and a key for it, but those can be generated later on
    step 6.

2. Get the current CA (`ca.pem.old`) and TLS (`tls.pem.old`) certificates
    and the TLS certificate key (`tls.key.old`):

    ``` {.bash data-prompt="$" }
    $ kubectl get secret/my-cluster-name-ssl-internal -o jsonpath='{.data.ca\.crt}' | base64 --decode > ca.pem.old
    $ kubectl get secret/my-cluster-name-ssl-internal -o jsonpath='{.data.tls\.crt}' | base64 --decode > tls.pem.old
    $ kubectl get secret/my-cluster-name-ssl-internal -o jsonpath='{.data.tls\.key}' | base64 --decode > tls.key.old
    ```

3. Combine new and current `ca.pem` into a `ca.pem.combined` file:

    ``` {.bash data-prompt="$" }
    $ cat ca.pem ca.pem.old >> ca.pem.combined
    ```

4. Create a new Secrets object with *old* TLS certificate (`tls.pem.old`)
    and key (`tls.key.old`), but a *new combined* `ca.pem`
    (`ca.pem.combined`):

    ``` {.bash data-prompt="$" }
    $ kubectl delete secret/my-cluster-name-ssl-internal
    $ kubectl create secret generic my-cluster-name-ssl-internal --from-file=tls.crt=tls.pem.old --from-file=tls.key=tls.key.old --from-file=ca.crt=ca.pem.combined --type=kubernetes.io/tls
    ```

5. The cluster will go through a rolling reconciliation, but it will do it
    without problems, as every node has old TLS certificate/key, and both new
    and old CA certificates.

6. If new TLS certificate and key weren’t generated on step 1,
    do that now.

7. Create a new Secrets object for the second time: use new TLS certificate
    (`server.pem` in the example) and its key (`server-key.pem`), and again
    the combined CA certificate (`ca.pem.combined`):

    ``` {.bash data-prompt="$" }
    $ kubectl delete secret/my-cluster-name-ssl-internal
    $ kubectl create secret generic my-cluster-name-ssl-internal --from-file=tls.crt=server.pem --from-file=tls.key=server-key.pem --from-file=ca.crt=ca.pem.combined --type=kubernetes.io/tls
    ```

8. The cluster will go through a rolling reconciliation, but it will do it
    without problems, as every node already has a new CA certificate (as a part
    of the combined CA certificate), and can successfully allow joiners with new
    TLS certificate to join. Joiner node also has a combined CA certificate, so
    it can authenticate against older TLS certificate.

9. Create a final Secrets object: use new TLS certificate (`server.pmm`) and
    its key (`server-key.pem`), and just the new CA certificate (`ca.pem`):

    ``` {.bash data-prompt="$" }
    $ kubectl delete secret/my-cluster-name-ssl-internal
    $ kubectl create secret generic my-cluster-name-ssl-internal --from-file=tls.crt=server.pem --from-file=tls.key=server-key.pem --from-file=ca.crt=ca.pem --type=kubernetes.io/tls
    ```

10. The cluster will go through a rolling reconciliation, but it will do it
    without problems: the old CA certificate is removed, and every node is
    already using new TLS certificate and no nodes rely on the old CA
    certificate any more.

## Update certificates with downtime

If your certificates have been already expired (or if you continue to use the
Operator version prior to 1.9.0), you should move through the
*pause - update Secrets - unpause* route as follows.

1. Pause the cluster [in a standard way](pause.md), and make
    sure it has reached its paused state.

2. If cert-manager is used, delete issuer
    and TLS certificates:

    ``` {.bash data-prompt="$" }
    $ {
      kubectl delete issuer/my-cluster-name-psmdb-ca-issuer issuer/my-cluster-name-psmdb-issuer 
      kubectl delete certificate/my-cluster-name-ssl certificate/my-cluster-name-ssl-internal
      }
    ```

3. Delete Secrets to force the SSL reconciliation:

    ``` {.bash data-prompt="$" }
    $ kubectl delete secret/my-cluster-name-ssl secret/my-cluster-name-ssl-internal
    ```

4. Check certificates to make sure reconciliation have succeeded.

5. Unpause the cluster [in a standard way](pause.md), and make
    sure it has reached its running state.

## Modify certificates generation

There may be reasons to tweak the certificates generation, making it better fit some needs.
Of course, maximum flexibility can be obtained with manual certificates generation,
but sometimes slight tweaking the already automated job may be enough.

The following example shows how to increase CA duration with cert-manager for
a cluster named `cluster1`:

1. Delete the `psmdb` Custom Resource in the proper namespace (this will cause
    deletion of all Pods of the cluster, but later you will recreate the cluster
    using the same `deploy/cr.yaml` flie from which it was originally created).

    !!! note

        you may need to make sure that [`finalizers.percona.com/delete-psmdb-pvc` is not set](operator.md#metadata)
        if you want to preserver Persistent Volumes with the data.

    Deletion command should look as follows:

    ``` {.bash data-prompt="$" }
    $ kubectl -n <namespace_name> delete psmdb cluster1
    ```

2. Deletion takes time. Check that all Pods disappear with `kubectl -n <namespace_name> get pods`
    command, and delete certificate related resources:
    
    ``` {.bash data-prompt="$" }
    $ kubectl -n <namespace_name> delete issuer.cert-manager.io/cluster1-psmdb-ca-issuer issuer.cert-manager.io/cluster1-psmdb-issuer certificate.cert-manager.io/cluster1-ssl-internal certificate.cert-manager.io/cluster1-ssl certificate.cert-manager.io/cluster1-ca-cert secret/cluster1-ca-cert secret/cluster1-ssl secret/cluster1-ssl-internal
    ```

3. Create your own custom CA:

    ```yaml  title="my_new_ca.yml"
    apiVersion: cert-manager.io/v1
    kind: Issuer
    metadata:
      name: cluster1-psmdb-ca-issuer
    spec:
      selfSigned: {}
    ---
    apiVersion: cert-manager.io/v1
    kind: Certificate
    metadata:
      name: cluster1-ca-cert
    spec:
      commonName: cluster1-ca
      duration: 10000h0m0s
      isCA: true
      issuerRef:
        kind: Issuer
        name: cluster1-psmdb-ca-issuer
      renewBefore: 730h0m0s
      secretName: cluster1-ca-cert
    ```

    Apply it as usual, with the `kubectl -n <namespace_name> apply -f my_new_ca.yml` command.

4. Recreate the cluster from the original `deploy/cr.yaml` configuration file:

    ``` {.bash data-prompt="$" }
    $ kubectl -n <namespace_name> apply -f deploy/cr.yaml
    ```

5. Verify certificate duration [in usual way](#check-your-certificates-for-expiration).