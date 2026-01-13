'use client';

import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import { getAuth, getIdTokenResult, onAuthStateChanged } from 'firebase/auth';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, app, storage } from '../../lib/firebase';

type CatalogItem = {
  id: string;
  title: string;
  productCode?: string;
  price?: number;
  assetUrl?: string;
  version: number;
  createdAt: string;
};

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [title, setTitle] = useState('');
  const [productCode, setProductCode] = useState('');
  const [price, setPrice] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
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
    const q = query(collection(db, 'catalog_items'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as CatalogItem) })));
    });
    return () => unsubscribe();
  }, []);

  const uploadItem = async () => {
    if (!isDirector) {
      setStatus('Access denied. Director permissions required.');
      return;
    }
    if (!title.trim()) {
      setStatus('Title is required.');
      return;
    }

    setStatus('Uploading...');
    let assetUrl: string | undefined;

    if (file) {
      const fileRef = ref(storage, `catalog/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      assetUrl = await getDownloadURL(fileRef);
    }

    const itemRef = doc(collection(db, 'catalog_items'));
    await setDoc(itemRef, {
      id: itemRef.id,
      title,
      productCode: productCode || undefined,
      price: price ? Number(price) : undefined,
      assetUrl,
      version: 1,
      createdAt: new Date().toISOString(),
    });

    setTitle('');
    setProductCode('');
    setPrice('');
    setFile(null);
    setStatus('Uploaded.');
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Catalog</h1>
        <p className="text-gray-500">Upload assets and manage catalog items.</p>
      </div>

      <div className="bg-white border rounded-lg p-6 shadow space-y-4">
        <h2 className="text-xl font-semibold">New Item</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="border rounded px-3 py-2" />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Product Code</span>
            <input value={productCode} onChange={(e) => setProductCode(e.target.value)} className="border rounded px-3 py-2" />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Price</span>
            <input value={price} onChange={(e) => setPrice(e.target.value)} className="border rounded px-3 py-2" />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Asset</span>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
        </div>
        <button
          onClick={uploadItem}
          disabled={!isDirector}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Upload Item
        </button>
        {status && <p className="text-sm text-gray-600">{status}</p>}
      </div>

      <div className="bg-white border rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold mb-4">Catalog Items</h2>
        <div className="space-y-4">
          {items.length === 0 && <p className="text-gray-500">No catalog items yet.</p>}
          {items.map((item) => (
            <div key={item.id} className="border rounded p-4 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-gray-500">Code: {item.productCode || '-'}</p>
                <p className="text-sm text-gray-500">Price: {item.price ?? '-'}</p>
              </div>
              {item.assetUrl && (
                <a href={item.assetUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-sm">
                  View Asset
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
