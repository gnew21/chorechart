import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Household, HouseholdMember } from '../types'
import { format } from 'date-fns'
import { Avatar } from '../components/Avatar'

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
      caption: null,
    })

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
    <div className="pb-24 min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-6" style={{ backgroundColor: '#F5F5F7' }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-title">Photos</h1>
            <p className="text-[15px] mt-1 tracking-[-0.01em]" style={{ color: '#86868B' }}>
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
            </p>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold active:opacity-70 transition-opacity"
            style={{ backgroundColor: 'white', color: '#1D1D1F', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
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

      <div className="px-4">
        {uploading && (
          <div className="card p-3 mb-4 text-center text-[13px] font-semibold text-emerald-500">
            Uploading photo…
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p style={{ color: '#86868B' }}>Loading photos…</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-16">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4"
              style={{ backgroundColor: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            >
              📷
            </div>
            <p className="text-[17px] font-semibold tracking-[-0.01em]" style={{ color: '#1D1D1F' }}>No photos yet</p>
            <p className="text-[15px] mt-1" style={{ color: '#86868B' }}>Tap Upload to add your first family photo</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {photos.map(photo => (
              <button
                key={photo.id}
                onClick={() => setSelected(photo)}
                className="aspect-square rounded-2xl overflow-hidden active:opacity-80 transition-opacity"
                style={{ backgroundColor: '#F5F5F7' }}
              >
                {photo.url ? (
                  <img src={photo.url} alt={photo.caption ?? ''} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl" style={{ color: '#C7C7CC' }}>📷</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Photo detail */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between p-4 pt-12">
            <button
              onClick={() => setSelected(null)}
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl active:opacity-70 transition-opacity"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}
            >
              ←
            </button>
            {selected.uploaded_by === member.user_id && (
              <button
                onClick={() => handleDelete(selected)}
                className="px-4 py-2 rounded-xl text-[13px] font-semibold active:opacity-70 transition-opacity"
                style={{ backgroundColor: 'rgba(255,59,48,0.8)', color: 'white' }}
              >
                Delete
              </button>
            )}
          </div>

          <div className="flex-1 flex items-center justify-center p-4">
            {selected.url && (
              <img
                src={selected.url}
                alt={selected.caption ?? ''}
                className="max-w-full max-h-full object-contain rounded-2xl"
              />
            )}
          </div>

          <div className="p-5" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
            {selected.caption && (
              <p className="text-white font-semibold mb-2 text-[15px]">{selected.caption}</p>
            )}
            <div className="flex items-center gap-2">
              {(() => {
                const uploader = memberMap.get(selected.uploaded_by)
                return uploader ? (
                  <>
                    <Avatar name={uploader.display_name} colour={uploader.avatar_colour} size="sm" />
                    <p className="text-white/80 text-[13px] font-medium">{uploader.display_name}</p>
                  </>
                ) : null
              })()}
              <p className="text-white/50 text-[12px] ml-auto">{format(new Date(selected.created_at), 'MMM d, yyyy')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
