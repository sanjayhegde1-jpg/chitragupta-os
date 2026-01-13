'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';

export type LeadCardData = {
  id: string;
  name?: string;
  email?: string;
  source?: string;
  last_event_at?: string;
};

export function LeadCard({ lead }: { lead: LeadCardData }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: lead.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };
  
  // Calculate rotting status (e.g., if last_event_at > 3 days ago)
  const isRotting = lead.last_event_at 
    ? (new Date().getTime() - new Date(lead.last_event_at).getTime()) > (3 * 24 * 60 * 60 * 1000)
    : false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white p-4 rounded shadow mb-3 border-l-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isRotting ? 'border-red-500' : 'border-blue-500'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-gray-800">{lead.name || 'Unknown'}</h4>
        {isRotting && <span className="text-xs text-red-500 font-bold">⚠️ Stale</span>}
      </div>
      <p className="text-sm text-gray-600 truncate">{lead.email}</p>
      <div className="flex justify-between items-center mt-3">
        <span className="text-xs text-gray-400 capitalize">{lead.source}</span>
        <Link 
          href={`/lead/${lead.id}`} 
          className="text-xs text-blue-600 hover:underline z-10"
          onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking link
        >
          View &rarr;
        </Link>
      </div>
    </div>
  );
}
