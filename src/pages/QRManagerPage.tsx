import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useNavigate } from 'react-router-dom'
import type { Chore } from '../types'
import { encodeChoreQR } from '../lib/qr'

interface Props {
  chores: Chore[]
}

export function QRManagerPage({ chores }: Props) {
  const printRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  function handlePrint() {
    window.print()
  }

  return (
    <div className="pb-20">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="text-gray-600 text-xl">←</button>
        <h1 className="text-xl font-bold text-gray-900">QR Codes</h1>
        <button onClick={handlePrint} className="ml-auto text-sm text-blue-600 font-medium">
          🖨️ Print
        </button>
      </div>

      <p className="px-4 py-3 text-sm text-gray-500">
        Print these and stick them around the house. Family members scan to log chores instantly.
      </p>

      <div ref={printRef} className="px-4 grid grid-cols-2 gap-4">
        {chores.map(chore => (
          <div key={chore.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center gap-2">
            <span className="text-3xl">{chore.emoji}</span>
            <p className="font-semibold text-gray-900 text-sm text-center">{chore.name}</p>
            <p className="text-xs text-gray-400">{chore.points} pts</p>
            <QRCodeSVG
              value={encodeChoreQR(chore.id)}
              size={120}
              level="M"
              includeMargin
            />
          </div>
        ))}
      </div>
    </div>
  )
}
