# Data Model V1

## Collections
### enquiries
- Raw inbound items (never deleted)
- Fields:
  - id: string (doc id)
  - source: 'indiamart' | 'tradeindia' | 'instagram' | 'facebook' | 'youtube' | 'manual'
  - sourceRef: string (provider id or CSV row id)
  - content: string
  - contact: { name?: string, phone?: string, email?: string, username?: string }
  - leadId?: string
  - triaged: boolean
  - createdAt: string (ISO)
  - updatedAt: string (ISO)

### leads
- Dedupe by phone/email + sourceRef
- Fields:
  - id: string
  - name?: string
  - phone?: string
  - email?: string
  - source: string
  - status: 'new' | 'contacted' | 'qualified' | 'quoted' | 'won' | 'lost'
  - whatsappNumber?: string
  - consentStatus: 'unknown' | 'opt_in' | 'opt_out'
  - lastContactedAt?: string
  - createdAt: string
  - updatedAt: string

### conversations
- Subcollection under leads: leads/{leadId}/messages
- Fields:
  - id: string
  - direction: 'inbound' | 'outbound'
  - channel: 'whatsapp' | 'social' | 'manual'
  - content: string
  - status?: 'queued' | 'sent' | 'failed'
  - createdAt: string
  - metadata?: object

### tasks
- Follow-ups
- Fields:
  - id: string
  - leadId: string
  - type: 'follow_up' | 'quote' | 'catalog'
  - status: 'open' | 'done'
  - dueAt?: string
  - createdAt: string

### approvals
- Drafts awaiting human approval
- Fields:
  - id: string
  - kind: 'whatsapp' | 'quote'
  - leadId: string
  - draft: object
  - status: 'pending' | 'approved' | 'rejected'
  - createdAt: string
  - decidedAt?: string
  - decidedBy?: string

### catalog_items
- Catalog assets + metadata
- Fields:
  - id: string
  - title: string
  - productCode?: string
  - price?: number
  - assetUrl?: string
  - version: number
  - createdAt: string

### quotes
- Generated artifacts
- Fields:
  - id: string
  - leadId: string
  - items: array
  - total: number
  - status: 'draft' | 'approved' | 'sent'
  - pdfUrl?: string
  - createdAt: string

### metrics_daily
- Aggregates
- Fields:
  - id: string (YYYY-MM-DD)
  - enquiries: number
  - untriaged: number
  - approvalsPending: number
  - sourceBreakdown: map
  - funnel: map

## Indexes (expected)
- enquiries: source, triaged, createdAt
- leads: phone, email, updatedAt
- approvals: status, createdAt
