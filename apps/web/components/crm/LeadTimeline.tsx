'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { mockStore } from '../../lib/mockStore';

type Message = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
};

export function LeadTimeline({ leadId }: { leadId: string }) {
  const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === 'true';
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (isTestMode) {
      const update = () => {
      const msgs = mockStore.getMessages(leadId).map((msg) => ({
        id: msg.id,
        sender: (msg.direction === 'inbound' ? 'user' : 'ai') as Message['sender'],
        text: msg.content,
        time: new Date(msg.createdAt).toLocaleTimeString(),
      }));
        setMessages(msgs.length > 0 ? msgs : []);
      };
      update();
      return mockStore.subscribe(update);
    }

    const messagesQuery = query(
      collection(db, `leads/${leadId}/messages`),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => {
        const payload = docSnap.data() as { direction?: string; content?: string; createdAt?: string };
        return {
          id: docSnap.id,
          sender: (payload.direction === 'inbound' ? 'user' : 'ai') as Message['sender'],
          text: payload.content || '',
          time: payload.createdAt ? new Date(payload.createdAt).toLocaleTimeString() : '',
        };
      });
      setMessages(data);
    });

    return () => unsubscribe();
  }, [leadId, isTestMode]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow overflow-hidden border border-gray-200">
      <div className="bg-gray-50 p-4 border-b">
        <h3 className="font-bold text-gray-700">Communication History</h3>
        <p className="text-xs text-gray-400 mt-1">Lead ID: {leadId}</p>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400">No messages yet.</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'ai' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[70%] p-3 rounded-lg text-sm ${
              msg.sender === 'ai'
                ? 'bg-white border text-gray-800 rounded-tl-none'
                : 'bg-blue-600 text-white rounded-tr-none'
            }`}>
              <p>{msg.text}</p>
              <span className={`text-xs block mt-1 ${
                msg.sender === 'ai' ? 'text-gray-400' : 'text-blue-100'
              }`}>{msg.time}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-white border-t">
        <input
          type="text"
          placeholder="Type a message (WhatsApp)..."
          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
        />
      </div>
    </div>
  );
}
