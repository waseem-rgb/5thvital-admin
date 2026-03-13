'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Test {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sampleType: string;
  turnaroundTime: string;
  isActive: boolean;
}

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', category: '', sampleType: '', turnaroundTime: '' });
  const [saving, setSaving] = useState(false);

  function loadTests(query?: string) {
    setLoading(true);
    const path = query ? `/api/tests/search?q=${encodeURIComponent(query)}` : '/api/tests';
    api.get(path)
      .then((data) => setTests(data.tests || data || []))
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadTests(); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadTests(search);
  }

  function openEdit(test: Test) {
    setEditingTest(test);
    setEditForm({ name: test.name, price: String(test.price), category: test.category || '', sampleType: test.sampleType || '', turnaroundTime: test.turnaroundTime || '' });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTest) return;
    setSaving(true);
    try {
      await api.put(`/api/tests/${editingTest.id}`, { ...editForm, price: Number(editForm.price) });
      setEditingTest(null);
      loadTests(search || undefined);
    } catch {
      alert('Failed to update test');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tests</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tests..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Search</button>
        </form>
      </div>

      {editingTest && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Test</h2>
          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sample Type</label>
              <input value={editForm.sampleType} onChange={e => setEditForm({ ...editForm, sampleType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Turnaround Time</label>
              <input value={editForm.turnaroundTime} onChange={e => setEditForm({ ...editForm, turnaroundTime: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Update Test'}
              </button>
              <button type="button" onClick={() => setEditingTest(null)}
                className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Sample</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">TAT</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tests.length ? tests.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{t.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{t.category || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">₹{t.price}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{t.sampleType || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{t.turnaroundTime || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => openEdit(t)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No tests found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
