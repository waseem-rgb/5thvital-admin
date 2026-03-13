'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface BookingDetail {
  id: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  patientAge: number;
  patientGender: string;
  address: string;
  status: string;
  totalAmount: number;
  paymentStatus: string;
  packageName: string;
  tests: Array<{ name: string; price: number }>;
  collectionDate: string;
  collectionTime: string;
  createdAt: string;
}

const statuses = ['pending', 'confirmed', 'sample_collected', 'processing', 'completed', 'cancelled'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    api.get(`/api/bookings/${id}`)
      .then((data) => setBooking(data.booking || data))
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(status: string) {
    setUpdating(true);
    try {
      await api.put(`/api/bookings/${id}/status`, { status });
      setBooking((prev) => prev ? { ...prev, status } : prev);
    } catch {
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <div className="animate-pulse"><div className="h-8 bg-gray-200 rounded w-48 mb-4" /><div className="h-64 bg-gray-200 rounded-xl" /></div>;
  if (!booking) return <div className="text-center py-12 text-gray-400">Order not found</div>;

  return (
    <div>
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Orders
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Order #{typeof booking.id === 'string' ? booking.id.slice(0, 8) : booking.id}</h1>
        <div className="flex items-center gap-3">
          <select value={booking.status} onChange={(e) => updateStatus(e.target.value)} disabled={updating}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {statuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Details</h2>
          <dl className="space-y-3">
            {[
              ['Name', booking.patientName],
              ['Phone', booking.patientPhone],
              ['Email', booking.patientEmail],
              ['Age', booking.patientAge],
              ['Gender', booking.patientGender],
              ['Address', booking.address],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between">
                <dt className="text-sm text-gray-500">{String(label)}</dt>
                <dd className="text-sm font-medium text-gray-900">{String(value || '-')}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
          <dl className="space-y-3">
            {[
              ['Package', booking.packageName],
              ['Amount', `₹${booking.totalAmount}`],
              ['Payment', booking.paymentStatus],
              ['Collection Date', booking.collectionDate],
              ['Collection Time', booking.collectionTime],
              ['Ordered On', new Date(booking.createdAt).toLocaleString()],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between">
                <dt className="text-sm text-gray-500">{String(label)}</dt>
                <dd className="text-sm font-medium text-gray-900">{String(value || '-')}</dd>
              </div>
            ))}
          </dl>
        </div>

        {booking.tests?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tests Included</h2>
            <div className="space-y-2">
              {booking.tests.map((t, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700">{t.name}</span>
                  <span className="text-sm font-medium text-gray-900">₹{t.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
