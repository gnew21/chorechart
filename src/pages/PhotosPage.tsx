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
    <div className="pb-24 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-500 px-5 pt-14 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Family Photos</h1>
            <p className="text-cyan-100 text-sm mt-0.5">{photos.length} photos</p>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/20 text-white font-semibold rounded-2xl text-sm active:scale-95 transition-all"
          >
            <span>📷</span> Upload
          </button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = '' }}
      />

      <div className="px-4 -mt-4">
        {uploading && (
          <div className="card p-3 mb-4 text-center text-emerald-600 text-sm font-semibold">
            Uploading photo…
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-gray-400">Loading photos…</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-sm">📷</div>
            <p className="text-gray-700 font-bold text-lg">No photos yet</p>
            <p className="text-gray-400 text-sm mt-1">Tap Upload to add your first family photo</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {photos.map(photo => (
              <button
                key={photo.id}
                onClick={() => setSelected(photo)}
                className="aspect-square bg-gray-100 rounded-2xl overflow-hidden active:scale-95 transition-all"
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
          <div className="flex items-center justify-between p-4 pt-12">
            <button onClick={() => setSelected(null)} className="w-10 h-10 bg-white/20 text-white rounded-2xl flex items-center justify-center text-xl">←</button>
            {selected.uploaded_by === member.user_id && (
              <button
                onClick={() => handleDelete(selected)}
                className="px-4 py-2 bg-red-500/80 text-white text-sm font-semibold rounded-xl"
              >
                Delete
              </button>
            )}
          </div>

          <div className="flex-1 flex items-center justify-center p-4">
            {selected.url && (
              <img src={selected.url} alt={selected.caption ?? ''} className="max-w-full max-h-full object-contain rounded-2xl" />
            )}
          </div>

          <div className="p-5 bg-gradient-to-t from-black/80 to-transparent">
            {selected.caption && (
              <p className="text-white font-semibold mb-2">{selected.caption}</p>
            )}
            <div className="flex items-center gap-2">
              {(() => {
                const uploader = memberMap.get(selected.uploaded_by)
                return uploader ? (
                  <>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: uploader.avatar_colour }}>
                      {uploader.display_name[0].toUpperCase()}
                    </div>
                    <p className="text-white/80 text-sm font-medium">{uploader.display_name}</p>
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
