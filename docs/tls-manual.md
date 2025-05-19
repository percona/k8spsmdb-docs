# Generate certificates manually

!!! warning

    Using manually generated certificates didn't work in the Operator version 1.16.0. The problem is fixed starting from the version 1.16.1.

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

You can explore pre-generated / development mode sample certificates available as base64-encoded data in the `deploy/ssl-secrets.yaml` file. Also, check MongoDB certificate requirements in the [upstream documentation :octicons-link-external-16:](https://www.mongodb.com/docs/manual/tutorial/configure-ssl/#member-certificate-requirements).

!!! note

    If you only create the external certificate, then the Operator will not
    generate the internal one, but instead use certificate you have provided for
    both external and internal communications.

Supposing that your cluster name is `my-cluster-name`, the instructions to
generate certificates manually are as follows:

=== "if sharding is off"
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

=== "if sharding is on"

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
          "*.${CLUSTER_NAME}-rs0.${NAMESPACE}.svc.cluster.local",
          "${CLUSTER_NAME}-mongos",
          "${CLUSTER_NAME}-mongos.${NAMESPACE}",
          "${CLUSTER_NAME}-mongos.${NAMESPACE}.svc.cluster.local",
          "*.${CLUSTER_NAME}-mongos",
          "*.${CLUSTER_NAME}-mongos.${NAMESPACE}",
          "*.${CLUSTER_NAME}-mongos.${NAMESPACE}.svc.cluster.local",
          "${CLUSTER_NAME}-cfg",
          "${CLUSTER_NAME}-cfg.${NAMESPACE}",
          "${CLUSTER_NAME}-cfg.${NAMESPACE}.svc.cluster.local",
          "*.${CLUSTER_NAME}-cfg",
          "*.${CLUSTER_NAME}-cfg.${NAMESPACE}",
          "*.${CLUSTER_NAME}-cfg.${NAMESPACE}.svc.cluster.local"
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
          "*.${CLUSTER_NAME}-rs0.${NAMESPACE}.svc.cluster.local",
          "${CLUSTER_NAME}-mongos",
          "${CLUSTER_NAME}-mongos.${NAMESPACE}",
          "${CLUSTER_NAME}-mongos.${NAMESPACE}.svc.cluster.local",
          "*.${CLUSTER_NAME}-mongos",
          "*.${CLUSTER_NAME}-mongos.${NAMESPACE}",
          "*.${CLUSTER_NAME}-mongos.${NAMESPACE}.svc.cluster.local",
          "${CLUSTER_NAME}-cfg",
          "${CLUSTER_NAME}-cfg.${NAMESPACE}",
          "${CLUSTER_NAME}-cfg.${NAMESPACE}.svc.cluster.local",
          "*.${CLUSTER_NAME}-cfg",
          "*.${CLUSTER_NAME}-cfg.${NAMESPACE}",
          "*.${CLUSTER_NAME}-cfg.${NAMESPACE}.svc.cluster.local"
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

!!! note

    Commands in the above example use `rs0` replica set name (the default one). If you set different name in `replsets.name` Custom Resource option, change these commands accordingly.