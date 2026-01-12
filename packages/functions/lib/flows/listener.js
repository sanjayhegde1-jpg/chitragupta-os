"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socialListenerFlow = void 0;
const flow_1 = require("@genkit-ai/flow");
const zod_1 = require("zod");
exports.socialListenerFlow = (0, flow_1.defineFlow)({
    name: 'socialListener',
    inputSchema: zod_1.z.object({ event: zod_1.z.any() }),
    outputSchema: zod_1.z.void(),
}, async (input) => {
    // TODO: Parse webhook payload (Instagram/Facebook/LinkedIn)
    // TODO: Classify intent (Lead vs Spam)
    // TODO: If Lead, inject into CRM and trigger Negotiator
});
//# sourceMappingURL=listener.js.map