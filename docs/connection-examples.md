# Connection examples

Use the same connection URI from [Connect your application](connect-from-app.md) in your code. The examples below show how to connect and run a simple operation with the official MongoDB drivers for Node.js, Python, and Go. Replace the URI with your own (host, username, password, and options such as `ssl=false` or `replicaSet=rs0` as needed).

## Node.js

Use the [MongoDB Node.js driver](https://www.mongodb.com/docs/drivers/node/current/). Install it with:

```bash
npm install mongodb
```

Example: connect and insert one document.

```javascript
const { MongoClient } = require("mongodb");

const uri = "mongodb://myuser:mypassword@my-cluster-name-mongos.default.svc.cluster.local/admin?ssl=false";

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

For replica set URI use the same pattern with a URI like `mongodb://...@my-cluster-name-rs0.<namespace>.svc.cluster.local/admin?replicaSet=rs0&ssl=false`. The driver handles failover and reconnection when you use a replica set URI.

## Python

Use [PyMongo](https://pymongo.readthedocs.io/). Install it with:

```bash
pip install pymongo
```

Example: connect and insert one document.

```python
from pymongo import MongoClient

uri = "mongodb://myuser:mypassword@my-cluster-name-mongos.default.svc.cluster.local/admin?ssl=false"

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

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	uri := "mongodb://myuser:mypassword@my-cluster-name-mongos.default.svc.cluster.local/admin?ssl=false"

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

## Next steps

* Build your URI from [Connect your application](connect-from-app.md).
* For a dedicated app user and credentials, see [Get credentials for your app](app-credentials.md).
* If your app runs outside the cluster, see [Connect from your laptop or CI](connect-from-outside.md).
* For configuration tips, see [App configuration](app-configuration.md).
