# Oracle Cloud Infrastructure Object Storage

To use Oracle Cloud Infrastructure (OCI) Object Storage as an object store for backups, you need the following:

* The name of an OCI Object Storage bucket
* The Object Storage namespace that the bucket belongs to
* The region where the bucket is located (for example, `us-ashburn-1`)
* Authentication to the bucket. See [Choose the authentication method](#choose-the-authentication-method) for available options.

<a name="configure-the-storage"></a>

## Choose the authentication method

You can use one of the following options to authenticate to OCI Object Storage:

* [**User principal**](#configure-user-principal-authentication). The Operator authenticates with an API signing key that you provide in a Kubernetes Secret. Use this method when the cluster runs outside of OCI, or when you want to authenticate as a specific user. This method **works on any Kubernetes platform** and requires that you manage the credentials yourself.
* [**OKE workload identity (recommended on OKE)**](#configure-oke-workload-identity-authentication). The Operator authenticates using the workload identity of the Kubernetes Service Account, without storing any credentials. Use this method when the cluster runs on Oracle Kubernetes Engine (OKE) and the corresponding OCI policy grants access to the bucket.

### How the Operator chooses OCI authentication

Unlike S3 and GCS, the Operator does not infer OCI authentication automatically from what's configured - you select the method explicitly with `credentials.type`:

* Set it to `userPrincipal` to authenticate with the API signing key in the Secret named by `credentials.secretName`. The Operator requires `secretName` to be set for this type.
* Set it to `okeWorkloadIdentity` to authenticate through the Kubernetes Service Account's workload identity, without a Secret.

## Configure user principal authentication

When you use the user principal authentication method, you need an API signing key and the related identifiers of the user and tenancy.

Export your namespace so the commands below can use it. Replace `<namespace>` with
your value:

```bash
export NAMESPACE=<namespace>
```

Follow these steps:
{.power-number}

1. Generate an API signing key pair and upload the public key for your user. As the result, you have a private key in PEM format and its fingerprint. Note down the OCID of your user and of your tenancy as well.

2. Encode the credentials in base64 format. The following commands show how to encode the required values. Replace the placeholders with your own values:

    === ":simple-linux: in Linux"

        ```bash
        echo -n 'ocid1.tenancy.oc1..aaaa...' | base64 --wrap=0
        echo -n 'ocid1.user.oc1..aaaa...' | base64 --wrap=0
        echo -n 'aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99' | base64 --wrap=0
        base64 --wrap=0 < oci_api_key.pem
        ```

    === ":simple-apple: in macOS"

        ```bash
        echo -n 'ocid1.tenancy.oc1..aaaa...' | base64
        echo -n 'ocid1.user.oc1..aaaa...' | base64
        echo -n 'aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99' | base64
        base64 < oci_api_key.pem
        ```

3. Create the Kubernetes Secret configuration file and specify the encoded credentials within. The Secret must contain the following keys:

    * `OCI_TENANCY` - the OCID of your tenancy
    * `OCI_USER` - the OCID of your user
    * `OCI_FINGERPRINT` - the fingerprint of the uploaded public key
    * `OCI_PRIVATE_KEY` - the private key in PEM format
    * `OCI_PRIVATE_KEY_PASSPHRASE` - the passphrase for the private key. Specify this key only if your private key is protected with a passphrase; otherwise omit it.

    ```yaml title="oci-secret.yaml"
    apiVersion: v1
    kind: Secret
    metadata:
      name: my-cluster-name-backup-oci
    type: Opaque
    data:
      OCI_TENANCY: base64_encoded_tenancy_ocid
      OCI_USER: base64_encoded_user_ocid
      OCI_FINGERPRINT: base64_encoded_fingerprint
      OCI_PRIVATE_KEY: base64_encoded_private_key
    ```

4. Create the Kubernetes Secrets object:

    ```bash
    kubectl apply -f oci-secret.yaml -n $NAMESPACE
    ```

5. Configure the OCI storage in the `backup.storages` subsection of the `deploy/cr.yaml` Custom Resource. Specify the following information:

    * `storages.NAME.type` - set to `oci` (substitute the `NAME` part with some arbitrary name you will later use to refer to this storage when making backups and restores)
    * `storages.NAME.oci.bucket`, `storages.NAME.oci.namespace`, `storages.NAME.oci.region` - the bucket name, the Object Storage namespace, and the region
    * `storages.NAME.oci.credentials.type` - set to `userPrincipal`
    * `storages.NAME.oci.credentials.secretName` - the name of the Secret you created in the previous step

    ```yaml
    backup:
      storages:
        oci:
          type: oci
          oci:
            bucket: OCI-BACKUP-BUCKET-NAME-HERE
            namespace: OCI-OBJECT-STORAGE-NAMESPACE-HERE
            region: us-ashburn-1
            credentials:
              type: userPrincipal
              secretName: my-cluster-name-backup-oci
    ```

    !!! tip "Organizing backups"

        You can use the [prefix](operator.md#backupstoragesstorage-nameociprefix) option to specify a path (sub-folder) inside the bucket where backups will be stored. If you don't set a prefix, backups are stored in the root directory.

    These and other options within the `storages.NAME.oci` subsection are further described in the [Operator Custom Resource options](operator.md#operator-backup-section).

6. Apply the configuration:

    ```bash
    kubectl apply -f deploy/cr.yaml -n $NAMESPACE
    ```

!!! note

    When you use the **OKE workload identity** authentication method, you don't need a Kubernetes Secret with credentials. See [Configure OKE workload identity authentication](#configure-oke-workload-identity-authentication) for the required setup instead.

## Configure OKE workload identity authentication

With the OKE workload identity method, you need a Kubernetes Secret with OCI credentials. Database pods (PBM agents)authenticate as the replica set Kubernetes Service Account to run backups and restores. The Operator uses its own Service Account (`percona-server-mongodb-operator`) to validate a backup before a restore. To grant access to OCI, you must add an OCI IAM policy statement for each Service Account. 

Using the OKE workload identity method requires an enhanced OKE cluster with Workload Identity enabled.

Follow these steps:
{.power-number}

1. Create a namespace for your cluster, for example `psmdb-workload-identity`. Export it as an environment variable:

    ```bash
    kubectl create namespace psmdb-workload-identity
    export NAMESPACE=psmdb-workload-identity
    ```

2. Create a Service Account that the database pods will use, for example `backup-service-account`:

    ```bash
    kubectl create serviceaccount backup-service-account -n $NAMESPACE
    ```

3. Add this statement to an OCI policy that grants this Service Account access to Object Storage. Replace the namespace, Service Account, and cluster OCID with your own values:

    ```text
    Allow any-user to manage objects in tenancy where all {request.principal.type='workload', request.principal.namespace='psmdb-workload-identity', request.principal.service_account='backup-service-account', request.principal.cluster_id='<cluster-ocid>'}
    ```

4. Configure the database pods to use this Service Account by setting the `serviceAccountName` option for your replica set in the `deploy/cr.yaml` Custom Resource:

    ```yaml
    replsets:
      - name: rs0
        size: 3
        serviceAccountName: backup-service-account
        ...
    ```

5. Add this statement to the an OCI policy for the `percona-server-mongodb-operator` Service Account. Replace the namespace and cluster OCID with your own values:

    ```text
    Allow any-user to manage objects in tenancy where all {request.principal.type='workload', request.principal.namespace='<operator-namespace>', request.principal.service_account='percona-server-mongodb-operator', request.principal.cluster_id='<cluster-ocid>'}
    ```

6. Configure the OCI storage in the `backup.storages` subsection of the `deploy/cr.yaml` Custom Resource. Specify the following information:

    * `storages.NAME.type` - set to `oci` (substitute the `NAME` part with some arbitrary name you will later use to refer to this storage when making backups and restores)
    * `storages.NAME.oci.bucket`, `storages.NAME.oci.namespace`, `storages.NAME.oci.region` - the bucket name, the Object Storage namespace, and the region
    * `storages.NAME.oci.credentials.type` - set to `okeWorkloadIdentity`

    ```yaml
    backup:
      storages:
        oci:
          type: oci
          oci:
            region: us-ashburn-1
            namespace: OCI-OBJECT-STORAGE-NAMESPACE-HERE
            bucket: OCI-BACKUP-BUCKET-NAME-HERE
            prefix: workload-identity-test
            credentials:
              type: okeWorkloadIdentity
    ```

    !!! tip "Organizing backups"

        You can use the [prefix](operator.md#backupstoragesstorage-nameociprefix) option to specify a path (sub-folder) inside the bucket where backups will be stored. If you don't set a prefix, backups are stored in the root directory.

    These and other options within the `storages.NAME.oci` subsection are further described in the [Operator Custom Resource options](operator.md#operator-backup-section).

7. Apply the configuration:

    ```bash
    kubectl apply -f deploy/cr.yaml -n $NAMESPACE
    ```

!!! warning

    Don't use the Operator's Service Account for your replica sets. Doing so grants the replica set pods permissions to perform operations on your Kubernetes cluster, which is a security risk.

## Enable server-side encryption

You can encrypt backups at rest with a key from OCI Vault or with your own customer-provided encryption key. To do so, configure the `storages.NAME.oci.serverSideEncryption` subsection:

* Set `serverSideEncryption.kmsKeyID` to the OCID of your OCI Vault key.
* To use a customer-provided (SSE-C) key, create a Kubernetes Secret with the `OCI_SSE_CUSTOMER_KEY` key and reference it in `serverSideEncryption.secretName`.

```yaml
backup:
  storages:
    oci:
      type: oci
      oci:
        bucket: OCI-BACKUP-BUCKET-NAME-HERE
        namespace: OCI-OBJECT-STORAGE-NAMESPACE-HERE
        region: us-ashburn-1
        credentials:
          type: userPrincipal
          secretName: my-cluster-name-backup-oci
        serverSideEncryption:
          kmsKeyID: OCI-KMS-KEY-OCID-HERE
          secretName: my-cluster-name-backup-oci-sse
```

## Verify the storage works

--8<-- "verify-backup-storage.md"
