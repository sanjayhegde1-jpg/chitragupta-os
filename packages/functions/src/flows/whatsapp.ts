import { onFlow } from '@genkit-ai/firebase/functions';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { directorAuth } from '../lib/auth';
import { sendWhatsAppMessage } from '../lib/whatsappProvider';
import { updateDailyMetrics } from '../lib/metrics';

const DraftSchema = z.object({
  leadId: z.string(),
  message: z.string(),
});

export const createWhatsappDraft = onFlow(
  {
    name: 'createWhatsappDraft',
    inputSchema: DraftSchema,
    outputSchema: z.object({ approvalId: z.string(), status: z.string() }),
    authPolicy: directorAuth,
  },
  async ({ leadId, message }) => {
    const db = admin.firestore();
    const approvalId = `apv_${Date.now()}`;

    await db.collection('approvals').doc(approvalId).set({
      id: approvalId,
      kind: 'whatsapp',
      leadId,
      draft: { message },
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    await updateDailyMetrics({ approvalsPending: 1 });

    return { approvalId, status: 'PENDING' };
  }
);

export const approveWhatsappDraft = onFlow(
  {
    name: 'approveWhatsappDraft',
    inputSchema: z.object({ approvalId: z.string(), decision: z.enum(['approved', 'rejected']) }),
    outputSchema: z.object({ status: z.string(), messageId: z.string().optional(), error: z.string().optional() }),
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
        {
          status: 'rejected',
          decidedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      await updateDailyMetrics({ approvalsPending: -1 });
      return { status: 'REJECTED' };
    }

    const leadSnap = await db.collection('leads').doc(approval.leadId).get();
    if (!leadSnap.exists) {
      await updateDailyMetrics({ approvalsPending: -1 });
      return { status: 'FAILED', error: 'Lead not found' };
    }

    const lead = leadSnap.data();
    const to = lead?.whatsappNumber || lead?.phone;
    if (!to) {
      await approvalRef.set(
        {
          status: 'rejected',
          decidedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      await updateDailyMetrics({ approvalsPending: -1 });
      return { status: 'FAILED', error: 'No WhatsApp number' };
    }

    if (lead?.consentStatus !== 'opt_in') {
      await approvalRef.set(
        {
          status: 'rejected',
          decidedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      await updateDailyMetrics({ approvalsPending: -1 });
      return { status: 'FAILED', error: 'WhatsApp consent missing' };
    }

    const result = await sendWhatsAppMessage({ to, message: approval.draft?.message || '' });
    if (!result.success) {
      await approvalRef.set(
        {
          status: 'rejected',
          decidedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      await updateDailyMetrics({ approvalsPending: -1 });
      return { status: 'FAILED', error: result.error || 'Send failed' };
    }

    await approvalRef.set(
      {
        status: 'approved',
        decidedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    await updateDailyMetrics({ approvalsPending: -1 });

    const messageRef = db.collection('leads').doc(approval.leadId).collection('messages').doc();
    await messageRef.set({
      id: messageRef.id,
      direction: 'outbound',
      channel: 'whatsapp',
      content: approval.draft?.message || '',
      status: 'sent',
      createdAt: new Date().toISOString(),
      metadata: { provider: result.provider, messageId: result.messageId },
    });

    await db.collection('leads').doc(approval.leadId).set(
      {
        lastContactedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return { status: 'SENT', messageId: result.messageId };
  }
);
