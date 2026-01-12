import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';
import { generate } from '@genkit-ai/ai';
import { gemini15Flash } from '@genkit-ai/vertexai';
import * as admin from 'firebase-admin';

// Local Zod def strictly adhering to the "glass box" principle where we see the code.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
/**
const LeadSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string().optional(),
  email: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
  source: z.string(),
  notes: z.string().optional(),
  createdAt: z.string(),
});
**/

export const crmIngestFlow = defineFlow(
  {
    name: 'crmIngest',
    inputSchema: z.object({ rawText: z.string(), source: z.string().default('manual') }),
    outputSchema: z.object({ leadId: z.string(), status: z.string(), similarity: z.string().optional() }),
  },
  async ({ rawText, source }) => {
    const db = admin.firestore();

    // 1. Extract Entities (AI)
    const extraction = await generate({
      model: gemini15Flash,
      prompt: `Extract lead information from this text into JSON:
      Text: "${rawText}"
      Fields: name, phone, email, notes.
      Output pure JSON only.`,
    });
    
    // Naive JSON parsing (Production would use structuredOutput schema mode)
    const functionOutput = extraction.text();
    const cleanJson = functionOutput.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanJson);

    // 2. Fuzzy Deduplication
    // Check if phone or email exists
    let existingLead = null;
    if (data.phone) {
        const q = await db.collection('leads').where('phone', '==', data.phone).get();
        if (!q.empty) existingLead = q.docs[0];
    }

    if (existingLead) {
        console.log(`[CRM] Duplicate detected: ${existingLead.id}`);
        return { leadId: existingLead.id, status: 'duplicate', similarity: 'high' };
    }

    // 3. Ingest
    const newLead = {
        id: `lead_${Date.now()}`,
        name: data.name || 'Unknown Lead',
        phone: data.phone,
        email: data.email,
        status: 'new',
        source: source,
        notes: data.notes,
        createdAt: new Date().toISOString()
    };

    await db.collection('leads').doc(newLead.id).set(newLead);
    console.log(`[CRM] New Lead Ingested: ${newLead.id}`);

    return { leadId: newLead.id, status: 'ingested' };
  }
);
