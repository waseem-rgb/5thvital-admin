'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Package {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: 'published' | 'draft';
  isFeatured: boolean;
  price: string | number | null;
  originalPrice: string | number | null;
  discountPercent: string | number | null;
  testsCount: number | null;
  sortOrder: number | null;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', price: '', originalPrice: '', status: 'published' });
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
    setForm({ name: '', slug: '', description: '', price: '', originalPrice: '', status: 'published' });
    setShowForm(true);
  }

  function openEdit(pkg: Package) {
    setEditing(pkg);
    setForm({
      name: pkg.name,
      slug: pkg.slug || '',
      description: pkg.description || '',
      price: pkg.price != null ? String(pkg.price) : '',
      originalPrice: pkg.originalPrice != null ? String(pkg.originalPrice) : '',
      status: pkg.status || 'draft',
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        price: form.price ? Number(form.price) : null,
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        status: form.status,
      };
      if (editing) {
        await api.put(`/api/admin/packages/${editing.id}`, body);
      } else {
        await api.post('/api/admin/packages', body);
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
      await api.del(`/api/admin/packages/${id}`);
      loadPackages();
    } catch {
      alert('Failed to delete package');
    }
  }

  const fmtPrice = (val: string | number | null): string => {
    if (val == null) return '-';
    const n = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(n) ? '-' : `₹${n.toLocaleString()}`;
  };

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (₹)</label>
              <input type="number" value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹)</label>
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
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
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Slug</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Original Price</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Selling Price</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tests</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {packages.length ? packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {pkg.name}
                      {pkg.isFeatured && <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Featured</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{pkg.slug}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{fmtPrice(pkg.originalPrice)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{fmtPrice(pkg.price)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {pkg.discountPercent != null ? `${parseFloat(String(pkg.discountPercent))}%` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{pkg.testsCount ?? '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        pkg.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {pkg.status === 'published' ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button onClick={() => openEdit(pkg)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
                      <button onClick={() => handleDelete(pkg.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-400">No packages found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
