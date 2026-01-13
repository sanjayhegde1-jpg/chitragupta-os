'use client';

import { useEffect, useState } from 'react';
import { collection, getCountFromServer, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

type Tile = {
  label: string;
  value: string | number;
};

const startOfDayIso = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return start.toISOString();
};

export default function DashboardPage() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [sourceBreakdown, setSourceBreakdown] = useState<Record<string, number>>({});
  const [funnel, setFunnel] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    const startOfDay = startOfDayIso();

    const enquiriesTodayQuery = query(collection(db, 'enquiries'), where('createdAt', '>=', startOfDay));
    const untriagedQuery = query(collection(db, 'enquiries'), where('triaged', '==', false));
    const approvalsPendingQuery = query(collection(db, 'approvals'), where('status', '==', 'pending'));
    const leadsQuery = query(collection(db, 'leads'));
    const quotesQuery = query(collection(db, 'quotes'));
    const wonLeadsQuery = query(collection(db, 'leads'), where('status', '==', 'won'));
    const approvedQuotesQuery = query(collection(db, 'quotes'), where('status', '==', 'approved'));

    const [
      enquiriesTodaySnap,
      untriagedSnap,
      approvalsSnap,
      leadsSnap,
      quotesSnap,
      wonLeadsSnap,
      approvedQuotesSnap,
      oldestEnquirySnap,
    ] = await Promise.all([
      getCountFromServer(enquiriesTodayQuery),
      getCountFromServer(untriagedQuery),
      getCountFromServer(approvalsPendingQuery),
      getCountFromServer(leadsQuery),
      getCountFromServer(quotesQuery),
      getCountFromServer(wonLeadsQuery),
      getCountFromServer(approvedQuotesQuery),
      getDocs(query(collection(db, 'enquiries'), where('triaged', '==', false), orderBy('createdAt', 'asc'), limit(1))),
    ]);

    const oldest = oldestEnquirySnap.docs[0]?.data()?.createdAt;
    const oldestAgeMinutes = oldest ? Math.floor((Date.now() - new Date(oldest).getTime()) / 60000) : 0;

    const enquiriesTodayCount = enquiriesTodaySnap.data().count;
    const untriagedCount = untriagedSnap.data().count;
    const approvalsPendingCount = approvalsSnap.data().count;

    setTiles([
      { label: 'New enquiries today', value: enquiriesTodayCount },
      { label: 'Untriaged queue', value: untriagedCount },
      { label: 'Oldest untriaged (min)', value: oldest ? oldestAgeMinutes : 'N/A' },
      { label: 'Approvals pending', value: approvalsPendingCount },
    ]);

    const enquiryDocs = await getDocs(enquiriesTodayQuery);
    const sourceCounts: Record<string, number> = {};
    enquiryDocs.forEach((docSnap) => {
      const source = docSnap.data().source || 'unknown';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });
    setSourceBreakdown(sourceCounts);

    setFunnel({
      enquiries: enquiriesTodayCount,
      leads: leadsSnap.data().count,
      quotes: quotesSnap.data().count,
      approvedQuotes: approvedQuotesSnap.data().count,
      won: wonLeadsSnap.data().count,
    });

    setLoading(false);
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Director Dashboard</h1>
        <p className="text-gray-500">Real-time SLA, approvals, and funnel health.</p>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading metrics...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiles.map((tile) => (
            <div key={tile.label} className="bg-white rounded-lg border shadow p-4">
              <p className="text-sm text-gray-500">{tile.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{tile.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Source Breakdown (Today)</h2>
          {Object.keys(sourceBreakdown).length === 0 && <p className="text-gray-500">No data yet.</p>}
          <div className="space-y-2">
            {Object.entries(sourceBreakdown).map(([source, count]) => (
              <div key={source} className="flex justify-between text-sm text-gray-600">
                <span className="capitalize">{source}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Funnel</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between"><span>Enquiries</span><span className="font-semibold">{funnel.enquiries || 0}</span></div>
            <div className="flex justify-between"><span>Leads</span><span className="font-semibold">{funnel.leads || 0}</span></div>
            <div className="flex justify-between"><span>Quotes</span><span className="font-semibold">{funnel.quotes || 0}</span></div>
            <div className="flex justify-between"><span>Approved Quotes</span><span className="font-semibold">{funnel.approvedQuotes || 0}</span></div>
            <div className="flex justify-between"><span>Won</span><span className="font-semibold">{funnel.won || 0}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
