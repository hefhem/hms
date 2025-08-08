# Hospital Management Software (HMS) — Starter Monorepo

This repository is a scaffold generated from a comprehensive blueprint to build a full-featured, multi-tenant Hospital Management System using **.NET Core**, **Angular**, **PostgreSQL/SQL Server**, **Redis**, **RabbitMQ**, **Docker/K8s**, **OpenTelemetry**, and **Keycloak/ASP.NET Identity**.

## Structure
- `backend/` — ASP.NET Core services (modular)
- `frontend/` — Angular apps (admin, staff, patient portal)
- `docs/` — Architecture, ADRs, workflows
- `ops/` — Docker, K8s, Terraform, GitHub Actions
- `postman/` — Postman collections & environment
- `tests/` — Load tests (k6) and E2E placeholders
- `scripts/` — Utilities (seed, local dev)

## Quickstart (dev docker-compose)
```bash
docker compose -f ops/docker/docker-compose.dev.yml up -d
# When backend is implemented:
# open http://localhost:8080/swagger
# open http://localhost:4200 (admin app)
```
