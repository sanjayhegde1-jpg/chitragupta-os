'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { LeadTimeline } from '../../../components/crm/LeadTimeline'; // Correct path

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLead = async () => {
        try {
            const docRef = doc(db, 'leads', params.id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setLead({ id: docSnap.id, ...docSnap.data() });
            }
        } catch (error) {
            console.error("Error fetching lead:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchLead();
  }, [params.id]);

  if (loading) return <div className="p-8">Loading Lead...</div>;
  if (!lead) return <div className="p-8">Lead not found.</div>;

  return (
    <div className="p-8 h-screen bg-slate-100 flex gap-6">
      {/* 1. Context Panel */}
      <div className="w-1/4 bg-white rounded-lg shadow p-6 h-full border border-gray-200">
         <div className="mb-6">
             <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600 mb-4">
                 {lead.name?.charAt(0) || '?'}
             </div>
             <h1 className="text-2xl font-bold text-gray-800">{lead.name}</h1>
             <p className="text-gray-500">{lead.email}</p>
             <p className="text-gray-500">{lead.phone}</p>
         </div>
         
         <div className="mb-6">
             <label className="text-xs font-bold text-gray-400 uppercase">Status</label>
             <p className={`mt-1 font-semibold capitalize ${
                 lead.status === 'won' ? 'text-green-600' : 'text-blue-600'
             }`}>{lead.status}</p>
         </div>

         <div className="mb-6">
             <label className="text-xs font-bold text-gray-400 uppercase">Source</label>
             <p className="mt-1 font-semibold capitalize">{lead.source}</p>
         </div>

         <div>
             <label className="text-xs font-bold text-gray-400 uppercase">AI Notes</label>
             <div className="mt-2 p-3 bg-yellow-50 text-sm text-yellow-800 rounded border border-yellow-100">
                 {lead.notes || "No AI notes generated."}
             </div>
         </div>
      </div>

      {/* 2. Timeline Panel */}
      <div className="flex-1 h-full">
         <LeadTimeline leadId={lead.id} />
      </div>

      {/* 3. Actions Panel */}
      <div className="w-1/4 bg-white rounded-lg shadow p-6 h-full border border-gray-200">
          <h2 className="font-bold text-gray-700 mb-4">Quick Actions</h2>
          <div className="space-y-3">
              <button className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 font-medium">
                  Draft Quote (AI)
              </button>
              <button className="w-full py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium">
                  Send Catalog
              </button>
              <button className="w-full py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium">
                  Create Invoice
              </button>
          </div>

          <hr className="my-6 border-gray-100"/>
          
          <h2 className="font-bold text-gray-700 mb-4">Tools</h2>
          <div className="text-sm text-gray-500">
              <p>Email: Connected</p>
              <p>WhatsApp: Connected</p>
          </div>
      </div>
    </div>
  );
}
