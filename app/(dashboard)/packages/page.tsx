'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  discountedPrice: number;
  testCount: number;
  category: string;
  isActive: boolean;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', discountedPrice: '', category: '' });
  const [saving, setSaving] = useState(false);

  function loadPackages() {
    setLoading(true);
    api.get('/api/packages')
      .then((data) => setPackages(data.packages || data || []))
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadPackages(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', description: '', price: '', discountedPrice: '', category: '' });
    setShowForm(true);
  }

  function openEdit(pkg: Package) {
    setEditing(pkg);
    setForm({ name: pkg.name, description: pkg.description, price: String(pkg.price), discountedPrice: String(pkg.discountedPrice || ''), category: pkg.category || '' });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, price: Number(form.price), discountedPrice: Number(form.discountedPrice) || undefined };
      if (editing) {
        await api.put(`/api/packages/${editing.id}`, body);
      } else {
        await api.post('/api/packages', body);
      }
      setShowForm(false);
      loadPackages();
    } catch {
      alert('Failed to save package');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this package?')) return;
    try {
      await api.del(`/api/packages/${id}`);
      loadPackages();
    } catch {
      alert('Failed to delete package');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Packages</h1>
        <button onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + Add Package
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{editing ? 'Edit Package' : 'New Package'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discounted Price (₹)</label>
              <input type="number" value={form.discountedPrice} onChange={e => setForm({ ...form, discountedPrice: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
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
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Disc. Price</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tests</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {packages.length ? packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{pkg.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{pkg.category || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">₹{pkg.price}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{pkg.discountedPrice ? `₹${pkg.discountedPrice}` : '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{pkg.testCount || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${pkg.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {pkg.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button onClick={() => openEdit(pkg)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
                      <button onClick={() => handleDelete(pkg.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No packages found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
