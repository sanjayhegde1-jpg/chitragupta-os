'use client';

import { useDroppable } from '@dnd-kit/core';
import { LeadCard } from './LeadCard';

export function KanbanColumn({ id, title, leads }: { id: string, title: string, leads: any[] }) {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div ref={setNodeRef} className="bg-gray-100 p-4 rounded-lg min-w-[280px] flex-1">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-700">{title}</h3>
        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">{leads.length}</span>
      </div>
      <div className="space-y-2 min-h-[500px]">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}
