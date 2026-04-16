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
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-2xl sheet-enter max-h-[90vh] overflow-y-auto">
        {title && (
          <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{title}</h2>
            <button onClick={onClose} className="text-gray-400 text-2xl leading-none">&times;</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
