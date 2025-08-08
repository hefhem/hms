# Domain Events (Draft)

- PatientRegistered, EncounterCreated, OrderPlaced, LabResultVerified, ImagingReportFinalized
- MedicationAdministered, InvoiceCreated, PaymentReceived, ClaimSubmitted, StockLevelLow

Each event has a strong-typed contract published on transaction commit and consumed by interested services.
