import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Household, HouseholdMember, Chore } from '../types'
import { detectChoreFromImage } from '../lib/claude'
import { ChoreConfirmSheet } from '../components/ChoreConfirmSheet'

interface Props {
  household: Household
  member: HouseholdMember
  chores: Chore[]
  onLogged: () => void
}

type State = 'idle' | 'analyzing' | 'found' | 'notfound' | 'error'

export function AIVisionPage({ household, member, chores, onLogged }: Props) {
  const [state, setState] = useState<State>('idle')
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [detectedChore, setDetectedChore] = useState<Chore | null>(null)
  const [detectedName, setDetectedName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [photoBase64, setPhotoBase64] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  async function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      setImageDataUrl(dataUrl)

      // Strip the data:image/...;base64, prefix
      const base64 = dataUrl.split(',')[1]
      setPhotoBase64(base64)
      setState('analyzing')

      try {
        const result = await detectChoreFromImage(base64)
        setDetectedName(result.chore_name)

        if (result.chore_name === 'unknown' || result.confidence === 'low') {
          setState('notfound')
          return
        }

        // Fuzzy match against household chores
        const lower = result.chore_name.toLowerCase()
        const match = chores.find(c =>
          c.name.toLowerCase().includes(lower) ||
          lower.includes(c.name.toLowerCase().split(' ')[0])
        )

        if (match) {
          setDetectedChore(match)
          setState('found')
        } else {
          setState('notfound')
        }
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : 'AI detection failed')
        setState('error')
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="text-gray-600 text-xl">←</button>
        <h1 className="font-semibold text-gray-900">AI Vision Log</h1>
        <span className="ml-auto text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Beta</span>
      </div>

      <div className="flex-1 p-4 flex flex-col items-center justify-center gap-6">
        {state === 'idle' && (
          <>
            <div className="text-center">
              <div className="text-6xl mb-3">🤖</div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">AI Chore Detection</h2>
              <p className="text-gray-500 text-sm">Take or upload a photo and AI will detect which chore you completed</p>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={() => fileRef.current?.click()}
                className="py-3 bg-purple-500 text-white font-semibold rounded-xl"
              >
                📷 Take or Upload Photo
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
          </>
        )}

        {state === 'analyzing' && (
          <div className="text-center">
            {imageDataUrl && <img src={imageDataUrl} alt="captured" className="w-48 h-48 object-cover rounded-2xl mb-4 mx-auto" />}
            <div className="text-4xl mb-3 animate-spin">🔍</div>
            <p className="text-gray-600 font-medium">Analyzing with AI…</p>
          </div>
        )}

        {state === 'found' && detectedChore && (
          <div className="text-center w-full max-w-xs">
            {imageDataUrl && <img src={imageDataUrl} alt="captured" className="w-48 h-48 object-cover rounded-2xl mb-4 mx-auto" />}
            <div className="text-3xl mb-2">✅</div>
            <p className="font-semibold text-gray-900 mb-4">Detected: {detectedName}</p>
            <div className="p-3 bg-green-50 rounded-xl flex items-center gap-3 mb-4">
              <span className="text-3xl">{detectedChore.emoji}</span>
              <div className="text-left">
                <p className="font-semibold text-gray-900">{detectedChore.name}</p>
                <p className="text-sm text-gray-500">{detectedChore.points} points</p>
              </div>
            </div>
            <ChoreConfirmSheet
              chore={detectedChore}
              householdId={household.id}
              userId={member.user_id}
              method="ai_vision"
              photoUrl={`data:image/jpeg;base64,${photoBase64}`}
              onLogged={() => { onLogged(); navigate('/') }}
              onClose={() => setState('idle')}
            />
            {/* Auto-open the sheet */}
            <button
              onClick={() => {}}
              className="w-full py-3 bg-green-500 text-white font-semibold rounded-xl"
            >
              Log This Chore →
            </button>
          </div>
        )}

        {state === 'notfound' && (
          <div className="text-center">
            {imageDataUrl && <img src={imageDataUrl} alt="captured" className="w-48 h-48 object-cover rounded-2xl mb-4 mx-auto" />}
            <div className="text-4xl mb-2">🤔</div>
            <p className="font-semibold text-gray-900 mb-2">Couldn't match a chore</p>
            <p className="text-gray-500 text-sm mb-4">{detectedName ? `Detected: "${detectedName}" — not in your chore list` : 'Could not identify a chore in this photo'}</p>
            <button onClick={() => setState('idle')} className="py-3 px-6 bg-gray-100 text-gray-700 font-medium rounded-xl">
              Try Again
            </button>
          </div>
        )}

        {state === 'error' && (
          <div className="text-center">
            <div className="text-4xl mb-2">⚠️</div>
            <p className="font-semibold text-gray-900 mb-2">Something went wrong</p>
            <p className="text-gray-500 text-sm mb-4">{errorMsg}</p>
            <button onClick={() => setState('idle')} className="py-3 px-6 bg-gray-100 text-gray-700 font-medium rounded-xl">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
