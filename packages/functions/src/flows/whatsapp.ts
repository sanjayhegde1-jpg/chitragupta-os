import { onFlow } from '@genkit-ai/firebase/functions';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { firebaseAuth } from '../lib/auth';

// Mock WhatsApp API
export const whatsappSendTemplate = onFlow(
  {
    name: 'whatsappSendTemplate',
    inputSchema: z.object({
        leadId: z.string(),
        templateName: z.string(),
        language: z.string().default('en_US'),
        variables: z.record(z.string()).optional()
    }),
    outputSchema: z.object({ success: z.boolean(), messageId: z.string().optional(), error: z.string().optional() }),
    authPolicy: firebaseAuth,
  },
  async ({ leadId, templateName, language, variables }) => {
    const db = admin.firestore();
    
    // 1. Fetch Lead
    const leadSnap = await db.collection('leads').doc(leadId).get();
    if (!leadSnap.exists) {
        return { success: false, error: "Lead not found" };
    }
    const lead = leadSnap.data();
    const phone = lead?.phone;

    if (!phone) {
         return { success: false, error: "Lead has no phone number" };
    }

    console.log(`[WhatsApp] Sending template '${templateName}' to ${phone} (${leadId}) with vars:`, variables);

    // 2. Mock API Call
    // Simulate latency
    await new Promise(r => setTimeout(r, 500));
    
    const messageId = `wam_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // 3. Log to History
    try {
        await db.collection('leads').doc(leadId).collection('messages').add({
            content: `[TEMPLATE: ${templateName}]`, // Placeholder content
            type: 'template',
            direction: 'outbound',
            status: 'sent',
            metadata: {
                templateName,
                variables,
                integration_id: messageId
            },
            created_at: new Date().toISOString(),
            source: 'whatsapp'
        });
    } catch (e) {
        console.error("Failed to log message:", e);
        // Don't fail the flow if just logging fails, but vital for history
    }

    return { success: true, messageId };
  }
);
