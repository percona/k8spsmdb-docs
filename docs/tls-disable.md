# Run Percona Server for MongoDB without TLS

You can run Percona Server for MongoDB without TLS. For example, for testing or demonstration purposes. However, we recommend that you have the TLS protocol enabled.

You can start a new cluster without TLS or disable the TLS protocol for a running cluster. See the corresponding sections for steps.

## Disable TLS for a new cluster

To disable TLS protocol for a new cluster, edit the `deploy/cr.yaml` Custom Resource manifest as follows:

* set the `tls.mode` key to `disabled` 
* set the `unsafeFlags.tls` to `true`.

```yaml
...
spec:
  ...
  unsafeFlags
    tls: true
    ...
  tls:
    mode: disabled
```

Apply the manifest:

```{.bash data-prompt="$" }
$ kubectl apply -f deploy/cr.yaml -n <namespace>
```

## Disable TLS for a running cluster

To disable TLS protocol for a running cluster, follow these steps:

1. Pause the cluster. Edit the `deploy/cr.yaml` Custom Resource manifest and set `spec.pause` key to `true`:

    ```yaml
    spec:
      pause: true
    ```

2. Apply the changes:

    ```{.bash data-prompt="$" }
    $ kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

3. Wait for the cluster to be paused. Check the status with the `kubectl get psmdb` command:

    ```{.bash data-prompt="$" }
    $ kubectl get psmdb -n <namespace>
    ```

4. Disable the TLS protocol by setting the following configuration in the `deploy/cr.yaml` Custom Resource manifest:

    ```yaml
    ...
    spec:
      ...
      unsafeFlags
        tls: true
        ...
      tls:
        mode: disabled
    ```

5. Apply the changes:

    ```{.bash data-prompt="$" }
    $ kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

6. Now resume the cluster. Edit the `deploy/cr.yaml` Custom Resource manifest and set the `spec.pause` key to `false`:

    ```yaml
    spec:
      pause: false
    ```

7. Apply the changes:

    ```{.bash data-prompt="$" }
    $ kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

8. Wait for the cluster to be resumed. Check the status with the `kubectl get psmdb` command.


## Re-enable TLS

To re-enable TLS protocol for a running cluster, follow these steps:

1. Pause the cluster. Edit the `deploy/cr.yaml` Custom Resource manifest and set `spec.pause` key to `true`:

    ```yaml
    spec:
      pause: true
    ```

2. Apply the changes:

    ```{.bash data-prompt="$" }
    $ kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

3. Wait for the cluster to be paused. Check the status with the `kubectl get psmdb` command:

    ```{.bash data-prompt="$" }
    $ kubectl get psmdb -n <namespace>
    ```

4. Enable the TLS protocol by setting the following configuration in the `deploy/cr.yaml` Custom Resource manifest:

    ```yaml
    ...
    spec:
      ...
      unsafeFlags
        tls: false
        ...
      tls:
        mode: preferTLS
    ```

5. Apply the changes:

    ```{.bash data-prompt="$" }
    $ kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

6. Now resume the cluster. Edit the `deploy/cr.yaml` Custom Resource manifest and set the `spec.pause` key to `false`:

    ```yaml
    spec:
      pause: false
    ```

7. Apply the changes:

    ```{.bash data-prompt="$" }
    $ kubectl apply -f deploy/cr.yaml -n <namespace>
    ```

8. Wait for the cluster to be resumed. Check the status with the `kubectl get psmdb` command.