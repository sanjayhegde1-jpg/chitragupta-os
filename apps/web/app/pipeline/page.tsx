'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { KanbanColumn } from '../../components/kanban/KanbanColumn';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const COLUMNS = [
  { id: 'new', title: 'New Leads' },
  { id: 'qualified', title: 'Qualified' },
  { id: 'negotiating', title: 'Negotiation' },
  { id: 'won', title: 'Closed Won' },
  { id: 'lost', title: 'Closed Lost' }
];

export default function PipelinePage() {
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    // Subscribe to all leads
    const q = query(collection(db, 'leads'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
       // active.id is the lead ID
       // over.id is the column ID (droppable)
       const leadId = active.id as string;
       const newStatus = over.id as string;

       // Optimistic UI Update (optional, but handling via Firestore snapshot is safer for now)
       try {
           await updateDoc(doc(db, 'leads', leadId), { status: newStatus });
           console.log(`Moved lead ${leadId} to ${newStatus}`);
       } catch (error) {
           console.error("Failed to update status:", error);
       }
    }
  };

  return (
    <div className="p-8 h-screen overflow-x-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Deal Pipeline</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Add Deal</button>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 h-full pb-8 min-w-max">
          {COLUMNS.map((col) => (
            <KanbanColumn 
                key={col.id} 
                id={col.id} 
                title={col.title} 
                leads={leads.filter(l => l.status === col.id)} 
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
