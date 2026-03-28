# HubSpot → DMS Lead Sync — Integration Plan

## Goal
When a HubSpot lead is qualified and converted, automatically (or on-demand) create a DMS Client record so intake staff don't re-enter data.

---

## Schema Changes (already applied)

Three optional fields added to the `Client` model — all nullable, no migration impact on existing rows:

| Field | Type | Purpose |
|---|---|---|
| `hubspotContactId` | `String? @unique` | HubSpot Contact record ID; unique index prevents duplicate clients |
| `hubspotDealId` | `String?` | HubSpot Deal ID at time of conversion (for audit trail) |
| `hubspotSyncedAt` | `DateTime?` | Timestamp of last successful sync |

---

## Architecture

```
src/lib/integrations/hubspot/
  types.ts   — HubSpotContact, HubSpotDeal, LeadConversionPayload
  client.ts  — thin fetch wrapper around HubSpot CRM API v3
  sync.ts    — convertLeadToClient() — idempotent conversion logic
```

**Why here?** Keeps integration logic isolated from core app actions. Easy to delete or swap without touching `src/lib/actions/`.

---

## Future Entry Points

Two recommended triggers for `convertLeadToClient()`:

### A. Webhook (preferred)
- Register a HubSpot workflow that POSTs to `/api/integrations/hubspot/webhook` on deal stage change (e.g., stage → "Contract Sent").
- Create `src/app/api/integrations/hubspot/webhook/route.ts`.
- Verify `X-HubSpot-Signature` header before processing.

### B. Manual conversion button
- On a future "Leads" page (or via a DMS admin action), staff clicks "Import from HubSpot" and provides a Contact ID.
- Calls `convertLeadToClient()` directly via a Server Action.

---

## Lead Conversion Workflow

```
HubSpot deal reaches target stage
       │
       ▼
Webhook POST → /api/integrations/hubspot/webhook
       │
       ├─ Verify signature
       ├─ Fetch Contact (+ Deal) via hubspot/client.ts
       ├─ Call convertLeadToClient()
       │     ├─ Guard: hubspotContactId unique → skip if duplicate
       │     └─ prisma.client.create(...)
       └─ Return 200
             │
             ▼
       DMS Client created (status: ONBOARDING)
       Handler assigned (auto or manual)
             │
             ▼
       Intake staff adds DebtAccounts, uploads docs
```

---

## Required Env Vars

```
HUBSPOT_ACCESS_TOKEN=         # Private App token (not OAuth for MVP)
HUBSPOT_WEBHOOK_SECRET=       # For signature verification
```

---

## What Is NOT in Scope (MVP)

- Two-way sync (DMS → HubSpot status updates)
- Automatic DebtAccount creation from HubSpot Deal line items
- Bulk backfill of historical leads
- OAuth flow (use Private App token for simplicity)

---

## Migration

Run after merging schema changes:

```bash
npx prisma migrate dev --name add_hubspot_sync_fields
```

No data changes — existing clients get `NULL` in all three new columns.
