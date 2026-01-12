"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executiveFlow = void 0;
const flow_1 = require("@genkit-ai/flow");
const zod_1 = require("zod");
// import { generate } from '@genkit-ai/googleai';
// import { gemini15Fro } from '@genkit-ai/vertexai'; 
exports.executiveFlow = (0, flow_1.defineFlow)({
    name: 'executiveRouter',
    inputSchema: zod_1.z.object({ request: zod_1.z.string() }),
    outputSchema: zod_1.z.object({
        intent: zod_1.z.enum(['social_post', 'market_research', 'customer_support', 'unknown']),
        confidence: zod_1.z.number()
    }),
}, async (input) => {
    // Basic intent classification stub
    // In a real scenario, this would use a Gemini call to classify the request
    return {
        intent: 'social_post',
        confidence: 0.95
    };
});
//# sourceMappingURL=executive.js.map