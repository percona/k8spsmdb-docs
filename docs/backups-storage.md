# Configure storage for backups

You can configure storage for backups in the `backup.storages` subsection of the
Custom Resource, using the [deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml)
configuration file.

!!! warning 

    Remote storage for backups has the **technical preview status**.

You should also create the [Kubernetes Secret  :octicons-link-external-16:](https://kubernetes.io/docs/concepts/configuration/secret/) object with credentials needed
to access the storage.

## Amazon S3 or S3-compatible storage

1. To store backups on the Amazon S3, you need to create a Secret with
    the following values:

    * the `metadata.name` key is the name which you will further use to refer
        your Kubernetes Secret,
    * the `data.AWS_ACCESS_KEY_ID` and `data.AWS_SECRET_ACCESS_KEY` keys are
        base64-encoded credentials used to access the storage (obviously these
        keys should contain proper values to make the access possible).

    Create the Secrets file with these base64-encoded keys following the
    [deploy/backup-s3.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/backup-s3.yaml)
    example:

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

    Once the editing is over, create the Kubernetes Secret object as follows:

    ``` {.bash data-prompt="$" }
    $ kubectl apply -f deploy/backup-s3.yaml
    ```

2. <a name="bucket"></a>Put the data needed to access the S3-compatible cloud into the
    `backup.storages` subsection of the Custom Resource.

    * `storages.<NAME>.type` should be set to `s3` (substitute the <NAME> part
       with some arbitrary name you will later use to refer this storage when
       making backups and restores).

    * `storages.<NAME>.s3.credentialsSecret` key should be set to the name used
        to refer your Kubernetes Secret (`my-cluster-name-backup-s3` in the last
        example).

    * `storages.<NAME>.s3.bucket` and `storages.<NAME>.s3.region` should contain
       the S3 bucket and region. Also you can use `storages.<NAME>.s3.prefix`
       option to specify the path (sub-folder) to the backups inside the S3
       bucket. If prefix is not set, backups are stored in the root directory.

    * if you use some S3-compatible storage instead of the original Amazon S3,
        add the [endpointURL  :octicons-link-external-16:](https://docs.min.io/docs/aws-cli-with-minio.html)
        key in the `s3` subsection, which should point to the actual cloud used
        for backups. This value and is specific to the cloud provider. For
        example, using [Google Cloud  :octicons-link-external-16:](https://cloud.google.com) involves the
        [following  :octicons-link-external-16:](https://storage.googleapis.com) endpointUrl:

        ```yaml
        endpointUrl: https://storage.googleapis.com
        ```

    The options within the `storages.<NAME>.s3` subsection are further explained
    in the [Operator Custom Resource options](operator.md#operator-backup-section).


    Here is an example
    of the [deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml)
    configuration file which configures Amazon S3 storage for backups:

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

Finally, make sure that your storage has enough resources to store backups, which is
especially important in the case of large databases. It is clear that you need
enough free space on the storage. Beside that, S3 storage [upload limitats :octicons-link-external-16:](https://docs.aws.amazon.com/AmazonS3/latest/userguide/qfacts.html)
include the maximum number 10000 parts, and backing up large data will result in
larger chunk sizes, which in turn may cause S3 server to run out of RAM, especially
within the default memory limits.

### Automating access to Amazon s3 based on IAM roles

Using AWS EC2 instances for backups makes it possible to automate access to AWS S3 buckets based on [Identity Access Management (IAM) roles  :octicons-link-external-16:](https://kubernetes-on-aws.readthedocs.io/en/latest/user-guide/iam-roles.html) for Service Accounts with *no need to specify the S3 credentials explicitly*.

You can use either make and use the *IAM instance profile*, or configure *IAM roles for Service Accounts* (both ways heavily rely on AWS specifics, and need following the official Amazon documentation to be configured). 

=== "Using IAM instance profile"

    Following steps are needed to turn this feature on:

    1. Create the [IAM instance profile  :octicons-link-external-16:](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html) and the permission policy within where you specify the access level that grants the access to S3 buckets.
    2. Attach the IAM profile to an EC2 instance.
    3. Configure an [S3 storage bucket in the Custom Resource](backups-storage.md#bucket) and verify the connection from the EC2 instance to it.
    4. *Do not provide* `s3.credentialsSecret` for the storage in `deploy/cr.yaml`.

=== "Using IAM role for service account"

    [IRSA :octicons-link-external-16:](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html) is the native way for the cluster [running on Amazon Elastic Kubernetes Service (AWS EKS)](eks.md) to access the AWS API using permissions configured in AWS IAM roles.

    Assuming that you have deployed the MongoDB Operator and the database cluster on [EKS, following our installation steps](eks.md), and your EKS cluster has [OpenID Connect issuer URL (OIDC) :octicons-link-external-16:](https://docs.aws.amazon.com/eks/latest/userguide/enable-iam-roles-for-service-accounts.html) enabled, the the high-level steps to configure it are the following:

    1. Create an IAM role for your OIDC, and attach to the created role the policy that defines the access to an S3 bucket. See [official Amazon documentation :octicons-link-external-16:](https://docs.aws.amazon.com/eks/latest/userguide/associate-service-account-role.html) for details.

    2. Find out service accounts used for the Operator and for the database cluster. Service account for the Operator is `percona-server-mongodb-operator` (it is set by the `serviceAccountName` key in the `deploy/operator.yaml` or `deploy/bundle.yaml` manifest) The cluster's default account is `default` (it can be set with `serviceAccountName` Custom Resource option in the `replsets`, `sharding.configsvrReplSet`, and `sharding.mongos` subsections of the `deploy/cr.yaml` manifest).
    
    3. Annotate both service accounts with the needed IAM roles. The commands should look as follows:

        ``` {.bash data-prompt="$" }
        $ kubectl -n <cluster namespace> annotate serviceaccount default eks.amazonaws.com/role-arn: arn:aws:iam::111122223333:role/my-role --overwrite
        $ kubectl -n <operator namespace> annotate serviceaccount percona-server-mongodb-operator eks.amazonaws.com/role-arn: arn:aws:iam::111122223333:role/my-role --overwrite
        ```

        Don't forget to substitute the `<operator namespace>` and `<cluster namespace>` placeholders with the real namespaces, and use your IAM role instead of the `eks.amazonaws.com/role-arn: arn:aws:iam::111122223333:role/my-role` example.

    4. Configure an [S3 storage bucket in the Custom Resource](backups-storage.md#bucket) and verify the connection from the EC2 instance to it. *Do not provide* `s3.credentialsSecret` for the storage in `deploy/cr.yaml`.

!!! note 

    If IRSA-related credentials are defined, they have the priority over any IAM instance profile. S3 credentials in a secret, if present, override any IRSA/IAM instance profile related credentials and are used for authentication instead.

## Google Cloud storage

To use [Google Cloud Storage (GCS) :octicons-link-external-16:](https://cloud.google.com/storage) as an object store for backups, you need the following information:

* a GCS bucket name. Refer to the [GCS bucket naming guidelines :octicons-link-external-16:](https://cloud.google.com/storage/docs/buckets#naming) for bucket name requirements
* authentication keys for your service account in JSON format. 

!!! note

    You can still use the S3-compatible implementation of GCS with HMAC. Refer to the [Amazon S3 storage setup](#amazon-s3-or-s3-compatible-storage) section for steps.

    However, we don't recommend their usage due to a [known issue in PBM :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/release-notes/2.11.0.html#known-limitations-for-using-hmac-keys-on-gcs) and encourage you to switch to using service accounts keys after the upgrade to the Operator version 1.21.0.
    
**Configuration steps** 
{.power-number}

1. [Create a service account :octicons-link-external-16:](https://cloud.google.com/iam/docs/service-accounts-create#iam-service-accounts-create-console), if you don't have it already.

2. Add [JSON service keys for the service account :octicons-link-external-16:](https://cloud.google.com/iam/docs/creating-managing-service-account-keys). As the result a service account key file in JSON format with the private key and related information is automatically downloaded on your machine.

3. Encode your keys in base64 format. You need to encode the service account email and the private key. You can get these values from the service account key file you downloaded when you created the service account keys.

    The following command shows how to encode a private key. Replace the placeholder with your private key and service account email:

    ```bash 
    echo -n "-----BEGIN PRIVATE KEY-----\nPRIVATE_KEY\n-----END PRIVATE KEY-----\n" | base64 
    ```

4. Create the Kubernetes Secret configuration file and specify the encoded GCS credentials within:

    ```yaml title="gcp-cs-secret.yaml"
    apiVersion: v1
    kind: Secret
    metadata:
      name: gcp-cs-secret-key
    type: Opaque
    data:
      GCS_CLIENT_EMAIL: base_64_encoded_email
      GCS_PRIVATE_KEY: base_64_encoded_key
    ```       

5. Create the Kubernetes Secrets object. Replace the `<namespace>` placeholder with your value:

    ``` {.bash data-prompt="$" }
    $ kubectl apply -f gcp-cs-secret.yaml -n <namespace>
    ```    

6. Configure the GCS storage in the `deploy/cr.yaml` Custom Resource. Specify the following information:

    * Set `storages.<NAME>.type` to `gcs` (substitute the <NAME> part
       with some arbitrary name you will later use to refer this storage when
       making backups and restores).

    * Specify the bucket name for the `storages.<NAME>.gcs.bucket` option

    * Specify the Secrets object name you created for the `storages.<NAME>.gcs.credentialsSecret` option

    ```yaml
    backup:
      storages:
        gcp-cs:
          type: gcs
          gcs:
            bucket: < GCS-BACKUP-BUCKET-NAME-HERE>
            credentialsSecret: gcp-cs-secret
    ```

7. Apply the configuration:

    ``` {.bash data-prompt="$" }
    $ kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

## Microsoft Azure Blob storage

1. To store backups on the Azure Blob storage, you need to create a
    Secret with the following values:

    * the `metadata.name` key is the name which you wll further use to refer
        your Kubernetes Secret,
    * the `data.AZURE_STORAGE_ACCOUNT_NAME` and `data.AZURE_STORAGE_ACCOUNT_KEY`
        keys are base64-encoded credentials used to access the storage
        (obviously these keys should contain proper values to make the access
        possible).

    Create the Secrets file with these base64-encoded keys following the
    `deploy/backup-azure.yaml` example:

    ```yaml
    apiVersion: v1
    kind: Secret
    metadata:
      name: my-cluster-azure-secret
    type: Opaque
    data:
      AZURE_STORAGE_ACCOUNT_NAME: UkVQTEFDRS1XSVRILUFXUy1BQ0NFU1MtS0VZ
      AZURE_STORAGE_ACCOUNT_KEY: UkVQTEFDRS1XSVRILUFXUy1TRUNSRVQtS0VZ
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

    Once the editing is over, create the Kubernetes Secret object as follows:

    ``` {.bash data-prompt="$" }
    $ kubectl apply -f deploy/backup-azure.yaml
    ```

2. Put the data needed to access the Azure Blob storage into the
    `backup.storages` subsection of the Custom Resource.

    * `storages.<NAME>.type` should be set to `azure` (substitute the <NAME> part
       with some arbitrary name you will later use to refer this storage when
       making backups and restores).

    * `storages.<NAME>.azure.credentialsSecret` key should be set to the name used
        to refer your Kubernetes Secret (`my-cluster-azure-secret` in the last
        example).

    * `storages.<NAME>.azure.container` option should contain the name of the
       Azure container. Also you can use `storages.<NAME>.azure.prefix`
       option to specify the path (sub-folder) to the backups inside the
       container. If prefix is not set, backups are stored in the root directory
       of the container.

    These and other options within the `storages.<NAME>.azure` subsection are
    further described in the [Operator Custom Resource options](operator.md#operator-backup-section).

    Here is an example
    of the [deploy/cr.yaml  :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/main/deploy/cr.yaml)
    configuration file which configures Azure Blob storage for backups:

    ```yaml
    ...
    backup:
      ...
      storages:
        azure-blob:
          type: azure
          azure:
            container: <your-container-name>
            prefix: psmdb
            credentialsSecret: my-cluster-azure-secret
          ...
    ```

## Remote file server

You can use the `filesystem` backup storage type to mount a *remote file server* to
a local directory as a *sidecar volume*, and make Percona Backup for MongoDB
use this directory as a storage for backups.

The approach is based on using common
[Network File System (NFS) protocol :octicons-link-external-16:](https://en.wikipedia.org/wiki/Network_File_System).
Particularly, this storage type is useful in network-restricted environments
without S3-compatible storage, or in cases with a non-standard storage service
that still supports NFS access.

1. Add the remote storage as a [sidecar volume](operator.md#replsetssidecarvolumesname)
    in the `replset` section of the Custom Resource (and also in `configsvrReplSet`
    in case of a sharded cluster). You will need to specify the server hostname
    and some directory on it, as in the following example:

    ```yaml
    replsets:
    - name: rs0
      ...
      sidecarVolumes:
      - name: backup-nfs-vol
        nfs:
          server: "nfs-service.storage.svc.cluster.local"
          path: "/psmdb-my-cluster-name-rs0"
      ...
    ```

    The `backup-nfs-vol` name specified above will be used to refer this
    sidecar volume in the backup section.

2. Now put the mount point (the local directory path to which the remote storage
    will be mounted) and the name of your sidecar volume into the
    `backup.volumeMounts` subsection of the Custom Resource:

    ```yaml
    backup:
      ...
      volumeMounts:
      - mountPath: /mnt/nfs/
        name: backup-nfs-vol
      ...
    ```

3. Finally, storage of the `filesystem` type needs to be configured in the
    `backup.storages` subsection. It needs only the mount point:

    ```yaml
    backup:
      enabled: true
      ...
      storages:
        backup-nfs:
          type: filesystem
          filesystem:
            path: /mnt/nfs/
    ```
