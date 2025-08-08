# ADR 0001 — Non-Functional Requirements

- Security/Compliance: HIPAA/GDPR aligned; PHI encryption in transit and at rest
- Performance Targets: P95 read < 250 ms; P95 write < 600 ms
- Availability: 99.9% (RPO ≤ 5m, RTO ≤ 30m)
- Interoperability: FHIR R4 (core resources), HL7 v2 for legacy LIS/RIS
- Observability: Central logs + traces + metrics; dashboards and alerts
