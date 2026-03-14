'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface BookingItem {
  id: string;
  name: string;
  price: number | string;
  type: 'test' | 'package';
}

interface Booking {
  id: string;
  customBookingId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAge?: number;
  customerGender?: string;
  address?: string;
  preferredDate?: string;
  preferredTime?: string;
  status: string;
  totalAmount: number | string;
  finalAmount?: number | string;
  discountAmount?: number | string;
  couponCode?: string;
  notes?: string;
  items: BookingItem[];
  createdAt: string;
}

const STATUSES = ['pending', 'confirmed', 'collected', 'completed', 'cancelled'] as const;

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

const fmtAmount = (val: number | string | undefined): string => {
  if (val == null) return '₹0';
  const n = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(n) ? '₹0' : `₹${n.toLocaleString()}`;
};

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

const fmtTime = (d: string) => {
  try { return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
};

export default function OrdersPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const loadBookings = useCallback(() => {
    api.get('/api/admin/bookings')
      .then((data) => {
        const list = Array.isArray(data) ? data : data.bookings || [];
        setBookings(list);
      })
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadBookings();
    const interval = setInterval(loadBookings, 30000);
    return () => clearInterval(interval);
  }, [loadBookings]);

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    setUpdatingStatus(bookingId);
    try {
      await api.put(`/api/admin/bookings/${bookingId}/status`, { status: newStatus });
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
      if (selected?.id === bookingId) {
        setSelected(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch {
      alert('Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const todayCount = bookings.filter(b => {
    try { return new Date(b.createdAt).toDateString() === new Date().toDateString(); }
    catch { return false; }
  }).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">{todayCount} today &middot; {bookings.length} total</p>
        </div>
        <button onClick={() => { setLoading(true); loadBookings(); }}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          Refresh
        </button>
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
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.length ? bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 font-mono">
                      {b.customBookingId || b.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{b.customerName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{b.customerPhone}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{b.items?.length || 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{fmtAmount(b.totalAmount)}</td>
                    <td className="px-6 py-4">
                      <select
                        value={b.status}
                        onChange={(e) => handleStatusChange(b.id, e.target.value)}
                        disabled={updatingStatus === b.id}
                        className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer ${statusColor(b.status)} ${updatingStatus === b.id ? 'opacity-50' : ''}`}
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{fmtDate(b.createdAt)}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => setSelected(b)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View
                      </button>
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

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Order {selected.customBookingId || selected.id.slice(0, 8)}
                </h2>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Customer</span>
                    <p className="font-medium text-gray-900">{selected.customerName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone</span>
                    <p className="font-medium text-gray-900">{selected.customerPhone}</p>
                  </div>
                  {selected.customerEmail && (
                    <div>
                      <span className="text-gray-500">Email</span>
                      <p className="font-medium text-gray-900">{selected.customerEmail}</p>
                    </div>
                  )}
                  {selected.customerAge && (
                    <div>
                      <span className="text-gray-500">Age / Gender</span>
                      <p className="font-medium text-gray-900">{selected.customerAge}{selected.customerGender ? ` / ${selected.customerGender}` : ''}</p>
                    </div>
                  )}
                  {selected.address && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Address</span>
                      <p className="font-medium text-gray-900">{selected.address}</p>
                    </div>
                  )}
                  {selected.preferredDate && (
                    <div>
                      <span className="text-gray-500">Preferred Date</span>
                      <p className="font-medium text-gray-900">{selected.preferredDate}</p>
                    </div>
                  )}
                  {selected.preferredTime && (
                    <div>
                      <span className="text-gray-500">Preferred Time</span>
                      <p className="font-medium text-gray-900">{selected.preferredTime}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Created</span>
                    <p className="font-medium text-gray-900">{fmtDate(selected.createdAt)} {fmtTime(selected.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status</span>
                    <p>
                      <select
                        value={selected.status}
                        onChange={(e) => handleStatusChange(selected.id, e.target.value)}
                        disabled={updatingStatus === selected.id}
                        className={`text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer ${statusColor(selected.status)}`}
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                        ))}
                      </select>
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Items ({selected.items?.length || 0})</h3>
                  <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
                    {selected.items?.length ? selected.items.map((item, i) => (
                      <div key={item.id || i} className="px-4 py-3 flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium text-gray-900">{item.name}</span>
                          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${item.type === 'package' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {item.type}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{fmtAmount(item.price)}</span>
                      </div>
                    )) : (
                      <div className="px-4 py-3 text-sm text-gray-400">No items</div>
                    )}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t border-gray-200 pt-3 space-y-1 text-sm">
                  {selected.couponCode && (
                    <div className="flex justify-between text-gray-600">
                      <span>Coupon: {selected.couponCode}</span>
                      <span>-{fmtAmount(selected.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-gray-900 text-base">
                    <span>Total</span>
                    <span>{fmtAmount(selected.totalAmount)}</span>
                  </div>
                </div>

                {selected.notes && (
                  <div className="text-sm">
                    <span className="text-gray-500">Notes</span>
                    <p className="mt-1 text-gray-700 bg-gray-50 rounded-lg p-3">{selected.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
