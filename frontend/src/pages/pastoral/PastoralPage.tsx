import { motion } from 'framer-motion'
import { BookOpen, Heart, Users, Star, ArrowRight, Sparkles } from 'lucide-react'

// ── Componente Principal ───────────────────────────────────────────────────────
const PastoralPage = () => {
  // Secciones planificadas (próximamente)
  const upcomingSections = [
    {
      icon: Heart,
      title: 'Visitas Pastorales',
      description: 'Registro y seguimiento de visitas a miembros y familias.',
      color: 'text-rose-500',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
    },
    {
      icon: Users,
      title: 'Consejería Pastoral',
      description: 'Gestión de sesiones de consejería y seguimiento espiritual.',
      color: 'text-violet-500',
      bg: 'bg-violet-50',
      border: 'border-violet-200',
    },
    {
      icon: BookOpen,
      title: 'Seguimiento Espiritual',
      description: 'Historial de crecimiento y disciplado de miembros.',
      color: 'text-indigo-500',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
    },
    {
      icon: Star,
      title: 'Informes Pastorales',
      description: 'Reportes periódicos del trabajo pastoral de la iglesia.',
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-violet-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Pastoral</h1>
        </div>
        <p className="text-neutral-500 text-sm ml-13">
          Gestión y seguimiento del trabajo pastoral de la iglesia.
        </p>
      </motion.div>

      {/* Banner "Próximamente" */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 mb-8 text-white"
      >
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/3" />
        <div className="absolute top-1/2 right-16 w-3 h-3 rounded-full bg-white/30" />
        <div className="absolute top-8 right-32 w-2 h-2 rounded-full bg-white/20" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold tracking-wide uppercase">Módulo en desarrollo</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-2">Sección Pastoral</h2>
          <p className="text-violet-100 text-base max-w-xl leading-relaxed">
            Estamos construyendo herramientas poderosas para el seguimiento y gestión del trabajo pastoral.
            Muy pronto podrás administrar visitas, consejería e informes desde aquí.
          </p>
          <div className="flex items-center gap-2 mt-5">
            <div className="flex items-center gap-1.5 text-violet-200 text-sm">
              <ArrowRight className="w-4 h-4" />
              <span>Las funcionalidades se irán añadiendo próximamente</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Cards de secciones próximas */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-4">
          Próximamente disponible
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {upcomingSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.07 }}
              className={`rounded-xl border-2 ${section.border} ${section.bg} p-5 relative overflow-hidden`}
            >
              {/* Decorative circle */}
              <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/40`} />

              <div className="relative z-10">
                <div className={`w-9 h-9 rounded-lg bg-white/70 flex items-center justify-center mb-3`}>
                  <section.icon className={`w-4.5 h-4.5 ${section.color}`} />
                </div>
                <h4 className="font-semibold text-neutral-800 mb-1">{section.title}</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">{section.description}</p>
              </div>

              {/* "Próximamente" badge */}
              <div className="absolute top-3 right-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-white/60 ${section.color}`}>
                  Próximamente
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-3 p-4 rounded-xl bg-neutral-50 border border-neutral-200"
      >
        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
          <BookOpen className="w-4 h-4 text-violet-500" />
        </div>
        <p className="text-sm text-neutral-500">
          La sección Pastoral está lista para recibir nuevos módulos. El equipo de desarrollo irá añadiendo funcionalidades según las necesidades de la iglesia.
        </p>
      </motion.div>
    </div>
  )
}

export default PastoralPage
