'use client';

import Link from 'next/link';

// Mock Templates Data (Consistent with TemplateSchema)
const MOCK_TEMPLATES = [
  {
    id: 'tpl_welcome',
    name: 'welcome_message_v1',
    language: 'en_US',
    category: 'MARKETING',
    status: 'APPROVED',
    components: [
      { type: 'HEADER', format: 'IMAGE', text: 'Welcome to our service!' },
      { type: 'BODY', text: 'Hi {{1}}, thanks for signing up.' },
      { type: 'BUTTONS', text: 'Visit Website' }
    ]
  },
  {
    id: 'tpl_invoice',
    name: 'invoice_ready',
    language: 'en_US',
    category: 'UTILITY',
    status: 'APPROVED',
    components: [
      { type: 'BODY', text: 'Your invoice {{1}} for {{2}} is ready.' },
      { type: 'FOOTER', text: 'Project Chitragupta' }
    ]
  },
  {
    id: 'tpl_promo',
    name: 'summer_sale_2026',
    language: 'en_US',
    category: 'MARKETING',
    status: 'PENDING',
    components: [
       { type: 'BODY', text: 'Summer sale is here! Get flat 50% off.' }
    ]
  }
];

export default function TemplatesPage() {
  const templates = MOCK_TEMPLATES;

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">WhatsApp Templates</h1>
            <p className="text-gray-500 mt-1">Manage and sync your business messaging templates.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50">
              Back to Home
            </Link>
            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 shadow-sm flex items-center gap-2">
             <span>+</span> New Template
            </button>
          </div>
        </div>

        {/* Sync Status Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex justify-between items-center">
             <div className="flex items-center gap-3">
                 <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-blue-900 text-sm font-medium">Synced with Meta Cloud API</span>
             </div>
             <span className="text-blue-700 text-xs font-mono">ID: WABA-882190</span>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <div key={tpl.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col">
              
              {/* Card Header */}
              <div className="p-4 border-b bg-gray-50 flex justify-between items-start">
                  <div>
                      <h3 className="font-mono text-sm font-bold text-gray-800 truncate" title={tpl.name}>{tpl.name}</h3>
                      <span className="text-xs text-gray-500">{tpl.language} • {tpl.category}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                    ${tpl.status === 'APPROVED' ? 'bg-green-100 text-green-700' : ''}
                    ${tpl.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : ''}
                    ${tpl.status === 'REJECTED' ? 'bg-red-100 text-red-700' : ''}
                  `}>
                    {tpl.status}
                  </span>
              </div>

              {/* Preview Body */}
              <div className="p-4 flex-1 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-opacity-5">
                 <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 relative max-w-[90%] pointer-events-none select-none">
                    
                    {/* Header Component */}
                    {tpl.components.find(c => c.type === 'HEADER') && (
                        <div className="mb-2 bg-gray-200 h-24 rounded-md flex items-center justify-center text-gray-400 text-xs">
                           {tpl.components.find(c => c.type === 'HEADER')?.format || 'HEADER'}
                        </div>
                    )}

                    {/* Body Text */}
                    <p className="text-sm text-gray-800 whitespace-pre-line">
                        {tpl.components.find(c => c.type === 'BODY')?.text || ''}
                    </p>

                    {/* Footer */}
                     {tpl.components.find(c => c.type === 'FOOTER') && (
                        <p className="text-[10px] text-gray-400 mt-2 pt-1 border-t">
                            {tpl.components.find(c => c.type === 'FOOTER')?.text}
                        </p>
                    )}
                 </div>
                 
                 {/* Buttons */}
                 {tpl.components.find(c => c.type === 'BUTTONS') && (
                      <div className="mt-2 bg-white text-blue-500 text-center py-2 text-sm font-medium rounded shadow-sm border max-w-[90%]">
                         {tpl.components.find(c => c.type === 'BUTTONS')?.text}
                      </div>
                 )}
              </div>

              {/* Actions */}
              <div className="p-3 border-t flex justify-end gap-2 bg-white">
                 <button className="text-xs text-gray-600 hover:text-gray-900 font-medium px-2 py-1">Edit</button>
                 <button className="text-xs text-red-600 hover:text-red-900 font-medium px-2 py-1">Delete</button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
