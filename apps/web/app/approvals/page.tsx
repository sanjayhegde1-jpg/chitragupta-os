'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app, db, functions } from '../../lib/firebase';
import { mockStore } from '../../lib/mockStore';

type ApprovalItem = {
  id: string;
  kind?: string;
  leadId?: string;
  status?: string;
  draft?: {
    message?: string;
    pdfUrl?: string;
  };
  type?: string;
  platform?: string;
  content?: string;
};

export default function ApprovalsPage() {
  const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === 'true';
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [status, setStatus] = useState('');
  const [actor, setActor] = useState('director');

  useEffect(() => {
    if (isTestMode) return;
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      setActor(user.email || user.uid || 'director');
    });
    return () => unsubscribe();
  }, [isTestMode]);

  useEffect(() => {
    if (isTestMode) {
      const update = () => {
        const pending = mockStore.getApprovals().filter((a) => a.status === 'pending');
        setApprovals(pending);
      };
      update();
      return mockStore.subscribe(update);
    }

    const q = query(collection(db, 'approvals'), where('status', '==', 'pending'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setApprovals(snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as ApprovalItem;
        return { ...data, id: docSnap.id };
      }));
    });

    return () => unsubscribe();
  }, [isTestMode]);

  const handleDecision = async (item: ApprovalItem, decision: 'approved' | 'rejected') => {
    setStatus('Processing...');
    try {
      if (isTestMode) {
        mockStore.updateApproval(item.id, decision === 'approved' ? 'approved' : 'rejected', {
          decidedAt: new Date().toISOString(),
          decidedBy: actor,
          outcome: decision,
        });
        if (decision === 'approved') {
          mockStore.addMessage({
            id: `msg_${item.id}`,
            leadId: item.leadId || 'unknown',
            direction: 'outbound',
            channel: 'whatsapp',
            content: item.draft?.message || item.draft?.pdfUrl || 'Approved message',
            createdAt: new Date().toISOString(),
          });
          mockStore.updateLeadStatus(item.leadId || '', item.kind === 'quote' ? 'quoted' : 'contacted');
        }
        setStatus('Done.');
        return;
      }

      if (item.kind === 'whatsapp') {
        const approve = httpsCallable(functions, 'approveWhatsappDraft');
        await approve({ approvalId: item.id, decision, decidedBy: actor });
      } else if (item.kind === 'quote') {
        const approve = httpsCallable(functions, 'approveQuoteDraft');
        await approve({ approvalId: item.id, decision, decidedBy: actor });
      } else {
        console.warn('Unknown approval kind', item.kind);
      }
      setStatus('Done.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setStatus(`Error: ${message}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Pending Approvals</h1>
      <div className="border border-yellow-200 bg-yellow-50 p-4 rounded mb-6">
        <h3 className="font-bold text-yellow-800">Governance Mode Active</h3>
        <p className="text-yellow-700">All high-stakes actions require manual confirmation.</p>
      </div>
      {status && <p className="mb-4 text-sm text-gray-600">{status}</p>}

      <div className="space-y-4">
        {approvals.length === 0 && (
          <p className="text-gray-500">No pending approvals.</p>
        )}

        {approvals.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded shadow border-l-4 border-blue-500 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg">{item.kind || item.type || 'Action Request'}</h3>
              <p className="text-gray-600">Lead: {item.leadId || 'Unknown'}</p>
              <div className="mt-2 p-3 bg-gray-50 rounded text-sm italic border">
                &quot;{item.draft?.message || item.content || item.draft?.pdfUrl || 'No draft'}&quot;
              </div>
            </div>
            <div className="space-x-4 flex">
              <button
                onClick={() => handleDecision(item, 'rejected')}
                className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Reject
              </button>
              <button
                onClick={() => handleDecision(item, 'approved')}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 shadow"
              >
                Approve & Send
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
