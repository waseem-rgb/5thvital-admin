'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

interface Package {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: 'published' | 'draft';
  isFeatured: boolean;
  price: string | number | null;
  originalPrice: string | number | null;
  discountPercent: string | number | null;
  testsCount: number | null;
  sortOrder: number | null;
  parameters: SelectedTest[] | null;
  faqs: FAQ[] | null;
  highlights: string | null;
  reportsWithinHours: number | null;
}

interface SelectedTest {
  id: string;
  name: string;
  price: number;
  reason?: string;
}

interface SearchTest {
  id: string;
  name: string;
  price: number;
  bodySystem: string;
  sampleType: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface AISuggestion {
  suggestedName: string;
  slug: string;
  description: string;
  highlights: string;
  selectedTests: (SelectedTest & { reason?: string })[];
  suggestedMrp: number;
  suggestedPrice: number;
  discountPercent: number;
  testsCount: number;
  reportsWithinHours: number;
  faqs: FAQ[];
}

// ─── Quick prompt chips ──────────────────
const QUICK_PROMPTS = [
  'Diabetes Care',
  'Heart Health',
  "Women's Health",
  'Senior Citizen Checkup',
  'Pre-employment Screening',
  'Thyroid Profile',
  'Liver & Kidney Function',
  'Full Body Checkup',
];

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── Simple form (create/edit) ──────────
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', price: '', originalPrice: '', status: 'published' });
  const [saving, setSaving] = useState(false);

  // ─── AI Builder state ──────────────────
  const [aiOpen, setAiOpen] = useState(false);
  const [aiStep, setAiStep] = useState<'prompt' | 'review'>('prompt');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBudget, setAiBudget] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [, setSuggestion] = useState<AISuggestion | null>(null);

  // ─── AI review form ──────────────────
  const [reviewName, setReviewName] = useState('');
  const [reviewSlug, setReviewSlug] = useState('');
  const [reviewDesc, setReviewDesc] = useState('');
  const [reviewHighlights, setReviewHighlights] = useState('');
  const [reviewMrp, setReviewMrp] = useState('');
  const [reviewPrice, setReviewPrice] = useState('');
  const [reviewDiscount, setReviewDiscount] = useState('');
  const [reviewHours, setReviewHours] = useState('');
  const [reviewTests, setReviewTests] = useState<(SelectedTest & { reason?: string })[]>([]);
  const [reviewFaqs, setReviewFaqs] = useState<FAQ[]>([]);
  const [reviewStatus, setReviewStatus] = useState('published');
  const [reviewPin, setReviewPin] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [showReasons, setShowReasons] = useState(false);

  // ─── Test search ──────────────────────
  const [testSearch, setTestSearch] = useState('');
  const [testResults, setTestResults] = useState<SearchTest[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Edit package test management ────
  const [editTestsPkgId, setEditTestsPkgId] = useState<string | null>(null);
  const [editTestsList, setEditTestsList] = useState<SelectedTest[]>([]);
  const [editTestSearch, setEditTestSearch] = useState('');
  const [editTestResults, setEditTestResults] = useState<SearchTest[]>([]);
  const [editSearchLoading, setEditSearchLoading] = useState(false);
  const editSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Load packages ─────────────────────
  const loadPackages = useCallback(() => {
    setLoading(true);
    api.get('/api/admin/packages')
      .then((data) => setPackages(data.packages || []))
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadPackages(); }, [loadPackages]);

  // ─── Simple create/edit ─────────────────
  function openCreate() {
    setEditing(null);
    setForm({ name: '', slug: '', description: '', price: '', originalPrice: '', status: 'published' });
    setShowForm(true);
  }

  function openEdit(pkg: Package) {
    setEditing(pkg);
    setForm({
      name: pkg.name,
      slug: pkg.slug || '',
      description: pkg.description || '',
      price: pkg.price != null ? String(pkg.price) : '',
      originalPrice: pkg.originalPrice != null ? String(pkg.originalPrice) : '',
      status: pkg.status || 'draft',
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        price: form.price ? Number(form.price) : null,
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        status: form.status,
      };
      if (editing) {
        await api.put(`/api/admin/packages/${editing.id}`, body);
      } else {
        await api.post('/api/admin/packages', body);
      }
      setShowForm(false);
      loadPackages();
    } catch {
      alert('Failed to save package');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this package?')) return;
    try {
      await api.del(`/api/admin/packages/${id}`);
      loadPackages();
    } catch {
      alert('Failed to delete package');
    }
  }

  async function handlePin(id: string, pinned: boolean) {
    try {
      await api.put(`/api/admin/packages/${id}/pin`, { pinned });
      loadPackages();
    } catch {
      alert('Failed to pin package');
    }
  }

  // ─── AI Builder ─────────────────────────
  function openAiBuilder() {
    setAiStep('prompt');
    setAiPrompt('');
    setAiBudget('');
    setAiError('');
    setSuggestion(null);
    setAiOpen(true);
  }

  async function generatePackage() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError('');
    try {
      const data = await api.post('/api/admin/packages/ai-suggest', {
        prompt: aiPrompt,
        budget: aiBudget ? Number(aiBudget) : undefined,
      });
      if (!data.suggestion) throw new Error('No suggestion returned');
      const s: AISuggestion = data.suggestion;
      setSuggestion(s);
      setReviewName(s.suggestedName);
      setReviewSlug(s.slug);
      setReviewDesc(s.description);
      setReviewHighlights(s.highlights);
      setReviewMrp(String(s.suggestedMrp));
      setReviewPrice(String(s.suggestedPrice));
      setReviewDiscount(String(s.discountPercent));
      setReviewHours(String(s.reportsWithinHours || 24));
      setReviewTests(s.selectedTests || []);
      setReviewFaqs(s.faqs || []);
      setReviewStatus('published');
      setReviewPin(false);
      setAiStep('review');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI generation failed';
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  }

  // Recalculate discount when MRP or price changes
  function onMrpChange(val: string) {
    setReviewMrp(val);
    const mrp = parseFloat(val);
    const price = parseFloat(reviewPrice);
    if (mrp > 0 && price > 0) {
      setReviewDiscount(String(Math.round((1 - price / mrp) * 100)));
    }
  }

  function onPriceChange(val: string) {
    setReviewPrice(val);
    const mrp = parseFloat(reviewMrp);
    const price = parseFloat(val);
    if (mrp > 0 && price > 0) {
      setReviewDiscount(String(Math.round((1 - price / mrp) * 100)));
    }
  }

  function removeReviewTest(testId: string) {
    setReviewTests(prev => prev.filter(t => t.id !== testId));
  }

  // Test search with debounce
  function handleTestSearch(val: string) {
    setTestSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!val.trim()) { setTestResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await api.post('/api/admin/packages/ai-search-tests', { query: val, limit: 15 });
        setTestResults(data.tests || []);
      } catch {
        setTestResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }

  function addTestToReview(test: SearchTest) {
    if (reviewTests.some(t => t.id === test.id)) return;
    setReviewTests(prev => [...prev, { id: test.id, name: test.name, price: test.price }]);
    setTestSearch('');
    setTestResults([]);
  }

  // FAQ management
  function addFaq() {
    setReviewFaqs(prev => [...prev, { question: '', answer: '' }]);
  }

  function updateFaq(idx: number, field: 'question' | 'answer', val: string) {
    setReviewFaqs(prev => prev.map((f, i) => i === idx ? { ...f, [field]: val } : f));
  }

  function removeFaq(idx: number) {
    setReviewFaqs(prev => prev.filter((_, i) => i !== idx));
  }

  // Save AI-built package
  async function saveAiPackage() {
    setReviewSaving(true);
    try {
      const body = {
        name: reviewName,
        slug: reviewSlug,
        description: reviewDesc,
        highlights: reviewHighlights,
        price: Number(reviewPrice),
        originalPrice: Number(reviewMrp),
        discountPercent: Number(reviewDiscount),
        reportsWithinHours: Number(reviewHours),
        selectedTests: reviewTests.map(t => ({ id: t.id, name: t.name, price: t.price })),
        faqs: reviewFaqs.filter(f => f.question.trim()),
        status: reviewStatus,
        sortOrder: reviewPin ? 0 : undefined,
      };
      await api.post('/api/admin/packages', body);
      setAiOpen(false);
      loadPackages();
    } catch {
      alert('Failed to save package');
    } finally {
      setReviewSaving(false);
    }
  }

  // ─── Edit package test management ──────
  function openTestManager(pkg: Package) {
    setEditTestsPkgId(pkg.id);
    const tests = Array.isArray(pkg.parameters) ? pkg.parameters : [];
    setEditTestsList(tests);
    setEditTestSearch('');
    setEditTestResults([]);
  }

  function handleEditTestSearch(val: string) {
    setEditTestSearch(val);
    if (editSearchTimer.current) clearTimeout(editSearchTimer.current);
    if (!val.trim()) { setEditTestResults([]); return; }
    editSearchTimer.current = setTimeout(async () => {
      setEditSearchLoading(true);
      try {
        const data = await api.post('/api/admin/packages/ai-search-tests', { query: val, limit: 15 });
        setEditTestResults(data.tests || []);
      } catch {
        setEditTestResults([]);
      } finally {
        setEditSearchLoading(false);
      }
    }, 300);
  }

  async function addTestToPackage(test: SearchTest) {
    if (!editTestsPkgId) return;
    if (editTestsList.some(t => t.id === test.id)) return;
    try {
      await api.post(`/api/admin/packages/${editTestsPkgId}/tests/add`, {
        testId: test.id, testName: test.name, price: test.price,
      });
      setEditTestsList(prev => [...prev, { id: test.id, name: test.name, price: test.price }]);
      setEditTestSearch('');
      setEditTestResults([]);
      loadPackages();
    } catch {
      alert('Failed to add test');
    }
  }

  async function removeTestFromPackage(testId: string) {
    if (!editTestsPkgId) return;
    try {
      await api.del(`/api/admin/packages/${editTestsPkgId}/tests/${testId}`);
      setEditTestsList(prev => prev.filter(t => t.id !== testId));
      loadPackages();
    } catch {
      alert('Failed to remove test');
    }
  }

  // ─── Helpers ──────────────────────────
  const fmtPrice = (val: string | number | null): string => {
    if (val == null) return '-';
    const n = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(n) ? '-' : `\u20B9${n.toLocaleString()}`;
  };

  const reviewTotal = reviewTests.reduce((s, t) => s + (t.price || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Packages</h1>
        <div className="flex gap-3">
          <button onClick={openAiBuilder}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-indigo-700 shadow-sm">
            AI Build Package
          </button>
          <button onClick={openCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            + Add Package
          </button>
        </div>
      </div>

      {/* Simple create/edit form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{editing ? 'Edit Package' : 'New Package'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (₹)</label>
              <input type="number" value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹)</label>
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Tests Manager */}
      {editTestsPkgId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Manage Tests ({editTestsList.length} tests)
            </h2>
            <button onClick={() => setEditTestsPkgId(null)}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
          </div>

          {/* Search to add */}
          <div className="relative mb-4">
            <input value={editTestSearch} onChange={e => handleEditTestSearch(e.target.value)}
              placeholder="Search tests to add..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            {editSearchLoading && <div className="absolute right-3 top-2.5 text-xs text-gray-400">Searching...</div>}
            {editTestResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {editTestResults.map(t => (
                  <button key={t.id} onClick={() => addTestToPackage(t)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex justify-between items-center"
                    disabled={editTestsList.some(et => et.id === t.id)}>
                    <span className={editTestsList.some(et => et.id === t.id) ? 'text-gray-400' : 'text-gray-900'}>
                      {t.name}
                    </span>
                    <span className="text-gray-500 text-xs">{fmtPrice(t.price)} &middot; {t.bodySystem}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Current tests */}
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {editTestsList.map(t => (
              <div key={t.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50">
                <span className="text-sm text-gray-900">{t.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{fmtPrice(t.price)}</span>
                  <button onClick={() => removeTestFromPackage(t.id)}
                    className="text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
                </div>
              </div>
            ))}
            {editTestsList.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No tests in this package</p>}
          </div>
        </div>
      )}

      {/* Packages table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Slug</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">MRP</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Discount</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tests</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {packages.length ? packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {pkg.name}
                      {(pkg.sortOrder === 0 || pkg.isFeatured) && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Featured</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{pkg.slug}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{fmtPrice(pkg.originalPrice)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{fmtPrice(pkg.price)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {pkg.discountPercent != null ? `${parseFloat(String(pkg.discountPercent))}%` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{pkg.testsCount ?? '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        pkg.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {pkg.status === 'published' ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => openEdit(pkg)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
                        <button onClick={() => openTestManager(pkg)} className="text-purple-600 hover:text-purple-800 text-sm font-medium">Tests</button>
                        <button onClick={() => handlePin(pkg.id, pkg.sortOrder !== 0)}
                          className="text-yellow-600 hover:text-yellow-800 text-sm font-medium">
                          {pkg.sortOrder === 0 ? 'Unpin' : 'Pin'}
                        </button>
                        <button onClick={() => handleDelete(pkg.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-400">No packages found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── AI Builder Modal ─────────────────────────────── */}
      {aiOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 my-auto">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="text-purple-600">AI</span> Package Builder
              </h2>
              <button onClick={() => setAiOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
            </div>

            {/* STEP 1: Prompt */}
            {aiStep === 'prompt' && (
              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe the package you want to create:
                </label>
                <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                  rows={4} placeholder='e.g. "Create a comprehensive diabetes package for adults above 40 that includes blood sugar, kidney function, and cholesterol tests"'
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4" />

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget (optional)</label>
                  <div className="relative w-48">
                    <span className="absolute left-3 top-2 text-gray-500 text-sm">₹</span>
                    <input type="number" value={aiBudget} onChange={e => setAiBudget(e.target.value)}
                      placeholder="flexible" className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm" />
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-xs text-gray-500 mb-2">Quick prompts:</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_PROMPTS.map(qp => (
                      <button key={qp} onClick={() => setAiPrompt(`Create a ${qp} package`)}
                        className="bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 px-3 py-1.5 rounded-full text-xs font-medium transition-colors">
                        {qp}
                      </button>
                    ))}
                  </div>
                </div>

                {aiError && (
                  <div className="bg-red-50 text-red-700 rounded-lg p-3 mb-4 text-sm">{aiError}</div>
                )}

                <button onClick={generatePackage} disabled={aiLoading || !aiPrompt.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all">
                  {aiLoading ? 'AI is analyzing 500+ tests and designing your package...' : 'Generate Package'}
                </button>
              </div>
            )}

            {/* STEP 2: Review */}
            {aiStep === 'review' && (
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                {/* Back + Regenerate */}
                <div className="flex items-center gap-3">
                  <button onClick={() => setAiStep('prompt')}
                    className="text-sm text-gray-500 hover:text-gray-700">&larr; Back</button>
                  <button onClick={generatePackage} disabled={aiLoading}
                    className="text-sm text-purple-600 hover:text-purple-800 font-medium">
                    {aiLoading ? 'Regenerating...' : 'Regenerate'}
                  </button>
                </div>

                {/* Name + Slug */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Package Name</label>
                    <input value={reviewName} onChange={e => setReviewName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Slug</label>
                    <input value={reviewSlug} onChange={e => setReviewSlug(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                  <textarea value={reviewDesc} onChange={e => setReviewDesc(e.target.value)}
                    rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>

                {/* Highlights */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Highlights (pipe-separated)</label>
                  <input value={reviewHighlights} onChange={e => setReviewHighlights(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>

                {/* Pricing */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 mb-3">Pricing</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">MRP (₹)</label>
                      <input type="number" value={reviewMrp} onChange={e => onMrpChange(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Price (₹)</label>
                      <input type="number" value={reviewPrice} onChange={e => onPriceChange(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Discount %</label>
                      <input type="number" value={reviewDiscount} onChange={e => setReviewDiscount(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100" readOnly />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Tests total value: {fmtPrice(reviewTotal)} &middot; Reports within: {reviewHours}h</p>
                </div>

                {/* Selected Tests */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-900">Selected Tests ({reviewTests.length})</p>
                    <button onClick={() => setShowReasons(!showReasons)}
                      className="text-xs text-purple-600 hover:text-purple-800">
                      {showReasons ? 'Hide' : 'Show'} AI reasoning
                    </button>
                  </div>

                  {/* Search to add */}
                  <div className="relative mb-3">
                    <input value={testSearch} onChange={e => handleTestSearch(e.target.value)}
                      placeholder="Search tests to add..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    {searchLoading && <span className="absolute right-3 top-2.5 text-xs text-gray-400">Searching...</span>}
                    {testResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {testResults.map(t => (
                          <button key={t.id} onClick={() => addTestToReview(t)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex justify-between"
                            disabled={reviewTests.some(rt => rt.id === t.id)}>
                            <span className={reviewTests.some(rt => rt.id === t.id) ? 'text-gray-400' : 'text-gray-900'}>
                              {t.name}
                            </span>
                            <span className="text-gray-500 text-xs">{fmtPrice(t.price)} &middot; {t.bodySystem}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Test list */}
                  <div className="space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                    {reviewTests.map(t => (
                      <div key={t.id} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-gray-900 truncate block">{t.name}</span>
                          {showReasons && t.reason && (
                            <span className="text-xs text-purple-600 italic">{t.reason}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-sm text-gray-500">{fmtPrice(t.price)}</span>
                          <button onClick={() => removeReviewTest(t.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
                        </div>
                      </div>
                    ))}
                    {reviewTests.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No tests selected</p>}
                  </div>
                </div>

                {/* FAQs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-900">FAQs ({reviewFaqs.length})</p>
                    <button onClick={addFaq} className="text-xs text-blue-600 hover:text-blue-800 font-medium">+ Add FAQ</button>
                  </div>
                  <div className="space-y-3">
                    {reviewFaqs.map((faq, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400">Q{idx + 1}</span>
                          <button onClick={() => removeFaq(idx)} className="text-red-500 text-xs">Remove</button>
                        </div>
                        <input value={faq.question} onChange={e => updateFaq(idx, 'question', e.target.value)}
                          placeholder="Question" className="w-full border border-gray-200 rounded px-2 py-1 text-sm mb-1" />
                        <textarea value={faq.answer} onChange={e => updateFaq(idx, 'answer', e.target.value)}
                          placeholder="Answer" rows={2} className="w-full border border-gray-200 rounded px-2 py-1 text-sm" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status + Pin */}
                <div className="flex items-center gap-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                    <select value={reviewStatus} onChange={e => setReviewStatus(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer mt-4">
                    <input type="checkbox" checked={reviewPin} onChange={e => setReviewPin(e.target.checked)}
                      className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Feature this package at top of website</span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button onClick={saveAiPackage} disabled={reviewSaving || !reviewName.trim() || !reviewSlug.trim()}
                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {reviewSaving ? 'Saving...' : 'Save Package'}
                  </button>
                  <button onClick={() => setAiStep('prompt')}
                    className="border border-gray-300 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Regenerate
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
