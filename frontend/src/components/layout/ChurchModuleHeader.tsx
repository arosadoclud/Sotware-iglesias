import type { ReactNode } from 'react'
import { BrandLogo } from './BrandLogo'
import './church-modules.css'
export function ChurchModuleHeader({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <header className="church-module-header">
      <div className="church-module-brand">
        <BrandLogo />
      </div>
      <div className="church-module-intro">
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children && <div className="church-module-actions">{children}</div>}
    </header>
  )
}
