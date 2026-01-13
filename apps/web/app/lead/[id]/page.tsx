'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { db, functions, storage } from '../../../lib/firebase';
import { LeadTimeline } from '../../../components/crm/LeadTimeline';
import { mockStore } from '../../../lib/mockStore';

type LeadRecord = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  status?: string;
  source?: string;
  notes?: string;
};

const escapePdf = (value: string) => value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const generateMinimalPdf = (title: string, lines: string[]) => {
  const pageLines = [title, ...lines].slice(0, 20);
  const content = pageLines
    .map((line, index) => `BT /F1 12 Tf 50 ${750 - index * 18} Td (${escapePdf(line)}) Tj ET`)
    .join('\n');

  const parts: string[] = [];
  const offsets: number[] = [];
  const add = (chunk: string) => {
    offsets.push(parts.join('').length);
    parts.push(chunk);
  };

  parts.push('%PDF-1.4\n');
  add('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n');
  add('2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n');
  add('3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n');
  add(`4 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj\n`);
  add('5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n');

  const xrefOffset = parts.join('').length;
  const xrefEntries = ['0000000000 65535 f '];
  offsets.forEach((offset) => {
    xrefEntries.push(`${String(offset).padStart(10, '0')} 00000 n `);
  });

  parts.push(`xref\n0 ${xrefEntries.length}\n${xrefEntries.join('\n')}\n`);
  parts.push('trailer << /Size ' + xrefEntries.length + ' /Root 1 0 R >>\n');
  parts.push(`startxref\n${xrefOffset}\n%%EOF`);

  return new TextEncoder().encode(parts.join(''));
};

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === 'true';
  const [lead, setLead] = useState<LeadRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isTestMode) {
      const update = () => {
        const found = mockStore.getLeads().find((item) => item.id === params.id) as LeadRecord | undefined;
        setLead(found || null);
        setLoading(false);
      };
      update();
      return mockStore.subscribe(update);
    }

    const fetchLead = async () => {
      try {
        const docRef = doc(db, 'leads', params.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Omit<LeadRecord, 'id'>;
          setLead({ id: docSnap.id, ...data });
        }
      } catch (error) {
        console.error('Error fetching lead:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [params.id, isTestMode]);

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
          <p
            className={`mt-1 font-semibold capitalize ${
              lead.status === 'won' ? 'text-green-600' : 'text-blue-600'
            }`}
          >
            {lead.status}
          </p>
        </div>

        <div className="mb-6">
          <label className="text-xs font-bold text-gray-400 uppercase">Source</label>
          <p className="mt-1 font-semibold capitalize">{lead.source}</p>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase">AI Notes</label>
          <div className="mt-2 p-3 bg-yellow-50 text-sm text-yellow-800 rounded border border-yellow-100">
            {lead.notes || 'No AI notes generated.'}
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
          <button
            onClick={async () => {
              const message = prompt('Enter WhatsApp message:', 'Hello! Thanks for your enquiry.');
              if (!message) return;

              if (isTestMode) {
                mockStore.addApproval({
                  id: `apv_${Date.now()}`,
                  kind: 'whatsapp',
                  leadId: lead.id,
                  draft: { message },
                  status: 'pending',
                  createdAt: new Date().toISOString(),
                });
                alert('Draft created (test mode).');
                return;
              }

              const createDraft = httpsCallable(functions, 'createWhatsappDraft');

              try {
                alert('Creating approval...');
                const res = await createDraft({
                  leadId: lead.id,
                  message,
                });
                const approvalId = (res.data as { approvalId?: string } | undefined)?.approvalId;
                alert(`Draft created. Approval ID: ${approvalId ?? 'unknown'}`);
              } catch (error) {
                const messageText = error instanceof Error ? error.message : 'Unknown error';
                alert('Error: ' + messageText);
              }
            }}
            className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 font-medium flex items-center justify-center gap-2"
          >
            <span>WA</span> Draft WhatsApp
          </button>
          <button
            onClick={async () => {
              const input = prompt('Paste latest enquiry text for agent:');
              if (!input) return;
              if (isTestMode) {
                const reply = `Thanks for reaching out. Please share details for ${lead.name || 'your request'}.`;
                mockStore.addApproval({
                  id: `apv_${Date.now()}`,
                  kind: 'whatsapp',
                  leadId: lead.id,
                  draft: { message: reply },
                  status: 'pending',
                  createdAt: new Date().toISOString(),
                });
                alert('Agent draft created (test mode).');
                return;
              }

              const agent = httpsCallable(functions, 'nextBestAction');
              const res = await agent({ content: input, source: lead.source || 'manual' });
              const data = res.data as { reply?: string; confidence?: number };
              const reply = data.reply || 'Thanks for reaching out. Could you share more details?';
              await httpsCallable(functions, 'createWhatsappDraft')({ leadId: lead.id, message: reply });
              alert(`Agent draft created (confidence ${(data.confidence ?? 0) * 100}%).`);
            }}
            className="w-full py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700 font-medium"
          >
            Run Agent
          </button>
          <button
            onClick={async () => {
              const title = prompt('Quote title:', `Quote for ${lead.name || 'Customer'}`);
              if (!title) return;
              const itemTitle = prompt('Item description:', 'Product');
              if (!itemTitle) return;
              const qty = Number(prompt('Quantity:', '1') || '1');
              const price = Number(prompt('Unit price:', '1000') || '0');
              const total = qty * price;
              const pdfBytes = generateMinimalPdf(title, [
                `Item: ${itemTitle}`,
                `Qty: ${qty}`,
                `Price: ${price}`,
                `Total: ${total}`,
              ]);

              if (isTestMode) {
                const quoteId = `q_${Date.now()}`;
                mockStore.addQuote({
                  id: quoteId,
                  leadId: lead.id,
                  items: [{ title: itemTitle, qty, price }],
                  total,
                  status: 'draft',
                  pdfUrl: 'mock://quote.pdf',
                  createdAt: new Date().toISOString(),
                });
                mockStore.addApproval({
                  id: `apv_${Date.now()}`,
                  kind: 'quote',
                  leadId: lead.id,
                  draft: { quoteId, pdfUrl: 'mock://quote.pdf', total },
                  status: 'pending',
                  createdAt: new Date().toISOString(),
                });
                alert('Quote draft created (test mode).');
                return;
              }

              const storageRef = ref(storage, `quotes/${lead.id}_${Date.now()}.pdf`);
              await uploadBytes(storageRef, pdfBytes, { contentType: 'application/pdf' });
              const pdfUrl = await getDownloadURL(storageRef);

              const createQuote = httpsCallable(functions, 'createQuoteDraft');
              await createQuote({
                leadId: lead.id,
                items: [{ title: itemTitle, qty, price }],
                total,
                pdfUrl,
              });

              alert('Quote draft created and awaiting approval.');
            }}
            className="w-full py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium"
          >
            Draft Quote (AI)
          </button>
          <button className="w-full py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium">
            Send Catalog
          </button>
          <button className="w-full py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium">
            Create Invoice
          </button>
        </div>

        <hr className="my-6 border-gray-100" />

        <h2 className="font-bold text-gray-700 mb-4">Tools</h2>
        <div className="text-sm text-gray-500">
          <p>Email: Connected</p>
          <p>WhatsApp: Connected</p>
        </div>
      </div>
    </div>
  );
}
