'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Stats {
  totalBookings: number;
  totalRevenue: number;
  totalPackages: number;
  totalTests: number;
  recentBookings: Array<{
    id: string;
    patientName: string;
    status: string;
    createdAt: string;
    totalAmount: number;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/stats')
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
      </div>
    </div>;
  }

  const cards = [
    { label: 'Total Orders', value: stats?.totalBookings ?? 0, color: 'bg-blue-500' },
    { label: 'Revenue', value: `₹${(stats?.totalRevenue ?? 0).toLocaleString()}`, color: 'bg-green-500' },
    { label: 'Packages', value: stats?.totalPackages ?? 0, color: 'bg-purple-500' },
    { label: 'Tests', value: stats?.totalTests ?? 0, color: 'bg-orange-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`w-10 h-10 ${card.color} rounded-lg opacity-20`} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Order ID</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.recentBookings?.length ? stats.recentBookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">#{b.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{b.patientName}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      b.status === 'completed' ? 'bg-green-100 text-green-700' :
                      b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{b.status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">₹{b.totalAmount}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No recent orders</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
