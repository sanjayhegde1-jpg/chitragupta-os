'use client';

export function LeadTimeline({ leadId }: { leadId: string }) {
  // Mock data for phase 1
  const messages = [
    { id: 1, sender: 'user', text: "Is the catalog available?", time: "10:00 AM" },
    { id: 2, sender: 'ai', text: "Yes, I've sent it to your email.", time: "10:01 AM" },
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow overflow-hidden border border-gray-200">
      <div className="bg-gray-50 p-4 border-b">
        <h3 className="font-bold text-gray-700">Communication History</h3>
        <p className="text-xs text-gray-400 mt-1">Lead ID: {leadId}</p>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
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
