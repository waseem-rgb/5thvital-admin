'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Phlebotomist {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  areas: string[] | null;
  isActive: boolean;
  todayCount: number;
  activeSlots: number;
  next7Bookings: number;
}

export default function PhlebotomistsPage() {
  const [phlebotomists, setPhlebotomists] = useState<Phlebotomist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Phlebotomist | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', areas: '' });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const loadData = useCallback(async () => {
    try {
      const data = await api.get('/api/admin/phlebotomists');
      setPhlebotomists(data.phlebotomists || []);
    } catch {
      setPhlebotomists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', phone: '', email: '', areas: '' });
    setShowForm(true);
  };

  const openEdit = (p: Phlebotomist) => {
    setEditing(p);
    setForm({
      name: p.name,
      phone: p.phone || '',
      email: p.email || '',
      areas: (p.areas || []).join(', '),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        areas: form.areas ? form.areas.split(',').map(a => a.trim()).filter(Boolean) : undefined,
      };
      if (editing) {
        await api.put(`/api/admin/phlebotomists/${editing.id}`, payload);
      } else {
        await api.post('/api/admin/phlebotomists', payload);
      }
      setShowForm(false);
      setEditing(null);
      loadData();
    } catch {
      alert('Failed to save phlebotomist');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p: Phlebotomist) => {
    if (p.isActive) {
      if (!confirm(`Deactivate ${p.name}?`)) return;
      try {
        await api.del(`/api/admin/phlebotomists/${p.id}`);
        loadData();
      } catch {
        alert('Failed to deactivate');
      }
    } else {
      try {
        await api.put(`/api/admin/phlebotomists/${p.id}`, { is_active: true });
        loadData();
      } catch {
        alert('Failed to activate');
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phlebotomists</h1>
          <p className="text-sm text-gray-500 mt-1">
            {phlebotomists.filter(p => p.isActive).length} active
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Add Phlebotomist
        </button>
      </div>

      {/* Slide-in form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowForm(false)} />
          <div className="relative w-96 bg-white h-full shadow-xl p-6 overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editing ? 'Edit Phlebotomist' : 'Add Phlebotomist'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="+91..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Areas (comma-separated)</label>
                <input
                  value={form.areas}
                  onChange={e => setForm(f => ({ ...f, areas: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Bhopal, Indore, Jabalpur"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim()}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editing ? 'Update' : 'Add'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : phlebotomists.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No phlebotomists yet</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Areas</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Today</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Slot Summary</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {phlebotomists.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.phone}</td>
                  <td className="px-4 py-3 text-gray-600">{p.email || '—'}</td>
                  <td className="px-4 py-3">
                    {p.areas && p.areas.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {p.areas.map(a => (
                          <span key={a} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">{a}</span>
                        ))}
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                      {p.todayCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">{p.activeSlots}</span> active slots
                      <span className="mx-1 text-gray-300">|</span>
                      <span className="font-medium">{p.next7Bookings}</span> bookings (7d)
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => router.push(`/phlebotomists/${p.id}/slots`)}
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md hover:bg-blue-100"
                      >
                        Manage Slots
                      </button>
                      <button
                        onClick={() => toggleActive(p)}
                        className={`text-xs px-2 py-1 rounded-md ${
                          p.isActive
                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        {p.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
