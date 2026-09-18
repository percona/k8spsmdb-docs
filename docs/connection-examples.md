# Connection examples

The examples below connect and run a simple operation with the official MongoDB drivers for
Node.js, Python, and Go.

None of them hardcodes a URI. Each one reads `MONGODB_URI` from the environment, so the same
code works with the connection string the Operator generated for you - whatever the cluster
name, namespace, replica set name, or TLS setting happens to be. Take the URI from
[Connect your application](connect-from-app.md) and put it in the environment first:

```bash
export MONGODB_URI=$(kubectl get secret <connection-secret-name> -n <namespace> \
  -o jsonpath='{.data.<username>_mongos_connectionString}' | base64 --decode)
```

On a replica set cluster the key is `<username>_rs0_connectionString` instead. See
[Connection secrets](connection-secrets.md#secret-names) for the full key layout.

## Node.js

Use the [MongoDB Node.js driver](https://www.mongodb.com/docs/drivers/node/current/). Install it with:

```bash
npm install mongodb
```

Example: connect and insert one document.

```javascript
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("mydb");
    const result = await db.collection("items").insertOne({ name: "example", value: 1 });
    console.log("Inserted id:", result.insertedId);
  } finally {
    await client.close();
  }
}

run().catch(console.error);
```

The Operator's replica set connection string already carries `replicaSet=rs0`, so the driver handles failover and reconnection without any extra code.

## Python

Use [PyMongo](https://pymongo.readthedocs.io/). Install it with:

```bash
pip install pymongo
```

Example: connect and insert one document.

```python
import os
from pymongo import MongoClient

uri = os.environ["MONGODB_URI"]

client = MongoClient(uri)
try:
    db = client.mydb
    result = db.items.insert_one({"name": "example", "value": 1})
    print("Inserted id:", result.inserted_id)
finally:
    client.close()
```

Use the same URI format as in [Connect your application](connect-from-app.md). For replica set, include `replicaSet=rs0` in the URI; PyMongo will discover members and handle failover.

## Go

Use the [MongoDB Go driver](https://www.mongodb.com/docs/drivers/go/current/). Add the module:

```bash
go get go.mongodb.org/mongo-driver/mongo
```

Example: connect and insert one document.

```go
package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	uri := os.Getenv("MONGODB_URI")

	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal(err)
	}
	defer func() { _ = client.Disconnect(context.Background()) }()

	coll := client.Database("mydb").Collection("items")
	result, err := coll.InsertOne(context.Background(), bson.M{"name": "example", "value": 1})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Inserted id:", result.InsertedID)
}
```

Use the same URI for replica set (with `replicaSet=rs0`); the driver handles replica set discovery and reconnection.

## Keep the URI in an environment variable for the connection string

Do not hardcode the MongoDB URI or credentials in your code. Use environment variables (for example `MONGODB_URI` or `MONGODB_USER` and `MONGODB_PASSWORD`) so you can change them per environment (local, staging, production) without changing code.

Example:

```bash
export MONGODB_URI=$(kubectl get secret <connection-secret-name> -n <namespace> \
  -o jsonpath='{.data.<username>_mongos_connectionString}' | base64 --decode)
```

Taking the value from the Secret rather than typing a URI keeps the host, the replica set name, and the TLS settings correct without you tracking them. Your app reads the variable at startup. In Kubernetes, you can inject it from a [Secret](app-credentials.md#use-the-connection-string-in-your-app) or ConfigMap.

Use a [dedicated application user](app-credentials.md) rather than the database admin account, with only the roles it needs. That limits the damage if the credentials leak.

## Retries and connection pooling

MongoDB drivers support automatic retries and connection pooling. For replica sets, the driver can reconnect and fail over if the primary changes. See your driver’s documentation (for example [Node.js](https://www.mongodb.com/docs/drivers/node/current/fundamentals/connection/), [Python](https://pymongo.readthedocs.io/en/stable/faq.html#connection-pooling), [Go](https://www.mongodb.com/docs/drivers/go/current/fundamentals/connection/)) for options like connection timeouts and retry logic.

## Next steps

[Troubleshoot connection issues :material-arrow-right:](troubleshoot-connection.md){.md-button}
