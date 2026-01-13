import { onFlow } from '@genkit-ai/firebase/functions';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { SocialNormalizer } from '../tools/socialNormalizer';
import { firebaseAuth } from '../lib/auth';

export const socialListener = onFlow(
  {
    name: 'socialListener',
    inputSchema: z.object({ event: z.any() }),
    outputSchema: z.void(),
    authPolicy: firebaseAuth,
  },
  async ({ event }) => {
    const db = admin.firestore();
    
    // 1. Normalize
    // Platform detection logic (rudimentary for now)
    const platform = event.object ? 'instagram' : 'manual'; 
    const enquiry = SocialNormalizer.normalize(platform, event);

    console.log(`[Listener] Received event from ${enquiry.source}: ${enquiry.id}`);

    // 2. Spam Filter (Stub)
    if (enquiry.content.toLowerCase().includes('lottery') || enquiry.content.toLowerCase().includes('winner')) {
        console.warn(`[Listener] Spam detected: ${enquiry.id}`);
        // Log screened event
        await db.collection('leads').doc('spam_log').collection('events').add({
            type: 'screened.spam',
            payload: enquiry,
            created_at: new Date().toISOString()
        });
        return;
    }

    // 3. Upsert Lead
    const leadRef = db.collection('leads').doc(enquiry.id);
    await db.runTransaction(async (t) => {
        const doc = await t.get(leadRef);
        if (!doc.exists) {
            t.set(leadRef, {
                id: enquiry.id,
                source: enquiry.source,
                name: enquiry.sender.name || 'Social User',
                status: 'new',
                intent: 'triage_needed',
                last_event_at: enquiry.timestamp,
                unread_count: 1,
                metadata: { original_payload: enquiry.raw_payload }
            });
            
            // Add Message
            const msgRef = leadRef.collection('messages').doc();
            t.set(msgRef, {
                content: enquiry.content,
                direction: 'inbound',
                created_at: enquiry.timestamp,
                source: enquiry.source
            });
        }
    });

    console.log(`[Listener] Processed ${enquiry.id}`);
  }
);
