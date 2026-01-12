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
