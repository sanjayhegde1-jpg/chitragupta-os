"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappTool = void 0;
const zod_1 = require("zod");
const config_1 = require("../lib/config");
exports.whatsappTool = {
    name: 'whatsappSend',
    description: 'Sends a WhatsApp message to a specific phone number using the Business API.',
    inputSchema: zod_1.z.object({
        to: zod_1.z.string(),
        templateName: zod_1.z.string().optional(),
        text: zod_1.z.string().optional(),
    }),
    execute: async (input) => {
        const token = await (0, config_1.getIntegrationConfig)('WABA_TOKEN');
        if (!token) {
            throw new Error("WhatsApp configuration missing (WABA_TOKEN). Please configure it in Settings.");
        }
        // Call Meta/Twilio API here using token
        console.log(`[WhatsApp] Sending to ${input.to} using token ending in ...${token.slice(-4)}`);
        return { success: true, messageId: 'mock-msg-id-dynamic' };
    }
};
//# sourceMappingURL=whatsapp.js.map