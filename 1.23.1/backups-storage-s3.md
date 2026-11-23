> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Amazon S3 storage

To use Amazon S3 storage service for backups, you need the following:

- A bucket name
- A region where the bucket is located
- Authentication to the bucket. See [Choose the authentication method](#choose-the-authentication-method) for available options.

## Storage considerations

Make sure your storage has enough free space for backups, especially for large databases.

Also, note that S3 has an upload limit of 10,000 parts per file. If your backup is very large, you may hit this limit, which increases the size of each chunk. Large chunk sizes can use a lot of memory on the S3 server. To avoid issues:

1. Check your storage free space before backing up.
1. Be aware of the 10,000 part limit for S3 uploads.
1. Adjust your backup chunk size and memory settings in the Custom Resource if necessary for large backups.

To encrypt backups at rest on S3, see [Enable server-side encryption for backups](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-encryption.html).

## Choose the authentication method

You can use one of the following options to authenticate to S3:

- **S3 access keys**. Store your AWS S3 access key and secret key in a Kubernetes Secret and reference it in your cluster configuration. This method **works on any Kubernetes platform** and requires that you manage the credentials yourself.
- **IAM role for service accounts (IRSA)**. Assign an IAM role to the Kubernetes Service Account used by the Operator. With IRSA, you don’t need to manage static secrets since AWS automatically provides temporary credentials to the Pod, following best practices for security and rotation. This is the recommended approach on Amazon Elastic Kubernetes Service (EKS), because you can map S3 permissions to specific Kubernetes service accounts instead of sharing them across all pods on a node.
- **IAM instance profile**. Attach an IAM role with S3 permissions to your EC2 worker nodes. Pods that run backup agents obtain credentials through the instance metadata service, so you don’t need to manage static secrets. Use this method when your cluster runs on EC2 instances and IRSA is not configured. All pods on the same node share the node’s permissions.

### How the Operator chooses S3 authentication

- If a Secret with s3 credentials exists and is defined in the Custom Resource, it has the highest precedence. The Operator always uses S3 credentials in a Kubernetes Secret if they are present.
- If a Secret with S3 credentials is not defined, but IRSA-related credentials are configured, then the Operator will use IRSA. In this case, IRSA credentials take precedence over any IAM instance profile on the worker nodes.

## Authenticate with S3 access keys

Follow these steps to authenticate using an AWS S3 access key and secret key. This method works on any Kubernetes environment.

1. Export the namespace as an environment variable:

   ```
   export NAMESPACE=<namespace>
   ```

1. Encode your `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` keys using base64:

   **in Linux**

   ```
   echo -n 'plain-text-string' | base64 --wrap=0
   ```

   **in macOS**

   ```
   echo -n 'plain-text-string' | base64
   ```

1. Create a Secret manifest with your access credentials. Use the [deploy/backup-s3.yaml](https://github.com/percona/percona-server-mongodb-operator/blob/v1.23.1/deploy/backup-s3.yaml) file as an example. You must specify the following information:

   - `metadata.name` is the name of the Kubernetes secret which you will reference in the Custom Resource
   - Base64-encoded credentials to access S3 storage.

   Put the following into `deploy/backup-s3.yaml`, replacing the values with the base64 strings you produced in the previous step:

   deploy/backup-s3.yaml

   ```
   apiVersion: v1
   kind: Secret
   metadata:
     name: my-cluster-name-backup-s3
   type: Opaque
   data:
     AWS_ACCESS_KEY_ID: UkVQTEFDRS1XSVRILUFXUy1BQ0NFU1MtS0VZ
     AWS_SECRET_ACCESS_KEY: UkVQTEFDRS1XSVRILUFXUy1TRUNSRVQtS0VZ
   ```

   Note

   Values under `data` must be valid base64. The placeholders above are real base64 strings (they decode to `REPLACE-WITH-AWS-ACCESS-KEY` and `REPLACE-WITH-AWS-SECRET-KEY`), so the manifest applies as written and fails later with an authentication error rather than a parsing one. If you would rather paste plain text, use `stringData` instead of `data` and skip the base64 step.

1. Create the Kubernetes Secret object with this file:

   ```
   kubectl apply -f deploy/backup-s3.yaml -n $NAMESPACE
   ```

1. Configure the storage in the Custom Resource. Modify the `backup.storages` subsection of the `deploy/cr.yaml` file. Give your storage a name (the default name is `s3-us-west`) and define the following information:

   - `type` - make sure the type is `s3`
   - `bucket` - where the data will be stored
   - `region` - location of the bucket
   - `credentialsSecret` - the name of the Secret you created previously
   - `prefix` (optional) - a path (sub-folder) inside the S3 bucket where backups will be stored. If you don’t set a prefix, backups are stored in the root directory.

   Here’s the example:

   ```
   ...
   backup:
     ...
     storages:
       s3-us-west:
         type: s3
         s3:
           bucket: S3-BACKUP-BUCKET-NAME-HERE
           region: us-west-2
           prefix: ""
           credentialsSecret: my-cluster-name-backup-s3
     ...
   ```

   For more configuration options, see the [Operator Custom Resource options](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#operator-backup-section).

1. Apply the configuration:

   ```
   kubectl apply -f deploy/cr.yaml -n $NAMESPACE
   ```

## Authenticate with IRSA

[IAM Roles for Service Accounts (IRSA)](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html) lets Pods on Amazon EKS assume an IAM role through the cluster’s OpenID Connect (OIDC) provider. You do not store AWS access keys in a Kubernetes Secret. Instead, Percona Backup for MongoDB uses the AWS default credential provider chain and receives temporary credentials automatically.

### Prerequisites

Before you start, make sure you have the following:

- An [EKS cluster with the Operator and database deployed](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/eks.html)

- An S3 bucket for backups

- The [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) , [eksctl](https://github.com/weaveworks/eksctl#installation) , and [kubectl](https://kubernetes.io/docs/tasks/tools/) installed and configured

- Your AWS account ID. You can get it with:

  ```
  aws sts get-caller-identity --query Account --output text
  ```

Set environment variables for the commands below. Replace the placeholders with your values:

```
export cluster_name=<my-cluster>
export aws_region=<aws-region>
export s3_bucket=<my-backup-bucket>
export policy_name=<my-s3-policy>
export role_name=<my-irsa-role>
export account_id=$(aws sts get-caller-identity --query Account --output text)
export namespace=<my-namespace>
```

### Configure the IAM role

1. Check whether your EKS cluster has an [OIDC issuer URL](https://docs.aws.amazon.com/eks/latest/userguide/enable-iam-roles-for-service-accounts.html) enabled:

   ```
   aws eks describe-cluster --name $cluster_name --region $aws_region \
     --query "cluster.identity.oidc.issuer" --output text
   ```

   Sample output

   ```
   https://oidc.eks.us-west-2.amazonaws.com/id/4B2D5F8C1A2B3C4D5E6F7A8B9C0D1E2F
   ```

   Save the OIDC ID from the URL (the part after `/id/`) and export it as an environment variable:

   ```
   export oidc_id=<oidc-id>
   ```

   For example, if the issuer URL is `https://oidc.eks.us-west-2.amazonaws.com/id/4B2D5F8C1A2B3C4D5E6F7A8B9C0D1E2F`, set `oidc_id` to `4B2D5F8C1A2B3C4D5E6F7A8B9C0D1E2F`.

   If the command returns no issuer URL, create the OIDC provider:

   ```
   eksctl utils associate-iam-oidc-provider \
     --region $aws_region --cluster $cluster_name --approve
   ```

1. Create an IAM policy that grants access to your S3 bucket. Replace `<s3_bucket>` with your bucket name:

   s3-bucket-policy.json

   ```
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:*"
         ],
         "Resource": [
           "arn:aws:s3:::<s3_bucket>",
           "arn:aws:s3:::<s3_bucket>/*"
         ]
       }
     ]
   }
   ```

   Tip

   The example uses broad `s3:*` permissions for simplicity. In production, restrict the policy to the specific S3 actions your backup and restore workflows require. Refer to the [Amazon S3 permissions documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-with-s3-actions.html) and tailor the policy to follow the principle of least privilege.

1. Create the IAM policy and save its Amazon Resource Name (ARN):

   ```
   aws iam create-policy \
     --policy-name $policy_name \
     --policy-document file://s3-bucket-policy.json
   ```

   Sample output

   ```
   {
       "Policy": {
           "PolicyName": "s3-access",
           "PolicyId": "ANPARXP3OARBBRX6TZXTI",
           "Arn": "arn:aws:iam::<account-id>:policy/s3-access",
           "Path": "/",
           "DefaultVersionId": "v1",
           "AttachmentCount": 0,
           "PermissionsBoundaryUsageCount": 0,
           "IsAttachable": true,
           "CreateDate": "2026-05-26T12:52:57+00:00",
           "UpdateDate": "2026-05-26T12:52:57+00:00"
       }
   }
   ```

   Note the `PolicyArn` value from the command output. You will need it later in this setup.

1. Create a trust policy that allows your EKS OIDC provider to assume the role. Replace `<account-id>`, `<aws-region>`, and `<oidc-id>` with your `$account_id`, `$aws_region`, and `$oidc_id` values. Each placeholder appears more than once in the file - replace every occurrence:

   role-trust-policy.json

   ```
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Federated": "arn:aws:iam::<account-id>:oidc-provider/oidc.eks.<aws-region>.amazonaws.com/id/<oidc-id>"
         },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": {
           "StringEquals": {
             "oidc.eks.<aws-region>.amazonaws.com/id/<oidc-id>:aud": "sts.amazonaws.com"
           }
         }
       }
     ]
   }
   ```

1. Create the IAM role:

   ```
   aws iam create-role \
     --role-name $role_name \
     --assume-role-policy-document file://role-trust-policy.json \
     --description "Allow Percona Operator for MongoDB to access S3 backups"
   ```

   Sample output

   ```
   {
       "Role": {
           "Path": "/",
           "RoleName": "s3-access-role",
           "RoleId": "AROARXP3OARBHYAIOYMKD",
           "Arn": "arn:aws:iam::<account-id>:role/s3-access-role",
           "CreateDate": "2026-05-26T12:53:29+00:00",
           "AssumeRolePolicyDocument": {
               "Version": "2012-10-17",
               "Statement": [
                   {
                       "Effect": "Allow",
                       "Principal": {
                           "Federated": "arn:aws:iam::<account-id>:oidc-provider/oidc.eks.eu-west-1.amazonaws.com/id/4B2D5F8C1A2B3C4D5E6F7A8B9C0D1E2F"
                       },
                       "Action": "sts:AssumeRoleWithWebIdentity",
                       "Condition": {
                           "StringEquals": {
                               "oidc.eks.eu-west-1.amazonaws.com/id/4B2D5F8C1A2B3C4D5E6F7A8B9C0D1E2F:aud": "sts.amazonaws.com"
                           }
                       }
                   }
               ]
           }
       }
   }
   ```

1. Attach the S3 policy to the role. Replace `<policy-name>` with the policy name from step 3 if you did not export `$policy_name`:

   ```
   aws iam attach-role-policy \
     --role-name $role_name \
     --policy-arn arn:aws:iam::${account_id}:policy/${policy_name}
   ```

   Sample output

   ```
   {
       "AttachedPolicies": [
           {
               "PolicyName": "s3-access",
               "PolicyArn": "arn:aws:iam::<account-id>:policy/s3-access"
           }
       ]
   }
   ```

1. Get the IAM role ARN. You will use it when you annotate the Kubernetes Service Accounts:

   ```
   role_arn=$(aws iam get-role --role-name $role_name --query "Role.Arn" --output text)
   ```

### Assign the IAM role to the Service accounts

1. Deploy the Operator if you haven’t done so yet:

   ```
   kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v1.23.1/deploy/bundle.yaml -n $namespace
   ```

1. Find service accounts used by the Operator and the database cluster:

   ```
   kubectl get serviceaccounts -n $namespace
   ```

   Expected output

   ```
   default                           0         15m
   percona-server-mongodb-operator   0         15m
   ```

   `percona-server-mongodb-operator` is the Operator service account defined by the `serviceAccountName` key in the `deploy/operator.yaml` or `deploy/bundle.yaml` manifest. `default` is cluster’s default service account. You can override it with the `serviceAccountName` Custom Resource option in the `replsets`, `sharding.configsvrReplSet`, and `sharding.mongos` subsections of the `deploy/cr.yaml` manifest, if needed.

1. Annotate both service accounts with the needed IAM role ARN:

   ````
   ```bash
   kubectl -n $NAMESPACE annotate serviceaccount default eks.amazonaws.com/role-arn=$role_arn --overwrite
   kubectl -n $NAMESPACE annotate serviceaccount percona-server-mongodb-operator eks.amazonaws.com/role-arn=$role_arn --overwrite
   ````

   ```
   ```

1. Annotating a Service Account does not restart existing Pods automatically. Restart the Operator and database Pods so they pick up the new `AWS_ROLE_ARN` environment variable:

   ```
   kubectl rollout restart deployment/percona-server-mongodb-operator -n $namespace
   kubectl rollout status deployment/percona-server-mongodb-operator -n $namespace
   ```

1. Verify that IRSA is configured correctly:

   - Check the annotation on both Service Accounts:

     ```
     kubectl -n $NAMESPACE get sa default -o yaml
     kubectl -n $NAMESPACE get sa percona-server-mongodb-operator -o yaml
     ```

   - Confirm that `AWS_ROLE_ARN` is set inside the Operator Pods:

     ```
     kubectl -n $NAMESPACE exec -it deploy/percona-server-mongodb-operator -- printenv | grep AWS_ROLE_ARN
     ```

     Sample output

     ```
     AWS_ROLE_ARN=arn:aws:iam::<account-id>:role/s3-access-role
     ```

### Configure Percona Server for MongoDB cluster

Now you are ready to configure Percona Server for MongoDB to use IRSA for backups.

**A new cluster deployment**

1. Edit the `backup.storages` subsection in `deploy/cr.yaml` Custom Resource manifest. Give your storage a name (default name is `s3-us-west`) and set the following keys:

   - `type` - make sure the type is `s3`
   - `bucket` - where the data will be stored
   - `region` - location of the bucket
   - `prefix` (optional) - a path (sub-folder) inside the S3 bucket where backups will be stored. If you don’t set a prefix, backups are stored in the root directory.
   - Omit `s3.credentialsSecret` so that PBM uses IRSA to access the S3 storage.

   Here’s the example configuration:

   ```
   ...
   backup:
     enabled: true
     ...
     storages:
       aws-s3:
         type: s3
         s3:
           bucket: <s3_bucket>
           region: <aws-region>
           prefix: data/pbm
   ...
   ```

   For more storage options, see the [Operator Custom Resource options](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/operator.html#operator-backup-section).

1. Apply the configuration and deploy the cluster:

   ```
   kubectl apply -f deploy/cr.yaml -n $namespace
   ```

1. Wait for the cluster to report the “Ready” status:

   ```
   kubectl get psmdb -n $namespace
   ```

1. Confirm that `AWS_ROLE_ARN` is set inside the database Pods. Replace the `<cluster-name>` with the name of your cluster (corresponds to the `metadata.name` value in your Custom Resource):

   ```
   kubectl exec -it <cluster-name>-rs0-1 -- printenv | grep AWS_ROLE_ARN
   ```

   Sample output

   ```
   AWS_ROLE_ARN=arn:aws:iam::<account-id>:role/s3-access-role
   ```

**Existing cluster**

If your running Percona Server for MongoDB cluster is currently using a Kubernetes Secret with S3 credentials for backups, you can switch to IRSA authentication by following these steps:

1. [Assign the IAM role to service accounts](#assign-the-iam-role-to-the-service-accounts), if you haven’t done it before

1. Make a rolling restart of the database Pods.

   - Export the cluster name as an environment variable:

     ```
     export DBCLUSTER=my-cluster-name
     ```

   - Use the following command:

     ```
     kubectl rollout restart sts/$DBCLUSTER-rs0 -n $NAMESPACE
     ```

1. Restart the Operator Deployment:

   ```
   kubectl rollout restart deployment percona-server-mongodb-operator -n $namespace
   ```

1. Confirm that AWS_ROLE_ARN is set inside the Operator and database Pods:

   ```
   kubectl -n $NAMESPACE exec -it deploy/percona-server-mongodb-operator -- printenv | grep AWS_ROLE_ARN
   kubectl exec -it $DBCLUSTER-rs0-0 -- printenv | grep AWS_ROLE_ARN
   ```

   Sample output

   ```
   AWS_ROLE_ARN=arn:aws:iam::<account-id>:role/s3-access-role
   ```

1. Remove the credentials Secret by patching the cluster. The storage name in the following command is `aws-s3`. Replace it with your value if you use another name:

   ```
   kubectl -n $NAMESPACE patch psmdb $DBCLUSTER --type=json \
   -p '[{"op":"remove","path":"/spec/backup/storages/aws-s3/s3/credentialsSecret"}]'
   sleep 30
   ```

### Verify access to S3 using IRSA

1. Run an on-demand backup to confirm that the cluster can write to the S3 bucket. Here’s the example of the backup object configuration:

   ````
   ```yaml title="deploy/backup/backup.yaml"
   apiVersion: psmdb.percona.com/v1
   kind: PerconaServerMongoDBBackup
   metadata:
     name: backup1
     finalizers:
       - percona.com/delete-backup
   spec:
     clusterName: my-cluster-name
     storageName: aws-s3 #Must match the name in your cluster configuration
   ````

   ```
   ```

1. Apply the configuration to start the backup:

   ```
   kubectl apply -f deploy/backup/backup.yaml -n $namespace
   ```

1. Check the backup progress:

   ```
   kubectl get psmdb-backup -n $namespace
   ```

### Troubleshooting

#### Pods stuck in Pending state

If your Pods are stuck in the `Pending` state, it may be because the `storageClass` specified in your Custom Resource does not match the one available in your EKS cluster. Review your Custom Resource configuration and ensure that it uses the correct storage class for your environment.

#### PBM reports “Request ARN is invalid”

This error usually indicates a problem with your IRSA (IAM Roles for Service Accounts) configuration. To resolve it:

1. **Verify the OIDC Provider:**

   Confirm that your EKS cluster has the correct OIDC provider set up. In your trust policy, the URL must exactly match your cluster’s OIDC provider URL and should follow the format:

   ```
   https://oidc.eks.<aws-region>.amazonaws.com/id/<oidc-id>
   ```

   Even minor mismatches (such as missing trailing slashes or extra characters) can cause this error.

1. **Check Service Account Annotations:**\
   Ensure that the Kubernetes service account used by the Operator has the correct `eks.amazonaws.com/role-arn` annotation. The annotation key should be present, and the value should be the full ARN of the IAM role you created for S3 access.

1. **Review Trust Policy Conditions:**\
   Make sure the IAM role’s trust policy references the correct service account namespace and name, and that any conditions (such as `StringEquals`) are accurate.

1. **Restart Pods:**\
   After correcting any issues, restart both the database and Operator pods to ensure the new IAM credentials are picked up.

By following these steps, you should be able to resolve the “Request ARN is invalid” error when using IRSA.

## Authenticate with an IAM instance profile

Follow these steps:

1. Create the [IAM instance profile](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html) and the permission policy within. In this policy you specify the access level that grants the access to S3 buckets.
1. Attach the IAM profile to your EC2 worker nodes.
1. Configure an S3 storage bucket in the Custom Resource and verify the connection from the EC2 instance to it.
1. Create or update the Percona Server for MongoDB cluster. *Do not provide* `s3.credentialsSecret` for the storage in `deploy/cr.yaml`.

## Verify the storage works

Storage problems surface as failed backups, not as errors when you apply the Custom Resource. Confirm the configuration by taking a backup and watching it finish.

Set `spec.storageName` to the storage name you defined under `backup.storages` (and `spec.clusterName` to your cluster):

deploy/backup/backup.yaml

```
apiVersion: psmdb.percona.com/v1
kind: PerconaServerMongoDBBackup
metadata:
  name: backup1
spec:
  clusterName: my-cluster-name
  storageName: <storage-name>
```

Apply it and watch the backup:

```
kubectl apply -f deploy/backup/backup.yaml -n $NAMESPACE
kubectl get psmdb-backup -n $NAMESPACE
```

The backup must reach the `ready` state. A backup that lands in `error`, or stays in `running` or `waiting`, usually means the bucket, the endpoint, the region, or the credentials are wrong. Check the backup object’s status message and the `pbm-agent` logs, and see [Troubleshoot backups and restores](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/debug-backup-restore.html).
