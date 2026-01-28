# Configure VolumeAttributesClass for Persistent Volumes

A `VolumeAttributesClass` is a Kubernetes resource that enables you to modify the attributes of an existing Persistent Volume (PV) without recreating it. 

It defines a group of storage attributes that you can change on an existing volume. These settings act as a "profile" that you attach to a PersistentVolumeClaim (PVC). To use this feature, the underlying CSI driver must support the Kubernetes `ModifyVolume` API.

Percona Operator for MongoDB supports VolumeAttributesClass through references in the PVC templates you define in the cluster’s Custom Resource (CR). 

This page explains when to use VolumeAttributesClass and how to configure it for Percona Operator deployments.

## When to use a VolumeAttributesClass?

You can use a VolumeAttributesClass to adjust the storage performance of an existing volume. Typical use cases include:

* Increasing provisioned IOPS
* Adjusting throughput
* Switching performance tiers
* Enabling storage features supported by the CSI backend

Unlike a `StorageClass`, which defines how a volume is **created**, a `VolumeAttributesClass` defines how a volume is **modified** after creation.

Read more about `VolumeAttributesClass` in the [Kubernetes documentation :octicons-link-external-16:](https://kubernetes.io/docs/concepts/storage/volume-attributes-classes/).

## How to configure a VolumeAttributesClass

### Requirements

To use `VolumeAttributesClass`, your environment must meet the following requirements:

* Kubernetes version 1.34 and above that supports the `VolumeAttributesClass` API.
* The `VolumeAttributesClass` feature gate is enabled for your Kubernetes cluster. 
* A CSI driver that supports `ModifyVolume`. The example of such driver on GKE is `pd.csi.storage.gke.io`. You can check the list of CSI drivers with the following command:

    ```bash
    kubectl get storageclasses
    ```

    ??? example "Expected output"

      ```{.text .no-copy}
      NAME                     PROVISIONER             RECLAIMPOLICY   VOLUMEBINDINGMODE      ALLOWVOLUMEEXPANSION   AGE
      premium-rwo              pd.csi.storage.gke.io   Delete          WaitForFirstConsumer   true                   5h18m
      standard                 kubernetes.io/gce-pd    Delete          Immediate              true                   5h18m
      standard-rwo (default)   pd.csi.storage.gke.io   Delete          WaitForFirstConsumer   true                   5h18m
      ```

* `PersistentVolumes` provisioned through that CSI driver. 

### Steps

To configure a VolumeAttributesClass, you need to create a `VolumeAttributesClass` resource. The resource defines the storage attributes that you can change on an existing volume.

1. Create a `VolumeAttributesClass` configuration file. For example, `volume-attributes-class.yaml`:

    ```yaml title="volume-attributes-class.yaml"
    apiVersion: storage.k8s.io/v1
    kind: VolumeAttributesClass
    metadata:
      name: silver
    driverName: pd.csi.storage.gke.io
    parameters:
      provisioned-iops: "3000"
      provisioned-throughput: "50"
    ```

2. Apply the configuration file to create the `VolumeAttributesClass` resource:

    ```bash
    kubectl apply -f volume-attributes-class.yaml -n <namespace>
    ```

3. Check that the `VolumeAttributesClass` is created:

    ```bash
    kubectl get volumeattributesclass -n <namespace>
    ```

    ??? example "Expected output"

        ```{.text .no-copy}
        NAME     DRIVERNAME              AGE
        silver   pd.csi.storage.gke.io   9m32s
        ```

4. Reference the `VolumeAttributesClass` in the PVC template in your cluster's Custom Resource (CR). For example, edit the `deploy/cr.yaml` file and add the following:

    ```yaml 
    replsets:
    - name: rs0
      ...
      volumeSpec:
        persistentVolumeClaim:
          volumeAttributesClassName: silver
          resources:
            requests:
              storage: 3Gi
    ```

5. Apply the changes to your cluster:

    ```bash
    kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

    !!! note "Behavior"
        The Operator applies `VolumeAttributesClass` only to new PVCs when they are created. It does not update existing PVCs automatically. To apply a `VolumeAttributesClass` to an existing PVC, either patch the PVC manually or trigger the Operator to recreate the PVC.

6. Verify that the `VolumeAttributesClass` was applied to the PVC:

    ```bash
    kubectl get pvc my-cluster-name-rs0-0 -n <namespace> -o yaml
    ```

    ??? example "Expected output"

    ```{.text .no-copy}
    apiVersion: v1
    kind: PersistentVolumeClaim
    metadata:
      name: my-cluster-name-rs0-0
      ...
    spec:
     accessModes:
     - ReadWriteOnce
     resources:
       requests:
         storage: 3Gi
     storageClassName: standard-rwo
     volumeAttributesClassName: silver
     volumeMode: Filesystem    
   ```
