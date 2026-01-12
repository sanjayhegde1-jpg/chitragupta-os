export default function InboxPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Unified Inbox</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Social Comments</h2>
          <p className="text-gray-500">No new comments.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">WhatsApp Chats</h2>
          <p className="text-gray-500">No active sessions.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">IndiaMART Enquiries</h2>
          <p className="text-gray-500">Checking for new leads...</p>
        </div>
      </div>
    </div>
  );
}
