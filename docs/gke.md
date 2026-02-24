# Create a Google Kubernetes Engine (GKE) cluster

This guide walks you through creating a Kubernetes cluster on Google
Kubernetes Engine (GKE). The document assumes some experience with the platform.
For more information on the GKE, see the [Kubernetes Engine Quickstart :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine/docs/quickstart).

## Prerequisites

You can use either **Google Cloud Shell** (in the browser) or your **local shell**.

For the local shell, install:

1. **[gcloud :octicons-link-external-16:](https://cloud.google.com/sdk/docs/quickstarts)** — Google Cloud SDK. Select your OS on the [Google Cloud SDK page  :octicons-link-external-16:](https://cloud.google.com/sdk/docs) and follow the instructions.
2. **kubectl** — Kubernetes command-line tool. After installing gcloud, run:

   ```bash
   gcloud auth login
   gcloud components install kubectl
   ```

## Create the GKE cluster

1. Create the cluster with `gcloud`. Replace `<project ID>` with your Google Cloud project ID (use `gcloud projects list` to see projects). You can change the zone (for example `us-central1-a`) and other parameters as needed:

   ```bash
   gcloud container clusters create my-cluster-name \
     --project <project ID> \
     --zone us-central1-a \
     --cluster-version {{ gkerecommended }} \
     --machine-type n1-standard-4 \
     --num-nodes=3
   ```

   For ARM64 nodes, use a different `--machine-type`, for example `t2a-standard-4`. Wait a few minutes for the cluster to be created.

2. Configure `kubectl` to use the new cluster:

   ```bash
   gcloud container clusters get-credentials my-cluster-name \
     --zone us-central1-a \
     --project <project ID>
   ```

3. Grant your user permission to create RBAC resources (required for installing the Operator). Use [Cloud IAM  :octicons-link-external-16:](https://cloud.google.com/iam) as needed; the following creates a cluster-admin binding for the current user:

   ```bash
   kubectl create clusterrolebinding cluster-admin-binding \
     --clusterrole cluster-admin \
     --user $(gcloud config get-value core/account)
   ```

   ??? example "Expected output"

       ``` {.text .no-copy}
       clusterrolebinding.rbac.authorization.k8s.io/cluster-admin-binding created
       ```

## Next steps

* Deploy the Operator and Percona Server for MongoDB in [single-namespace mode](kubectl.md) or [cluster-wide mode](cluster-wide.md).
* [Verify the cluster operation](verify-cluster.md).
* If the cluster does not become ready, see [Initial troubleshooting](debug.md).
* To remove the Kubernetes cluster and all resources, see [Delete the Operator and database](delete.md#delete-the-kubernetes-cluster-platform-specific).
