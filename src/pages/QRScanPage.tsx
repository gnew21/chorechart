import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import type { Household, HouseholdMember, Chore } from '../types'
import { decodeChoreQR } from '../lib/qr'
import { ChoreConfirmSheet } from '../components/ChoreConfirmSheet'

interface Props {
  household: Household
  member: HouseholdMember
  chores: Chore[]
  onLogged: () => void
}

export function QRScanPage({ household, member, chores, onLogged }: Props) {
  const [scannedChore, setScannedChore] = useState<Chore | null>(null)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decoded) => {
        const choreId = decodeChoreQR(decoded)
        if (!choreId) { setError('Not a valid ChoreChart QR code'); return }
        const chore = chores.find(c => c.id === choreId)
        if (!chore) { setError('Chore not found in your household'); return }
        scanner.stop().catch(() => {})
        setScannedChore(chore)
      },
      () => {}
    ).catch(e => setError(e?.message ?? 'Camera error'))

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [chores])

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => navigate(-1)} className="text-white text-2xl">←</button>
        <h1 className="text-white font-semibold">Scan QR Code</h1>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div id="qr-reader" className="w-full max-w-sm rounded-2xl overflow-hidden" />
      </div>

      {error && (
        <div className="mx-4 mb-4 p-3 bg-red-500/80 rounded-xl text-white text-sm text-center">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      <p className="text-white/60 text-sm text-center pb-8">
        Point camera at a chore QR code
      </p>

      <ChoreConfirmSheet
        chore={scannedChore}
        householdId={household.id}
        userId={member.user_id}
        method="qr"
        onLogged={() => { onLogged(); navigate('/') }}
        onClose={() => setScannedChore(null)}
      />
    </div>
  )
}
