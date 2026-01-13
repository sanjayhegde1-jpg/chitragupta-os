import { onFlow } from '@genkit-ai/firebase/functions';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { directorAuth } from '../lib/auth';
import { sendWhatsAppMessage } from '../lib/whatsappProvider';

const QuoteItemSchema = z.object({
  title: z.string(),
  qty: z.number(),
  price: z.number(),
});

export const createQuoteDraft = onFlow(
  {
    name: 'createQuoteDraft',
    inputSchema: z.object({
      leadId: z.string(),
      items: z.array(QuoteItemSchema),
      total: z.number(),
      pdfUrl: z.string(),
    }),
    outputSchema: z.object({ approvalId: z.string(), quoteId: z.string() }),
    authPolicy: directorAuth,
  },
  async ({ leadId, items, total, pdfUrl }) => {
    const db = admin.firestore();
    const quoteRef = db.collection('quotes').doc();
    const quoteId = quoteRef.id;
    const createdAt = new Date().toISOString();

    await quoteRef.set({
      id: quoteId,
      leadId,
      items,
      total,
      status: 'draft',
      pdfUrl,
      createdAt,
    });

    const approvalId = `apv_${Date.now()}`;
    await db.collection('approvals').doc(approvalId).set({
      id: approvalId,
      kind: 'quote',
      leadId,
      draft: { quoteId, pdfUrl, total },
      status: 'pending',
      createdAt,
    });

    return { approvalId, quoteId };
  }
);

export const approveQuoteDraft = onFlow(
  {
    name: 'approveQuoteDraft',
    inputSchema: z.object({ approvalId: z.string(), decision: z.enum(['approved', 'rejected']) }),
    outputSchema: z.object({ status: z.string(), error: z.string().optional() }),
    authPolicy: directorAuth,
  },
  async ({ approvalId, decision }) => {
    const db = admin.firestore();
    const approvalRef = db.collection('approvals').doc(approvalId);
    const approvalSnap = await approvalRef.get();

    if (!approvalSnap.exists) {
      return { status: 'NOT_FOUND', error: 'Approval not found' };
    }

    const approval = approvalSnap.data();
    if (!approval) {
      return { status: 'NOT_FOUND', error: 'Approval not found' };
    }

    if (decision === 'rejected') {
      await approvalRef.set(
        { status: 'rejected', decidedAt: new Date().toISOString() },
        { merge: true }
      );
      return { status: 'REJECTED' };
    }

    const leadSnap = await db.collection('leads').doc(approval.leadId).get();
    if (!leadSnap.exists) {
      return { status: 'FAILED', error: 'Lead not found' };
    }

    const lead = leadSnap.data();
    const to = lead?.whatsappNumber || lead?.phone;
    if (!to) {
      return { status: 'FAILED', error: 'No WhatsApp number' };
    }
    if (lead?.consentStatus !== 'opt_in') {
      return { status: 'FAILED', error: 'WhatsApp consent missing' };
    }

    const pdfUrl = approval.draft?.pdfUrl || '';
    const message = `Your quotation is ready: ${pdfUrl}`;
    const result = await sendWhatsAppMessage({ to, message });

    if (!result.success) {
      return { status: 'FAILED', error: result.error || 'Send failed' };
    }

    await approvalRef.set(
      { status: 'approved', decidedAt: new Date().toISOString() },
      { merge: true }
    );

    await db.collection('quotes').doc(approval.draft?.quoteId).set(
      { status: 'approved' },
      { merge: true }
    );

    const messageRef = db.collection('leads').doc(approval.leadId).collection('messages').doc();
    await messageRef.set({
      id: messageRef.id,
      direction: 'outbound',
      channel: 'whatsapp',
      content: message,
      status: 'sent',
      createdAt: new Date().toISOString(),
      metadata: { provider: result.provider, messageId: result.messageId },
    });

    return { status: 'SENT' };
  }
);
