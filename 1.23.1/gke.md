> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Create a Google Kubernetes Engine (GKE) cluster

This guide walks you through creating a Kubernetes cluster on Google Kubernetes Engine (GKE). The document assumes some experience with the platform. For more information on the GKE, see the [Kubernetes Engine Quickstart](https://cloud.google.com/kubernetes-engine/docs/quickstart) .

## Prerequisites

You can use either **Google Cloud Shell** (in the browser) or your **local shell**.

For the local shell, install:

1. **[gcloud](https://cloud.google.com/sdk/docs/quickstarts)** — Google Cloud SDK. Select your OS on the [Google Cloud SDK page](https://cloud.google.com/sdk/docs) and follow the instructions.

1. **kubectl** — Kubernetes command-line tool. After installing gcloud, run:

   ```
   gcloud auth login
   gcloud components install kubectl
   ```

## Create the GKE cluster

1. Create the cluster with `gcloud`. Replace `<project ID>` with your Google Cloud project ID (use `gcloud projects list` to see projects). You can change the zone (for example `us-central1-a`) and other parameters as needed:

   ```
   gcloud container clusters create my-cluster-name \
     --project <project ID> \
     --zone us-central1-a \
     --cluster-version 1.35 \
     --machine-type n1-standard-4 \
     --num-nodes=3
   ```

   For ARM64 nodes, use a different `--machine-type`, for example `t2a-standard-4`. Wait a few minutes for the cluster to be created.

1. Configure `kubectl` to use the new cluster:

   ```
   gcloud container clusters get-credentials my-cluster-name \
     --zone us-central1-a \
     --project <project ID>
   ```

1. Grant your user permission to create RBAC resources (required for installing the Operator). Use [Cloud IAM](https://cloud.google.com/iam) as needed; the following creates a cluster-admin binding for the current user:

   ```
   kubectl create clusterrolebinding cluster-admin-binding \
     --clusterrole cluster-admin \
     --user $(gcloud config get-value core/account)
   ```

   ??? example “Expected output”

   ````
    ``` {.text .no-copy}
    clusterrolebinding.rbac.authorization.k8s.io/cluster-admin-binding created
   ````

   ```

   ```

## Delete the GKE cluster

To remove the Kubernetes cluster and all resources, see [Delete the Operator and database](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/delete.html#delete-the-kubernetes-cluster-platform-specific).

## Next steps

Deploy the Operator and Percona Server for MongoDB.

[Single-namespace deployment](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/kubectl.html) [Multi-namespace deployment](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/cluster-wide.html)
