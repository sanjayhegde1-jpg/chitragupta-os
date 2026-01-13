import { onFlow } from '@genkit-ai/firebase/functions';
// Interrupt not available in this version. Using async approval pattern.
import { z } from 'zod';
import { generate } from '@genkit-ai/ai';
import { gemini15Pro } from '@genkit-ai/vertexai';
import * as admin from 'firebase-admin';
import { firebaseAuth } from '../lib/auth';

export const socialManager = onFlow(
  {
    name: 'socialManager',
    inputSchema: z.object({ topic: z.string() }),
    outputSchema: z.object({ postContent: z.string(), status: z.string() }),
    authPolicy: firebaseAuth,
  },
  async (input) => {
    const db = admin.firestore();

    // 1. RAG Retrieval (Mocking Vector Search for now as we don't have embeddings fully set up in this snippet)
    // In production: const docs = await retrieve({ retriever: vectorRetriever, query: input.topic, options: { limit: 3 } });
    const memorySnapshot = await db.collection('memories').limit(3).get();
    const brandVoice = memorySnapshot.docs.map(d => d.data().content).join('\n---\n');

    // 2. Draft Content
    const draft = await generate({
      model: gemini15Pro,
      prompt: `You are a Social Media Manager for an Indian SME. 
      Use the following Brand Voice Context:
      ${brandVoice}
      
      Task: Write a LinkedIn post about: "${input.topic}".
      Keep it professional yet engaging.`,
    });
    
    const content = draft.text();

    // 3. Create Approval Request (Async Pattern)
    const approvalId = `apv_${Date.now()}`;
    await db.collection('approvals').doc(approvalId).set({
        id: approvalId,
        type: 'SOCIAL_POST',
        platform: 'LinkedIn',
        content: content,
        status: 'pending',
        createdAt: new Date().toISOString(),
        flowId: 'socialManager' 
    });

    console.log(`[Social] Approval requested: ${approvalId}. Flow exiting.`);

    // 4. Return Pending Status
    return { 
      postContent: content, 
      status: "PENDING_APPROVAL",
      approvalId: approvalId 
    };
  }
);
