> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Configure PVC snapshots

This guide provides step-by-step instructions for configuring and using Persistent Volume Claim (PVC) Snapshots with Percona Operator for MongoDB.

For when to use snapshots compared with other backup types, see [Backup types](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups.html#backup-types). For requirements, see [PVC snapshots](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pvc-snapshots.html).

Amazon EKS users

If you run your cluster on Amazon EKS, refer to the [Add a VolumeSnapshotClass on EKS](#add-a-volumesnapshotclass-on-eks) section. EKS requires specific addons, a `gp3` storage class, and a matching `VolumeSnapshotClass` before you can use PVC snapshots.

## Requirements

Your environment must satisfy the following before PVC snapshots work at all:

1. Your Kubernetes cluster must run a CSI driver that supports Volume Snapshots. Examples:

   - Google Kubernetes Engine (GKE): `pd.csi.storage.gke.io`
   - Amazon EKS: `ebs.csi.aws.com`
   - Azure Kubernetes Service (AKS): `disk.csi.azure.com`

   Check what driver you have:

   ```
   kubectl get csidriver
   ```

1. Your Kubernetes cluster must have VolumeSnapshot CRDs installed. Most managed Kubernetes providers include these by default. Verify by running:

   ```
   kubectl get crd | grep volumesnapshot
   ```

   Expected output

   ```
   volumesnapshotclasses.snapshot.storage.k8s.io
   ```

1. At least one VolumeSnapshotClass must exist and be compatible with the storage class used by your MongoDB data volumes. Check it with:

   ```
   kubectl get volumesnapshotclasses
   ```

   If you don’t have one, you can add it yourself. Refer to the [Add a VolumeSnapshotClass](#add-a-volumesnapshotclass) section.

1. To use PVC snapshots, you must run the Operator version 1.23.0 or later.

## Prepare your environment

1. Clone the Operator repository to be able to edit manifests:

   ```
   git clone -b v1.23.1 https://github.com/percona/percona-server-mongodb-operator
   cd percona-server-mongodb-operator
   ```

1. Export your cluster namespace:

   ```
   export NAMESPACE=<namespace>
   ```

## Add a VolumeSnapshotClass

If your cluster has no suitable `VolumeSnapshotClass`, create one for your platform.

1. Create a VolumeSnapshotClass configuration file with the following configuration:

   **Google Kubernetes Engine (GKE)**

   volume-snapshot-class.yaml

   ```
   apiVersion: snapshot.storage.k8s.io/v1
   kind: VolumeSnapshotClass
   metadata:
     name: gke-snapshot-class
   driver: pd.csi.storage.gke.io
   deletionPolicy: Delete
   ```

   **Azure Kubernetes Service (AKS)**

   volume-snapshot-class.yaml

   ```
   apiVersion: snapshot.storage.k8s.io/v1
   kind: VolumeSnapshotClass
   metadata:
     name: aks-snapshot-class
   driver: disk.csi.azure.com
   deletionPolicy: Delete
   ```

   **OpenShift**

   volume-snapshot-class.yaml

   ```
   apiVersion: snapshot.storage.k8s.io/v1
   kind: VolumeSnapshotClass
   metadata:
     name: openshift-snapshot-class
   driver: ebs.csi.aws.com   # use the driver that matches your storage class
   deletionPolicy: Delete
   ```

1. Create the VolumeSnapshotClass resource:

   ```
   kubectl apply -f volume-snapshot-class.yaml
   ```

1. Verify that the VolumeSnapshotClass resource is created:

   ```
   kubectl get volumesnapshotclasses
   ```

   Sample output

   ```
   NAME                 DRIVER                  DELETIONPOLICY   AGE
   gke-snapshot-class   pd.csi.storage.gke.io   Delete           42s
   ```

### Add a VolumeSnapshotClass on EKS

1. Before you start, ensure you have the following:

   - An EKS cluster (or plan to create one)
   - kubectl configured to access your cluster
   - The AWS CLI installed and configured

1. Enable required EKS addons. EKS requires two addons for volume snapshots: the Amazon EBS CSI driver and the snapshot controller. You can enable them when you create the cluster or add them to an existing cluster.

   **At cluster creation**

   If you deploy the cluster with `eksctl` or a similar tool, include these addons in your cluster configuration:

   ```
   addons:
     - name: aws-ebs-csi-driver
       wellKnownPolicies:
         ebsCSIController: true
     - name: snapshot-controller
   nodeGroups:
     - name: ng-1
       desiredCapacity: 3
       minSize: 3
       maxSize: 3
   ```

   **On existing cluster**

   If your cluster already exists, enable the addons with the AWS CLI. Replace with the name of your EKS cluster in the following commands:

   ```
   aws eks create-addon \
     --cluster-name <CLUSTER_NAME> \
     --addon-name aws-ebs-csi-driver \
     --resolve-conflicts OVERWRITE

   aws eks create-addon \
     --cluster-name <CLUSTER_NAME> \
     --addon-name snapshot-controller
   ```

1. Create a `gp3` storage class. Since the default `gp2` storage class on EKS doesn’t support volume snapshots, you must use `gp3` instead.

   - Create the storage class configuration file:

     ebs-gp3-storage-class.yaml

     ```
     apiVersion: storage.k8s.io/v1
     kind: StorageClass
     metadata:
       name: ebs-csi-gp3
     provisioner: ebs.csi.aws.com
     volumeBindingMode: WaitForFirstConsumer
     allowVolumeExpansion: true
     parameters:
       type: gp3
     ```

   - Apply the configuration to create the StorageClass:

   ```
   kubectl apply -f ebs-gp3-storage-class.yaml
   ```

1. Now you are ready to create the VolumeSnapshotClass.

   Here’s the example configuration file:

   ebs-gp3-snapshot-class.yaml

   ```
   apiVersion: snapshot.storage.k8s.io/v1
   kind: VolumeSnapshotClass
   metadata:
     name: ebs-csi-gp3
   driver: ebs.csi.aws.com
   deletionPolicy: Delete
   ```

   Apply it with:

   ```
   kubectl apply -f ebs-gp3-snapshot-class.yaml
   ```

   Expected output

   ```
   volumesnapshotclass.snapshot.storage.k8s.io/ebs-csi-gp3 created
   ```

## Verify the setup

Confirm the `VolumeSnapshotClass` exists and names the CSI driver your storage class uses:

```
kubectl get volumesnapshotclass
```

Then take a PVC snapshot backup and confirm it completes:

```
kubectl get psmdb-backup -n $NAMESPACE
```

The backup must reach the `ready` state. A backup that fails here usually means the `VolumeSnapshotClass` name in the task does not match one returned above, or the driver does not match the one behind the volumes.

## Next steps

[Use PVC snapshots for backups and restores](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/backups-pvc-usage.html)
