'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../lib/firebase';

type ApprovalItem = {
  id: string;
  kind?: string;
  leadId?: string;
  status?: string;
  draft?: {
    message?: string;
  };
  type?: string;
  platform?: string;
  content?: string;
};

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'approvals'), where('status', '==', 'pending'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setApprovals(snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as ApprovalItem) })));
    });

    return () => unsubscribe();
  }, []);

  const handleDecision = async (item: ApprovalItem, decision: 'approved' | 'rejected') => {
    setStatus('Processing...');
    try {
      if (item.kind === 'whatsapp') {
        const approve = httpsCallable(functions, 'approveWhatsappDraft');
        await approve({ approvalId: item.id, decision });
      } else if (item.kind === 'quote') {
        const approve = httpsCallable(functions, 'approveQuoteDraft');
        await approve({ approvalId: item.id, decision });
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
