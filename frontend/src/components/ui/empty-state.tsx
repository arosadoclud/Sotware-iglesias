import { LucideIcon } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  className?: string
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  const ActionIcon = action?.icon

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4", className)}>
      <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-neutral-400" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>
      <p className="text-neutral-600 text-center max-w-md mb-6">{description}</p>
      {action && (
        <Button onClick={action.onClick}>
          {ActionIcon && <ActionIcon className="w-4 h-4 mr-2" />}
          {action.label}
        </Button>
      )}
    </div>
  )
}
