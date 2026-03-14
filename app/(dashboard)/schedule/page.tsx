'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface Phlebotomist {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  todayCount: number;
}

interface ScheduleBooking {
  id: string;
  customBookingId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  preferredDate: string;
  preferredTime: string;
  status: string;
  phlebotomistId: string | null;
  phlebotomistName: string | null;
  finalAmount: number;
  items: { name: string; type: string }[];
}

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
];

const fmtTime12 = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const statusColor = (s: string) => {
  switch (s) {
    case 'confirmed': return 'border-blue-300 bg-blue-50';
    case 'collected': return 'border-green-300 bg-green-50';
    case 'completed': return 'border-green-400 bg-green-100';
    case 'pending': return 'border-yellow-300 bg-yellow-50';
    default: return 'border-gray-200 bg-gray-50';
  }
};

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getAreaFromAddress(address: string): string {
  if (!address) return '';
  const parts = address.split(',').map(p => p.trim());
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
}

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()));
  const [phlebotomists, setPhlebotomists] = useState<Phlebotomist[]>([]);
  const [bookings, setBookings] = useState<ScheduleBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedPhlebId, setSelectedPhlebId] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('10:00');
  const [showAddPhleb, setShowAddPhleb] = useState(false);
  const [newPhleb, setNewPhleb] = useState({ name: '', phone: '' });
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [phlebData, scheduleData] = await Promise.all([
        api.get('/api/admin/phlebotomists'),
        api.get(`/api/admin/schedule?from=${selectedDate}&to=${selectedDate}`),
      ]);
      setPhlebotomists(phlebData.phlebotomists || []);
      setBookings(scheduleData.bookings || []);
    } catch {
      setPhlebotomists([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const assignedBookings = bookings.filter(b => b.phlebotomistId);
  const unassignedBookings = bookings.filter(b => !b.phlebotomistId);

  const getPhlebBookings = (phlebId: string) =>
    assignedBookings.filter(b => b.phlebotomistId === phlebId);

  const handleAssign = async (bookingId: string) => {
    if (!selectedPhlebId) return;
    try {
      await api.put(`/api/admin/bookings/${bookingId}/assign`, {
        phlebotomistId: selectedPhlebId,
        scheduledTime: `${selectedDate}T${selectedTime}:00`,
      });
      setAssigning(null);
      setSelectedPhlebId('');
      loadData();
    } catch {
      alert('Failed to assign booking');
    }
  };

  const handleAddPhlebotomist = async () => {
    if (!newPhleb.name.trim()) return;
    setCreating(true);
    try {
      await api.post('/api/admin/phlebotomists', newPhleb);
      setNewPhleb({ name: '', phone: '' });
      setShowAddPhleb(false);
      loadData();
    } catch {
      alert('Failed to add phlebotomist');
    } finally {
      setCreating(false);
    }
  };

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(formatDate(d));
  };

  const activePhlebs = phlebotomists.filter(p => p.isActive);

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-sm text-gray-500 mt-1">
            {assignedBookings.length} assigned &middot; {unassignedBookings.length} unassigned
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => setSelectedDate(formatDate(new Date()))}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-2"
          >
            Today
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400">Loading schedule...</div>
      ) : (
        <div className="flex gap-6 h-[calc(100vh-160px)]">
          {/* Left sidebar: Phlebotomists */}
          <div className="w-64 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 text-sm">Phlebotomists</h2>
              <button onClick={() => setShowAddPhleb(!showAddPhleb)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                + Add
              </button>
            </div>

            {showAddPhleb && (
              <div className="p-3 border-b border-gray-100 space-y-2">
                <input
                  placeholder="Name"
                  value={newPhleb.name}
                  onChange={e => setNewPhleb(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                />
                <input
                  placeholder="Phone"
                  value={newPhleb.phone}
                  onChange={e => setNewPhleb(p => ({ ...p, phone: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                />
                <button
                  onClick={handleAddPhlebotomist}
                  disabled={creating || !newPhleb.name.trim()}
                  className="w-full bg-blue-600 text-white text-xs py-1.5 rounded-lg disabled:opacity-50"
                >
                  {creating ? 'Adding...' : 'Add'}
                </button>
              </div>
            )}

            <div className="divide-y divide-gray-50">
              {activePhlebs.length === 0 ? (
                <p className="p-4 text-sm text-gray-400">No phlebotomists</p>
              ) : activePhlebs.map(p => {
                const pBookings = getPhlebBookings(p.id);
                return (
                  <div key={p.id} className="p-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.phone}</p>
                      </div>
                      <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {pBookings.length}
                      </span>
                    </div>
                    {pBookings.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {pBookings.map(b => (
                          <div key={b.id} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                            {b.preferredTime || '—'} · {b.customerName}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main area: Day view */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-y-auto">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {TIME_SLOTS.map(slot => {
                const slotBookings = assignedBookings.filter(b => {
                  if (!b.preferredTime) return false;
                  const bTime = b.preferredTime.slice(0, 5);
                  return bTime === slot;
                });

                return (
                  <div key={slot} className="flex">
                    <div className="w-20 flex-shrink-0 py-3 px-3 text-xs font-medium text-gray-500 border-r border-gray-50">
                      {fmtTime12(slot)}
                    </div>
                    <div className="flex-1 py-2 px-3 min-h-[60px]">
                      {slotBookings.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {slotBookings.map(b => (
                            <div key={b.id} className={`border rounded-lg px-3 py-2 text-xs max-w-xs ${statusColor(b.status)}`}>
                              <div className="font-medium text-gray-900">{b.customerName}</div>
                              <div className="text-gray-600">{getAreaFromAddress(b.address)}</div>
                              <div className="text-gray-500 mt-0.5">
                                {b.items.length} tests · {b.phlebotomistName}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel: Unassigned bookings */}
          <div className="w-80 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 overflow-y-auto">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">
                Unassigned ({unassignedBookings.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {unassignedBookings.length === 0 ? (
                <p className="p-4 text-sm text-gray-400 text-center">All bookings assigned</p>
              ) : unassignedBookings.map(b => (
                <div key={b.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{b.customerName}</p>
                      <p className="text-xs text-gray-500">{b.customerPhone}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{getAreaFromAddress(b.address)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {b.items.length} items · {b.preferredTime || 'No time pref'}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-gray-400">
                      {b.customBookingId}
                    </span>
                  </div>

                  {assigning === b.id ? (
                    <div className="mt-2 space-y-2 border-t border-gray-100 pt-2">
                      <select
                        value={selectedPhlebId}
                        onChange={e => setSelectedPhlebId(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
                      >
                        <option value="">Select phlebotomist</option>
                        {activePhlebs.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <select
                        value={selectedTime}
                        onChange={e => setSelectedTime(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
                      >
                        {TIME_SLOTS.map(t => (
                          <option key={t} value={t}>{fmtTime12(t)}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAssign(b.id)}
                          disabled={!selectedPhlebId}
                          className="flex-1 bg-blue-600 text-white text-xs py-1.5 rounded-lg disabled:opacity-50"
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => { setAssigning(null); setSelectedPhlebId(''); }}
                          className="flex-1 border border-gray-200 text-gray-600 text-xs py-1.5 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAssigning(b.id); setSelectedPhlebId(''); setSelectedTime(b.preferredTime?.slice(0, 5) || '10:00'); }}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Assign →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
