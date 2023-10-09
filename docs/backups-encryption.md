# Enable server-side encryption for backups

Encrypting database backups is done separately for [physical and logical backups](backups.md).
Physical backups are encrypted if [data-at-rest encryption is turned on](TLS.md).
Logical backups need to be encrypted on the cloud.

There is a possibility to enable [server-side encryption]([https://en.wikipedia.org/wiki/LZ4_(compression_algorithm)](https://docs.percona.com/percona-backup-mongodb/details/storage-configuration.html#server-side-encryption)) for backups stored on S3.
Starting from the version 1.15.0, the Operator supports Server Side Encryption either with [AWS Key Management Service (KMS)](https://aws.amazon.com/kms/), or just encrypt/decrypt backups with AES-256 encryption algorithm with any S3-compatible storage.

To enable server-side encryption for backups, use [backup.storages.backup.storages.&lt;storage-name&gt;.s3.serverSideEncryption section](operator.md#backup-storages-s3--serversideencryption-kmskeyid) in the `deploy/cr.yaml` configuration file.
You can either integrate with AWS KMS or use AES-256 key. For example, to use
AES-256 key your custom resource manifest will look as follows:

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
          sseCustomerKey: SOMEKEY  
    ...
```

!!! note

    Encryption key for S3-compatible storage set in the `sseCustomerKey` field 
    should be encoded in base64. 
    
    You can use the following command to get a base64-encoded string from a plain text one:

        === "in Linux"

            ``` {.bash data-prompt="$" }
            $ echo -n 'plain-text-string' | base64 --wrap=0
            ```

        === "in macOS"

            ``` {.bash data-prompt="$" }
            $ echo -n 'plain-text-string' | base64
            ```
