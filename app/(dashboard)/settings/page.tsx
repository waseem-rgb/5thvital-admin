'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Settings {
  siteName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  gstNumber: string;
  minimumOrderAmount: number;
  serviceableAreas: string;
  collectionStartTime: string;
  collectionEndTime: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    siteName: '', contactEmail: '', contactPhone: '', address: '',
    gstNumber: '', minimumOrderAmount: 0, serviceableAreas: '',
    collectionStartTime: '', collectionEndTime: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/api/settings')
      .then((data) => setSettings(data.settings || data || settings))
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await api.put('/api/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="animate-pulse"><div className="h-8 bg-gray-200 rounded w-48 mb-4" /><div className="h-96 bg-gray-200 rounded-xl" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
              <input value={settings.siteName} onChange={e => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input type="email" value={settings.contactEmail} onChange={e => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input value={settings.contactPhone} onChange={e => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
              <input value={settings.gstNumber} onChange={e => setSettings({ ...settings, gstNumber: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount (₹)</label>
              <input type="number" value={settings.minimumOrderAmount} onChange={e => setSettings({ ...settings, minimumOrderAmount: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serviceable Areas</label>
              <input value={settings.serviceableAreas} onChange={e => setSettings({ ...settings, serviceableAreas: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Comma separated" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Collection Start Time</label>
              <input type="time" value={settings.collectionStartTime} onChange={e => setSettings({ ...settings, collectionStartTime: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Collection End Time</label>
              <input type="time" value={settings.collectionEndTime} onChange={e => setSettings({ ...settings, collectionEndTime: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea value={settings.address} onChange={e => setSettings({ ...settings, address: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} />
          </div>
          <div className="flex items-center gap-4">
            <button type="submit" disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            {saved && <span className="text-green-600 text-sm font-medium">Settings saved successfully!</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
