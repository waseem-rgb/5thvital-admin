'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Coupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '', discountType: 'percent', discountValue: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', expiresAt: ''
  });
  const [saving, setSaving] = useState(false);

  function loadCoupons() {
    setLoading(true);
    api.get('/api/admin/coupons')
      .then((data) => setCoupons(data.coupons || []))
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadCoupons(); }, []);

  function openCreate() {
    setForm({ code: '', discountType: 'percent', discountValue: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', expiresAt: '' });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...form,
        discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount) || undefined,
        maxDiscount: Number(form.maxDiscount) || undefined,
        usageLimit: Number(form.usageLimit) || undefined,
        expiresAt: form.expiresAt || undefined,
      };
      await api.post('/api/admin/coupons', body);
      setShowForm(false);
      loadCoupons();
    } catch {
      alert('Failed to create coupon');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this coupon?')) return;
    try {
      await api.del(`/api/admin/coupons/${id}`);
      loadCoupons();
    } catch {
      alert('Failed to delete coupon');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
        <button onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + Add Coupon
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Coupon</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="percent">Percentage</option>
                <option value="flat">Flat Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
              <input type="number" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount (₹)</label>
              <input type="number" value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (₹)</label>
              <input type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
              <input type="number" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Creating...' : 'Create Coupon'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
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
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Min Order</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Usage</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Expires</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coupons.length ? coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono font-medium text-gray-900">{c.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {c.discountType === 'percent' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.minOrderAmount ? `₹${c.minOrderAmount}` : '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.usedCount}/{c.usageLimit || '\u221E'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No coupons found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
