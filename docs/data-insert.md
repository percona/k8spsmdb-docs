# 3. Insert sample data 

In this tutorial you will learn to insert sample data to Percona Server for MongoDB.

MongoDB provides [multiple methods for data insert  :octicons-link-external-16:](https://www.mongodb.com/docs/v7.0/reference/insert-methods/). We will use a `For` loop to insert some sample documents.
{.power-number}

1. Run the following command: 

    ``` {.javascript data-prompt="admin>"}
    admin> for (var i = 1; i <= 50; i++) {
       db.test.insertOne( { x : i } )
    }
    ```

    If there is no `test` collection created, MongoDB creates when inserting documents.

    ??? example "Output"

        ```{.json .no-copy}
        {
          acknowledged: true,
          insertedId: ObjectId("652567e5eedca48f97e1868f")
        }
        ```

2. Query the collection to verify the data insertion

    ``` {.javascript data-prompt="admin>"}
    admin> db.test.find()
    ```

    ??? example "Output"

        ```{.json .no-copy}
        [
          { _id: ObjectId("652567e4eedca48f97e1865e"), x: 1 },
          { _id: ObjectId("652567e4eedca48f97e1865f"), x: 2 },
          { _id: ObjectId("652567e4eedca48f97e18660"), x: 3 },
          { _id: ObjectId("652567e4eedca48f97e18661"), x: 4 },
          { _id: ObjectId("652567e4eedca48f97e18662"), x: 5 },
          { _id: ObjectId("652567e4eedca48f97e18663"), x: 6 },
          { _id: ObjectId("652567e4eedca48f97e18664"), x: 7 },
          { _id: ObjectId("652567e4eedca48f97e18665"), x: 8 },
          { _id: ObjectId("652567e4eedca48f97e18666"), x: 9 },
          { _id: ObjectId("652567e4eedca48f97e18667"), x: 10 },
          { _id: ObjectId("652567e4eedca48f97e18668"), x: 11 },
          { _id: ObjectId("652567e4eedca48f97e18669"), x: 12 },
          { _id: ObjectId("652567e4eedca48f97e1866a"), x: 13 },
          { _id: ObjectId("652567e4eedca48f97e1866b"), x: 14 },
          { _id: ObjectId("652567e4eedca48f97e1866c"), x: 15 },
          { _id: ObjectId("652567e4eedca48f97e1866d"), x: 16 },
          { _id: ObjectId("652567e4eedca48f97e1866e"), x: 17 },
          { _id: ObjectId("652567e4eedca48f97e1866f"), x: 18 },
          { _id: ObjectId("652567e4eedca48f97e18670"), x: 19 },
          { _id: ObjectId("652567e4eedca48f97e18671"), x: 20 }
        ]
        ```

        You will have different `_id` values.

Now your cluster has some data in it.

## Next steps

[Make a backup :material-arrow-right:](backup-tutorial.md){.md-button}   
