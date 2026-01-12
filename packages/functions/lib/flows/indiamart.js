"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.indiamartPollerFlow = void 0;
const flow_1 = require("@genkit-ai/flow");
const zod_1 = require("zod");
const config_1 = require("../lib/config");
exports.indiamartPollerFlow = (0, flow_1.defineFlow)({
    name: 'indiamartPoller',
    inputSchema: zod_1.z.void(),
    outputSchema: zod_1.z.object({ newLeads: zod_1.z.number(), errors: zod_1.z.array(zod_1.z.string()) }),
}, async () => {
    const apiKey = await (0, config_1.getIntegrationConfig)('INDIAMART_API_KEY');
    if (!apiKey) {
        console.error("IndiaMART API config missing.");
        return { newLeads: 0, errors: ["Missing INDIAMART_API_KEY"] };
    }
    // TODO: Connect to IndiaMART CRM API
    // 1. Fetch latest leads since last cursor
    // 2. Upsert to Firestore
    // 3. Update cursor
    console.log(`[IndiaMART] Polling with key ending in ...${apiKey.slice(-4)}`);
    return { newLeads: 0, errors: [] };
});
//# sourceMappingURL=indiamart.js.map