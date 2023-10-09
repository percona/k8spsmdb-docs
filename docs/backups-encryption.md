# Enable server-side encryption for backups

There is a possibility to enable [server-side encryption]([https://en.wikipedia.org/wiki/LZ4_(compression_algorithm)](https://docs.percona.com/percona-backup-mongodb/details/storage-configuration.html#server-side-encryption))
for backups stored on S3.

Starting from the version 1.15.0, the Operator supports Server Side Encryption with [AWS KMS](https://aws.amazon.com/kms/), with keys stored on the client side.



!!! note

    This feature is available only with Percona XtraDB Cluster 8.0 and not
    Percona XtraDB Cluster 5.7.

To enable compression, use [pxc.configuration](operator.md#pxc-configuration)
key in the `deploy/cr.yaml` configuration file to supply Percona XtraDB Cluster
nodes with two additional `my.cnf` options under its `[sst]` and `[xtrabackup]`
sections as follows:

```yaml
serverSideEncryption:
  kmsKeyID: 1234abcd-12ab-34cd-56ef-1234567890ab
  sseAlgorithm: AES256
  sseAlgorithm: aws:kms
  sseCustomerAlgorithm: AES256
  sseCustomerKey: Y3VzdG9tZXIta2V5
    ...
```

When enabled, compression will be used for both backups and [SST](https://www.percona.com/doc/percona-xtradb-cluster/8.0/manual/state_snapshot_transfer.html).

