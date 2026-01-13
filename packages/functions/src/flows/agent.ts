import { onFlow } from '@genkit-ai/firebase/functions';
import { z } from 'zod';
import { firebaseAuth } from '../lib/auth';

export const nextBestAction = onFlow(
  {
    name: 'nextBestAction',
    inputSchema: z.object({
      content: z.string(),
      source: z.string().optional(),
    }),
    outputSchema: z.object({
      intent: z.string(),
      reply: z.string(),
      confidence: z.number(),
      reasons: z.array(z.string()),
    }),
    authPolicy: firebaseAuth,
  },
  async ({ content }) => {
    const lower = content.toLowerCase();
    let intent = 'general';
    let reply = 'Thanks for reaching out. Could you share the product details and quantity?';
    let confidence = 0.4;
    const reasons: string[] = [];

    if (lower.includes('price') || lower.includes('quote') || lower.includes('quotation') || lower.includes('rate')) {
      intent = 'quote';
      reply = 'Thanks for your enquiry. To share a quote, please confirm quantity and specifications.';
      confidence = 0.7;
      reasons.push('Detected pricing intent');
    } else if (lower.includes('catalog') || lower.includes('brochure') || lower.includes('pdf')) {
      intent = 'catalog';
      reply = 'Happy to share the catalog. Please confirm your WhatsApp number and product interest.';
      confidence = 0.65;
      reasons.push('Detected catalog intent');
    } else {
      reasons.push('Default reply due to limited context');
    }

    return { intent, reply, confidence, reasons };
  }
);
