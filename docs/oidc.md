# How to integrate Percona Operator for MongoDB with an OIDC identity provider

OpenID Connect (OIDC) is an identity authentication protocol built on top of the OAuth 2.0 framework.

This guide covers integrating an already-configured OIDC identity provider with Percona Server for MongoDB and the Operator. OIDC authentication has been tested with Okta, Microsoft Entra ID, Ping Identity, and Keycloak.

!!! note

    OIDC authentication is available in Percona Server for MongoDB 8.0.12-4 and
    later (on the [8.0 line  :octicons-link-external-16:](https://docs.percona.com/percona-server-for-mongodb/8.0/oidc.html)),
    and on the [7.0 release line  :octicons-link-external-16:](https://docs.percona.com/percona-server-for-mongodb/7.0/oidc.html).

## Configure OIDC authentication

Each provider tutorial below shows the `mongod` configuration to apply. In a standalone Percona Server for MongoDB you would add these options to `/etc/mongod.conf`; with the Operator you put the same `security` and `setParameter` options into the `configuration` field of the custom resource in `deploy/cr.yaml`:

* `replsets.configuration` — for the replica set (`mongod`) nodes;
* `sharding.mongos.configuration` — for `mongos`. Required on a sharded cluster, since clients authenticate through `mongos`;
* `sharding.configsvrReplSet.configuration` — for the config servers (only needed if clients connect to them directly).

After editing the custom resource, apply it with `kubectl apply -f deploy/cr.yaml`.

!!! important

    Always keep `SCRAM-SHA-256` enabled together with `MONGODB-OIDC` in `authenticationMechanisms`. The Operator's system users (`clusterAdmin`, `clusterMonitor`, the backup user, and others) authenticate with SCRAM, so removing it locks the Operator out of the cluster.

Pick your identity provider:

=== "Okta"

    Set up the Okta side as described in [Configure OIDC authentication with Okta  :octicons-link-external-16:](https://docs.percona.com/percona-server-for-mongodb/8.0/oidc-okta.html). Once it is configured, add the following to the `configuration` field (see above):

    ```yaml
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

    Set up the Entra side as described in [Configure OIDC authentication with Microsoft Entra  :octicons-link-external-16:](https://docs.percona.com/percona-server-for-mongodb/8.0/oidc-entra.html). Once it is configured, add the following to the `configuration` field (see above):

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

    `requestScopes` must be an **array**. Entra emits group **object IDs** in the `groups` claim, so the role is named `entra/<group-object-id>`. `principalName: preferred_username` gives a readable user name (Entra's `sub` is an opaque ID).

=== "Ping Identity"

    Set up the Ping side as described in [Configure OIDC authentication with Ping Identity  :octicons-link-external-16:](https://docs.percona.com/percona-server-for-mongodb/8.0/oidc-ping.html). Once it is configured, add the following to the `configuration` field (see above):

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

    Ping requires the extra `--oidcIdTokenAsAccessToken` flag for `mongosh` at login (see below).

=== "Keycloak"

    Set up the Keycloak side as described in [Configure OIDC authentication with Keycloak  :octicons-link-external-16:](https://docs.percona.com/percona-server-for-mongodb/8.0/oidc-keycloak.html). Once it is configured, add the following to the `configuration` field (see above):

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

    Keycloak must present a publicly trusted certificate — see [Limitations](#limitations).

## Map identity-provider groups to MongoDB roles

A user authenticated through the identity provider gets the MongoDB role named `<authNamePrefix>/<group>`, where `<group>` is the value the provider puts into the authorization claim. Declare the role in the `roles` subsection of `deploy/cr.yaml`, so the Operator creates and reconciles it (here the Okta group `mongodb-users`):

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

``` {.json data-prompt=">" }
> db.runCommand({connectionStatus:1})
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
