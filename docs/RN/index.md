# Percona Operator for MongoDB Release Notes

- [Percona Operator for MongoDB 1.22.0 ({{date.1_22_0}})](Kubernetes-Operator-for-PSMONGODB-RN1.21.2.md)
- [Percona Operator for MongoDB 1.21.2 ({{date.1_21_2}})](Kubernetes-Operator-for-PSMONGODB-RN1.21.2.md)
- [Percona Operator for MongoDB 1.21.1 ({{date.1_21_1}})](Kubernetes-Operator-for-PSMONGODB-RN1.21.1.md)
- [Percona Operator for MongoDB 1.21.0 ({{date.1_21_0}})](Kubernetes-Operator-for-PSMONGODB-RN1.21.0.md)
- [Percona Operator for MongoDB 1.20.1 ({{date.1_20_1}})](Kubernetes-Operator-for-PSMONGODB-RN1.20.1.md)
- [Percona Operator for MongoDB 1.20.0 ({{date.1_20_0}})](Kubernetes-Operator-for-PSMONGODB-RN1.20.0.md)
- [Percona Operator for MongoDB 1.19.1 (2025-02-20)](Kubernetes-Operator-for-PSMONGODB-RN1.19.1.md)
- [Percona Operator for MongoDB 1.19.0 (2025-01-21)](Kubernetes-Operator-for-PSMONGODB-RN1.19.0.md)
- [Percona Operator for MongoDB 1.18.0 (2024-11-14)](Kubernetes-Operator-for-PSMONGODB-RN1.18.0.md)Vault integration for system user password management
  You can now integrate the Operator with HashiCorp Vault for system user password management. This allows organizations to centralize password management while keeping the Operator responsible for applying those passwords to the database.
  When this integration is enabled, the Operator authenticates to Vault using either the Kubernetes authentication method or a Vault token. It retrieves system user passwords during cluster creation and generates the corresponding Kubernetes Secret from this data. The Operator periodically checks Vault for password changes and updates the Secret when differences are detected. If Vault is temporarily unavailable or the Operator cannot retrieve the passwords, it logs the event and continues cluster reconciliation to ensure the cluster availability.
  Organizations benefit from this integration when they need:
  ·       Centralized credential governance
  ·       Auditable password rotation
  ·       Compliance with internal security policies
  ·       Separation of duties (DBA vs. security team)
  ·       Consistent password lifecycle management across environments
  Vault becomes the single source of truth, while the Operator ensures Percona Server for MongoDB always uses the correct credentials.
- [Percona Operator for MongoDB 1.17.0 (2024-09-09)](Kubernetes-Operator-for-PSMONGODB-RN1.17.0.md)
- [Percona Operator for MongoDB 1.16.2 (2024-07-23)](Kubernetes-Operator-for-PSMONGODB-RN1.16.2.md)
- [Percona Operator for MongoDB 1.16.1 (2024-06-24)](Kubernetes-Operator-for-PSMONGODB-RN1.16.1.md)
- [Percona Operator for MongoDB 1.16.0 (2024-05-24)](Kubernetes-Operator-for-PSMONGODB-RN1.16.0.md)
- [Percona Operator for MongoDB 1.15.0 (2023-10-09)](Kubernetes-Operator-for-PSMONGODB-RN1.15.0.md)
- [Percona Operator for MongoDB 1.14.0 (2023-03-13)](Kubernetes-Operator-for-PSMONGODB-RN1.14.0.md)
- [Percona Operator for MongoDB 1.13.0 (2022-09-08)](Kubernetes-Operator-for-PSMONGODB-RN1.13.0.md)
- [Percona Operator for MongoDB 1.12.0 (2022-05-05)](Kubernetes-Operator-for-PSMONGODB-RN1.12.0.md)
- *[Percona Distribution for MongoDB Operator* 1.11.0 (2021-12-21)](Kubernetes-Operator-for-PSMONGODB-RN1.11.0.md)
- *[Percona Distribution for MongoDB Operator* 1.10.0 (2021-09-30)](Kubernetes-Operator-for-PSMONGODB-RN1.10.0.md)
- *[Percona Distribution for MongoDB Operator* 1.9.0 (2021-07-29)](Kubernetes-Operator-for-PSMONGODB-RN1.9.0.md)
- *[Percona Kubernetes Operator for Percona Server for MongoDB* 1.8.0 (2021-05-06)](Kubernetes-Operator-for-PSMONGODB-RN1.8.0.md)
- *[Percona Kubernetes Operator for Percona Server for MongoDB* 1.7.0 (2021-03-08)](Kubernetes-Operator-for-PSMONGODB-RN1.7.0.md)
- *[Percona Kubernetes Operator for Percona Server for MongoDB* 1.6.0 (2020-12-22)](Kubernetes-Operator-for-PSMONGODB-RN1.6.0.md)
- *[Percona Kubernetes Operator for Percona Server for MongoDB* 1.5.0 (2020-09-07)](Kubernetes-Operator-for-PSMONGODB-RN1.5.0.md)
- *[Percona Kubernetes Operator for Percona Server for MongoDB* 1.4.0 (2020-03-31)](Kubernetes-Operator-for-PSMONGODB-RN1.4.0.md)
- *[Percona Kubernetes Operator for Percona Server for MongoDB* 1.3.0 (2019-12-11)](Kubernetes-Operator-for-PSMONGODB-RN1.3.0.md)
- *[Percona Kubernetes Operator for Percona Server for MongoDB* 1.2.0 (2019-09-20)](Kubernetes-Operator-for-PSMONGODB-RN1.2.0.md)
- *[Percona Kubernetes Operator for Percona Server for MongoDB* 1.1.0 (2019-07-15)](Kubernetes-Operator-for-PSMONGODB-RN1.1.0.md)
- *[Percona Kubernetes Operator for Percona Server for MongoDB* 1.0.0 (2019-05-29)](Kubernetes-Operator-for-PSMONGODB-RN1.0.0.md)

