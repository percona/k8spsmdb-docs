## Restore to a new Kubernetes environment

To [restore from a backup to a new Kubernetes-based environment](backups-restore-to-new-cluster.md), you must create a Secrets object there with the same user passwords as in the original cluster. 

Find the Secrets name object on the source cluster in the `spec.secrets` key in the `deploy/cr.yaml. Use this name to recreate the Secrets on the target cluster.

Find more details about secrets in [System Users](users.md#system-users). 