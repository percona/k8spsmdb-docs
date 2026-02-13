# App configuration

A few practices help keep your application secure and easy to run in different environments.

## Use environment variables for the connection string

Do not hardcode the MongoDB URI or credentials in your code. Use environment variables (for example `MONGODB_URI` or `MONGODB_USER` and `MONGODB_PASSWORD`) so you can change them per environment (local, staging, production) without changing code.

Example:

```bash
export MONGODB_URI="mongodb://myuser:mypassword@my-cluster-mongos.default.svc.cluster.local/admin?ssl=false"
```

Your app reads the variable at startup. In Kubernetes, you can inject it from a [Secret](app-credentials.md#use-the-credentials-in-your-app) or ConfigMap.

## Use a dedicated application user

Use an [application-level (unprivileged) user](app-credentials.md) for your app instead of the database admin account. Create one user per application or service, with only the roles it needs (for example `readWrite` on a single database). That limits the impact of leaked credentials and follows least-privilege.

## Optional: retries and connection pooling

MongoDB drivers support automatic retries and connection pooling. For replica sets, the driver can reconnect and fail over if the primary changes. See your driver’s documentation (for example [Node.js](https://www.mongodb.com/docs/drivers/node/current/fundamentals/connection/), [Python](https://pymongo.readthedocs.io/en/stable/faq.html#connection-pooling), [Go](https://www.mongodb.com/docs/drivers/go/current/fundamentals/connection/)) for options like connection timeouts and retry logic.

## Next steps

* [Get credentials for your app](app-credentials.md) — Create and use an application user.
* [Troubleshoot connection issues](troubleshoot-connection.md) — Fix common connection errors.
