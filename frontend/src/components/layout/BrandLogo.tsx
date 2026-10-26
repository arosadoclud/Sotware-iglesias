import { cn } from '../../lib/utils'

export function BrandLogo({ className = '' }: { className?: string }) {
  return <img src="/arca-logo.png" alt="Arca Evangélica · Dios Fuerte" width={1909} height={824} className={cn('brand-logo', className)} />
}
