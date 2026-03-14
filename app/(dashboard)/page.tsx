'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface RecentBooking {
  id: string;
  customBookingId: string;
  customerName: string;
  customerPhone: string;
  status: string;
  finalAmount: number;
  createdAt: string;
  itemsCount: number;
}

interface Stats {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  totalPackages: number;
  totalTests: number;
  recentBookings: RecentBooking[];
}

const statusColor = (s: string) => {
  switch (s) {
    case 'completed': return 'bg-green-100 text-green-700';
    case 'confirmed': return 'bg-blue-100 text-blue-700';
    case 'collected': return 'bg-orange-100 text-orange-700';
    case 'cancelled': return 'bg-red-100 text-red-700';
    case 'pending': return 'bg-yellow-100 text-yellow-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadStats = useCallback(() => {
    api.get('/api/admin/stats')
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, [loadStats]);

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
      </div>
    </div>;
  }

  const cards = [
    { label: 'Total Orders', value: stats?.totalOrders ?? 0, color: 'bg-blue-500' },
    { label: "Today's Orders", value: stats?.todayOrders ?? 0, color: 'bg-indigo-500' },
    { label: 'Total Revenue', value: `₹${(stats?.totalRevenue ?? 0).toLocaleString()}`, color: 'bg-green-500' },
    { label: "Today's Revenue", value: `₹${(stats?.todayRevenue ?? 0).toLocaleString()}`, color: 'bg-emerald-500' },
    { label: 'Published Packages', value: stats?.totalPackages ?? 0, color: 'bg-purple-500' },
    { label: 'Active Tests', value: stats?.totalTests ?? 0, color: 'bg-orange-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{card.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`w-8 h-8 ${card.color} rounded-lg opacity-20`} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <button onClick={() => router.push('/orders')} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.recentBookings?.length ? stats.recentBookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push('/orders')}>
                  <td className="px-6 py-4 text-sm font-mono font-medium text-gray-900">{b.customBookingId}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{b.customerName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{b.customerPhone}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${statusColor(b.status)}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{b.finalAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No recent orders</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
