import { onFlow } from '@genkit-ai/firebase/functions';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { getIntegrationConfig } from '../lib/config';
import { IndiaMartClient } from '../tools/indiaMartClient';
import { firebaseAuth } from '../lib/auth';

export const indiamartPoller = onFlow(
  {
    name: 'indiamartPoller',
    inputSchema: z.void(),
    outputSchema: z.object({ newLeads: z.number(), errors: z.array(z.string()) }),
    authPolicy: firebaseAuth,
  },
  async () => {
    const db = admin.firestore();
    const apiKey = await getIntegrationConfig('INDIAMART_API_KEY');
    
    if (!apiKey) {
        console.error("IndiaMART API config missing.");
        return { newLeads: 0, errors: ["Missing INDIAMART_API_KEY"] };
    }

    const client = new IndiaMartClient(apiKey);
    const cursorRef = db.collection('ingestion_cursors').doc('indiamart');
    
    // 1. Get Cursor
    const cursorSnap = await cursorRef.get();
    const lastFetch = cursorSnap.exists ? cursorSnap.data()?.cursor : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Default 24h ago
    const now = new Date().toISOString();

    console.log(`[IndiaMART] Polling window: ${lastFetch} -> ${now}`);

    try {
        // 2. Fetch
        const enquiries = await client.fetchLeads(lastFetch, now);
        
        let added = 0;
        const errors: string[] = [];

        // 3. Upsert
        for (const enquiry of enquiries) {
            try {
                // Upsert logic: check existing to avoid overwrite of processed logic
                // For now, simpler set({ merge: true }) for basic fields, but respecting existing status
                const leadRef = db.collection('leads').doc(enquiry.id);
                
                await db.runTransaction(async (t) => {
                    const doc = await t.get(leadRef);
                    
                    if (!doc.exists) {
                        t.set(leadRef, {
                            id: enquiry.id,
                            source: 'indiamart',
                            phone: enquiry.sender.phone,
                            email: enquiry.sender.email,
                            name: enquiry.sender.name,
                            status: 'new',
                            intent: 'inquiry',
                            last_event_at: enquiry.timestamp,
                            unread_count: 1,
                            metadata: { indiamart_payload: enquiry.raw_payload }
                        });
                        // Add message
                        const msgRef = leadRef.collection('messages').doc();
                        t.set(msgRef, {
                            content: enquiry.content,
                            direction: 'inbound',
                            created_at: enquiry.timestamp,
                            source: 'indiamart'
                        });
                        added++;
                    } else {
                        // Already exists, maybe just update last_event_at if this is a new message? 
                        // IndiaMART leads typically come as one-offs.
                        // We will skip strict update for now to avoid overwriting existing work.
                        console.log(`[IndiaMART] Lead ${enquiry.id} already exists. Skipping.`);
                    }
                });

            } catch (e: any) {
                console.error(`[IndiaMART] Failed to process lead ${enquiry.id}:`, e);
                errors.push(e.message);
            }
        }

        // 4. Update Cursor
        if (enquiries.length > 0 || lastFetch !== now) {
           await cursorRef.set({ cursor: now, updated_at: now }, { merge: true });
        }

        return { newLeads: added, errors };

    } catch (apiError: any) {
        return { newLeads: 0, errors: [apiError.message] };
    }
  }
);
