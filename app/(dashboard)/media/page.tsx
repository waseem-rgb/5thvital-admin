import { createClient } from '@/lib/supabase/server'
import { checkAdmin } from '@/lib/auth/requireAdmin'
import { AdminLayout } from '@/components/layout'
import { Media } from '@/lib/types'

async function getMedia(): Promise<Media[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching media:', error)
    return []
  }

  return data || []
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default async function MediaPage() {
  const { admin } = await checkAdmin()
  const media = await getMedia()

  if (!admin) return null

  return (
    <AdminLayout title="Media" role={admin.role} email={admin.email}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Media Library</h2>
            <p className="text-sm text-gray-600">
              {media.length} file{media.length !== 1 ? 's' : ''} in library
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Upload media through Supabase Storage
          </p>
        </div>

        {/* Media Grid */}
        {media.length === 0 ? (
          <div className="card p-8 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No media files</h3>
            <p className="text-gray-600">
              Upload media files through Supabase Storage to see them here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {media.map((item) => (
              <div
                key={item.id}
                className="card overflow-hidden group"
              >
                {/* Preview */}
                <div className="aspect-square bg-gray-100 relative">
                  {item.mime_type.startsWith('image/') ? (
                    <img
                      src={item.url}
                      alt={item.alt_text || item.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-100"
                    >
                      View
                    </a>
                  </div>
                </div>
                
                {/* Info */}
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 truncate" title={item.filename}>
                    {item.filename}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatFileSize(item.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
