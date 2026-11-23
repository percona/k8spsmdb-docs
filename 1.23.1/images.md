> For the complete documentation index, see [llms.txt](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/llms.txt).

# Percona certified images

This page lists Percona’s certified Docker images that you can use with Percona Operator for MongoDB.

To find images for a specific Operator version, see [Retrieve Percona certified images](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/image-query.html).

Starting with version 1.24.0, a release also has security-build tags. See [Operator security builds](https://docs.percona.com/percona-operator-for-mongodb/1.23.1/security-builds.html).

**Images released with the Operator version 1.23.1**:

| Image                                                  | Digest                                                           |
| ------------------------------------------------------ | ---------------------------------------------------------------- |
| percona/percona-server-mongodb:8.0.32-14               | 47b05b6624421b7b417d2324da59db7e5fc74d544c15ede4fe8877b6d4e79ff8 |
| percona/percona-server-mongodb:8.0.32-14 (ARM64)       | 2cef2f3fa8a26fe1aa5ce1eb51381f92d1caedc3781b5d474b320d52d4096114 |
| percona/percona-server-mongodb:7.0.43-23               | dc817d4892f0045136745d0988601b6ff0a7bbe50c76110c353920819c720c71 |
| percona/percona-server-mongodb:7.0.43-23 (ARM64)       | 316a9311998523cf0ace036d4a455188535c00629987843fc93c3e244af40a98 |
| percona/percona-server-mongodb:6.0.29-23               | cf9254f6d05f7f64b6295a7d96c6b4591d02e521a68488cb99eb54f9720714c1 |
| percona/percona-server-mongodb:6.0.29-23 (ARM64)       | 62fbdebb132307ced293ad30eeb597e7f4f7f9bf05ccc222a436c7f2b71d5cbc |
| percona/fluentbit:5.1.2-1                              | aff34602ff0e94115943d2a3c9888d167c415ca4f46ea0a41811e057901de632 |
| percona/fluentbit:5.1.2-1 (ARM64)                      | 690b3ce2fac56a2d112fc8c3b40945f2c72ae3f7a43622fb083cbc6e839cf1d6 |
| percona/pmm-client:3.9.1                               | 6b4309035f1fc4c0dcb6b7374ac7a01526319374a071759282a21eb016f754bf |
| percona/pmm-client:3.9.1 (ARM64)                       | ab419b7e10cd81fa44dd198e4a10c44dc056e87ea73fd836a66b6a2356bc4efc |
| percona/pmm-client:2.44.1-1                            | 52a8fb5e8f912eef1ff8a117ea323c401e278908ce29928dafc23fac1db4f1e3 |
| percona/pmm-client:2.44.1-1 (ARM64)                    | 390bfd12f981e8b3890550c4927a3ece071377065e001894458047602c744e3b |
| percona/percona-backup-mongodb:2.15.0                  | 2c69ec2dbd5be02df31577869df97c72781bf6fe6456471e8087b0e03136f672 |
| percona/percona-backup-mongodb:2.15.0 (ARM64)          | 188c38f60e54b9864e74e346209c0a924b6c8b0829062a31d44a5abb42626703 |
| percona/percona-server-mongodb-operator:1.23.1         | cdb60f9b30c5126602c5fddfb9e8af3523022580dc1ad8760c6ff7c55227f385 |
| percona/percona-server-mongodb-operator:1.23.1 (ARM64) | 21dd29afd7ac3a9311988823ff80d7ef25057163cc1a1ad875d8f5589535d33a |

## Image tag format

Image tags have the format:

`[component_name]-[component_version]`

where:

- `component_name` is the name of the component. For example, `percona-server-mongodb`
- `component_version` is the version of the component. For example, `8.0.4-1`.

Note, that PMM Client images have their own tags. They contain the version of PMM.

[Find images for previous versions](https://docs.percona.com/legacy-documentation/)
