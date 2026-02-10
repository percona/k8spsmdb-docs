# Define custom environment variables

!!! admonition "Version added: 1.22.0"

Custom environment variables let you inject configuration without rebuilding container images. This is useful when you need to:

- Align container behavior with your platform (cache size settings, time zone, locale).
- Pass non-sensitive runtime flags to custom entrypoints.
- Provide credentials or third-party API tokens from a Secret without baking them into images.

You can configure custom environment variables in these ways:

* [Set them in the Custom Resource directly](#set-variables-directly-in-the-custom-resource)
* [Load variables from a ConfigMap](#load-variables-from-a-configmap)
* [Load variables from a Secret](#load-variables-from-a-secret)

## Supported components

Custom `env` and `envFrom` are supported for these components:

- `mongod` containers: `spec.replsets[].env` and `spec.replsets[].envFrom`
- `mongos` containers: `spec.sharding.mongos.env` and `spec.sharding.mongos.envFrom`
- Log collector container: `spec.logcollector.env` and `spec.logcollector.envFrom`

## Set variables directly in the Custom Resource

Use this method when you have a small number of non-sensitive values and you want everything in a single file.

For example, you want to set a time zone to keep logs aligned across containers.

1. Edit the `deploy/cr.yaml` Custom Resource manifest

    ```yaml
    spec:
      replsets:
      - name: rs0
        size: 3
        env:
          - name: TZ
            value: "UTC"
    ```

2. Apply the changes:
  
    ```bash
    kubectl apply -f deploy/cr.yaml -n $NAMESPACE
    ```

The Operator makes a rolling restart of your Pods.

## Load variables from a ConfigMap

Use this when you want to share the same variables across multiple clusters or update them without editing the Custom resource.

For example, set a custom runtime flag for `mongod` across all replica set pods.

1. Export the namespace where your cluster is running as an environment variable. Replace `my-namespace` with your value:

    ```bash
    export NAMESPACE=my-namespace
    ```

2. Create a ConfigMap file. Let's name it `mongod-flags.yaml`:

    ```yaml
    apiVersion: v1
    kind: ConfigMap
    metadata:
      name: psmdb-env-config
    data:
      MONGODB_EXTRA_FLAGS: "--setParameter diagnosticDataCollectionEnabled=false"
    ```

3. Create the ConfigMap:

    ```bash
    kubectl apply -f mongod-flags.yaml -n $NAMESPACE
    ```

4. Reference it in the Custom Resource:

    ```yaml
    spec:
      replsets:
      - name: rs0
        size: 3
        envFrom:
          - configMapRef:
              name: psmdb-env-config
    ```

5. Apply the changes: 
  
    ```bash
    kubectl apply -f deploy/cr.yaml -n $NAMESPACE
    ```

The Operator makes a rolling restart of your Pods.

## Load variables from a Secret

Use this when you need to supply sensitive values (tokens, passwords, keys).

For example, you need to provide a token used by a custom sidecar container.

1. Encode your sensitive values before adding them to a Secret, as Kubernetes stores Secret data in base64-encoded form. This helps prevent accidental exposure of sensitive information in plaintext, even though it is not a secure encryption method.

    To encode an API token, run:

    ```bash
    echo -n "your-token" | base64
    ```

    Copy the encoded string for use in your Secret manifest.

2. Export the namespace where your cluster is running as an environment variable. Replace `my-namespace` with your value:

    ```bash
    export NAMESPACE=my-namespace
    ```

3. Create a Secret configuration file. For example, `custom-sidecar.yaml`:

    ```yaml
    apiVersion: v1
    kind: Secret
    metadata:
      name: psmdb-env-secrets
    type: Opaque
    stringData:
      LOG_EXPORT_TOKEN: "your-base64-encoded-token"
    ```

4. Create the Secret object:

    ```bash
    kubectl apply -f custom-sidecar.yaml -n $NAMESPACE
    ```

5. Reference the Secret in the Custom Resource:

    ```yaml
    spec:
      logcollector:
        enabled: true
        envFrom:
          - secretRef:
              name: psmdb-env-secrets
    ```

6. Apply the changes:
  
    ```bash
    kubectl apply -f deploy/cr.yaml -n $NAMESPACE
    ```

The Operator makes a rolling restart of your Pods.
