export default function PipelinePage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Sales Pipeline</h1>
      <div className="grid grid-cols-4 gap-4 h-[600px]">
        {['New Leads', 'Negotiating', 'Qualified', 'Closed'].map((stage) => (
          <div key={stage} className="bg-gray-100 p-4 rounded flex flex-col">
            <h3 className="font-bold text-gray-700 mb-4 uppercase text-sm tracking-wide">{stage}</h3>
            <div className="flex-1 space-y-3">
              {/* Kanban Item Stub */}
              <div className="bg-white p-3 rounded shadow-sm text-sm cursor-pointer hover:shadow-md">
                <div className="font-semibold text-gray-900">Acme Industries</div>
                <div className="text-gray-500 text-xs mt-1">₹ 2.5 Lakhs</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
