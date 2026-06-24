# OIDC authentication in Percona Operator for MongoDB 

OpenID Connect (OIDC) is an identity authentication protocol built on top of the OAuth 2.0 framework. OIDC is designed to verify user identities and provide authentication, ensuring that users are who they claim to be. OAuth 2.0 is used for user authorization to access resources.

If your organization already uses an identity provider (IdP) such as Okta or Microsoft Entra ID, you can connect Percona Server for MongoDB to it through OpenID Connect (OIDC). This lets your users to sign in with familiar corporate credentials while you can manage user credentials, access policies and roles in a centralized place - on the IdP side.

This guide walks you through integrating an already-configured 
identity provider with Percona Server for MongoDB managed by the Operator. 

The flow has been tested with Okta, Microsoft Entra ID, Ping Identity, and Keycloak. The IdP configuration is out of scope of this document. Please refer to [Percona Server for MongoDB documentation :octicons-link-external-16:](https://docs.percona.com/percona-server-for-mongodb/latest/oidc.html) and upstream documentation of your IdP for the configuration guidelines.

Use OIDC authentication only for application level users. The Operator's system users (`clusterAdmin`, `clusterMonitor`, the backup user, and others) authenticate with SCRAM. Therefore, keep `SCRAM-SHA-256` together with `MONGODB-OIDC` authentication mechanisms in Percona Server for MongoDB configuration. Removing the SCRAM authentication mechanism locks the Operator out of the cluster.

## Version availability

OIDC authentication is available with the following software versions:

* Percona Server for MongoDB 8.0.12-4 and later
* Percona Server for MongoDB 7.0.24-13 and later
* Percona Operator for MongoDB 1.21.0 and later

## Configure OIDC authentication

### Where to add OIDC configuration

The configuration examples in each provider tutorial are provided for `mongod` instances.

You must add these configuration options to the `configuration` subsection of the custom resource in `deploy/cr.yaml`.

- For a **replica set**, add the configuration only to `replsets.configuration`.
- For a **sharded cluster**, add the configuration to all of the following:

    - `replsets.configuration` for each shard (`mongod` nodes)
    - `sharding.mongos.configuration` for `mongos`. In the cluster, the clients authenticate through `mongos`
    - `sharding.configsvrReplSet.configuration` for the config servers (only needed if clients connect to them directly).

Each provider tutorial below explains the details for your identity provider.

To apply the configuration, run:

```bash
kubectl apply -f deploy/cr.yaml -n <namespace>
```

### Set up an Identity Provider and configure authentication in the Operator

Pick your identity provider:

=== "Okta"

    On the Okta side, you need to complete the following steps as part of your IdP setup:

    - Create and configure an OIDC application with Okta
    - Configure the authorization server
    - Create users and groups

    For detailed, step-by-step instructions, follow [Configure OIDC authentication with Okta  :octicons-link-external-16:](https://docs.percona.com/percona-server-for-mongodb/latest/oidc-okta.html).
    
    Once the IdP is configured, add the following to the `configuration` field. 
    
    This example shows the configuration for database Pods. 
    For instructions on how to configure a sharded cluster, refer to the [Where to add OIDC configuration](#where-to-add-oidc-configuration) section above.

    ```yaml
    spec:
      replsets:
        - name: rs0
          configuration:
            security:
              authorization: "enabled"
            setParameter:
              authenticationMechanisms: SCRAM-SHA-256,MONGODB-OIDC
              oidcIdentityProviders: '[
                {
                  "issuer": "https://<your-org>.okta.com/oauth2/default",
                  "audience": "api://default",
                  "clientId": "<client-id>",
                  "authNamePrefix": "okta",
                  "useAuthorizationClaim": true,
                  "authorizationClaim": "groups",
                  "supportsHumanFlows": true
                }
              ]'
 
    ```

    Okta puts the user's email in `sub`, so the MongoDB user appears as `okta/<email>`.

=== "Microsoft Entra ID"

    On the Microfost Entra side, you need to complete the following steps as part of your IdP setup:

    - Create and configure an OIDC application with Microsoft Entra
    - Create users and groups

    For detailed, step-by-step instructions, follow the [Configure OIDC authentication with Microsoft Entra  :octicons-link-external-16:](https://docs.percona.com/percona-server-for-mongodb/8.0/oidc-entra.html) tutorial. 
    
    Once the IdP is configured, add the following Percona Server for MongoDB configuration to the `configuration` field. 
     
    Key points to consider:

    * `requestScopes` must be an **array**. Entra emits group **object IDs** in the `groups` claim, so the role is named `entra/<group-object-id>`. 
    * `principalName: preferred_username` gives a readable user name (Entra's `sub` is an opaque ID).
    
    This example shows the configuration for database Pods. 
    For instructions on how to configure a sharded cluster, refer to the [Where to add OIDC configuration](#where-to-add-oidc-configuration) section above.

    ```yaml
    security:
      authorization: "enabled"
    setParameter:
      authenticationMechanisms: SCRAM-SHA-256,MONGODB-OIDC
      oidcIdentityProviders: '[
        {
          "issuer": "https://login.microsoftonline.com/<tenant-id>/v2.0",
          "audience": "<client-id>",
          "clientId": "<client-id>",
          "authNamePrefix": "entra",
          "principalName": "preferred_username",
          "useAuthorizationClaim": true,
          "authorizationClaim": "groups",
          "requestScopes": ["api://<client-id>/<scope-name>"],
          "supportsHumanFlows": true
        }
      ]'
    ```

=== "Ping Identity"

    On the Ping Identity side, you need to complete the following steps as part of your IdP setup:

    * Create a new environment with Ping Identity
    * Configure an OIDC application
    * Create users and groups
    
    For detailed, step-by-step instructions, follow the  [Configure OIDC authentication with Ping Identity  :octicons-link-external-16:](https://docs.percona.com/percona-server-for-mongodb/8.0/oidc-ping.html) tutorial.
    
    Once you configured the IdP, add the following Percona Server for MongoDB configuration to the `configuration` field of the Custom Resource. 

    This example shows the configuration for database Pods. 
    For instructions on how to configure a sharded cluster, refer to the [Where to add OIDC configuration](#where-to-add-oidc-configuration) section above.

    ```yaml
    security:
      authorization: "enabled"
    setParameter:
      authenticationMechanisms: SCRAM-SHA-256,MONGODB-OIDC
      oidcIdentityProviders: '[
        {
          "issuer": "https://auth.pingone.<region>/<environment-id>/as",
          "audience": "<client-id>",
          "clientId": "<client-id>",
          "authNamePrefix": "ping",
          "useAuthorizationClaim": true,
          "authorizationClaim": "auth_claims",
          "supportsHumanFlows": true
        }
      ]'
    ```

    Ping requires the extra `--oidcIdTokenAsAccessToken` flag for `mongosh` at login. Refer to the [Log in](#log-in) for details.

=== "Keycloak"

    On the Keykloak side, you need to complete the following steps as part of your IdP setup:

    * Create a new realm in KeyCloak
    * Create and configure an OIDC client
    * Create users and groups
    
    !!! important

        When using Keycloak, you must provide the certificate signed by the trusted CA. Otherwise, Percona Server for MongoDB cannot verify the connection and login attempts fail. See [Limitations](#limitations).
    
    For detailed, step-by-step instructions, follow the [Configure OIDC authentication with Keycloak  :octicons-link-external-16:](https://docs.percona.com/percona-server-for-mongodb/8.0/oidc-keycloak.html) tutorial.
    
    Once it is configured, the following Percona Server for MongoDB configuration to the `configuration` field of the Custom Resource. 
     
    This example shows the configuration for database Pods.    For instructions on how to configure a sharded cluster, refer to the [Where to add OIDC configuration](#where-to-add-oidc-configuration) section above.

    ```yaml
    security:
      authorization: "enabled"
    setParameter:
      authenticationMechanisms: SCRAM-SHA-256,MONGODB-OIDC
      oidcIdentityProviders: '[
        {
          "issuer": "https://<keycloak-host>:8443/realms/<realm>",
          "audience": "<client-id>",
          "clientId": "<client-id>",
          "authNamePrefix": "keycloak",
          "useAuthorizationClaim": true,
          "authorizationClaim": "groups",
          "supportsHumanFlows": true
        }
      ]'
    ```

### Map identity-provider groups to MongoDB roles

To enable users to access Percona Server for MongoDB, you must create roles and define privileges for them.

The role name must match the identity provider group name and must have the prefix that matches the `authNamePrefix` in Percona Server for MongoDB configuration. The role name format is therefore `<authNamePrefix>/<group>`, where `<group>` is the value the provider puts into the authorization claim.

Declare the role in the `roles` subsection of `deploy/cr.yaml`, so the Operator creates and reconciles it.

This configuration example shows the role for Okta group `mongodb-users`:

```yaml
spec:
  roles:
    - role: okta/mongodb-users
      db: admin
      privileges: []
      roles:
        - role: readWriteAnyDatabase
          db: admin
```

Apply the change with `kubectl apply -f deploy/cr.yaml`. See [Custom MongoDB roles](app-users.md#custom-mongodb-roles) for the full `roles` reference.

## Log in

OIDC uses an interactive (human) flow: with `--oidcFlows auth-code` `mongosh` opens a browser, with `--oidcFlows device-auth` it prints a URL and a code to enter from any browser:

```bash
mongosh "mongodb://<your_cluster_name>-rs0.<your_namespace>.svc.cluster.local/admin?replicaSet=rs0&ssl=false" --authenticationMechanism MONGODB-OIDC --oidcFlows auth-code
```

!!! note

    Ping Identity additionally requires the `--oidcIdTokenAsAccessToken` flag for `mongosh`.

Verify that the user and roles are recognized:

```json
db.runCommand({connectionStatus:1})
```

The output should be like the following:

``` {.json data-prompt=">" }
{
  authInfo: {
    authenticatedUsers: [
      { user: 'okta/user@example.com', db: '$external' }
    ],
    authenticatedUserRoles: [
      { role: 'okta/mongodb-users', db: 'admin' },
      { role: 'readWriteAnyDatabase', db: 'admin' }
    ]
  },
  ok: 1
}
```

## Multiple identity providers

You can configure more than one provider on a single cluster — `oidcIdentityProviders` is a JSON array. MongoDB routes a login to a provider by matching the supplied user name against each provider's `matchPattern` (a regular expression); the order of the array sets the priority (the first match wins).

The example below routes `@example.com` users to Okta and `@corp.com` users to Microsoft Entra:

```yaml
security:
  authorization: "enabled"
setParameter:
  authenticationMechanisms: SCRAM-SHA-256,MONGODB-OIDC
  oidcIdentityProviders: '[
    {
      "issuer": "https://<your-org>.okta.com/oauth2/default",
      "audience": "api://default",
      "clientId": "<okta-client-id>",
      "authNamePrefix": "okta",
      "useAuthorizationClaim": true,
      "authorizationClaim": "groups",
      "supportsHumanFlows": true,
      "matchPattern": "@example\\.com$"
    },
    {
      "issuer": "https://login.microsoftonline.com/<tenant-id>/v2.0",
      "audience": "<client-id>",
      "clientId": "<client-id>",
      "authNamePrefix": "entra",
      "principalName": "preferred_username",
      "useAuthorizationClaim": true,
      "authorizationClaim": "groups",
      "requestScopes": ["api://<client-id>/<scope-name>"],
      "supportsHumanFlows": true,
      "matchPattern": "@corp\\.com$"
    }
  ]'
```

Two rules matter once there is more than one human-flow provider:

* **`matchPattern` is required** on each provider, so that MongoDB knows which one to use. It is matched against the user name you pass at login.
* **The user name you pass must equal the token's principal.** MongoDB compares the user name used for routing with the principal in the issued token and rejects the login if they differ (`principal names ... are not equal`). The principal comes from the `principalName` claim (default `sub`). If a provider's `sub` is an opaque identifier (Microsoft Entra, for example), set `principalName` to a claim that equals what users type, such as `preferred_username`.

Create one role per provider (`okta/<group>`, `entra/<group>`, and so on), then log in by passing a user name that matches the intended provider's `matchPattern`.

## Limitations

The `issuer` must present a **publicly trusted TLS certificate**. To validate a token, mongod fetches the provider's keys (JWKS) from the `issuer` over HTTPS and must trust that certificate; the Operator currently provides no way to add a custom CA to the database nodes. Public identity providers (Okta, Microsoft Entra, Ping, and a Keycloak fronted by a publicly trusted certificate) work out of the box.

A self-hosted identity provider with a **private or self-signed certificate** (for example a Keycloak running inside your network) is therefore **not supported yet** — mongod cannot fetch the JWKS and OIDC logins fail with:

```text
Failed to load JWKs from issuer ... SSL peer certificate or SSH remote key was not OK
```

As a workaround, front the identity provider with a publicly trusted certificate.
