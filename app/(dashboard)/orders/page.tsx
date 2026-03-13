'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Booking {
  id: string;
  patientName: string;
  patientPhone: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  packageName?: string;
}

export default function OrdersPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/bookings')
      .then((data) => setBookings(data.bookings || data || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const statusColor = (s: string) => {
    switch (s) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <span className="text-sm text-gray-500">{bookings.length} total</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Patient</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Package</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.length ? bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{typeof b.id === 'string' ? b.id.slice(0, 8) : b.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{b.patientName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{b.patientPhone}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{b.packageName || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">₹{b.totalAmount}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColor(b.status)}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <Link href={`/orders/${b.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View
                      </Link>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-400">No orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
