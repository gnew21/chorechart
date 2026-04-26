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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-[28px] sheet-enter max-h-[92vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 bg-[#D2D2D7] rounded-full" />
        </div>
        {title && (
          <div className="flex items-center justify-between px-5 pt-3 pb-4 border-b border-black/[0.06]">
            <h2 className="text-[17px] font-semibold text-[#1D1D1F]">{title}</h2>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-[#F5F5F7] text-[#86868B] text-lg">&times;</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
