import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Household, HouseholdMember } from '../types'
import { format } from 'date-fns'

interface Photo {
  id: string
  household_id: string
  uploaded_by: string
  storage_path: string
  caption: string | null
  created_at: string
  url?: string
}

interface Props {
  household: Household
  member: HouseholdMember
  members: HouseholdMember[]
}

export function PhotosPage({ household, member, members }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState<Photo | null>(null)
  const [caption, setCaption] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const loadPhotos = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('photos')
      .select('*')
      .eq('household_id', household.id)
      .order('created_at', { ascending: false })

    if (data) {
      const withUrls = await Promise.all(
        data.map(async (photo: Photo) => {
          const { data: urlData } = await supabase.storage
            .from('family-photos')
            .createSignedUrl(photo.storage_path, 3600)
          return { ...photo, url: urlData?.signedUrl }
        })
      )
      setPhotos(withUrls)
    }
    setLoading(false)
  }, [household.id])

  useEffect(() => { loadPhotos() }, [loadPhotos])

  async function handleUpload(file: File) {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${household.id}/${Date.now()}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('family-photos')
      .upload(path, file, { contentType: file.type })

    if (uploadErr) {
      alert('Upload failed: ' + uploadErr.message)
      setUploading(false)
      return
    }

    await supabase.from('photos').insert({
      household_id: household.id,
      uploaded_by: member.user_id,
      storage_path: path,
      caption: caption.trim() || null,
    })

    setCaption('')
    setUploading(false)
    loadPhotos()
  }

  async function handleDelete(photo: Photo) {
    await supabase.storage.from('family-photos').remove([photo.storage_path])
    await supabase.from('photos').delete().eq('id', photo.id)
    setSelected(null)
    loadPhotos()
  }

  const memberMap = new Map(members.map(m => [m.user_id, m]))

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Family Photos</h1>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded-xl"
          >
            + Upload
          </button>
        </div>
      </div>

      {/* Upload input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = '' }}
      />

      {uploading && (
        <div className="mx-4 mt-4 p-3 bg-green-50 rounded-xl text-center text-green-600 text-sm font-medium">
          Uploading photo…
        </div>
      )}

      {/* Grid */}
      <div className="px-4 pt-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-gray-400">Loading photos…</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-3">📷</div>
            <p className="text-gray-500 font-medium">No photos yet</p>
            <p className="text-gray-400 text-sm mt-1">Tap Upload to add your first family photo</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {photos.map(photo => (
              <button
                key={photo.id}
                onClick={() => setSelected(photo)}
                className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
              >
                {photo.url ? (
                  <img src={photo.url} alt={photo.caption ?? ''} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📷</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Photo detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setSelected(null)} className="text-white text-2xl">←</button>
            {selected.uploaded_by === member.user_id && (
              <button
                onClick={() => handleDelete(selected)}
                className="text-red-400 text-sm font-medium"
              >
                Delete
              </button>
            )}
          </div>

          <div className="flex-1 flex items-center justify-center p-4">
            {selected.url && (
              <img src={selected.url} alt={selected.caption ?? ''} className="max-w-full max-h-full object-contain rounded-xl" />
            )}
          </div>

          <div className="p-4 bg-black/60">
            {selected.caption && (
              <p className="text-white font-medium mb-1">{selected.caption}</p>
            )}
            <div className="flex items-center gap-2">
              {(() => {
                const uploader = memberMap.get(selected.uploaded_by)
                return uploader ? (
                  <>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: uploader.avatar_colour }}>
                      {uploader.display_name[0].toUpperCase()}
                    </div>
                    <p className="text-white/70 text-sm">{uploader.display_name}</p>
                  </>
                ) : null
              })()}
              <p className="text-white/50 text-xs ml-auto">{format(new Date(selected.created_at), 'MMM d, yyyy')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
