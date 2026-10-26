import type { WidgetType } from '@/types'
import { PlaceholderWidget } from './PlaceholderWidget'
import { AccountsWidget } from './AccountsWidget'
import { PositionsWidget } from './PositionsWidget'
import { OverviewWidget } from './OverviewWidget'

interface Props {
  type: WidgetType
  title: string
}

export function Widget({ type, title }: Props) {
  switch (type) {
    case 'accounts':
      return <AccountsWidget />
    case 'positions':
      return <PositionsWidget />
    case 'overview':
      return <OverviewWidget />
    default:
      return <PlaceholderWidget title={title} />
  }
}