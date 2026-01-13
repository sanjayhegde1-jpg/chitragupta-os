# Merge Summary - Outcome MVP

## Pages
- /inbox: Unified inbox with untriaged queue, SLA badges, filters (source + SLA), CSV import (IndiaMART/TradeIndia), and manual social intake; creates enquiries, leads, messages, and follow-up tasks.
- /approvals: Director approval queue for WhatsApp and quote drafts; approve/reject with decidedBy/decidedAt logged and outcomes written.
- /lead/[id]: Lead detail with timeline, WhatsApp consent capture, WhatsApp draft, and quote draft actions.
- /catalog: Director-only catalog upload for assets + metadata stored in Firestore/Storage.
- /dashboard: Director dashboard tiles for SLA, approvals pending, source breakdown, and funnel counts.

## Data model (Firestore)
- enquiries: id, source, sourceRef, content, contact{ name, phone, email, username }, rawPayload?, leadId, triaged, createdAt, updatedAt
- leads: id, name, phone, email, source, status, whatsappNumber, consentStatus, lastContactedAt, createdAt, updatedAt
- leads/{leadId}/messages: id, direction, channel, content, status?, createdAt, metadata?
- approvals: id, kind, leadId, draft, status, createdAt, decidedAt?, decidedBy?, outcome?
- catalog_items: id, title, productCode?, price?, assetUrl?, version, createdAt
- quotes: id, leadId, items, total, status, pdfUrl?, createdAt
- tasks: id, leadId, type, status, dueAt?, createdAt
- metrics_daily: id, enquiries, untriaged, approvalsPending, sourceBreakdown, funnel

## Production-ready vs stubbed
- Production-ready: inbox intake, approvals with audit metadata, quotes with approval gate, catalog uploads, dashboard metrics, Firestore security (director claim), WhatsApp rate limits via system_config.
- Stubbed/guarded: WhatsApp provider (mock unless creds provided), external marketplace/social APIs (CSV/manual only).

## Required env vars (names only)
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
- WHATSAPP_ACCESS_TOKEN
- WHATSAPP_PHONE_NUMBER_ID
- DEV_BYPASS_AUTH (emulator-only)

## Local run
```bash
npm.cmd ci
npm.cmd run check:lockfiles
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run dev --workspace web
```

## Deploy
```bash
firebase deploy --only hosting,functions,firestore,storage
```
