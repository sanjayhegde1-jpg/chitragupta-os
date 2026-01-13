import { z } from 'zod';

// --- Lead Schema ---
// "Zero Lead Leakage" - Capturing intent and source is critical.
export const LeadSchema = z.object({
  id: z.string().uuid(),
  source: z.enum(['instagram', 'facebook', 'linkedin', 'indiamart', 'tradeindia']),
  phone_e164: z.string().regex(/^\+[1-9]\d{1,14}$/, "Invalid E.164 phone number"),
  status: z.enum(['new', 'negotiating', 'qualified', 'closed_won', 'closed_lost', 'spam']),
  intent: z.string().describe("Classified intent (e.g., 'price_query', 'catalog_request')"),
  urgency: z.enum(['low', 'medium', 'high']).default('medium'),
  last_event_at: z.string().datetime(), // ISO 8601
  metadata: z.record(z.any()).optional(),
});
export type Lead = z.infer<typeof LeadSchema>;

// --- Memory Schema (RAG) ---
// Used by Vector Search to maintain Brand Voice and context.
export const MemorySchema = z.object({
  content: z.string(),
  embedding: z.array(z.number()).describe("Vector embedding of the content"),
  metadata: z.object({
    type: z.enum(['brand_voice', 'past_negotiation', 'inventory_fact']),
    userId: z.string().optional(),
    topics: z.array(z.string()),
    createdAt: z.string().datetime(),
  }),
});
export type Memory = z.infer<typeof MemorySchema>;

// --- Approval Schema (Interrupts) ---
// Human-in-the-Loop governance for high-stakes actions.
export const ApprovalSchema = z.object({
  flowId: z.string(),
  kind: z.enum(['social_post', 'quote_approval', 'whatsapp_reply']),
  payload: z.record(z.any()).describe("The data needing approval (e.g., draft post, price quote)"),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  decision: z.object({
    by: z.string(),
    at: z.string().datetime(),
    reason: z.string().optional(),
  }).optional(),
});
export type Approval = z.infer<typeof ApprovalSchema>;

// --- Outcome MVP Schemas ---
export const SourceEnum = z.enum(['indiamart', 'tradeindia', 'instagram', 'facebook', 'youtube', 'manual']);
export type Source = z.infer<typeof SourceEnum>;

export const EnquirySchema = z.object({
  id: z.string(),
  source: SourceEnum,
  sourceRef: z.string(),
  content: z.string(),
  contact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    username: z.string().optional(),
  }),
  rawPayload: z.record(z.unknown()).optional(),
  leadId: z.string().optional(),
  triaged: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Enquiry = z.infer<typeof EnquirySchema>;

export const LeadStatusV1Enum = z.enum(['new', 'contacted', 'qualified', 'quoted', 'won', 'lost']);
export type LeadStatusV1 = z.infer<typeof LeadStatusV1Enum>;

export const ConsentStatusEnum = z.enum(['unknown', 'opt_in', 'opt_out']);
export type ConsentStatus = z.infer<typeof ConsentStatusEnum>;

export const LeadV1Schema = z.object({
  id: z.string(),
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  source: SourceEnum,
  status: LeadStatusV1Enum,
  whatsappNumber: z.string().optional(),
  consentStatus: ConsentStatusEnum,
  lastContactedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type LeadV1 = z.infer<typeof LeadV1Schema>;

export const MessageSchema = z.object({
  id: z.string(),
  direction: z.enum(['inbound', 'outbound']),
  channel: z.enum(['whatsapp', 'social', 'manual']),
  content: z.string(),
  status: z.enum(['queued', 'sent', 'failed']).optional(),
  createdAt: z.string(),
  metadata: z.record(z.unknown()).optional(),
});
export type Message = z.infer<typeof MessageSchema>;

export const TaskSchema = z.object({
  id: z.string(),
  leadId: z.string(),
  type: z.enum(['follow_up', 'quote', 'catalog']),
  status: z.enum(['open', 'done']),
  dueAt: z.string().optional(),
  createdAt: z.string(),
});
export type Task = z.infer<typeof TaskSchema>;

export const ApprovalV1Schema = z.object({
  id: z.string(),
  kind: z.enum(['whatsapp', 'quote']),
  leadId: z.string(),
  draft: z.record(z.unknown()),
  status: z.enum(['pending', 'approved', 'rejected']),
  createdAt: z.string(),
  decidedAt: z.string().optional(),
  decidedBy: z.string().optional(),
  outcome: z.string().optional(),
});
export type ApprovalV1 = z.infer<typeof ApprovalV1Schema>;

export const CatalogItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  productCode: z.string().optional(),
  price: z.number().optional(),
  assetUrl: z.string().optional(),
  version: z.number(),
  createdAt: z.string(),
});
export type CatalogItem = z.infer<typeof CatalogItemSchema>;

export const QuoteSchema = z.object({
  id: z.string(),
  leadId: z.string(),
  items: z.array(z.record(z.unknown())),
  total: z.number(),
  status: z.enum(['draft', 'approved', 'sent']),
  pdfUrl: z.string().optional(),
  createdAt: z.string(),
});
export type Quote = z.infer<typeof QuoteSchema>;

export const MetricsDailySchema = z.object({
  id: z.string(),
  enquiries: z.number(),
  untriaged: z.number(),
  approvalsPending: z.number(),
  sourceBreakdown: z.record(z.number()),
  funnel: z.record(z.number()),
});
export type MetricsDaily = z.infer<typeof MetricsDailySchema>;
