# Percona certified images

Following table presents Percona’s certified docker images to be used with the
Percona Operator for Percona Server for MongoDB:

| Image                                          | Digest                                                           |
|:-----------------------------------------------|:-----------------------------------------------------------------|
| percona/percona-server-mongodb-operator:2.0.0 | b60849c110ab166fa004e6cdbb5a2f1ec93b676306fdd9c6d9dbbdb4a6d92331 |
| percona/pmm-client:2.30.0                      | de556410de32a49a8a6bc157536881e2baefc8549a1094d6c2c70242a3c792cb |
| percona/percona-backup-mongodb:1.8.1           | 80aad4f71ee3ce721f019e0409cc5a21c07376169428bbd04b486da3bf515704 |
| percona/percona-server-mongodb:5.0.11-10       | da3713525d76a354435e1ab8fda12a06407e7eca8b8e72b9ac0163a34c8eb735 |
| percona/percona-server-mongodb:5.0.7-6         | 3f4849a17236c3849a513f46caa39fbc6da0414f98d27e080fbe0496fa9e86a2 |
| percona/percona-server-mongodb:5.0.4-3         | 4ac4cff1dac52ea109e9a68a61de44c75b62292bb4676cf8efd1e00000d8adf3 |
| percona/percona-server-mongodb:4.4.16-16       | 402b5e5b08ac73c74a47c72d002251a086f9ad28b0594fbae5c34757b294ce13 |
| percona/percona-server-mongodb:4.4.13-13       | 059c3c9a0360d6823905e39b52bdcaf76c3929c93408c537f139cee835c2bc0f |
| percona/percona-server-mongodb:4.4.10-11       | ea73a506fa02604660e3ef7d452d142a89587bb5daca15d3cc1b539a9b1000c5 |
| percona/percona-server-mongodb:4.4.8-9         | 4d29b3557c949f95009eaccf7a8f56215ac609406d230be87b6eaa072e0c1f69 |
| percona/percona-server-mongodb:4.2.22-22       | da4634df780563e10a547662c58c8ce28fbe5c98e1ac8b42b4f6be87f292e92b |


docker images --no-trunc --format='{{.Repository}}:{{.Tag}}    {{.Digest}}' | grep '2\.0\.0' | grep -vE 'pgbouncer|postgres-ha|pgbackrest-repo'
percona/percona-postgresql-operator:2.0.0    sha256:
percona/percona-postgresql-operator:2.0.0-ppg12-pgbackrest    sha256:ec0ee54b0558c802a11b0dfc1784e1d017e57465dfac6f2a712ed49e1d2a6d77
percona/percona-postgresql-operator:2.0.0-ppg12-pgbadger    sha256:3134cf61e45ac213d60a53c46fad297dbda95bd3063e5f8049df5b818a8de840
percona/percona-postgresql-operator:2.0.0-ppg12-postgres    sha256:be6cb4c8bfe1531b6442e17a78698137ede885f88bb4a34002f2b740582b991a
percona/percona-postgresql-operator:2.0.0-ppg13-pgbackrest    sha256:5b8391f3cd3b821dd5a124058eb8e6f09d3241ee3872ff0c5c2d5374b270e0bd
percona/percona-postgresql-operator:2.0.0-ppg13-pgbadger    sha256:a442f77d8b56392501721f8d47bea436ac6ca9d2af9bbec30e0defaf3f326796
percona/percona-postgresql-operator:2.0.0-ppg13-postgres    sha256:27a7e284a3a1b59673ae38f6dbaac7f8618563facc60b5c0c2adf65348ffbfb3
percona/percona-postgresql-operator:2.0.0-ppg14-pgbackrest    sha256:9bcac75e97204eb78296f4befff555cad1600373ed5fd76576e0401a8c8eb4e6
percona/percona-postgresql-operator:2.0.0-ppg14-pgbadger    sha256:81f22f4b2ae18f14b5748cc06e216bf0e6fc2cdefb406d7f3a4fe042652dd145
percona/percona-postgresql-operator:2.0.0-ppg14-postgres    sha256:bf47531669ab49a26479f46efc78ed42b9393325cfac1b00c3e340987c8869f0











Message ivan.pylypenko




