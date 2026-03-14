'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface Prescription {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  fileUrl: string;
  fileName: string;
  fileType: string;
  notes: string | null;
  status: 'pending' | 'reviewed' | 'converted';
  bookingId: string | null;
  createdAt: string;
  updatedAt: string;
}

const TABS = ['all', 'pending', 'reviewed', 'converted'] as const;

const statusBadge = (s: string) => {
  switch (s) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'reviewed': return 'bg-blue-100 text-blue-800';
    case 'converted': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await api.get('/api/prescriptions/admin');
      setPrescriptions(data.prescriptions || []);
    } catch {
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const filtered = activeTab === 'all'
    ? prescriptions
    : prescriptions.filter(p => p.status === activeTab);

  const pendingCount = prescriptions.filter(p => p.status === 'pending').length;

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      await api.put(`/api/prescriptions/admin/${id}/status`, { status });
      loadData();
    } catch {
      alert('Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const deletePrescription = async (id: string) => {
    if (!confirm('Delete this prescription?')) return;
    setActionLoading(id);
    try {
      await api.del(`/api/prescriptions/admin/${id}`);
      loadData();
    } catch {
      alert('Failed to delete');
    } finally {
      setActionLoading(null);
    }
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://64.227.129.25';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-yellow-600 mt-1 font-medium">
              {pendingCount} pending review
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
            {tab === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading prescriptions...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No prescriptions found</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">File</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Notes</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{p.customerName}</div>
                    <div className="text-xs text-gray-500">{p.customerPhone}</div>
                    {p.customerEmail && <div className="text-xs text-gray-400">{p.customerEmail}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`${API_URL}${p.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      {p.fileName}
                    </a>
                    <div className="text-xs text-gray-400">{p.fileType}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-[200px] truncate">
                    {p.notes || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${statusBadge(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {p.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(p.id, 'reviewed')}
                          disabled={actionLoading === p.id}
                          className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md hover:bg-blue-100 disabled:opacity-50"
                        >
                          Mark Reviewed
                        </button>
                      )}
                      {p.status !== 'converted' && (
                        <button
                          onClick={() => updateStatus(p.id, 'converted')}
                          disabled={actionLoading === p.id}
                          className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-md hover:bg-green-100 disabled:opacity-50"
                        >
                          Converted
                        </button>
                      )}
                      <button
                        onClick={() => deletePrescription(p.id)}
                        disabled={actionLoading === p.id}
                        className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-md hover:bg-red-100 disabled:opacity-50"
                      >
                        Delete
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
