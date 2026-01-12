"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crmIngestFlow = void 0;
const flow_1 = require("@genkit-ai/flow");
const zod_1 = require("zod");
const shared_1 = require("@chitragupta/shared");
// Note: We need to ensure @chitragupta/shared is linked or available. 
// For now, assuming local compilation works or we use relative imports if linking fails.
// If relative import is needed: import { LeadSchema } from '../../../shared/src/types'; 
// But let's stick to the mapped name if tsconfig paths are set, or relative for safety now.
exports.crmIngestFlow = (0, flow_1.defineFlow)({
    name: 'crmIngest',
    inputSchema: shared_1.LeadSchema,
    outputSchema: zod_1.z.object({ leadId: zod_1.z.string(), status: zod_1.z.string() }),
}, async (lead) => {
    // TODO: Check Firestore for existing lead by phone/email
    // TODO: Create or Update Lead document
    // TODO: Trigger WhatsApp Negotiator if new
    return { leadId: lead.id, status: 'ingested' };
});
//# sourceMappingURL=crm.js.map