# HMS Architecture Blueprint

This document captures the logical architecture, services, cross-cutting concerns, and interoperability approach (FHIR/HL7). See ADRs for decision history.

## Services (initial set)
- Identity & Access
- Master Data
- Patient Registry (ADT)
- Scheduling
- EHR (Encounters, Vitals, Notes, Problems, Diagnoses, Immunizations, Procedures)
- Orders (Lab/Imaging/Medication/Procedure)
- Pharmacy (Medication orders, eMAR)
- Laboratory (LIS)
- Radiology (RIS)
- Billing & Claims
- Inventory & Procurement
- Notifications
- Reports & Analytics

## Cross-Cutting
- Multitenancy, RBAC/ABAC, Audit, Validation, Caching, Rate limiting, API versioning, OpenAPI, Health checks
- Observability: Serilog + OpenTelemetry (traces/metrics) to Grafana/Tempo/Jaeger/Loki
- Eventing via RabbitMQ (see docs/events.md)
