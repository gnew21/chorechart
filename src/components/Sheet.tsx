import { useEffect } from 'react'
import type { ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}

export function Sheet({ open, onClose, children, title }: Props) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-3xl sheet-enter max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        {title && (
          <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-lg">&times;</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
