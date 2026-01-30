'use client'

import { useState } from 'react'
import { Setting } from '@/lib/types'
import { createSettingAction, deleteSettingAction, updateSettingAction } from '@/lib/actions/settings'
import { useRouter } from 'next/navigation'

interface SettingsFormProps {
  settings: Setting[]
  canEdit: boolean
}

export default function SettingsForm({ settings, canEdit }: SettingsFormProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('{}')
  const [newDescription, setNewDescription] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()

  const handleEdit = (setting: Setting) => {
    setEditingKey(setting.key)
    setEditValue(JSON.stringify(setting.value, null, 2))
    setError(null)
  }

  const handleSave = async (key: string) => {
    setLoading(true)
    setError(null)

    const result = await updateSettingAction({ key, valueJson: editValue })

    if (!result.success) {
      setError(result.error || 'Failed to save setting')
      setLoading(false)
      return
    }

    setEditingKey(null)
    router.refresh()
    setLoading(false)
  }

  const handleAdd = async () => {
    setLoading(true)
    setError(null)

    const result = await createSettingAction({
      key: newKey,
      valueJson: newValue,
      description: newDescription || undefined,
    })

    if (!result.success) {
      setError(result.error || 'Failed to add setting. Key may already exist.')
      setLoading(false)
      return
    }

    setNewKey('')
    setNewValue('{}')
    setNewDescription('')
    setShowAddForm(false)
    router.refresh()
    setLoading(false)
  }

  const handleDelete = async (key: string) => {
    if (!confirm(`Are you sure you want to delete the setting "${key}"?`)) {
      return
    }

    setLoading(true)
    const result = await deleteSettingAction({ key })
    if (!result.success) {
      console.error('Error deleting setting:', result.error)
      alert('Failed to delete setting')
      setLoading(false)
      return
    }

    router.refresh()
    setLoading(false)
  }

  if (settings.length === 0 && !showAddForm) {
    return (
      <div className="card p-8 text-center">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No settings yet</h3>
        <p className="text-gray-600 mb-4">Add your first setting to configure your site.</p>
        {canEdit && (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary"
          >
            Add Setting
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add New Setting */}
      {canEdit && (
        <div className="card p-6">
          {showAddForm ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Add New Setting</h3>
              
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key
                  </label>
                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="site_name"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Brief description"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value (JSON)
                </label>
                <textarea
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="textarea font-mono text-sm min-h-[100px]"
                  spellCheck={false}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setError(null)
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={loading || !newKey}
                  className="btn btn-primary"
                >
                  {loading ? 'Adding...' : 'Add Setting'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Setting
            </button>
          )}
        </div>
      )}

      {/* Settings List */}
      {settings.map((setting) => (
        <div key={setting.id} className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">{setting.key}</h3>
              {setting.description && (
                <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
              )}
            </div>
            {canEdit && editingKey !== setting.key && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(setting)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(setting.key)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {editingKey === setting.key ? (
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="textarea font-mono text-sm min-h-[150px]"
                spellCheck={false}
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setEditingKey(null)
                    setError(null)
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSave(setting.key)}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
              {JSON.stringify(setting.value, null, 2)}
            </pre>
          )}

          <div className="mt-4 text-xs text-gray-500">
            Last updated: {new Date(setting.updated_at).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )
}
