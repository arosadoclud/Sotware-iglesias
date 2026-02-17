import * as React from "react"
import { cn } from "../../lib/utils"

interface ProgressProps {
  value: number // 0-100
  className?: string
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  className,
  showLabel = false,
  size = "md",
}) => {
  const clampedValue = Math.min(100, Math.max(0, value))
  
  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  }

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-600 mb-1">
          <span>Progreso</span>
          <span className="font-medium">{Math.round(clampedValue)}%</span>
        </div>
      )}
      <div className={cn("w-full bg-slate-200 rounded-full overflow-hidden", sizeClasses[size])}>
        <div
          className={cn(
            "h-full transition-all duration-300 ease-in-out",
            clampedValue < 33 ? "bg-red-500" :
            clampedValue < 66 ? "bg-amber-500" :
            "bg-green-500"
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  )
}
