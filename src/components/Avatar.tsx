interface Props {
  name: string
  colour: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' }

export function Avatar({ name, colour, size = 'md' }: Props) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ backgroundColor: colour }}
    >
      {initials}
    </div>
  )
}
