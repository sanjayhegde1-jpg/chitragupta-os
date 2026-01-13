'use client';

import { useEffect, useState } from 'react';
import { db, app } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, getIdTokenResult } from 'firebase/auth';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    WABA_TOKEN: '',
    INDIAMART_API_KEY: '',
    INSTAGRAM_TOKEN: ''
  });
  const [status, setStatus] = useState('');
  const [accessState, setAccessState] = useState<'checking' | 'allowed' | 'denied'>('checking');

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAccessState('denied');
        return;
      }

      const token = await getIdTokenResult(user);
      setAccessState(token.claims.director ? 'allowed' : 'denied');
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accessState !== 'allowed') {
      setStatus('Access denied. Director permissions required.');
      return;
    }
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

      {accessState === 'checking' && (
        <div className="mb-6 rounded border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          Checking access...
        </div>
      )}

      {accessState === 'denied' && (
        <div className="mb-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Access denied. Director permissions required to update settings.
        </div>
      )}
      
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
              disabled={accessState !== 'allowed'}
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
              disabled={accessState !== 'allowed'}
              className="w-full p-2 border rounded focus:ring-red-500 focus:border-red-500"
              placeholder="Enter Access Key" 
            />
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 mt-4">
          <button 
            type="submit" 
            disabled={accessState !== 'allowed'}
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
