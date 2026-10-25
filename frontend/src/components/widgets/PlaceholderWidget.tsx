import { Construction } from 'lucide-react'

interface Props {
  title: string
}

export function PlaceholderWidget({ title }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted select-none">
      <Construction size={28} className="opacity-40" />
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs opacity-50">Coming in a future phase</span>
    </div>
  )
}
