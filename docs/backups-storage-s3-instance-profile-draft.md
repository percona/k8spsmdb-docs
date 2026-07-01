# Draft: IAM instance profile section for backups-storage-s3.md

This file contains the proposed **Automate access to Amazon S3 using IAM instance profile** section. Replace lines 465–473 in `backups-storage-s3.md` with the content below (from `## Automate access` through the end of the instance profile section).

---

## Automate access to Amazon S3 using IAM instance profile

An [IAM instance profile :octicons-link-external-16:](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html) attaches an IAM role to EC2 instances. When your Kubernetes worker nodes run on EC2, Pods obtain AWS credentials through the [EC2 instance metadata service (IMDS) :octicons-link-external-16:](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-metadata.html). You do not store AWS access keys in a Kubernetes Secret. Instead, Percona Backup for MongoDB uses the AWS default credential provider chain and receives credentials from the worker node automatically.

Use this method when your cluster runs on EC2 worker nodes and IRSA is not configured—for example, in self-managed Kubernetes clusters on EC2. All Pods on the same worker node share the node's IAM permissions.

### Prerequisites

Before you start, make sure you have the following:

* A Kubernetes cluster whose worker nodes run on EC2
* The [Operator and database deployed](kubectl.md), or ready to deploy
* An S3 bucket for backups
* The [AWS CLI :octicons-link-external-16:](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) and [kubectl :octicons-link-external-16:](https://kubernetes.io/docs/tasks/tools/) installed and configured
* Your AWS account ID. You can get it with:

    ```bash
    aws sts get-caller-identity --query Account --output text
    ```

Set environment variables for the commands below. Replace the placeholders with your values:

```bash
export aws_region=<aws-region>
export s3_bucket=<my-backup-bucket>
export policy_name=<my-s3-policy>
export role_name=<my-ec2-role>
export instance_profile_name=<my-instance-profile>
export namespace=<my-namespace>
export account_id=$(aws sts get-caller-identity --query Account --output text)
```

### Configure the IAM role and instance profile
{.power-number}

1. Create an IAM policy that grants access to your S3 bucket. Replace `<s3_bucket>` with your bucket name:

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

        The example uses broad `s3:*` permissions for simplicity. In production, restrict the policy to the specific S3 actions your backup and restore workflows require. Refer to the [Amazon S3 permissions documentation :octicons-link-external-16:](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-with-s3-actions.html) and tailor the policy to follow the principle of least privilege.

2. Create the IAM policy:

    ```bash
    aws iam create-policy \
      --policy-name $policy_name \
      --policy-document file://s3-bucket-policy.json
    ```

3. Create a trust policy that allows EC2 instances to assume the role:

    ```json title="ec2-trust-policy.json"
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "ec2.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    }
    ```

4. Create the IAM role:

    ```bash
    aws iam create-role \
      --role-name $role_name \
      --assume-role-policy-document file://ec2-trust-policy.json \
      --description "Allow EC2 worker nodes to access S3 backups"
    ```

5. Attach the S3 policy to the role:

    ```bash
    aws iam attach-role-policy \
      --role-name $role_name \
      --policy-arn arn:aws:iam::${account_id}:policy/${policy_name}
    ```

6. Create an instance profile and add the role to it:

    ```bash
    aws iam create-instance-profile \
      --instance-profile-name $instance_profile_name

    aws iam add-role-to-instance-profile \
      --instance-profile-name $instance_profile_name \
      --role-name $role_name
    ```

    !!! note "EKS clusters without IRSA"

        Amazon EKS worker nodes already have an instance profile through the node group IAM role. Instead of creating a new instance profile, attach the S3 policy from step 2 to the existing node group role. Skip steps 6–7 in the next section and apply the policy to that role.

### Attach the instance profile to worker nodes
{.power-number}

1. Attach the instance profile to each EC2 worker node in your cluster. The exact steps depend on how you manage your nodes:

    * **Self-managed clusters:** Attach the profile when you launch instances, or associate it with running instances:

        ```bash
        aws ec2 associate-iam-instance-profile \
          --instance-id <instance-id> \
          --iam-instance-profile Name=$instance_profile_name
        ```

    * **Auto Scaling groups:** Update the launch template or Auto Scaling group to use `$instance_profile_name`.

2. If you changed the instance profile on running nodes, restart the Operator and database Pods so backup agents pick up the new credentials:

    ```bash
    kubectl rollout restart deployment/percona-server-mongodb-operator -n $namespace
    kubectl rollout status deployment/percona-server-mongodb-operator -n $namespace
    ```

3. Verify that worker nodes expose IAM credentials through IMDS. Run this command from a database Pod:

    ```bash
    kubectl exec -it <database-pod> -n $namespace -- \
      curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        my-ec2-role
        ```

    The output should show the IAM role name attached to the worker node.

### Configure Percona Server for MongoDB cluster

Now you are ready to configure Percona Server for MongoDB to use the instance profile for backups.

=== "A new cluster deployment"

    1. Edit the `backup.storages` subsection in `deploy/cr.yaml` Custom Resource manifest. Give your storage a name (default name is `s3-us-west`) and set the following keys:

        * `type` - make sure the type is `s3`
        * `bucket` - where the data will be stored
        * `region` - location of the bucket
        * `prefix` (optional) - a path (sub-folder) inside the S3 bucket where backups will be stored. If you don't set a prefix, backups are stored in the root directory.
        * Omit `s3.credentialsSecret` so that PBM uses the worker node's instance profile to access the S3 storage.

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

    3. Wait for the cluster to report the `ready` status:

        ```bash
        kubectl get psmdb -n $namespace
        ```

=== "Existing cluster"

    If your running Percona Server for MongoDB cluster is currently using a Kubernetes Secret with S3 credentials for backups, you can switch to an instance profile by following these steps:

    1. [Attach the instance profile to worker nodes](#attach-the-instance-profile-to-worker-nodes), if you have not done so already.

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
        kubectl rollout restart deployment/percona-server-mongodb-operator -n $namespace
        ```

    4. Remove the credentials Secret by patching the cluster. The storage name in the following command is `aws-s3`. Replace it with your value if you use another name:

        ```bash
        kubectl -n $namespace patch psmdb $DBCLUSTER --type=json \
          -p '[{"op":"remove","path":"/spec/backup/storages/aws-s3/s3/credentialsSecret"}]'
        sleep 30
        ```

### Verify access to S3 using IAM instance profile

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
      storageName: aws-s3
    ```

2. Apply the configuration to start the backup:

    ```bash
    kubectl apply -f deploy/backup/backup.yaml -n $namespace
    ```

3. Check the backup progress:

    ```bash
    kubectl get psmdb-backup -n $namespace
    ```

    When the backup reaches the `ready` status, the instance profile configuration is working.

### Troubleshooting

#### Backup fails with access denied

* Confirm that the IAM policy is attached to the role associated with the worker node's instance profile.
* Make sure `s3.credentialsSecret` is not set in the Custom Resource. Secret-based credentials override instance profile credentials.
* Verify that Pods can reach IMDS. Some environments block the metadata endpoint or require [IMDSv2 :octicons-link-external-16:](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configured-instance-metadata-service.html).

#### All Pods on the node share the same permissions

This is expected behavior for instance profiles. If you need per-Pod S3 permissions, use [IRSA](#automate-access-to-amazon-s3-using-irsa) on EKS instead.
