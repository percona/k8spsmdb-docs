# Retrieve Percona certified images

When preparing for the upgrade, you must have the list of compatible images for a specific Operator version and the database version you wish to update to. You can either manually find the images in the [list of certified images](images.md) or you can get this list by querying the **Version Service** server. 

### What is the Version Service?

The **Version Service** is a centralized repository that the Percona Operator for MySQL connects to at scheduled times to get the latest information on compatible versions and valid image paths. This service is a crucial part of the automatic upgrade process, and it is enabled by default. Its landing page, `check.percona.com`, provides more details about the service itself.

### How to query the Version Service

You can manually query the Version Service using the `curl` command. The basic syntax is:

```bash
curl https://check.percona.com/versions/v1/psmdb-operator/<operator-version>/<psmdb-version> | jq -r '.versions[].matrix'
```

where:

* **`<operator-version>`** is the version of the Percona Operator for MongoDB you are using.
* **`<psmdb-version>`** is the version of Percona Server for MongoDB you want to get images for. This part is optional and helps filter the results. It can be a specific Percona Server for MongoDB version (e.g. 8.0.8-3), a recommended version (e.g. 7.0-recommended), or the latest available version (e.g. 8.0-latest).

For example, to retrieve the list of images for the Operator version `1.20.0` and the latest version of Percona Server for MongoDB 8.0, use the following command:

```bash
curl https://check.percona.com/versions/v1/psmdb-operator/1.20.0/8.0-latest |jq -r '.versions[].matrix'
```

??? example "Sample output"

    ```{.text .no-copy}
    {
    "mongod": {
        "8.0.8-3": {
            "imagePath": "percona/percona-server-mongodb:8.0.8-3",
            "imageHash": "e4580ca292f07fd7800e139121aea4b2c1dfa6aa34f3657d25a861883fd3de41",
            "imageHashArm64": "96cfee2102499aba05e63ca7862102c2b1da1cf9f4eea0cbea3793a07c183925",
            "status": "available",
            "critical": false
        }
    },
    "pmm": {
        "2.44.1": {
            "imagePath": "percona/pmm-client:2.44.1",
            "imageHash": "8b2eaddffd626f02a2d5318ffebc0c277fe8457da6083b8cfcada9b6e6168616",
            "imageHashArm64": "337fecd4afdb3f6daf2caa2b341b9fe41d0418a0e4ec76980c7f29be9d08b5ea",
            "status": "recommended",
            "critical": false
        }
    },
    "backup": {
        "2.9.1": {
            "imagePath": "percona/percona-backup-mongodb:2.9.1",
            "imageHash": "976bfbaa548eb70dd90bf0bd2dcfe40b2994d749ef644af3a0590f4856e4d7e2",
            "imageHashArm64": "ebc6e5c5aa3ed97991d3fd90e9201597b485ddc0eae8d7ee4311ecb785c03bf0",
            "status": "recommended",
            "critical": false
        }
    },
    "operator": {
        "1.20.0": {
            "imagePath": "percona/percona-server-mongodb-operator:1.20.0",
            "imageHash": "01da3139b0f7f64a27f3642ca06581ea065a02891b13ce2375d61471011d6dd4",
            "imageHashArm64": "26d885398af42d18928f51f070aff770df900eb5ddf46e3e0bc2570720089bb1",
            "status": "recommended",
            "critical": false
        }
    },
    ```

To narrow down the search and check the Percona Server for MySQL images available for a specific Operator version (`1.20.1` in the following example), use the following command:

```bash
curl -s https://check.percona.com/versions/v1/psmdb-operator/1.20.1 | jq -r '.versions[0].matrix.mongod | to_entries[] | "\(.key)\t\(.value.imagePath)\t\(.value.status)"'
```

??? example "Sample output"
 
    ```{.text .no-copy}
    6.0.15-12	percona/percona-server-mongodb:6.0.15-12	available
    6.0.16-13	percona/percona-server-mongodb:6.0.16-13	available
    6.0.18-15	percona/percona-server-mongodb:6.0.18-15-multi	available
    6.0.19-16	percona/percona-server-mongodb:6.0.19-16-multi	available
    6.0.21-18	percona/percona-server-mongodb:6.0.21-18	recommended
    7.0.12-7	percona/percona-server-mongodb:7.0.12-7	available
    7.0.14-8	percona/percona-server-mongodb:7.0.14-8-multi	available
    7.0.15-9	percona/percona-server-mongodb:7.0.15-9-multi	available
    7.0.18-11	percona/percona-server-mongodb:7.0.18-11	recommended
    8.0.4-1	percona/percona-server-mongodb:8.0.4-1-multi	available
    8.0.8-3	percona/percona-server-mongodb:8.0.8-3	available
    ```