'use client';

import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import Link from 'next/link';

export default function Home() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResponse('');

    try {
      const executiveRouter = httpsCallable(functions, 'executiveRouter');
      // Note: Genkit flows typically take a single object argument.
      // executive.ts expects: inputSchema: z.object({ userQuery: z.string() })
      const result = await executiveRouter({ userQuery: query });
      
      // Genkit callable functions return standard data wrapped.
      // result.data should be the string output schema.
      setResponse(result.data as string);
    } catch (error) {
      console.error(error);
      setResponse('Error: Failed to reach the Executive Agent.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center p-8 md:p-24">
      {/* Header */}
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex mb-12">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Chitragupta OS | <span className="font-bold ml-2 text-blue-600">Executive Console</span>
        </p>
      </div>

      {/* Chat Interface */}
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gray-50 border-b p-4">
          <h2 className="text-lg font-semibold text-gray-700">Talk to your OS</h2>
        </div>
        
        <div className="p-6 h-[400px] overflow-y-auto flex flex-col space-y-4">
           {!response && !loading && (
             <div className="text-center text-gray-400 mt-12">
               <p>Ask me to draft a post, query leads, or update settings.</p>
             </div>
           )}

           {loading && (
             <div className="flex justify-start">
               <div className="bg-gray-100 text-gray-800 rounded-lg rounded-tl-none p-3 max-w-[80%] animate-pulse">
                 Thinking...
               </div>
             </div>
           )}

           {response && (
             <div className="flex justify-start">
               <div className="bg-blue-50 text-blue-900 rounded-lg rounded-tl-none p-4 max-w-[90%] whitespace-pre-wrap">
                 {response}
               </div>
             </div>
           )}
        </div>

        <div className="p-4 bg-gray-50 border-t">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: 'Draft a LinkedIn post about our new pricing'..."
              className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-4xl">
        <Link href="/inbox" className="p-6 bg-white rounded shadow hover:shadow-lg transition cursor-pointer border border-gray-100">
          <h3 className="text-xl font-bold mb-2 text-gray-800">Inbox</h3>
          <p className="text-sm text-gray-500">Unified leads & messages.</p>
        </Link>
        <Link href="/approvals" className="p-6 bg-white rounded shadow hover:shadow-lg transition cursor-pointer border border-gray-100">
          <h3 className="text-xl font-bold mb-2 text-amber-600">Approvals</h3>
          <p className="text-sm text-gray-500">Pending human actions.</p>
        </Link>
        <Link href="/settings" className="p-6 bg-white rounded shadow hover:shadow-lg transition cursor-pointer border border-gray-100">
          <h3 className="text-xl font-bold mb-2 text-gray-800">Settings</h3>
          <p className="text-sm text-gray-500">Configure connectors.</p>
        </Link>
      </div>
    </main>
  );
}
