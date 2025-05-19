# Install and use the *cert-manager*

## About the *cert-manager*

The [cert-manager  :octicons-link-external-16:](https://cert-manager.io/docs/) is a Kubernetes certificate
management controller which widely used to automate the management and issuance
of TLS certificates. It is community-driven, and open source.

When you have already installed *cert-manager* and deploy the operator, the
operator requests a certificate from the *cert-manager*. The *cert-manager* acts
as a self-signed issuer and generates certificates. The Percona Operator
self-signed issuer is local to the operator namespace. This self-signed issuer
is created because Percona Server for MongoDB requires all certificates issued
by the same CA (Certificate authority).

Self-signed issuer allows you to deploy and use the Percona Operator without
creating a cluster issuer separately.

## Install the *cert-manager*

The steps to install the *cert-manager* are the following:

* create a namespace,
* disable resource validations on the cert-manager namespace,
* install the cert-manager.

The following commands perform all the needed actions:

``` {.bash data-prompt="$" }
$ kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v{{ certmanagerrecommended }}/cert-manager.yaml --validate=false
```

After the installation, you can verify the *cert-manager* by running the
following command:

``` {.bash data-prompt="$" }
$ kubectl get pods -n cert-manager
```

The result should display the *cert-manager* and webhook active and running:

``` {.text .no-copy}
NAME                                       READY   STATUS    RESTARTS   AGE
cert-manager-7d59dd4888-tmjqq              1/1     Running   0          3m8s
cert-manager-cainjector-85899d45d9-8ncw9   1/1     Running   0          3m8s
cert-manager-webhook-84fcdcd5d-697k4       1/1     Running   0          3m8s
```

Once you create the database with the Operator, it will automatically trigger the
cert-manager to create certificates. Whenever you check certificates for expiration,
you will find that they are valid and short-term.