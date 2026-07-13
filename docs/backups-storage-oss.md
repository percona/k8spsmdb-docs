# Alibaba Cloud Object Storage Service (OSS)

!!! note "Version added: [1.23.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.23.0.md)"

If you operate in the Asia-Pacific or China region, or already run workloads on Alibaba Cloud, you can use Alibaba Cloud Object Storage Service (OSS) as the remote backup storage. This way you can keep backup traffic in the same cloud, which helps reduce latency and simplifies compliance.

To use [Alibaba Cloud Object Storage Service (OSS) :octicons-link-external-16:](https://www.alibabacloud.com/product/object-storage-service) as a remote store for backups, you need the following:

* An Alibaba Cloud account with the Object Storage Service (OSS) enabled for it
* An OSS bucket. Refer to the [bucket naming conventions :octicons-link-external-16:](https://www.alibabacloud.com/help/en/oss/user-guide/bucket-naming-conventions) for requirements
* Access to the Resource Access Management (RAM) console and sufficient permissions to create and manage access policies and users. Read more about using RAM with Alibaba Cloud OSS in the [official documentation :octicons-link-external-16:](https://www.alibabacloud.com/help/en/oss/user-guide/how-oss-works-with-ram).

**Configuration steps**
{.power-number}

1. Create an OSS bucket in the [Alibaba Cloud Management Console :octicons-link-external-16:](https://www.alibabacloud.com/help/en/oss/user-guide/create-buckets-4/), or with the [`ossutil` :octicons-link-external-16:](https://www.alibabacloud.com/help/en/oss/developer-reference/ossutil-overview) CLI. Note the bucket name, region, and endpoint URL (for example, `https://oss-eu-central-1.aliyuncs.com`).

2. Create a RAM user and grant it permissions to access the bucket. Create an AccessKey pair for that user. See [Configure access to Alibaba Cloud OSS for PBM :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/details/oss.html#configure-access-to-alibaba-cloud-oss-for-pbm) for permission guidance.

3. Encode your AccessKey ID and AccessKey secret with base64:

    === ":simple-linux: in Linux"

        ```bash
        echo -n 'plain-text-string' | base64 --wrap=0
        ```

    === ":simple-apple: in macOS"

        ```bash
        echo -n 'plain-text-string' | base64
        ```

4. Create a Kubernetes Secret manifest with the encoded credentials:

    ```yaml title="backup-oss-secret.yaml"
    apiVersion: v1
    kind: Secret
    metadata:
      name: my-cluster-name-backup-oss
    type: Opaque
    data:
      ALIBABA_ACCESS_KEY_ID: <base64-encoded-access-key-id>
      ALIBABA_ACCESS_KEY_SECRET: <base64-encoded-access-key-secret>
    ```

5. Create the Secret in your cluster. Replace the `<namespace>` placeholder with your value:

    ```bash
    kubectl apply -f backup-oss-secret.yaml -n <namespace>
    ```

6. Configure the OSS storage in the `deploy/cr.yaml` Custom Resource. Specify the following information:

    * Set `storages.NAME.type` to `oss`. Substitute the `NAME` part with a name you will later use to refer to this storage when making backups and restores.
    * Specify the bucket name for the `storages.NAME.oss.bucket` option
    * Specify the Secret name for the `storages.NAME.oss.credentialsSecret` option
    * Specify the OSS endpoint for the `storages.NAME.oss.endpointUrl` option
    * Specify the bucket region for the `storages.NAME.oss.region` option
    * Optionally, set `storages.NAME.oss.prefix` to store backups in a sub-folder. If you don't set a prefix, backups are stored in the root of the bucket

    ```yaml
    backup:
      storages:
        alibaba-oss:
          type: oss
          oss:
            bucket: OSS-BACKUP-BUCKET-NAME-HERE
            prefix: "some-prefix"
            credentialsSecret: my-cluster-name-backup-oss
            endpointUrl: https://oss-eu-central-1.aliyuncs.com
            region: eu-central-1
    ```

    These and other options within the `storages.NAME.oss` subsection are further described in the [Operator Custom Resource options](operator.md#operator-backup-section).

7. Apply the configuration:

    ```bash
    kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

## Optional settings

You can fine-tune OSS uploads and encryption in the same `oss` block.

### Upload retries and multipart settings

Use these options to improve reliability on unstable networks and to control multipart uploads:

```yaml
backup:
  storages:
    alibaba-oss:
      type: oss
      oss:
        bucket: OSS-BACKUP-BUCKET-NAME-HERE
        credentialsSecret: my-cluster-name-backup-oss
        endpointUrl: https://oss-eu-central-1.aliyuncs.com
        region: eu-central-1
        connectTimeout: 10s
        uploadPartSize: 10485760
        maxUploadParts: 10000
        retryer:
          maxAttempts: 3
          maxBackoff: 5m
          baseDelay: 1s
```

### Server-side encryption

OSS supports server-side encryption with OSS-managed keys (SSE-OSS) or with customer master keys in Alibaba Cloud Key Management Service (SSE-KMS). Configure encryption under `serverSideEncryption`.

Provide the encryption key either directly in the Custom
Resource with `encryptionKeyId`, or in a dedicated Secret
referenced by `secretName`. When you use a Secret, it must
contain the `SSE_CUSTOMER_KEY` key.

=== "With encryptionKeyId in a Secret"

    To keep the key out of the Custom Resource, create a Kubernetes Secret that includes the `SSE_CUSTOMER_KEY` value and reference it with `secretName`.

    1. Create the Secret manifest. For example:

        ```yaml title="oss-sse-key.yaml"
        apiVersion: v1
        kind: Secret
        metadata:
          name: my-cluster-name-backup-oss-sse
        type: Opaque
        stringData:
          SSE_CUSTOMER_KEY: "OSS-KMS-KEY-ID-HERE"
        ```

    2. Create the Secret object:

        ```bash
        kubectl apply -f oss-sse-key.yaml -n <namespace>
        ```

    3. Reference this Secret in your storage configuration:

        ```yaml
        backup:
          storages:
            alibaba-oss:
              type: oss
              oss:
                bucket: OSS-BACKUP-BUCKET-NAME-HERE
                credentialsSecret: my-cluster-name-backup-oss
                endpointUrl: https://oss-eu-central-1.aliyuncs.com
                region: eu-central-1
                serverSideEncryption:
                  secretName: my-cluster-name-backup-oss-sse
                  encryptionMethod: sse
                  encryptionAlgorithm: KMS
        ```

=== "With encryptionKeyId in the Custom Resource"

    Provide the encryption key directly in the Custom Resource with `encryptionKeyId`:

    ```yaml
    backup:
      storages:
        alibaba-oss:
          type: oss
          oss:
            bucket: OSS-BACKUP-BUCKET-NAME-HERE
            credentialsSecret: my-cluster-name-backup-oss
            endpointUrl: https://oss-eu-central-1.aliyuncs.com
            region: eu-central-1
            serverSideEncryption:
              encryptionMethod: sse
              encryptionAlgorithm: KMS
              encryptionKeyId: OSS-KMS-KEY-ID-HERE
    ```

For encryption types, RAM permissions, and PBM-side details, see [Server-side encryption in PBM :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/details/oss.html#server-side-encryption).
