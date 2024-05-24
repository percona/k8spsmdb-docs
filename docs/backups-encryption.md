# Enable server-side encryption for backups

Encrypting database backups is done separately for [physical and logical backups](backups.md).
Physical backups are encrypted if [data-at-rest encryption is turned on](encryption.md).
Logical backups need to be encrypted on the cloud.

There is a possibility to enable [server-side encryption  :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/details/storage-configuration.html#server-side-encryption) for backups stored on S3.
Starting from the version 1.15.0, the Operator supports Server Side Encryption either with [AWS Key Management Service (KMS)  :octicons-link-external-16:](https://aws.amazon.com/kms/), or just encrypt/decrypt backups with AES-256 encryption algorithm with any S3-compatible storage.

To enable server-side encryption for backups, use [backup.storages.&lt;storage-name&gt;.s3.serverSideEncryption section](operator.md#backupstoragesstoragenames3serversideencryptionkmskeyid) in the `deploy/cr.yaml` configuration file.


## Encryption with keys stored in AWS KMS

To use the server-side AWS KMS encryption, specify the [ID of your customer-managed key  :octicons-link-external-16:](https://docs.aws.amazon.com/kms/latest/developerguide/find-cmk-id-arn.html) and other needed options as follows:

=== "with kmsKeyID in Custom Resource"

    Set the following Custom Resource options in the `deploy/cr.yaml` configuration file:

    ```yaml
    backup:
      ...
      storages:
        my-s3:
          type: s3
          s3:
            bucket: my-backup-bucket
            serverSideEncryption:
              kmsKeyID: <kms_key_ID>
              sseAlgorithm: aws:kms
    ```

    Here `<kms_key_ID>` should be substituted with the [ID of your customer-managed key  :octicons-link-external-16:](https://docs.aws.amazon.com/kms/latest/developerguide/find-cmk-id-arn.html)
    stored in the AWS KMS. It should look similar to the following example value:
    `128887dd-d583-43f2-b3f9-d12036d32b12`.

=== "with kmsKeyID in Secret object"

    You can avoid storing your `kmsKeyID` in Custom Resource, and put it into a
    dedicated Secrets object. Define your secret in YAML as follows:
    
    
    ```yaml title="deploy/sse-secret.yaml"
    
    apiVersion: v1
    kind: Secret
    metadata:
      name: my-cluster-name-sse
    type: Opaque
    stringData:
      KMS_KEY_ID: <kms_key_ID>
    ```

    Here `<kms_key_ID>` should be substituted with the [ID of your customer-managed key  :octicons-link-external-16:](https://docs.aws.amazon.com/kms/latest/developerguide/find-cmk-id-arn.html)
    stored in the AWS KMS. It should look similar to the following example value:
    `128887dd-d583-43f2-b3f9-d12036d32b12`.

    When the YAML file is ready, apply it to create the Secret:

    ``` {.bash data-prompt="$" }
    $ kubectl create -f deploy/sse-secret.yaml
    ```
    
    After creating the Secret, set the following Custom Resource options in the `deploy/cr.yaml` configuration file:

    ```yaml
    secrets:
      ...
      sse: my-cluster-name-sse
    ...
    backup:
      ...
      storages:
        my-s3:
          type: s3
          s3:
            bucket: my-backup-bucket
            serverSideEncryption:
              sseAlgorithm: aws:kms
    ```

## Encryption with localy-stored keys on any S3-compatible storage

The Operator also supports server-side encryption with customer-provided keys
that are stored on the client side. During the backup/restore process,
encryption key will be provided by the Operator as part of the requests to the
S3 storage, and the S3 storage will them to encrypt/decrypt the data using the
AES-256 encryption algorithm. This allows to use server-side encryption on
S3-compatible storages different from AWS KMS (the feature was tested with the
[AWS  :octicons-link-external-16:](https://aws.amazon.com/) and [MinIO  :octicons-link-external-16:](https://min.io/) storages).

To use the server-side encryption with locally-stored keys, specify your
encryption key and other needed options:

=== "with encryption key in Custom Resource"

    Set the following Custom Resource options in the `deploy/cr.yaml` configuration file:

    ```yaml
    backup:
      ...
      storages:
        my-s3:
          type: s3
          s3:
            bucket: my-backup-bucket
            serverSideEncryption:
              sseCustomerAlgorithm: AES256
              sseCustomerKey: <your_encryption_key_in_base64>
        ...
    ```

    Here `<your_encryption_key_in_base64>` should be substituted with the actual
    encryption key encoded in base64.

=== "with encryption key in Secret object"

    You can avoid storing your encryption key in Custom Resource, and put it
    into a dedicated Secrets object. Define your secret in YAML as follows:
    
    
    ```yaml title="deploy/sse-secret.yaml"
    
    apiVersion: v1
    kind: Secret
    metadata:
      name: my-cluster-name-sse
    type: Opaque
    stringData:
      SSE_CUSTOMER_KEY: <your_encryption_key_in_base64>
    ```

    Here `<your_encryption_key_in_base64>` should be substituted with the actual
    encryption key encoded in base64.

    When the YAML file is ready, apply it to create the Secret:

    ``` {.bash data-prompt="$" }
    $ kubectl create -f deploy/sse-secret.yaml
    ```
    
    After creating the Secret, set the following Custom Resource options in the `deploy/cr.yaml` configuration file:

    ```yaml
    secrets:
      ...
      sse: my-cluster-name-sse
    ...
    backup:
      ...
      storages:
        my-s3:
          type: s3
          s3:
            bucket: my-backup-bucket
            serverSideEncryption:
              sseCustomerAlgorithm: AES256
        ...
    ```

!!! note

    You can use the following command to get a base64-encoded string from a plain text one:

    === "in Linux"

        ``` {.bash data-prompt="$" }
        $ echo -n 'plain-text-string' | base64 --wrap=0
        ```

    === "in macOS"

       ``` {.bash data-prompt="$" }
       $ echo -n 'plain-text-string' | base64
       ```
