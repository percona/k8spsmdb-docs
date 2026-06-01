# Configure PVC snapshots

This guide provides step-by-step instructions for configuring and using Persistent Volume Claim (PVC) Snapshots with Percona Operator for MongoDB.

For a high-level explanation of PVC snapshots, see [PVC snapshot support](backups-pvc-snapshots.md).

!!! note "Amazon EKS users"

    If you run your cluster on Amazon EKS, refer to the [Add a VolumeSnapshotClass on EKS](#add-a-volumesnapshotclass-on-eks) section. EKS requires specific addons, a `gp3` storage class, and a matching `VolumeSnapshotClass` before you can use PVC snapshots.

## Prerequisites

Before you use PVC snapshots, verify the following:

1. Your Kubernetes cluster must run a CSI driver that supports Volume Snapshots. Examples:

    * Google Kubernetes Engine (GKE): `pd.csi.storage.gke.io`
    * Amazon EKS: `ebs.csi.aws.com`
    * Azure Kubernetes Service (AKS): `disk.csi.azure.com`

    Check what driver you have:

    ```bash
    kubectl get csidriver
    ```

2. Your Kubernetes cluster must have VolumeSnapshot CRDs installed. Most managed Kubernetes providers include these by default. Verify by running:

    ```bash
    kubectl get crd | grep volumesnapshot
    ```

    ??? example "Expected output"

        ```text
        volumesnapshotclasses.snapshot.storage.k8s.io
        ```

3. At least one VolumeSnapshotClass must exist and be compatible with the storage class used by your MongoDB data volumes. Check it with:

    ```bash
    kubectl get volumesnapshotclasses
    ```

    If you don't have one, you can add it yourself. Refer to the [Add a VolumeSnapshotClass](#add-a-volumesnapshotclass) section.

4. To use PVC snapshots, you must run the Operator version 1.23.0 or later.

## Before you start

1. Clone the Operator repository to be able to edit manifests:

    ```bash
    git clone -b v{{ release }} https://github.com/percona/percona-server-mongodb-operator
    cd percona-server-mongodb-operator
    ```

2. Export your cluster namespace:

    ```bash
    export NAMESPACE=<namespace>
    ```

## Add a VolumeSnapshotClass

If your cluster has no suitable `VolumeSnapshotClass`, create one for your platform.

1. Create a VolumeSnapshotClass configuration file with the following configuration:

    === "Google Kubernetes Engine (GKE)"

        ```yaml title="volume-snapshot-class.yaml"
        apiVersion: snapshot.storage.k8s.io/v1
        kind: VolumeSnapshotClass
        metadata:
          name: gke-snapshot-class
        driver: pd.csi.storage.gke.io
        deletionPolicy: Delete
        ```

    === "Azure Kubernetes Service (AKS)"

        ```yaml title="volume-snapshot-class.yaml"
        apiVersion: snapshot.storage.k8s.io/v1
        kind: VolumeSnapshotClass
        metadata:
          name: aks-snapshot-class
        driver: disk.csi.azure.com
        deletionPolicy: Delete
        ```

    === "OpenShift"

        ```yaml title="volume-snapshot-class.yaml"
        apiVersion: snapshot.storage.k8s.io/v1
        kind: VolumeSnapshotClass
        metadata:
          name: openshift-snapshot-class
        driver: ebs.csi.aws.com   # use the driver that matches your storage class
        deletionPolicy: Delete
        ```

2. Create the VolumeSnapshotClass resource:

    ```bash
    kubectl apply -f volume-snapshot-class.yaml
    ```

3. Verify that the VolumeSnapshotClass resource is created:

    ```bash
    kubectl get volumesnapshotclasses
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        NAME                 DRIVER                  DELETIONPOLICY   AGE
        gke-snapshot-class   pd.csi.storage.gke.io   Delete           42s
        ```

### Add a VolumeSnapshotClass on EKS

1. Before you start, ensure you have the following:
   
    * An EKS cluster (or plan to create one)
    * kubectl configured to access your cluster
    * The AWS CLI installed and configured

2. Enable required EKS addons. EKS requires two addons for volume snapshots: the Amazon EBS CSI driver and the snapshot controller. You can enable them when you create the cluster or add them to an existing cluster.

    === "At cluster creation"
        
        If you deploy the cluster with `eksctl` or a similar tool, include these addons in your cluster configuration:

        ```yaml
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

    === "On existing cluster"
        
        If your cluster already exists, enable the addons with the AWS CLI. Replace <CLUSTER_NAME> with the name of your EKS cluster in the following commands:

        ```bash
        aws eks create-addon \
          --cluster-name <CLUSTER_NAME> \
          --addon-name aws-ebs-csi-driver \
          --resolve-conflicts OVERWRITE
        
        aws eks create-addon \
          --cluster-name <CLUSTER_NAME> \
          --addon-name snapshot-controller
        ```

3. Create a `gp3` storage class. Since the default `gp2` storage class on EKS doesn't support volume snapshots, you must use `gp3` instead.
    
    * Create the storage class configuration file:
      
        ```yaml title="ebs-gp3-storage-class.yaml"
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

    * Apply the configuration to create the StorageClass:
      
       ```bash
       kubectl apply -f ebs-gp3-storage-class.yaml
       ```

4. Now you are ready to create the VolumeSnapshotClass. 
  
    Here's the example configuration file:

    ```yaml title="ebs-gp3-snapshot-class.yaml"
    apiVersion: snapshot.storage.k8s.io/v1
    kind: VolumeSnapshotClass
    metadata:
      name: ebs-csi-gp3
    driver: ebs.csi.aws.com
    deletionPolicy: Delete
    ```

    Apply it with:

    ```bash
    kubectl apply -f ebs-gp3-snapshot-class.yaml
    ```

    ??? example "Expected output"
        
        ```{.text .no-copy}
        volumesnapshotclass.snapshot.storage.k8s.io/ebs-csi-gp3 created
        ```

## Next steps

[Use PVC snapshots for backups and restores](backups-pvc-usage.md){.md-button}

