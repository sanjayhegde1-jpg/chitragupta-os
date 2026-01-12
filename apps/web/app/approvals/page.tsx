export default function ApprovalsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Pending Approvals (HITL)</h1>
      <div className="border border-yellow-200 bg-yellow-50 p-4 rounded mb-6">
        <h3 className="font-bold text-yellow-800">Governance Mode Active</h3>
        <p className="text-yellow-700">All high-stakes actions require manual confirmation.</p>
      </div>
      
      <div className="space-y-4">
        {/* Mock Approval Item */}
        <div className="bg-white p-6 rounded shadow border-l-4 border-blue-500 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-lg">Social Post Draft</h3>
            <p className="text-gray-600">Platform: Instagram | Confidence: 85%</p>
            <p className="text-sm mt-1 italic">"Introducing our new manufacturing line..."</p>
          </div>
          <div className="space-x-4">
            <button className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200">Reject</button>
            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Approve & Publish</button>
          </div>
        </div>
      </div>
    </div>
  );
}
