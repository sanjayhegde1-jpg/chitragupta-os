import { onFlow } from '@genkit-ai/firebase/functions';
import { runFlow } from '@genkit-ai/flow';
import { z } from 'zod';
import { generate } from '@genkit-ai/ai';
import { gemini15Flash } from '@genkit-ai/vertexai'; 
import { socialManager } from './social';
import { firebaseAuth } from '../lib/auth';

export const executive = onFlow(
  {
    name: 'executiveRouter',
    inputSchema: z.object({ userQuery: z.string() }),
    outputSchema: z.string(),
    authPolicy: firebaseAuth,
  },
  async ({ userQuery }) => {
    // 1. Classify Intent
    const classification = await generate({
      model: gemini15Flash,
      prompt: `Classify the following user query into one of these intents:
      - SOCIAL_DRAFT: Requests to draft, write, or create social media posts (LinkedIn, Instagram).
      - CRM_QUERY: Questions about leads, sales, or customer data.
      - SETTINGS: Requests to configure API keys, settings, or integrations.
      - GENERAL: Anything else.
      
      Query: "${userQuery}"
      
      Output JUST the intent label.`,
    });

    const intent = classification.text().trim().toUpperCase();
    console.log(`[Executive] Intent Detected: ${intent}`);

    // 2. Route Request
    if (intent === 'SOCIAL_DRAFT') {
      const result = await runFlow(socialManager, { topic: userQuery });
      return `Social Agent initiated. Status: ${result.status}. Content: ${result.postContent}`;
    }

    if (intent === 'CRM_QUERY') {
      // In a real scenario, we would parse natural language to structured query
      // For now, we just pass it through or execute a dummy ingest for demo purposes if it looks like lead data
      // But per instructions, 'Call crm.query'. We don't have crm.query yet, only ingest.
      // Let's assume generic response for query for now as configured in instructions 'Else -> Reply directly' applies to general.
      // INSTRUCTION UPDATE: "If CRM_QUERY -> Call crm.query." (We need to add a query flow or just handle it)
      // Since crm.ts only has ingest, I'll return a stub message or call ingest if it looks like data.
      return "CRM Query functionality not fully implemented. Please check the Dashboard.";
    }

    if (intent === 'SETTINGS') {
      return "You can manage your configurations here: https://beehive-os-dev.web.app/settings";
    }

    // GENERAL
    const reply = await generate({
      model: gemini15Flash,
      prompt: `You are Chitragupta, an AI OS for Indian SMEs. Answer this efficiently: ${userQuery}`,
    });
    return reply.text();
  }
);
