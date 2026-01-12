'use client';

import { useState } from 'react';
import { db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    WABA_TOKEN: '',
    INDIAMART_API_KEY: '',
    INSTAGRAM_TOKEN: ''
  });
  const [status, setStatus] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Saving...');
    try {
      await setDoc(doc(db, 'system_config', 'integrations'), formData, { merge: true });
      setStatus('Saved successfully!');
    } catch (error) {
      console.error(error);
      setStatus('Error saving settings.');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Connector Settings</h1>
      <p className="mb-8 text-gray-600">Manage API credentials for external integrations.</p>
      
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WhatsApp Card */}
        <div className="bg-white p-6 rounded shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-green-600">WhatsApp Business</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">WABA Token</label>
            <input 
              type="password" 
              name="WABA_TOKEN"
              value={formData.WABA_TOKEN}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-green-500 focus:border-green-500"
              placeholder="EAA..." 
            />
          </div>
        </div>

        {/* IndiaMART Card */}
        <div className="bg-white p-6 rounded shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-red-600">IndiaMART CRM</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input 
              type="text" 
              name="INDIAMART_API_KEY"
              value={formData.INDIAMART_API_KEY}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-red-500 focus:border-red-500"
              placeholder="Enter Access Key" 
            />
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 mt-4">
          <button 
            type="submit" 
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 w-full md:w-auto"
          >
            Save Configuration
          </button>
          {status && <p className="mt-4 text-sm font-semibold">{status}</p>}
        </div>
      </form>
    </div>
  );
}
