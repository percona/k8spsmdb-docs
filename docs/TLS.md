# Transport Layer Security (TLS)

The Percona Operator for MongoDB uses Transport Layer Security (TLS) cryptographic protocol for the following types of communication:

* Internal - communication between Percona Server for MongoDB instances in the cluster
* External - communication between the client application and the cluster

The internal certificate is also used as an authorization method.

Certificates for TLS security can be generated in several ways. By default, the
Operator generates long-term certificates automatically if there are no
certificate secrets available. Other options are the following ones:

* the Operator can use a specifically installed *cert-manager*, which will
    automatically generate and renew short-term TLS certificates,
* certificates can be generated manually.

You can also use pre-generated certificates available in the
`deploy/ssl-secrets.yaml` file for test purposes, but we strongly recommend
**avoiding their usage on any production system**!

The following subsections explain how to configure TLS security with the
Operator yourself, as well as how to temporarily disable it if needed.

## Install and use the *cert-manager*

### About the *cert-manager*

The [cert-manager](https://cert-manager.io/docs/) is a Kubernetes certificate
management controller which widely used to automate the management and issuance
of TLS certificates. It is community-driven, and open source.

When you have already installed *cert-manager* and deploy the operator, the
operator requests a certificate from the *cert-manager*. The *cert-manager* acts
as a self-signed issuer and generates certificates. The Percona Operator
self-signed issuer is local to the operator namespace. This self-signed issuer
is created because Percona Server for MongoDB requires all certificates issued
by the same CA (Certificate authority).

Self-signed issuer allows you to deploy and use the Percona Operator without
creating a cluster issuer separately.

### Installation of the *cert-manager*

The steps to install the *cert-manager* are the following:

* create a namespace,
* disable resource validations on the cert-manager namespace,
* install the cert-manager.

The following commands perform all the needed actions:

``` {.bash data-prompt="$" }
$ kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v{{ certmanagerrecommended }}/cert-manager.yaml --validate=false
```

After the installation, you can verify the *cert-manager* by running the
following command:

``` {.bash data-prompt="$" }
$ kubectl get pods -n cert-manager
```

The result should display the *cert-manager* and webhook active and running:

``` {.text .no-copy}
NAME                                       READY   STATUS    RESTARTS   AGE
cert-manager-7d59dd4888-tmjqq              1/1     Running   0          3m8s
cert-manager-cainjector-85899d45d9-8ncw9   1/1     Running   0          3m8s
cert-manager-webhook-84fcdcd5d-697k4       1/1     Running   0          3m8s
```

Once you create the database with the Operator, it will automatically trigger
cert-manager to create certificates. Whenever you check certificates for expiration,
you will find that they are valid and short-term.

## Generate certificates manually

To generate certificates manually, follow these steps:

1. Provision a Certificate Authority (CA) to generate TLS certificates,
2. Generate a CA key and certificate file with the server details,
3. Create the server TLS certificates using the CA keys, certs, and server details.

The set of commands generate certificates with the following attributes:

* `Server-pem` - Certificate
* `Server-key.pem` - the private key
* `ca.pem` - Certificate Authority

You should generate certificates twice: one set is for external communications,
and another set is for internal ones. A secret created for the external use must
be added to the `spec.secrets.ssl` key of the `deploy/cr.yaml` file. A
certificate generated for internal communications must be added to the
`spec.secrets.sslInternal` key of the `deploy/cr.yaml` file.

Supposing that your cluster name is `my-cluster-name`, the instructions to
generate certificates manually are as follows:

``` {.bash data-prompt="$" }
$ CLUSTER_NAME=my-cluster-name
$ NAMESPACE=default
$ cat <<EOF | cfssl gencert -initca - | cfssljson -bare ca
  {
    "CN": "Root CA",
    "names": [
      {
        "O": "PSMDB"
      }
    ],
    "key": {
      "algo": "rsa",
      "size": 2048
    }
  }
EOF

$ cat <<EOF > ca-config.json
  {
    "signing": {
      "default": {
        "expiry": "87600h",
        "usages": ["signing", "key encipherment", "server auth", "client auth"]
      }
    }
  }
EOF

$ cat <<EOF | cfssl gencert -ca=ca.pem  -ca-key=ca-key.pem -config=./ca-config.json - | cfssljson -bare server
  {
    "hosts": [
      "localhost",
      "${CLUSTER_NAME}-rs0",
      "${CLUSTER_NAME}-rs0.${NAMESPACE}",
      "${CLUSTER_NAME}-rs0.${NAMESPACE}.svc.cluster.local",
      "*.${CLUSTER_NAME}-rs0",
      "*.${CLUSTER_NAME}-rs0.${NAMESPACE}",
      "*.${CLUSTER_NAME}-rs0.${NAMESPACE}.svc.cluster.local"
    ],
    "names": [
      {
        "O": "PSMDB"
      }
    ],
    "CN": "${CLUSTER_NAME/-rs0}",
    "key": {
      "algo": "rsa",
      "size": 2048
    }
  }
EOF
$ cfssl bundle -ca-bundle=ca.pem -cert=server.pem | cfssljson -bare server

$ kubectl create secret generic my-cluster-name-ssl-internal --from-file=tls.crt=server.pem --from-file=tls.key=server-key.pem --from-file=ca.crt=ca.pem --type=kubernetes.io/tls

$ cat <<EOF | cfssl gencert -ca=ca.pem  -ca-key=ca-key.pem -config=./ca-config.json - | cfssljson -bare client
  {
    "hosts": [
      "${CLUSTER_NAME}-rs0",
      "${CLUSTER_NAME}-rs0.${NAMESPACE}",
      "${CLUSTER_NAME}-rs0.${NAMESPACE}.svc.cluster.local",
      "*.${CLUSTER_NAME}-rs0",
      "*.${CLUSTER_NAME}-rs0.${NAMESPACE}",
      "*.${CLUSTER_NAME}-rs0.${NAMESPACE}.svc.cluster.local"
    ],
    "names": [
      {
        "O": "PSMDB"
      }
    ],
    "CN": "${CLUSTER_NAME/-rs0}",
    "key": {
      "algo": "rsa",
      "size": 2048
    }
  }
EOF

$ kubectl create secret generic my-cluster-name-ssl --from-file=tls.crt=client.pem --from-file=tls.key=client-key.pem --from-file=ca.crt=ca.pem --type=kubernetes.io/tls
```

## Update certificates

If a cert-manager is used, it should take care of
updating the certificates. If you generate certificates manually,
you should take care of updating them in proper time.

TLS certificates issued by cert-manager are short-term ones, valid for 3 months.
They are reissued automatically on schedule and without downtime.

![image](assets/images/certificates.svg)

Versions of the Operator prior 1.9.0 have used 3 month root certificate, which
caused issues with the automatic TLS certificates update. If that’s your case,
you can make the Operator update along with the [official instruction](update.md#operator-update).

!!! note

    If you use the cert-manager version earlier than 1.9.0, and you would
    like to avoid downtime while updating the certificates after the Operator
    update to 1.9.0 or newer version,
    force the certificates regeneration by a cert-manager.

### Check your certificates for expiration

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

2. Optionally you can also check that the certificates issuer is up and running:

    ``` {.bash data-prompt="$" }
    $ kubectl get issuer
    ```

    The response should be as follows:

    ``` {.text .no-copy}
    NAME                       READY   AGE
    my-cluster-name-psmdb-ca   True    61s
    ```

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

## Run Percona Server for MongoDB without TLS

Omitting TLS is also possible, but we recommend that you run your cluster with
the TLS protocol enabled.

To disable TLS protocol (e.g. for demonstration purposes) set the
`spec.allowUnsafeConfigurations` key to `true` in the `deploy/cr.yaml`
file and and make sure that there are no certificate secrets available.

!!! warning

    Normally, the Operator prevents users from configuring a cluster with unsafe
    parameters (starting it with less than 3 replica set instances or without
    TLS, etc.), automatically changing such unsafe parameters to safe defaults.
    If you switch the cluster to the *unsafe configurations permissive mode*,
    you will not be able to switch it back by setting
    `spec.allowUnsafeConfigurations` key to `false`, the flag will be ignored.
