# Amazon S3 storage

To use Amazon S3 storage service for backups, you need the following:

* A bucket name
* A region where the bucket is located
* Authentication to the bucket. See [Choose the authentication method](#choose-the-authentication-method) for available options.

## Storage considerations

Make sure your storage has enough free space for backups, especially for large databases.

Also, note that S3 has an upload limit of 10,000 parts per file. If your backup is very large, you may hit this limit, which increases the size of each chunk. Large chunk sizes can use a lot of memory on the S3 server. To avoid issues:

1. Check your storage free space before backing up.
2. Be aware of the 10,000 part limit for S3 uploads.
3. Adjust your backup chunk size and memory settings in the Custom Resource if necessary for large backups.

## Choose the authentication method

You can use one of the following options to authenticate to S3:
   
* **S3 access keys**. Store your AWS S3 access key and secret key in a Kubernetes Secret and reference it in your cluster configuration. This method **works on any Kubernetes platform** and requires that you manage the credentials yourself.
* **IAM role for service accounts (IRSA)**. Assign an IAM role to the Kubernetes Service Account used by the Operator. With IRSA, you don’t need to manage static secrets since AWS automatically provides temporary credentials to the Pod, following best practices for security and rotation. This is the recommended approach for on Amazon Elastic Kubernetes Service (EKS), because you can map S3 permissions to specific Kubernetes service accounts instead of sharing them across all pods on a node.
* **IAM instance profile**. Attach an IAM role with S3 permissions to your EC2 worker nodes. Pods that run backup agents obtain credentials through the instance metadata service, so you don't need to manage static secrets. Use this method when your cluster runs on EC2 instances and IRSA is not configured. All pods on the same node share the node's permissions.

### How the Operator chooses S3 authentication

* If a Secret with s3 credentials exists and is defined in the Custom Resource, it has the highest precedence. The Operator always uses S3 credentials in a Kubernetes Secret if they are present. 
* If a Secret with S3 credentials is not defined, but IRSA-related credentials are configured, then the Operator will use IRSA. In this case, IRSA credentials take precedence over any IAM instance profile on the worker nodes.

## Set up AWS S3 access with S3 credentials

Follow these steps to authenticate using an AWS S3 access key and secret key. This method works on any Kubernetes environment.

1. Encode your `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` keys using base64:

    === ":simple-linux: in Linux"

        ```bash
        echo -n 'plain-text-string' | base64 --wrap=0
        ```

    === ":simple-apple: in macOS"

        ```bash
        echo -n 'plain-text-string' | base64
        ```

2. Create a Secret manifest with your access credentials. Use the [deploy/backup-s3.yaml :octicons-link-external-16:](https://github.com/percona/percona-server-mongodb-operator/blob/v{{release}}/deploy/backup-s3.yaml) file as an example. You must specify the following information:

    * `metadata.name` is the name of the Kubernetes secret which you will reference in the Custom Resource
    * Base64-encoded credentials to access S3 storage.

    Here's the example configuration of the Secret file:

    ```yaml
    apiVersion: v1
    kind: Secret
    metadata:
      name: my-cluster-name-backup-s3
    type: Opaque
    data:
      AWS_ACCESS_KEY_ID: <base64-encoded-access-key>
      AWS_SECRET_ACCESS_KEY: <base64-encoded-secret>
    ```

3. Create the Kubernetes Secret object with this file:

    ```bash
    kubectl apply -f deploy/backup-s3.yaml -n <namespace>
    ```

4. Configure the storage in the Custom Resource. Modify the `backup.storages` subsection of the `deploy/cr.yaml` file. Give your storage a name (the default name is `s3-us-west`) and define the following information:

    * `type` - make sure the type is `s3`
    * `bucket` - where the data will be stored
    * `region` - location of the bucket
    * `credentialsSecret` - the name of the Secret you created previously
    * `prefix` (optional) - a path (sub-folder) inside the S3 bucket where backups will be stored. If you don't set a prefix, backups are stored in the root directory.

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


5. Apply the configuration:

    ```bash
    kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

## Automate access to Amazon S3 using IRSA

[IAM Roles for Service Accounts (IRSA) :octicons-link-external-16:](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html) lets Pods on Amazon EKS assume an IAM role through the cluster's OpenID Connect (OIDC) provider. You do not store AWS access keys in a Kubernetes Secret. Instead, Percona Backup for MongoDB uses the AWS default credential provider chain and receives temporary credentials automatically.

### Prerequisites

Before you start, make sure you have the following:

* An [EKS cluster with the Operator and database deployed](eks.md)
* An S3 bucket for backups
* The [AWS CLI :octicons-link-external-16:](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html), [eksctl :octicons-link-external-16:](https://github.com/weaveworks/eksctl#installation), and [kubectl :octicons-link-external-16:](https://kubernetes.io/docs/tasks/tools/) installed and configured
* Your AWS account ID. You can get it with:

    ```bash
    aws sts get-caller-identity --query Account --output text
    ```

Set environment variables for the commands below. Replace the placeholders with your values:

```bash
export cluster_name=<my-cluster>
export aws_region=<aws-region>
export s3_bucket=<my-backup-bucket>
export policy_name=<my-s3-policy>
export role_name=<my-irsa-role>
export account_id=$(aws sts get-caller-identity --query Account --output text)
export namespace=<my-namespace>
```

### Configure the IAM role {.power-number}

1. Check whether your EKS cluster has an [OIDC issuer URL :octicons-link-external-16:](https://docs.aws.amazon.com/eks/latest/userguide/enable-iam-roles-for-service-accounts.html) enabled:

    ```bash
    aws eks describe-cluster --name $cluster_name --region $aws_region \
      --query "cluster.identity.oidc.issuer" --output text
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        https://oidc.eks.us-west-2.amazonaws.com/id/4B2D5F8C1A2B3C4D5E6F7A8B9C0D1E2F
        ```

    Save the OIDC ID from the URL (the part after `/id/`). 

    If the command returns no issuer URL, create the OIDC provider:

    ```bash
    eksctl utils associate-iam-oidc-provider \
      --region $aws_region --cluster $cluster_name --approve
    ```

2. Create an IAM policy that grants access to your S3 bucket. Replace `<s3_bucket>` with your bucket name:

    ```json title="s3-bucket-policy.json"
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

    !!! tip

        The example uses broad `s3:*` permissions for simplicity. In production, restrict the policy to the specific S3 actions your backup and restore workflows require. Refer to the [Amazon S3 permissions documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-with-s3-actions.html) and tailor the policy to follow the principle of least privilege.
   

3. Create the IAM policy and save its Amazon Resource Name (ARN):

    ```bash
    aws iam create-policy \
      --policy-name $policy_name \
      --policy-document file://s3-bucket-policy.json
    ```

    ??? example "Sample output"

        ```{.json .no-copy}
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

4. Create a trust policy that allows your EKS OIDC provider to assume the role. Replace `<account-id>`, `<region>`, and `<oidc-id>` in the file with your `$account_id`, `$aws_region`, and `$oidc_id` values:

    ```json title="role-trust-policy.json"
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Federated": "arn:aws:iam::<account-id>:oidc-provider/oidc.eks.<region>.amazonaws.com/id/<oidc-id>"
          },
          "Action": "sts:AssumeRoleWithWebIdentity",
          "Condition": {
            "StringEquals": {
              "oidc.eks.<region>.amazonaws.com/id/<oidc-id>:aud": "sts.amazonaws.com"
            }
          }
        }
      ]
    }
    ```

5. Create the IAM role:

    ```bash
    aws iam create-role \
      --role-name $role_name \
      --assume-role-policy-document file://role-trust-policy.json \
      --description "Allow Percona Operator for MongoDB to access S3 backups"
    ```

    ??? example "Sample output"

        ```{.json .no-copy}
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

6. Attach the S3 policy to the role. Replace `<policy-name>` with the policy name from step 3 if you did not export `$policy_name`:

    ```bash
    aws iam attach-role-policy \
      --role-name $role_name \
      --policy-arn arn:aws:iam::${account_id}:policy/${policy_name}
    ```

    ??? example "Sample output"

        ```{.json .no-copy}
        {
            "AttachedPolicies": [
                {
                    "PolicyName": "s3-access",
                    "PolicyArn": "arn:aws:iam::<account-id>:policy/s3-access"
                }
            ]
        }
        ```

7. Get the IAM role ARN. You will use it when you annotate the Kubernetes Service Accounts:

    ```bash
    role_arn=$(aws iam get-role --role-name $role_name --query "Role.Arn" --output text)
    ```

### Assign the IAM role to the Service accounts

1. Deploy the Operator if you haven't done so yet:
    
    ```bash
    kubectl apply --server-side -f https://raw.githubusercontent.com/percona/percona-server-mongodb-operator/v{{ release }}/deploy/bundle.yaml -n $namespace
    ```

2. Find service accounts used by the Operator and the database cluster:
    
    ```bash
    kubectl get serviceaccounts -n $namespace
    ```

    ??? example "Expected output"

        ```{.text .no-copy}
        default                           0         15m
        percona-server-mongodb-operator   0         15m
        ```
        
    `percona-server-mongodb-operator` is the Operator service account defined by the `serviceAccountName` key in the `deploy/operator.yaml` or `deploy/bundle.yaml` manifest.
    `default` is cluster's default service account. You can override it with the `serviceAccountName` Custom Resource option in the `replsets`, `sharding.configsvrReplSet`, and `sharding.mongos` subsections of the `deploy/cr.yaml` manifest, if needed.

3. Annotate both service accounts with the needed IAM role ARN:

        ```bash
        kubectl -n $namespace annotate serviceaccount default eks.amazonaws.com/role-arn: $role-arn --overwrite
        kubectl -n $namespace annotate serviceaccount percona-server-mongodb-operator eks.amazonaws.com/role-arn: $role-arn --overwrite
        ```

4. Annotating a Service Account does not restart existing Pods automatically. Restart the Operator and database Pods so they pick up the new `AWS_ROLE_ARN` environment variable:
    
    ```bash
    kubectl rollout restart deployment/percona-server-mongodb-operator -n $namespace
    kubectl rollout status deployment/percona-server-mongodb-operator -n $namespace
    ```

5. Verify that IRSA is configured correctly:

    * Check the annotation on both Service Accounts:

        ```bash
        kubectl -n $namespace get sa default -o yaml
        kubectl -n $namespace get sa percona-server-mongodb-operator -o yaml
        ```

    * Confirm that `AWS_ROLE_ARN` is set inside the Operator Pods:

        ```bash
        kubectl -n $namespace exec -it deploy/percona-server-mongodb-operator -- printenv | grep AWS_ROLE_ARN
        ```

        ??? example "Sample output"

            ```text
            AWS_ROLE_ARN=arn:aws:iam::<account-id>:role/s3-access-role
            ```

### Configure Percona Server for MongoDB cluster

Now you are ready to configure Percona Server for MongoDB to use IRSA for backups. 

=== "A new cluster deployment"

    1. Edit the `backup.storages` subsection in `deploy/cr.yaml` Custom Resource manifest. Give your storage a name (default name is `s3-us-west`) and set the following keys:
         
        * `type` - make sure the type is `s3`
        * `bucket` - where the data will be stored
        * `region` - location of the bucket
        * `prefix` (optional) - a path (sub-folder) inside the S3 bucket where backups will be stored. If you don't set a prefix, backups are stored in the root directory. 
        * Omit `s3.credentialsSecret` so that PBM uses IRSA to access the S3 storage.
        
        Here's the example configuration:
    
        ```yaml
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
    
        For more storage options, see the [Operator Custom Resource options](operator.md#operator-backup-section).
    
    2. Apply the configuration and deploy the cluster:
        
        ```bash
        kubectl apply -f deploy/cr.yaml -n $namespace
        ```

    3. Wait for the cluster to report the "Ready" status:
        
        ```bash
        kubectl get psmdb -n $namespace
        ```

    4. Confirm that `AWS_ROLE_ARN` is set inside the database Pods. Replace the `<cluster-name>` with the name of your cluster (corresponds to the `metadata.name` value in your Custom Resource):
        
        ```bash
        kubectl exec -it <cluster-name>-rs0-1 -- printenv | grep AWS_ROLE_ARN
        ```

        ??? example "Sample output"
            
            ```text
            AWS_ROLE_ARN=arn:aws:iam::<account-id>:role/s3-access-role
            ```


=== "Existing cluster"

    If your running Percona Server for MongoDB cluster is currently using a Kubernetes Secret with S3 credentials for backups, you can switch to IRSA authentication by following these steps:

    1. [Assign the IAM role to service accounts](#assign-the-iam-role-to-the-service-accounts), if you haven't done it before
    2. Make a rolling restart of the database Pods. 
   
        * Export the cluster name as an environment variable:
            
            ```bash
            export DBCLUSTER=my-cluster-name
            ```

        * Use the following for loop:
        
            ```bash
            for i in 0 1 2; do    
              kubectl delete pod $DBCLUSTER-rs0-$i -n $namespace
            done
            ```

    3. Restart the Operator Deployment:

        ```bash
        kubectl rollout restart deployment percona-server-mongodb-operator -n $namespace
        ```

    4. Confirm that AWS_ROLE_ARN is set inside the Operator and database Pods:

        ```bash
        kubectl -n $namespace exec -it deploy/percona-server-mongodb-operator -- printenv | grep AWS_ROLE_ARN
        kubectl exec -it $DBCLUSTER-rs0-0 -- printenv | grep AWS_ROLE_ARN
        ```

        ??? example "Sample output"
            
            ```text
            AWS_ROLE_ARN=arn:aws:iam::<account-id>:role/s3-access-role
            ```

    5. Remove the credentials Secret by patching the cluster. The storage name in the following command is `aws-s3`. Replace it with your value if you use another name:

        ```bash 
        kubectl -n $namespace patch psmdb $DBCLUSTER --type=json \
        -p '[{"op":"remove","path":"/spec/backup/storages/aws-s3/s3/credentialsSecret"}]'
        sleep 30
        ```
    
### Verify access to S3 using IRSA

1. Run an on-demand backup to confirm that the cluster can write to the S3 bucket. Here's the example of the backup object configuration:

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
        ```

2. Apply the configuration to start the backup:

    ```bash
    kubectl apply -f deploy/backup/backup.yaml -n $namespace
    ```

3. Check the backup progress:

    ```bash
    kubectl get psmdb-backup -n $namespace
    ```

### Troubleshooting

#### Pods stuck in Pending state

If your Pods are stuck in the `Pending` state, it may be because the `storageClass` specified in your Custom Resource does not match the one available in your EKS cluster. Review your Custom Resource configuration and ensure that it uses the correct storage class for your environment.
    
#### PBM reports "Request ARN is invalid"

This error usually indicates a problem with your IRSA (IAM Roles for Service Accounts) configuration. To resolve it:

1. **Verify the OIDC Provider:**  
   
    Confirm that your EKS cluster has the correct OIDC provider set up. In your trust policy, the URL must exactly match your cluster's OIDC provider URL and should follow the format:  

    ```
    https://oidc.eks.<region>.amazonaws.com/id/<OIDC_ID>
    ```
    
    Even minor mismatches (such as missing trailing slashes or extra characters) can cause this error.

2. **Check Service Account Annotations:**  
   Ensure that the Kubernetes service account used by the Operator has the correct `eks.amazonaws.com/role-arn` annotation. The annotation key should be present, and the value should be the full ARN of the IAM role you created for S3 access.

3. **Review Trust Policy Conditions:**  
   Make sure the IAM role's trust policy references the correct service account namespace and name, and that any conditions (such as `StringEquals`) are accurate.

4. **Restart Pods:**  
   After correcting any issues, restart both the database and Operator pods to ensure the new IAM credentials are picked up.

By following these steps, you should be able to resolve the "Request ARN is invalid" error when using IRSA.


## Automate access to Amazon S3 using IAM instance profile

Follow these steps:

1. Create the [IAM instance profile :octicons-link-external-16:](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html) and the permission policy within. In this policy you specify the access level that grants the access to S3 buckets.
2. Attach the IAM profile to your EC2 worker nodes.
3. Configure an S3 storage bucket in the Custom Resource and verify the connection from the EC2 instance to it.
4. Create or update the Percona Server for MongoDB cluster. *Do not provide* `s3.credentialsSecret` for the storage in `deploy/cr.yaml`.


