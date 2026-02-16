import * as React from "react"
import { X } from "lucide-react"

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface SheetContentProps {
  children: React.ReactNode
  className?: string
  side?: "left" | "right"
}

export const Sheet: React.FC<SheetProps> = ({ open, onOpenChange, children }) => {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
        }}
        onClick={() => onOpenChange(false)}
      />
      {children}
    </>
  )
}

export const SheetContent: React.FC<SheetContentProps> = ({
  children,
  className,
  side = "right",
}) => {
  return (
    <div
      className={className}
      style={{
        position: "fixed",
        top: 0,
        [side]: 0,
        height: "100%",
        width: window.innerWidth < 640 ? "100%" : "540px",
        maxWidth: "100%",
        zIndex: 50,
        background: "#FFFFFF",
        borderRadius: side === "left" ? "0 12px 12px 0" : "12px 0 0 12px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.14)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {children}
    </div>
  )
}

export const SheetHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <div 
      className={className}
      style={{
        background: "#1B2D5B",
        padding: "1.25rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {children}
    </div>
  )
}

export const SheetTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <h2 
      className={className}
      style={{
        color: "white",
        fontSize: "0.95rem",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        margin: 0,
      }}
    >
      {children}
    </h2>
  )
}

export const SheetClose: React.FC<{ onClose: () => void; className?: string }> = ({
  onClose,
  className,
}) => {
  return (
    <button
      onClick={onClose}
      className={className}
      style={{
        background: "rgba(255, 255, 255, 0.1)",
        border: "1.5px solid rgba(255, 255, 255, 0.2)",
        borderRadius: "8px",
        padding: "6px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
      }}
    >
      <X style={{ width: "18px", height: "18px" }} />
      <span style={{ 
        position: "absolute", 
        width: "1px", 
        height: "1px", 
        padding: 0, 
        margin: "-1px", 
        overflow: "hidden", 
        clip: "rect(0, 0, 0, 0)", 
        whiteSpace: "nowrap", 
        borderWidth: 0 
      }}>
        Cerrar
      </span>
    </button>
  )
}

export const SheetBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <div 
      className={className}
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "1.5rem",
        background: "#FFFFFF",
      }}
    >
      {children}
    </div>
  )
}

export const SheetFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <div 
      className={className}
      style={{
        borderTop: "1px solid #F3F4F6",
        padding: "1rem 1.5rem",
        display: "flex",
        gap: "0.75rem",
        justifyContent: "flex-end",
        background: "#FFFFFF",
      }}
    >
      {children}
    </div>
  )
}
