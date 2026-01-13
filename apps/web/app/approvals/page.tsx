'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

type ApprovalItem = {
  id: string;
  type?: string;
  platform?: string;
  content?: string;
};

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);

  useEffect(() => {
    // Listen for pending approvals
    // NOTE: This assumes 'approvals' collection is populated.
    // If using Genkit Flows natively, we might need a custom tool to expose this state.
    const q = query(collection(db, 'approvals'), where('status', '==', 'pending'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setApprovals(
        snapshot.docs.map((doc) => {
          const data = doc.data() as Partial<ApprovalItem>;
          return { id: doc.id, ...data };
        })
      );
    });

    return () => unsubscribe();
  }, []);

  const handleDecision = async (id: string, decision: 'approve' | 'reject') => {
      // TODO: Call approval.resolve flow or update Firestore
      console.log(`Decision for ${id}: ${decision}`);
      alert("Approval logic requires backend trigger connection. (Implemented in Phase L)");
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Pending Approvals</h1>
      <div className="border border-yellow-200 bg-yellow-50 p-4 rounded mb-6">
        <h3 className="font-bold text-yellow-800">Governance Mode Active</h3>
        <p className="text-yellow-700">All high-stakes actions require manual confirmation.</p>
      </div>
      
      <div className="space-y-4">
        {approvals.length === 0 && (
            <p className="text-gray-500">No pending approvals.</p>
        )}

        {approvals.map((item) => (
             <div key={item.id} className="bg-white p-6 rounded shadow border-l-4 border-blue-500 flex justify-between items-center">
             <div>
               <h3 className="font-semibold text-lg">{item.type || 'Action Request'}</h3>
               <p className="text-gray-600">Context: {item.platform}</p>
               <div className="mt-2 p-3 bg-gray-50 rounded text-sm italic border">
                   &quot;{item.content}&quot;
               </div>
             </div>
             <div className="space-x-4 flex">
               <button 
                onClick={() => handleDecision(item.id, 'reject')}
                className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
               >
                   Reject
               </button>
               <button 
                onClick={() => handleDecision(item.id, 'approve')}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 shadow"
               >
                   Approve & Publish
               </button>
             </div>
           </div>
        ))}

        {/* Mock item for visual verification since DB might be empty */}
         <div className="bg-gray-50 opacity-50 p-6 rounded border-2 border-dashed border-gray-300 flex justify-between items-center">
           <div>
             <h3 className="font-semibold text-lg text-gray-500">[Example Prototype Item]</h3>
             <p className="text-gray-500">Platform: LinkedIn</p>
           </div>
           <div className="space-x-4">
             <button disabled className="px-4 py-2 bg-gray-200 text-gray-400 rounded">Reject</button>
             <button disabled className="px-4 py-2 bg-gray-300 text-gray-500 rounded">Approve</button>
           </div>
         </div>
      </div>
    </div>
  );
}
