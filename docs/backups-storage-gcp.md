# Google Cloud storage

To use [Google Cloud Storage (GCS) :octicons-link-external-16:](https://cloud.google.com/storage) as an object store for backups, you need the following:

* A GCS bucket name. Refer to the [GCS bucket naming guidelines :octicons-link-external-16:](https://cloud.google.com/storage/docs/buckets#naming) for bucket name requirements
* Authentication to the bucket. See [Choose the authentication method](#choose-the-authentication-method) for available options.

## Choose the authentication method

You can use one of the following options to authenticate to GCS:

* [**Workload Identity (recommended on GKE)**](#automate-access-to-google-cloud-storage-using-workload-identity). Bind a Google service account to the Kubernetes Service Account used by your database Pods. You do not store service account JSON keys in a Kubernetes Secret. Google provides short-lived credentials automatically. This is the recommended approach on Google Kubernetes Engine (GKE) and for environments that forbid exporting service account keys.
* [**Service account JSON keys**](#set-up-google-cloud-storage-access-with-service-account-keys). Store the service account email and private key in a Kubernetes Secret and reference it in your cluster configuration. This method works on any Kubernetes platform and requires that you manage the credentials yourself.

!!! note

    You can still use the S3-compatible implementation of GCS with HMAC keys. Refer to the [Amazon S3 storage setup](backups-storage-s3.md) section for steps.

    However, we don't recommend their usage due to a [known issue in PBM :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/release-notes/2.11.0.html#known-limitations-for-using-hmac-keys-on-gcs) and encourage you to use the native `gcs` storage type instead.

### How the Operator chooses GCS authentication

* If a Secret with GCS credentials is defined in the Custom Resource (`gcs.credentialsSecret`), the Operator uses those credentials.
* If `gcs.credentialsSecret` is omitted, the Operator configures Percona Backup for MongoDB to use Application Default Credentials (ADC), such as GKE Workload Identity.

## Automate access to Google Cloud Storage using Workload Identity

!!! note "Version added: [1.23.0](RN/Kubernetes-Operator-for-PSMONGODB-RN1.23.0.md)"

[GKE Workload Identity :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity) lets Pods authenticate to Google Cloud as a Google service account. Percona Backup for MongoDB uses Application Default Credentials and receives short-lived tokens automatically. For how PBM uses Workload Identity and ADC, see the [PBM documentation :octicons-link-external-16:](https://docs.percona.com/percona-backup-mongodb/details/workload-identity-auth.html).

### Prerequisites

Before you start, make sure you have the following:

* A [GKE cluster with Workload Identity enabled :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity#enable) and the Operator and database deployed. See also [Install on GKE](gke.md).
* A GCS bucket for backups
* The [Google Cloud CLI (gcloud) :octicons-link-external-16:](https://cloud.google.com/sdk/docs/install) and [kubectl :octicons-link-external-16:](https://kubernetes.io/docs/tasks/tools/) installed and configured
* Permission to create service accounts and manage IAM bindings

Set environment variables for the commands below. Replace the placeholders with your values:

```bash
export PROJECT_ID=<my-project-id>
export GCS_BUCKET=<my-backup-bucket>
export GSA_NAME=<my-gcs-backup-gsa>
export NAMESPACE=<my-namespace>
export KSA_NAME=default
```

`KSA_NAME` is the Kubernetes Service Account used by your database Pods. By default this is `default`. You can override it with the `serviceAccountName` Custom Resource option in the `replsets`, `sharding.configsvrReplSet`, and `sharding.mongos` subsections of the `deploy/cr.yaml` manifest.

### Configure Google Cloud access {.power-number}

1. Create a Google service account (GSA), if you don't have one already:

    ```bash
    gcloud iam service-accounts create $GSA_NAME \
      --project=$PROJECT_ID \
      --display-name="Percona MongoDB GCS backups"
    ```

2. Grant the GSA permissions on the backup bucket. For example, grant object read and write access:

    ```bash
    gcloud storage buckets add-iam-policy-binding gs://$GCS_BUCKET \
      --member="serviceAccount:${GSA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
      --role="roles/storage.objectUser"
    ```

    !!! tip

        Choose the IAM role that matches your security policy. `roles/storage.objectUser` is a common choice for backup and restore workflows.

3. Allow the Kubernetes Service Account to impersonate the Google service account:

    ```bash
    gcloud iam service-accounts add-iam-policy-binding \
      ${GSA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com \
      --role roles/iam.workloadIdentityUser \
      --member "serviceAccount:${PROJECT_ID}.svc.id.goog[${NAMESPACE}/${KSA_NAME}]"
    ```

4. Annotate the Kubernetes Service Account with the Google service account email:

    ```bash
    kubectl -n $NAMESPACE annotate serviceaccount $KSA_NAME \
      iam.gke.io/gcp-service-account=${GSA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com \
      --overwrite
    ```

5. Annotating a Service Account does not restart existing Pods automatically. Restart the database Pods so they pick up the Workload Identity configuration. For a replica set named `rs0`:

    ```bash
    export DBCLUSTER=my-cluster-name
    kubectl rollout restart sts/$DBCLUSTER-rs0 -n $NAMESPACE
    ```

### Configure Percona Server for MongoDB cluster

Now you are ready to configure Percona Server for MongoDB to use Workload Identity for GCS backups.

=== "A new cluster deployment"

    1. Edit the `backup.storages` subsection in the `deploy/cr.yaml` Custom Resource manifest. Give your storage a name and set the following keys:

        * `type` - make sure the type is `gcs`
        * `bucket` - where the data will be stored
        * `prefix` (optional) - a path (sub-folder) inside the GCS bucket where backups will be stored. If you don't set a prefix, backups are stored in the root directory.
        * Omit `gcs.credentialsSecret` so that PBM uses Workload Identity / ADC to access the GCS storage.

        Here's the example configuration:

        ```yaml
        ...
        backup:
          enabled: true
          ...
          storages:
            gcs-wi:
              type: gcs
              gcs:
                bucket: <my-backup-bucket>
                prefix: mongodb-backup
        ...
        ```

        For more storage options, see the [Operator Custom Resource options](operator.md#operator-backup-section).

    2. Apply the configuration and deploy the cluster:

        ```bash
        kubectl apply -f deploy/cr.yaml -n $NAMESPACE
        ```

    3. Wait for the cluster to report the Ready status:

        ```bash
        kubectl get psmdb -n $NAMESPACE
        ```

=== "Existing cluster"

    If your running Percona Server for MongoDB cluster is currently using a Kubernetes Secret with GCS credentials for backups, you can switch to Workload Identity by following these steps:

    1. [Configure Google Cloud access](#configure-google-cloud-access) and annotate the Service Account, if you haven't done it before.
    2. Make a rolling restart of the database Pods so they pick up the Workload Identity annotation.

        * Export the cluster name as an environment variable:

            ```bash
            export DBCLUSTER=my-cluster-name
            ```

        * Restart the Pods (adjust the replica set name and Pod count for your cluster):

            ```bash
            for i in 0 1 2; do
              kubectl delete pod $DBCLUSTER-rs0-$i -n $NAMESPACE
            done
            ```

    3. Remove the credentials Secret from the Custom Resource. The storage name in the following command is `gcs`. Replace it with your value if you use another name:

        ```bash
        kubectl -n $NAMESPACE patch psmdb $DBCLUSTER --type=json \
          -p '[{"op":"remove","path":"/spec/backup/storages/gcs/gcs/credentialsSecret"}]'
        ```

### Verify access to GCS using Workload Identity

[Run an on-demand backup](backups-ondemand.md) to confirm that the cluster can write to the GCS bucket. 

### Troubleshooting

* **Confirm the Service Account annotation.** The Kubernetes Service Account used by the database Pods must have the `iam.gke.io/gcp-service-account` annotation set to the Google service account email.
* **Confirm the IAM binding.** The Google service account must grant `roles/iam.workloadIdentityUser` to `serviceAccount:PROJECT_ID.svc.id.goog[NAMESPACE/KSA_NAME]`.
* **Confirm bucket permissions.** The Google service account must have permission to read and write objects in the backup bucket.
* **Remove `credentialsSecret`.** If `gcs.credentialsSecret` is still set in the Custom Resource, the Operator uses the Secret instead of Workload Identity.
* **Restart Pods after annotation changes.** Existing Pods do not pick up a new Workload Identity annotation until you restart them.

## Set up Google Cloud Storage access with service account keys

Follow these steps to authenticate using a service account JSON key. This method works on any Kubernetes environment.

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
