# Generate TLS certificates manually

!!! warning

    Manual certificate generation didn't work in Operator version 1.16.0. This issue is fixed starting from version 1.16.1.

You can generate TLS certificates manually instead of using the Operator's automatic certificate generation. This approach gives you full control over certificate properties and is useful for production environments with specific security requirements.

## What you'll create

When you follow the steps from this guide, you'll generate these certificate files:

* `server.pem` - Server certificate for MongoDB nodes
* `server-key.pem` - Private key for the server certificate  
* `client.pem` - Client certificate for external connections
* `client-key.pem` - Private key for the client certificate
* `ca.pem` - Certificate Authority certificate
* `ca-key.pem` - Certificate Authority private key

## Certificate requirements

You need to create **two sets** of certificates:

1. **External certificates** - for client connections from outside the cluster. This set is mandatory
2. **Internal certificates** - for communication between MongoDB nodes within the cluster. You can omit generating a separate of certificates for internal communication. In this case, the operator reuses the external certificates for both external and internal communication.

Generating two separate sets of certificates is not mandatory but highly recommended. Using different certificates for internal and external connections gives you more control and improves security. For example, you can choose to renew or replace external certificates more often than internal ones, or set different expiration dates for each. This makes managing and securing your cluster easier in the long run.

After creating the certificates, you'll create two Kubernetes Secrets and reference them in your cluster configuration.

## Prerequisites

Before you start, make sure you have:

* `cfssl` and `cfssljson` tools installed on your system
* Your cluster name and namespace ready
* Access to your Kubernetes cluster

## Procedure

### Generate certificates

Replace `my-cluster-name` and `my-namespace` with your actual cluster name and namespace in the commands below.

=== "Sharded cluster (sharding is enabled)"

    1. Set your cluster variables
    
        ```bash
        CLUSTER_NAME=my-cluster-name
        NAMESPACE=my-namespace
        ```
    
    2. Create the Certificate Authority (CA)
    
        This command creates a root Certificate Authority that will sign all your certificates:
        
        ```bash
        cat <<EOF | cfssl gencert -initca - | cfssljson -bare ca
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
        ```
    
    3. Create CA configuration file that defines how the CA will sign certificates:
    
        ```bash
        cat <<EOF > ca-config.json
          {
            "signing": {
              "default": {
                "expiry": "87600h",
                "usages": ["signing", "key encipherment", "server auth", "client auth"]
              }
            }
          }
        EOF
        ```
    
    4. Generate the certificate for internal MongoDB node communication, including all shard components:
    
        ```bash
        cat <<EOF | cfssl gencert -ca=ca.pem  -ca-key=ca-key.pem -config=./ca-config.json - | cfssljson -bare server
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
        ```
    
    5. Bundle the server certificate with the CA certificate:
    
        ```bash
        cfssl bundle -ca-bundle=ca.pem -cert=server.pem | cfssljson -bare server
        ```
    
    6. Create a Kubernetes Secret for internal cluster communication:
    
        ```bash
        kubectl create secret generic my-cluster-name-ssl-internal --from-file=tls.crt=server.pem --from-file=tls.key=server-key.pem --from-file=ca.crt=ca.pem --type=kubernetes.io/tls
        ```
    
    7. Generate the certificate for external client connections, including all shard components:
    
        ```bash
        cat <<EOF | cfssl gencert -ca=ca.pem  -ca-key=ca-key.pem -config=./ca-config.json - | cfssljson -bare client
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
        ```
    
    8. Create a Kubernetes Secret for external client connections:
    
        ```bash
        kubectl create secret generic my-cluster-name-ssl --from-file=tls.crt=client.pem --from-file=tls.key=client-key.pem --from-file=ca.crt=ca.pem --type=kubernetes.io/tls
        ```

=== "Replica set only (no sharding)"

    1. Set your cluster variables
    
        ```bash
        CLUSTER_NAME=my-cluster-name
        NAMESPACE=my-namespace
        ```
    
    2. Create the Certificate Authority (CA)
    
        This command creates a root Certificate Authority that will sign all your certificates:
    
        ```bash
        cat <<EOF | cfssl gencert -initca - | cfssljson -bare ca
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
        ```
    
    3. Create a CA configuration file that defines how the CA will sign certificates:
    
        ```bash
        cat <<EOF > ca-config.json
          {
            "signing": {
              "default": {
                "expiry": "87600h",
                "usages": ["signing", "key encipherment", "server auth", "client auth"]
              }
            }
          }
        EOF
        ```
    
    4. Generate the certificate for internal MongoDB node communication:
    
        ```bash
        cat <<EOF | cfssl gencert -ca=ca.pem  -ca-key=ca-key.pem -config=./ca-config.json - | cfssljson -bare server
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
        ```
    
    5. Bundle the server certificate with the CA certificate:
    
        ```bash
        cfssl bundle -ca-bundle=ca.pem -cert=server.pem | cfssljson -bare server
        ```
    
    6. Create a Kubernetes Secret for internal cluster communication:
    
        ```bash
        kubectl create secret generic my-cluster-name-ssl-internal --from-file=tls.crt=server.pem --from-file=tls.key=server-key.pem --from-file=ca.crt=ca.pem --type=kubernetes.io/tls
        ```
    
    7. Generate the certificate for external client connections:
    
        ```bash
        cat <<EOF | cfssl gencert -ca=ca.pem  -ca-key=ca-key.pem -config=./ca-config.json - | cfssljson -bare client
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
        ```
    
    8. Create a Kubernetes Secret for external client connections:
    
        ```bash
        kubectl create secret generic my-cluster-name-ssl --from-file=tls.crt=client.pem --from-file=tls.key=client-key.pem --from-file=ca.crt=ca.pem --type=kubernetes.io/tls
        ```

### Configure your cluster

After creating the Secrets, add them to your cluster configuration in the `deploy/cr.yaml` file:

```yaml
spec:
  secrets:
    ssl: my-cluster-name-ssl          # External certificate secret
    sslInternal: my-cluster-name-ssl-internal  # Internal certificate secret
```

## Important notes

1. If you only create the external certificate, the Operator will use it for both external and internal communications instead of generating a separate internal certificate.

2. The commands above use `rs0` as the replica set name (the default). If you set a different name in the `replsets.name` Custom Resource option, update the commands accordingly.

## Additional resources

* Check the sample certificates in `deploy/ssl-secrets.yaml` for reference
* Review MongoDB certificate requirements in the [upstream documentation :octicons-link-external-16:](https://www.mongodb.com/docs/manual/tutorial/configure-ssl/#member-certificate-requirements)