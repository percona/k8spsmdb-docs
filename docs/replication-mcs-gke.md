# Enable multi-cluster Services on GKE

This document provides instructions how to enable multi-cluster Services on GKE. To learn more about multi-cluster services concept, see [Multi-cluster Services](replication-mcs.md).

The recommended approach is to use [Workload Identity Federation :octicons-link-external-16:](https://cloud.google.com/iam/docs/workload-identity-federation). Workload Identity Federation allows Kubernetes service accounts to impersonate Google Cloud IAM service accounts. This means:

* You don't need to store and mount service account keys in Pods.
* You can assign fine-grained IAM roles to workloads.
* Authentication is handled securely and natively.

## Before you start

1. Check the [requirements for MCS :octicons-link-external-16:](https://cloud.google.com/kubernetes-engine/docs/how-to/multi-cluster-services#requirements) on GKE and ensure your infrastructure meets them.

2. Ensure your account has the following roles:

    * roles/container.admin
    * roles/iam.serviceAccountAdmin

## Procedure

1. Export your GKE project ID as an environment variable to simplify further configuration

    ```bash
    PROJECT_ID=<your-project-id>
    ```

2. Enable the MCS, fleet (hub), Resource Manager, Cloud Service Mesh, and Cloud DNS APIs for your account:

    ```{.bash data-prompt="$"}
    $ gcloud services enable \
    multiclusterservicediscovery.googleapis.com \
    gkehub.googleapis.com \
    cloudresourcemanager.googleapis.com \
    trafficdirector.googleapis.com \
    dns.googleapis.com \
    --project $PROJECT_ID
    ```

3. Enable multi-cluster Services for your project on GKE:

    ```{.bash data-prompt="$"}
    $ gcloud container fleet multi-cluster-services enable --project $PROJECT_ID
    ```

4. Create two clusters and enable Workload Identity for them. Let's name the clusters `main` and `replica`:

    * Create the `main` cluster:

       ```{.bash data-prompt="$"}
       $ gcloud container clusters create main-cluster \
         --zone us-central1-a \
         --cluster-version {{ gkerecommended }} \
         --machine-type n1-standard-4 \
         --num-nodes=3 \
         --workload-pool=$PROJECT_ID.svc.id.goog
       ```
       
    * Create the `replica` cluster:
      
       ```{.bash data-prompt="$"}
       $ gcloud container clusters create replica-cluster \
         --zone us-central1-a \
         --cluster-version {{ gkerecommended }} \
         --machine-type n1-standard-4 \
         --num-nodes=3 \
         --workload-pool=$PROJECT_ID.svc.id.goog
       ```
    
5. Add clusters to the fleet and enable Workload Identity Federation:

    * Add the main cluster

    ```{.bash data-prompt="$"}
    $ gcloud container fleet memberships register main-cluster \
      --gke-cluster us-central1-a/main-cluster \
      --enable-workload-identity 
    ```
    
    * Add the replica cluster

    ```{.bash data-prompt="$"}
    $ gcloud container fleet memberships register replica-cluster \
      --gke-cluster us-central1-a/replica-cluster \
      --enable-workload-identity 
    ```

6. Enable MCS importer to manage Identity and Access Management (IAM) permissions.

    * Extract the Project number and set it as the environment variable:

       ```{.bash data-prompt="$"}
       $ PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
       ```

    * Enable IAM permissions:

       ```{.bash data-prompt="$"}
       $ gcloud projects add-iam-policy-binding $PROJECT_ID \
         --member "principal://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$PROJECT_ID.svc.id.goog/subject/ns/gke-mcs/sa/gke-mcs-importer" \
         --role "roles/compute.networkViewer"
       ```

7. Verify that MCS is enabled:

    ```{.bash data-prompt="$"}
    $ gcloud container fleet multi-cluster-services describe --project $PROJECT_ID
    ```

    ??? example "Sample output"

        ```{.text .no-copy}
        createTime: '2021-11-10T09:31:41.578155328Z'
        membershipStates:
          projects/166042509722/locations/us-central1/memberships/main-cluster:
            state:
              code: OK
              description: Firewall successfully updated
              updateTime: '2025-09-26T11:01:09.038866570Z'
          projects/166042509722/locations/us-central1/memberships/replica-cluster:
            state:
              code: OK
              description: Firewall successfully updated
              updateTime: '2025-09-26T11:01:44.661916334Z'
        name: projects/cloud-dev-112233/locations/global/features/multiclusterservicediscovery
        resourceState:
          state: ACTIVE
        spec: {}
        updateTime: '2024-05-16T08:02:36.718079209Z'
        ```

## Next steps

[Deploy the Main site](replication-main.md){.md-button}