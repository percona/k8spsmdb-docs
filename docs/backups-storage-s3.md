# Amazon S3 storage

To use Amazon S3 storage service, create a Secret object with your access credentials. Use the [deploy/backup-s3.yaml :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/v{{release}}/deploy/backup-s3.yaml) file as an example. You must specify the following information:

* `metadata.name` is the name of the Kubernetes secret which you will reference in the Custom Resource
* `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are base64-encoded keys to access S3 storage

Use the following command to encode the keys:

=== ":simple-linux: in Linux"

    ```bash
    echo -n 'plain-text-string' | base64 --wrap=0
    ```

=== ":simple-apple: in macOS"

    ```bash
    echo -n 'plain-text-string' | base64
    ```

Here's the example configuration of the Secret file:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-cluster-name-backup-s3
type: Opaque
data:
  AWS_ACCESS_KEY_ID: UkVQTEFDRS1XSVRILUFXUy1BQ0NFU1MtS0VZ
  AWS_SECRET_ACCESS_KEY: UkVQTEFDRS1XSVRILUFXUy1TRUNSRVQtS0VZ
```

1. Create the Kubernetes Secret object with this file:

    ```bash
    kubectl apply -f deploy/backup-s3.yaml -n <namespace>
    ```

2. Configure the storage in the Custom Resource. Modify the `backup.storages` subsection of the `deploy/cr.yaml` file. Give your storage a name (the default name is `s3-us-west`) and define the following information:

    * `type` - make sure the type is `s3`
    * `bucket` - where the data will be stored
    * `region` - location of the bucket
    * `credentialsSecret` - the name of the Secret you created previously
    !!! tip "Organizing backups"

        You can use the [prefix](operator.md#backupstoragesstorage-names3prefix) option to specify a path (sub-folder) inside the S3 bucket where backups will be stored. If you don't set a prefix, backups are stored in the root directory.

    Here's the example:

    ```yaml
    ...
    backup:
      ...
      storages:
        s3-us-west:
          type: s3
          s3:
            bucket: S3-BACKUP-BUCKET-NAME-HERE
            region: us-west-2
            credentialsSecret: my-cluster-name-backup-s3
      ...
    ```

    For more configuration options, see the [Operator Custom Resource options](operator.md#operator-backup-section).

    !!! note "Plan for large backups"

        Make sure your storage has enough free space for backups, especially for large databases.

        Also, note that S3 has an upload limit of 10,000 parts per file. If your backup is very large, you may hit this limit, which increases the size of each chunk. Large chunk sizes can use a lot of memory on the S3 server. To avoid issues:

        1. Check your storage free space before backing up.
        2. Be aware of the 10,000 part limit for S3 uploads.
        3. Adjust your backup chunk size and memory settings in the Custom Resource if necessary for large backups.

3. Apply the configuration:

    ```bash
    kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

## Automating access to Amazon S3 based on IAM roles

Using AWS EC2 instances for backups makes it possible to automate access to AWS S3 buckets based on [Identity Access Management (IAM) roles  :octicons-link-external-16:](https://kubernetes-on-aws.readthedocs.io/en/latest/user-guide/iam-roles.html) for Service Accounts with *no need to specify the S3 credentials explicitly*.

You can either use the *IAM instance profile* or configure *IAM roles for Service Accounts*. Both approaches are AWS-specific so you should follow the official Amazon documentation.

=== "Using IAM instance profile"

    Follow these steps:

    1. Create the [IAM instance profile  :octicons-link-external-16:](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html) and the permission policy within where you specify the access level that grants the access to S3 buckets.
    2. Attach the IAM profile to an EC2 instance.
    3. Configure an S3 storage bucket in the Custom Resource and verify the connection from the EC2 instance to it.
    4. *Do not provide* `s3.credentialsSecret` for the storage in `deploy/cr.yaml`.

=== "Using IAM role for service account"

    [IRSA :octicons-link-external-16:](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html) is the native way for the cluster [running on Amazon Elastic Kubernetes Service (AWS EKS)](eks.md) to access the AWS API using permissions configured in AWS IAM roles.

    Assuming that you have [deployed the Operator and the database cluster on EKS](eks.md), and your EKS cluster has [OpenID Connect issuer URL (OIDC) :octicons-link-external-16:](https://docs.aws.amazon.com/eks/latest/userguide/enable-iam-roles-for-service-accounts.html) enabled, the high-level steps to configure it are the following:

    1. Create an IAM role for your OIDC, and attach to the created role the policy that defines the access to an S3 bucket. See [official Amazon documentation :octicons-link-external-16:](https://docs.aws.amazon.com/eks/latest/userguide/associate-service-account-role.html) for details.

    2. Find the service accounts used for the Operator and the database cluster. Service account for the Operator is `percona-server-mongodb-operator` (it is set by the `serviceAccountName` key in the `deploy/operator.yaml` or `deploy/bundle.yaml` manifest). The cluster's default account is `default` (it can be set with the `serviceAccountName` Custom Resource option in the `replsets`, `sharding.configsvrReplSet`, and `sharding.mongos` subsections of the `deploy/cr.yaml` manifest).
    3. Annotate both service accounts with the needed IAM roles. The commands should look as follows:

        ```bash
        kubectl -n <cluster namespace> annotate serviceaccount default eks.amazonaws.com/role-arn: arn:aws:iam::111122223333:role/my-role --overwrite
        kubectl -n <operator namespace> annotate serviceaccount percona-server-mongodb-operator eks.amazonaws.com/role-arn: arn:aws:iam::111122223333:role/my-role --overwrite
        ```

        Don't forget to substitute the `<operator namespace>` and `<cluster namespace>` placeholders with the real namespaces, and use your IAM role instead of the `eks.amazonaws.com/role-arn: arn:aws:iam::111122223333:role/my-role` example.

    4. Configure an S3 storage bucket in the Custom Resource and verify the connection from the EC2 instance to it. *Do not provide* `s3.credentialsSecret` for the storage in `deploy/cr.yaml`.

!!! note

    If IRSA-related credentials are defined, they have the priority over any IAM instance profile. S3 credentials in a secret, if present, override any IRSA/IAM instance profile related credentials and are used for authentication instead.
