# Enable server-side encryption for backups

Encrypting database backups is done separately for [physical and logical backups](backups.md).
Physical backups are encrypted if [data-at-rest encryption is turned on](TLS.md).
Logical backups need to be encrypted on the cloud.

There is a possibility to enable [server-side encryption](https://docs.percona.com/percona-backup-mongodb/details/storage-configuration.html#server-side-encryption) for backups stored on S3.
Starting from the version 1.15.0, the Operator supports Server Side Encryption either with [AWS Key Management Service (KMS)](https://aws.amazon.com/kms/), or just encrypt/decrypt backups with AES-256 encryption algorithm with any S3-compatible storage.

To enable server-side encryption for backups, use [backup.storages.backup.storages.&lt;storage-name&gt;.s3.serverSideEncryption section](operator.md#backup-storages-s3--serversideencryption-kmskeyid) in the `deploy/cr.yaml` configuration file.


## Encryption with keys stored in AWS KMS

To use the server-side AWS KMS encryption, specify the following Custom Resource options in the `deploy/cr.yaml` configuration file:

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

Here `<kms_key_ID>` should be substituted with the [ID of your customer-managed key](https://docs.aws.amazon.com/kms/latest/developerguide/find-cmk-id-arn.html) stored in the AWS KMS.

## Encryption with localy-stored keys on any S3-compatible storage

The Operator also supports server-side encryption with customer-provided keys that are stored on the client side. During the backup/restore process, encryption key will be provided by the Operator as part of the requests to the S3 storage, and the S3 storage will them to encrypt/decrypt the data using the AES-256 encryption algorithm. This allows to use server-side encryption on S3-compatible storages different from AWS. 

To use the server-side encryption wit locally-stored keys, specify the following Custom Resource options in the `deploy/cr.yaml` configuration file:

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
          sseCustomerKey: <your_encryption_key>  
    ...
```

Here `<your_encryption_key>` should be substituted with the actual encryption key encoded in base64.

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
