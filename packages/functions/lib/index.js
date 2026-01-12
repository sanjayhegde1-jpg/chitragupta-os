"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedData = exports.helloChitragupta = exports.crmIngestFlow = exports.indiamartPollerFlow = exports.executiveFlow = exports.socialListenerFlow = exports.socialManagerFlow = void 0;
const social_1 = require("./flows/social");
Object.defineProperty(exports, "socialManagerFlow", { enumerable: true, get: function () { return social_1.socialManagerFlow; } });
const listener_1 = require("./flows/listener");
Object.defineProperty(exports, "socialListenerFlow", { enumerable: true, get: function () { return listener_1.socialListenerFlow; } });
const executive_1 = require("./flows/executive");
Object.defineProperty(exports, "executiveFlow", { enumerable: true, get: function () { return executive_1.executiveFlow; } });
const indiamart_1 = require("./flows/indiamart");
Object.defineProperty(exports, "indiamartPollerFlow", { enumerable: true, get: function () { return indiamart_1.indiamartPollerFlow; } });
const crm_1 = require("./flows/crm");
Object.defineProperty(exports, "crmIngestFlow", { enumerable: true, get: function () { return crm_1.crmIngestFlow; } });
const v2_1 = require("firebase-functions/v2");
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
(0, v2_1.setGlobalOptions)({ region: 'asia-south1' });
// Ensure Firebase Admin is initialized
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const functions = __importStar(require("firebase-functions"));
exports.helloChitragupta = functions.https.onRequest((request, response) => {
    response.send("Chitragupta OS | Genkit Brain Active");
});
exports.seedData = (0, https_1.onRequest)(async (req, res) => {
    const db = admin.firestore();
    // 1. System Config
    await db.collection('system_config').doc('integrations').set({
        WABA_TOKEN: false,
        INDIAMART_API_KEY: false,
        INSTAGRAM_TOKEN: false,
        _seeded_at: new Date().toISOString()
    }, { merge: true });
    // 2. Test Leads
    const leads = [
        { name: "Ramesh Traders", status: "new", source: "indiamart" },
        { name: "Suresh Engineering", status: "negotiating", source: "whatsapp" },
        { name: "Priya Exports", status: "qualified", source: "linkedin" }
    ];
    for (const lead of leads) {
        await db.collection('leads').add(Object.assign(Object.assign({}, lead), { createdAt: new Date().toISOString() }));
    }
    // 3. Knowledge Base (RAG)
    await db.collection('memories').add({
        content: "Project Chitragupta is an AI Operating System for manufacturing.",
        metadata: {
            type: "brand_voice",
            topics: ["overview", "mission"]
        },
        embedding: [],
        createdAt: new Date().toISOString()
    });
    res.send({ status: "success", message: "Database seeded successfully!" });
});
//# sourceMappingURL=index.js.map