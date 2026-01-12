import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';

export const socialListenerFlow = defineFlow(
  {
    name: 'socialListener',
    inputSchema: z.object({ event: z.any() }),
    outputSchema: z.void(),
  },
  async (input) => {
    // TODO: Parse webhook payload (Instagram/Facebook/LinkedIn)
    // TODO: Classify intent (Lead vs Spam)
    // TODO: If Lead, inject into CRM and trigger Negotiator
  }
);
