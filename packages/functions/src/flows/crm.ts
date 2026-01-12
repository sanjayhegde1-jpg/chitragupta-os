import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';
import { LeadSchema } from '@chitragupta/shared';
// Note: We need to ensure @chitragupta/shared is linked or available. 
// For now, assuming local compilation works or we use relative imports if linking fails.
// If relative import is needed: import { LeadSchema } from '../../../shared/src/types'; 
// But let's stick to the mapped name if tsconfig paths are set, or relative for safety now.

export const crmIngestFlow = defineFlow(
  {
    name: 'crmIngest',
    inputSchema: LeadSchema,
    outputSchema: z.object({ leadId: z.string(), status: z.string() }),
  },
  async (lead) => {
    // TODO: Check Firestore for existing lead by phone/email
    // TODO: Create or Update Lead document
    // TODO: Trigger WhatsApp Negotiator if new
    return { leadId: lead.id, status: 'ingested' };
  }
);
