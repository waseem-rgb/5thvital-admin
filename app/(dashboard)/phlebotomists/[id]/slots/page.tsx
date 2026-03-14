'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Slot {
  id: string;
  slotDate: string;
  slotTime: string;
  maxBookings: number;
  currentBookings: number;
  isAvailable: boolean;
}

const TIME_OPTIONS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
];

const DAYS_OF_WEEK = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

const fmtTime = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

function getDateRange(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  const start = new Date(startStr + 'T00:00:00');
  const end = new Date(endStr + 'T00:00:00');
  while (start <= end) {
    dates.push(start.toISOString().split('T')[0]);
    start.setDate(start.getDate() + 1);
  }
  return dates;
}

export default function PhlebotomistSlotsPage() {
  const params = useParams();
  const router = useRouter();
  const phlebId = params.id as string;

  const [slots, setSlots] = useState<Slot[]>([]);
  const [phlebName, setPhlebName] = useState('');
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  // Bulk add modal
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkFrom, setBulkFrom] = useState(fromDate);
  const [bulkTo, setBulkTo] = useState(toDate);
  const [bulkTimes, setBulkTimes] = useState<string[]>(['07:00', '08:00', '09:00', '10:00']);
  const [bulkMax, setBulkMax] = useState(1);
  const [bulkSaving, setBulkSaving] = useState(false);

  // Recurring schedule
  const [recurStartDate, setRecurStartDate] = useState(fromDate);
  const [recurEndDate, setRecurEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [recurSkipDays, setRecurSkipDays] = useState<number[]>([0]); // skip Sunday by default
  const [recurTimes, setRecurTimes] = useState<string[]>([
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  ]);
  const [recurMax, setRecurMax] = useState(1);
  const [recurSaving, setRecurSaving] = useState(false);
  const [recurResult, setRecurResult] = useState<{ created: number; skipped: number } | null>(null);

  const loadSlots = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/admin/slots?phlebotomistId=${phlebId}&from=${fromDate}&to=${toDate}`);
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [phlebId, fromDate, toDate]);

  useEffect(() => {
    loadSlots();
    // Fetch phlebotomist name
    api.get('/api/admin/phlebotomists').then((data: { phlebotomists?: { id: string; name: string }[] }) => {
      const p = (data.phlebotomists || []).find((ph) => ph.id === phlebId);
      if (p) setPhlebName(p.name);
    }).catch(() => {});
  }, [loadSlots, phlebId]);

  const deleteSlot = async (slotId: string) => {
    try {
      await api.del(`/api/admin/slots/${slotId}`);
      loadSlots();
    } catch {
      alert('Cannot delete slot (may have bookings)');
    }
  };

  const handleBulkAdd = async () => {
    if (bulkTimes.length === 0) return;
    setBulkSaving(true);
    try {
      await api.post('/api/admin/slots/bulk', {
        phlebotomistId: phlebId,
        fromDate: bulkFrom,
        toDate: bulkTo,
        times: bulkTimes,
        maxBookings: bulkMax,
      });
      setShowBulkAdd(false);
      loadSlots();
    } catch {
      alert('Failed to create slots');
    } finally {
      setBulkSaving(false);
    }
  };

  const toggleBulkTime = (t: string) => {
    setBulkTimes(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t].sort()
    );
  };

  const toggleRecurTime = (t: string) => {
    setRecurTimes(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t].sort()
    );
  };

  const toggleSkipDay = (day: number) => {
    setRecurSkipDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleRecurring = async () => {
    if (recurTimes.length === 0) return;
    setRecurSaving(true);
    setRecurResult(null);
    try {
      const data = await api.post('/api/admin/slots/recurring', {
        phlebotomistId: phlebId,
        startDate: recurStartDate,
        endDate: recurEndDate,
        times: recurTimes,
        skipDays: recurSkipDays,
        maxBookings: recurMax,
      });
      setRecurResult({ created: data.created, skipped: data.skipped });
      loadSlots();
    } catch {
      alert('Failed to generate recurring slots');
    } finally {
      setRecurSaving(false);
    }
  };

  // Group slots by date
  const dateRange = getDateRange(fromDate, toDate);
  const slotsByDate: Record<string, Slot[]> = {};
  for (const d of dateRange) slotsByDate[d] = [];
  for (const s of slots) {
    if (slotsByDate[s.slotDate]) slotsByDate[s.slotDate].push(s);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.push('/phlebotomists')} className="text-sm text-blue-600 hover:text-blue-800 mb-1">
            &larr; Back to Phlebotomists
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Slots: {phlebName || 'Loading...'}
          </h1>
        </div>
        <button
          onClick={() => setShowBulkAdd(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Bulk Add Slots
        </button>
      </div>

      {/* Set Recurring Schedule */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Set Recurring Schedule</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 w-20 flex-shrink-0">Start Date:</label>
            <input type="date" value={recurStartDate} onChange={e => setRecurStartDate(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 w-20 flex-shrink-0">End Date:</label>
            <input type="date" value={recurEndDate} onChange={e => setRecurEndDate(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Working Days</label>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map(day => {
              const isWorking = !recurSkipDays.includes(day.value);
              return (
                <button
                  key={day.value}
                  onClick={() => toggleSkipDay(day.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    isWorking
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-400 border-gray-300 line-through'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Time Slots</label>
          <div className="flex flex-wrap gap-2">
            {TIME_OPTIONS.map(t => (
              <button
                key={t}
                onClick={() => toggleRecurTime(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  recurTimes.includes(t)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                }`}
              >
                {fmtTime(t)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Max per slot:</label>
            <input type="number" min={1} max={10} value={recurMax}
              onChange={e => setRecurMax(parseInt(e.target.value) || 1)}
              className="w-16 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-center" />
          </div>
          <button
            onClick={handleRecurring}
            disabled={recurSaving || recurTimes.length === 0}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {recurSaving ? 'Generating...' : 'Generate Slots'}
          </button>
          {recurResult && (
            <span className="text-sm text-green-700 font-medium">
              Created {recurResult.created} slots, skipped {recurResult.skipped} existing
            </span>
          )}
        </div>
      </div>

      {/* Date range picker for calendar view */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm text-gray-600">View from:</label>
        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
        <label className="text-sm text-gray-600">to:</label>
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
      </div>

      {/* Bulk Add Modal */}
      {showBulkAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowBulkAdd(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-[480px] max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Bulk Add Slots</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input type="date" value={bulkFrom} onChange={e => setBulkFrom(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input type="date" value={bulkTo} onChange={e => setBulkTo(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Slots</label>
                <div className="flex flex-wrap gap-2">
                  {TIME_OPTIONS.map(t => (
                    <button
                      key={t}
                      onClick={() => toggleBulkTime(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        bulkTimes.includes(t)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {fmtTime(t)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Bookings per Slot</label>
                <input type="number" min={1} max={10} value={bulkMax}
                  onChange={e => setBulkMax(parseInt(e.target.value) || 1)}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleBulkAdd}
                  disabled={bulkSaving || bulkTimes.length === 0}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {bulkSaving ? 'Creating...' : `Create ${bulkTimes.length} slots/day`}
                </button>
                <button
                  onClick={() => setShowBulkAdd(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading slots...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dateRange.map(date => {
            const daySlots = slotsByDate[date] || [];
            const isToday = date === new Date().toISOString().split('T')[0];
            return (
              <div key={date} className={`bg-white rounded-xl border p-4 ${isToday ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-sm text-gray-900">
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </h3>
                  {isToday && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Today</span>}
                </div>
                {daySlots.length === 0 ? (
                  <p className="text-xs text-gray-400">No slots</p>
                ) : (
                  <div className="space-y-1.5">
                    {daySlots.sort((a, b) => a.slotTime.localeCompare(b.slotTime)).map(s => (
                      <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-2.5 py-1.5">
                        <div>
                          <span className="text-xs font-medium text-gray-900">{fmtTime(s.slotTime)}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {s.currentBookings}/{s.maxBookings}
                          </span>
                        </div>
                        {s.currentBookings === 0 ? (
                          <button
                            onClick={() => deleteSlot(s.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                            title="Delete slot"
                          >
                            &times;
                          </button>
                        ) : (
                          <span className="text-xs text-green-600 font-medium">Booked</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
