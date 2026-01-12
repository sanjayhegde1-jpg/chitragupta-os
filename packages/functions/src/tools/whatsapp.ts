import { z } from 'zod';
import { getIntegrationConfig } from '../lib/config';

export const whatsappTool = {
  name: 'whatsappSend',
  description: 'Sends a WhatsApp message to a specific phone number using the Business API.',
  inputSchema: z.object({
    to: z.string(),
    templateName: z.string().optional(),
    text: z.string().optional(),
  }),
  execute: async (input: { to: string; templateName?: string; text?: string }) => {
    const token = await getIntegrationConfig('WABA_TOKEN');
    
    if (!token) {
      throw new Error("WhatsApp configuration missing (WABA_TOKEN). Please configure it in Settings.");
    }

    // Call Meta/Twilio API here using token
    console.log(`[WhatsApp] Sending to ${input.to} using token ending in ...${token.slice(-4)}`);
    return { success: true, messageId: 'mock-msg-id-dynamic' };
  }
};
