# Google Cloud storage

To use [Google Cloud Storage (GCS) :octicons-link-external-16:](https://cloud.google.com/storage) as an object store for backups, you need the following information:

* a GCS bucket name. Refer to the [GCS bucket naming guidelines :octicons-link-external-16:](https://cloud.google.com/storage/docs/buckets#naming) for bucket name requirements
* authentication keys for your service account in JSON format.

!!! note

    You can still use the S3-compatible implementation of GCS with HMAC. Refer to the [Amazon S3 storage setup](backups-storage-s3.md) section for steps.

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

    ```bash
    kubectl apply -f gcp-cs-secret.yaml -n <namespace>
    ```

6. Configure the GCS storage in the `deploy/cr.yaml` Custom Resource. Specify the following information:

    * Set `storages.NAME.type` to `gcs` (substitute the `NAME` part
       with some arbitrary name you will later use to refer this storage when
       making backups and restores).

    * Specify the bucket name for the `storages.NAME.gcs.bucket` option

    * Specify the Secrets object name you created for the `storages.NAME.gcs.credentialsSecret` option

    ```yaml
    backup:
      storages:
        gcp-cs:
          type: gcs
          gcs:
            bucket: GCS-BACKUP-BUCKET-NAME-HERE
            credentialsSecret: gcp-cs-secret
    ```

7. Apply the configuration:

    ```bash
    kubectl apply -f deploy/cr.yaml -n <namespace>
    ```
