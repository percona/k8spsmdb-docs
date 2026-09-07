# Define custom environment variables

!!! note "Version added: [1.22.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.22.0.md)"

Custom environment variables let you inject configuration without rebuilding container images. This is useful when you need to:

- Align container behavior with your platform (cache size settings, time zone, locale).
- Pass non-sensitive runtime flags to custom entrypoints.
- Provide credentials or third-party API tokens from a Secret without baking them into images.

The following sections in this document show how you can define custom environment variables.

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

1. Export the namespace where your cluster is running as an environment variable. Replace `my-namespace` with your value:

    ```bash
    export NAMESPACE=my-namespace
    ```

2. Create a Secret configuration file. For example, `custom-sidecar.yaml`. Put your value in
    plain text under `stringData` - Kubernetes base64-encodes it for you when the Secret is
    created:

    ```yaml
    apiVersion: v1
    kind: Secret
    metadata:
      name: psmdb-env-secrets
    type: Opaque
    stringData:
      LOG_EXPORT_TOKEN: "your-token"
    ```

3. Create the Secret object:

    ```bash
    kubectl apply -f custom-sidecar.yaml -n $NAMESPACE
    ```

4. Reference the Secret in the Custom Resource:

    ```yaml
    spec:
      logcollector:
        enabled: true
        envFrom:
          - secretRef:
              name: psmdb-env-secrets
    ```

5. Apply the changes:
  
    ```bash
    kubectl apply -f deploy/cr.yaml -n $NAMESPACE
    ```

The Operator makes a rolling restart of your Pods.
