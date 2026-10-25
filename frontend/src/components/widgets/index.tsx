import type { WidgetType } from '@/types'
import { PlaceholderWidget } from './PlaceholderWidget'

interface Props {
  type: WidgetType
  title: string
}

export function Widget({ type: _type, title }: Props) {
  // Phase 1+ widgets will be imported and rendered here as they are built
  return <PlaceholderWidget title={title} />
}