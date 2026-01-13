'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, onSnapshot, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { getAuth, getIdTokenResult, onAuthStateChanged } from 'firebase/auth';
import { db, app } from '../../lib/firebase';

type EnquiryItem = {
  id: string;
  source: string;
  sourceRef: string;
  content: string;
  contact: {
    name?: string;
    phone?: string;
    email?: string;
    username?: string;
  };
  leadId?: string;
  triaged: boolean;
  createdAt: string;
};

type LeadRow = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  createdAt?: string;
};

type CsvMapping = {
  name?: string;
  phone?: string;
  email?: string;
  content?: string;
  sourceRef?: string;
};

const SOURCE_OPTIONS = ['indiamart', 'tradeindia', 'instagram', 'facebook', 'youtube', 'manual'] as const;

type CsvRow = Record<string, string>;

type CsvState = {
  headers: string[];
  rows: CsvRow[];
};

const parseCsv = (text: string): CsvState => {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const splitLine = (line: string) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
        continue;
      }
      current += char;
    }
    result.push(current.trim());
    return result;
  };

  const headers = splitLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = splitLine(line);
    const row: CsvRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });

  return { headers, rows };
};

const sanitizeId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '_');

export default function InboxPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [csvState, setCsvState] = useState<CsvState>({ headers: [], rows: [] });
  const [csvMapping, setCsvMapping] = useState<CsvMapping>({});
  const [csvSource, setCsvSource] = useState<'indiamart' | 'tradeindia'>('indiamart');
  const [manualSource, setManualSource] = useState<(typeof SOURCE_OPTIONS)[number]>('instagram');
  const [manualContent, setManualContent] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualUsername, setManualUsername] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [manualStatus, setManualStatus] = useState('');
  const [isDirector, setIsDirector] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsDirector(false);
        return;
      }
      const token = await getIdTokenResult(user);
      setIsDirector(Boolean(token.claims.director));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const leadsQuery = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    const unsubscribeLeads = onSnapshot(leadsQuery, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<LeadRow, 'id'>),
      }));
      setLeads(data);
      setLoading(false);
    });

    const enquiryQuery = query(
      collection(db, 'enquiries'),
      where('triaged', '==', false),
      orderBy('createdAt', 'asc')
    );
    const unsubscribeEnquiries = onSnapshot(enquiryQuery, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<EnquiryItem, 'id'>),
      }));
      setEnquiries(data);
    });

    return () => {
      unsubscribeLeads();
      unsubscribeEnquiries();
    };
  }, []);

  const csvPreviewRows = useMemo(() => csvState.rows.slice(0, 5), [csvState]);

  const handleCsvUpload = async (file: File) => {
    const text = await file.text();
    const parsed = parseCsv(text);
    setCsvState(parsed);
    if (parsed.headers.length > 0) {
      setCsvMapping({
        name: parsed.headers.find((h) => h.toLowerCase().includes('name')),
        phone: parsed.headers.find((h) => h.toLowerCase().includes('phone')),
        email: parsed.headers.find((h) => h.toLowerCase().includes('email')),
        content: parsed.headers.find((h) => h.toLowerCase().includes('message')),
        sourceRef: parsed.headers[0],
      });
    }
  };

  const findExistingLead = async (phone?: string, email?: string) => {
    if (!phone && !email) return null;
    if (phone) {
      const q = query(collection(db, 'leads'), where('phone', '==', phone));
      const snap = await getDocs(q);
      if (!snap.empty) return snap.docs[0];
    }
    if (email) {
      const q = query(collection(db, 'leads'), where('email', '==', email));
      const snap = await getDocs(q);
      if (!snap.empty) return snap.docs[0];
    }
    return null;
  };

  const importCsv = async () => {
    if (!isDirector) {
      setImportStatus('Access denied. Director permissions required.');
      return;
    }

    if (csvState.rows.length === 0) {
      setImportStatus('No rows to import.');
      return;
    }

    setImportStatus('Importing...');
    let imported = 0;
    let skipped = 0;

    for (const row of csvState.rows) {
      const sourceRefRaw = (csvMapping.sourceRef && row[csvMapping.sourceRef]) || `row_${Date.now()}_${Math.random()}`;
      const sourceRef = sanitizeId(sourceRefRaw);
      const enquiryId = `${csvSource}_${sourceRef}`;

      const enquiryRef = doc(db, 'enquiries', enquiryId);

      const name = csvMapping.name ? row[csvMapping.name] : undefined;
      const phone = csvMapping.phone ? row[csvMapping.phone] : undefined;
      const email = csvMapping.email ? row[csvMapping.email] : undefined;
      const content = csvMapping.content ? row[csvMapping.content] : 'Imported enquiry';

      const existingLead = await findExistingLead(phone, email);
      let leadId = existingLead?.id;

      if (!leadId) {
        const leadRef = doc(collection(db, 'leads'));
        leadId = leadRef.id;
        await setDoc(leadRef, {
          id: leadId,
          name: name || 'Unknown',
          phone,
          email,
          source: csvSource,
          status: 'new',
          consentStatus: 'unknown',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      await setDoc(enquiryRef, {
        id: enquiryId,
        source: csvSource,
        sourceRef: sourceRefRaw,
        content,
        contact: { name, phone, email },
        leadId,
        triaged: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const messageRef = doc(collection(db, `leads/${leadId}/messages`));
      await setDoc(messageRef, {
        id: messageRef.id,
        direction: 'inbound',
        channel: 'manual',
        content,
        createdAt: new Date().toISOString(),
      });

      imported += 1;
    }

    setImportStatus(`Imported ${imported} rows. Skipped ${skipped}.`);
  };

  const createManualEnquiry = async () => {
    if (!isDirector) {
      setManualStatus('Access denied. Director permissions required.');
      return;
    }

    if (!manualContent.trim()) {
      setManualStatus('Please add enquiry text.');
      return;
    }

    setManualStatus('Saving...');
    const sourceRef = `manual_${Date.now()}`;
    const enquiryId = `${manualSource}_${sourceRef}`;
    const phone = manualPhone || undefined;
    const email = manualEmail || undefined;
    const name = manualName || undefined;

    const existingLead = await findExistingLead(phone, email);
    let leadId = existingLead?.id;

    if (!leadId) {
      const leadRef = doc(collection(db, 'leads'));
      leadId = leadRef.id;
      await setDoc(leadRef, {
        id: leadId,
        name: name || 'Unknown',
        phone,
        email,
        source: manualSource,
        status: 'new',
        consentStatus: 'unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    await setDoc(doc(db, 'enquiries', enquiryId), {
      id: enquiryId,
      source: manualSource,
      sourceRef,
      content: manualContent,
      contact: {
        name,
        phone,
        email,
        username: manualUsername || undefined,
      },
      leadId,
      triaged: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const messageRef = doc(collection(db, `leads/${leadId}/messages`));
    await setDoc(messageRef, {
      id: messageRef.id,
      direction: 'inbound',
      channel: 'manual',
      content: manualContent,
      createdAt: new Date().toISOString(),
    });

    setManualStatus('Saved.');
    setManualContent('');
    setManualName('');
    setManualPhone('');
    setManualEmail('');
    setManualUsername('');
  };

  const markTriaged = async (enquiryId: string) => {
    if (!isDirector) {
      return;
    }
    await updateDoc(doc(db, 'enquiries', enquiryId), {
      triaged: true,
      updatedAt: new Date().toISOString(),
    });
  };

  const getSlaBadge = (createdAt: string) => {
    const ageMinutes = (Date.now() - new Date(createdAt).getTime()) / 60000;
    if (ageMinutes > 120) return { label: 'SLA 2h+', className: 'bg-red-100 text-red-700' };
    if (ageMinutes > 30) return { label: 'SLA 30m+', className: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Fresh', className: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Unified Inbox</h1>
          <p className="text-gray-500">Zero leakage queue for all inbound enquiries.</p>
        </div>
        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
          {enquiries.length} Untriaged
        </span>
      </div>

      <section className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Zero Leakage Queue</h2>
        {enquiries.length === 0 ? (
          <p className="text-gray-500">No untriaged enquiries.</p>
        ) : (
          <div className="space-y-4">
            {enquiries.map((item) => {
              const sla = getSlaBadge(item.createdAt);
              return (
                <div key={item.id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="uppercase font-semibold">{item.source}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${sla.className}`}>{sla.label}</span>
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-2 text-gray-800">{item.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.contact.name || 'Unknown'} · {item.contact.phone || 'No phone'} · {item.contact.email || 'No email'}
                    </p>
                  </div>
                  <button
                    disabled={!isDirector}
                    onClick={() => markTriaged(item.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Mark Triaged
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">CSV Import (IndiaMART / TradeIndia)</h2>
          <div className="flex gap-2 mb-4">
            <select
              value={csvSource}
              onChange={(e) => setCsvSource(e.target.value as 'indiamart' | 'tradeindia')}
              className="border rounded px-3 py-2"
            >
              <option value="indiamart">IndiaMART</option>
              <option value="tradeindia">TradeIndia</option>
            </select>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files && handleCsvUpload(e.target.files[0])}
              className="border rounded px-3 py-2"
            />
          </div>

          {csvState.headers.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {['name', 'phone', 'email', 'content', 'sourceRef'].map((field) => (
                  <label key={field} className="flex flex-col">
                    <span className="text-gray-600">{field}</span>
                    <select
                      value={csvMapping[field as keyof CsvMapping] || ''}
                      onChange={(e) => setCsvMapping({ ...csvMapping, [field]: e.target.value })}
                      className="border rounded px-2 py-1"
                    >
                      <option value="">(none)</option>
                      {csvState.headers.map((header) => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              <div className="border rounded p-3 text-xs text-gray-500">
                <p className="font-semibold mb-2">Preview</p>
                {csvPreviewRows.map((row, idx) => (
                  <pre key={idx} className="whitespace-pre-wrap">{JSON.stringify(row, null, 2)}</pre>
                ))}
              </div>

              <button
                disabled={!isDirector}
                onClick={importCsv}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Import CSV
              </button>
              {importStatus && <p className="text-sm text-gray-600">{importStatus}</p>}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Manual Social Intake</h2>
          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
            <label className="flex flex-col">
              <span className="text-gray-600">Source</span>
              <select
                value={manualSource}
                onChange={(e) => setManualSource(e.target.value as (typeof SOURCE_OPTIONS)[number])}
                className="border rounded px-2 py-1"
              >
                {SOURCE_OPTIONS.filter((s) => !['indiamart', 'tradeindia'].includes(s)).map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col">
              <span className="text-gray-600">Name</span>
              <input value={manualName} onChange={(e) => setManualName(e.target.value)} className="border rounded px-2 py-1" />
            </label>
            <label className="flex flex-col">
              <span className="text-gray-600">Phone</span>
              <input value={manualPhone} onChange={(e) => setManualPhone(e.target.value)} className="border rounded px-2 py-1" />
            </label>
            <label className="flex flex-col">
              <span className="text-gray-600">Email</span>
              <input value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} className="border rounded px-2 py-1" />
            </label>
            <label className="flex flex-col">
              <span className="text-gray-600">Username</span>
              <input value={manualUsername} onChange={(e) => setManualUsername(e.target.value)} className="border rounded px-2 py-1" />
            </label>
          </div>
          <textarea
            value={manualContent}
            onChange={(e) => setManualContent(e.target.value)}
            className="w-full border rounded p-2 min-h-[120px]"
            placeholder="Paste DM or comment text here..."
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              disabled={!isDirector}
              onClick={createManualEnquiry}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Save Intake
            </button>
            {manualStatus && <span className="text-sm text-gray-600">{manualStatus}</span>}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Leads</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="p-4 text-center">Loading leads...</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center text-gray-500">No leads found.</td></tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{lead.name || 'Unknown'}</div>
                    <div className="text-sm text-gray-500">{lead.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 uppercase">
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {lead.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
