'use client';

type Enquiry = {
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

type Lead = {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  whatsappNumber?: string;
  source?: string;
  status?: string;
  consentStatus?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Approval = {
  id: string;
  kind: 'whatsapp' | 'quote';
  leadId: string;
  draft: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

type Message = {
  id: string;
  leadId: string;
  direction: 'inbound' | 'outbound';
  channel: 'whatsapp' | 'manual' | 'social';
  content: string;
  createdAt: string;
};

type Quote = {
  id: string;
  leadId: string;
  items: Array<Record<string, unknown>>;
  total: number;
  status: 'draft' | 'approved' | 'sent';
  pdfUrl?: string;
  createdAt: string;
};

type Task = {
  id: string;
  leadId: string;
  type: 'follow_up' | 'quote' | 'catalog';
  status: 'open' | 'done';
  createdAt: string;
};

type Listener = () => void;

const listeners = new Set<Listener>();
const storageKey = 'chitragupta_mock_store_v1';
const isTestMode = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_TEST_MODE === 'true';

const state = {
  enquiries: [] as Enquiry[],
  leads: [] as Lead[],
  approvals: [] as Approval[],
  messages: [] as Message[],
  quotes: [] as Quote[],
  tasks: [] as Task[],
};

if (isTestMode) {
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<typeof state>;
      Object.assign(state, parsed);
    }
  } catch (error) {
    console.warn('[mockStore] Failed to load session state', error);
  }
}

const persist = () => {
  if (!isTestMode) return;
  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    console.warn('[mockStore] Failed to persist session state', error);
  }
};

const notify = () => {
  persist();
  listeners.forEach((fn) => fn());
};

export const mockStore = {
  subscribe: (fn: Listener) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  getEnquiries: () => state.enquiries,
  getLeads: () => state.leads,
  getApprovals: () => state.approvals,
  getTasks: () => state.tasks,
  getMessages: (leadId: string) => state.messages.filter((m) => m.leadId === leadId),
  addEnquiry: (enquiry: Enquiry) => {
    const existing = state.enquiries.find((e) => e.id === enquiry.id);
    if (!existing) state.enquiries.push(enquiry);
    notify();
  },
  addLead: (lead: Lead) => {
    const existing = state.leads.find((l) => l.id === lead.id);
    if (!existing) state.leads.push(lead);
    notify();
  },
  addApproval: (approval: Approval) => {
    const existing = state.approvals.find((a) => a.id === approval.id);
    if (!existing) state.approvals.push(approval);
    notify();
  },
  updateApproval: (approvalId: string, status: Approval['status']) => {
    const approval = state.approvals.find((a) => a.id === approvalId);
    if (approval) {
      approval.status = status;
      notify();
    }
  },
  addMessage: (message: Message) => {
    state.messages.push(message);
    notify();
  },
  markTriaged: (enquiryId: string) => {
    const enquiry = state.enquiries.find((e) => e.id === enquiryId);
    if (enquiry) {
      enquiry.triaged = true;
      notify();
    }
  },
  addQuote: (quote: Quote) => {
    state.quotes.push(quote);
    notify();
  },
  addTask: (task: Task) => {
    state.tasks.push(task);
    notify();
  },
  updateLeadStatus: (leadId: string, status: string) => {
    const lead = state.leads.find((l) => l.id === leadId);
    if (lead) {
      lead.status = status;
      notify();
    }
  },
};
