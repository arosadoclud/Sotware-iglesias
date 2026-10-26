import { Link } from 'react-router-dom'
import {
  BookOpen,
  Heart,
  Users,
  Star,
  ArrowUpRight,
  FileText,
  ClipboardList
} from 'lucide-react'
import { ChurchModuleHeader } from '../../components/layout/ChurchModuleHeader'
import { useAuthStore } from '../../store/authStore'
import { P } from '../../constants/permissions'
export default function PastoralPage() {
  const { hasPermission } = useAuthStore()
  const links = [
    {
      to: '/persons',
      title: 'Nuestra comunidad',
      copy: 'Consulta las personas que forman parte de la iglesia.',
      icon: Users,
      permission: P.PERSONS_VIEW
    },
    {
      to: '/letters',
      title: 'Correspondencia pastoral',
      copy: 'Prepara invitaciones y cartas de recomendación.',
      icon: FileText,
      permission: P.LETTERS_VIEW
    },
    {
      to: '/secretaria',
      title: 'Registros de la iglesia',
      copy: 'Presentaciones, bautismos, bodas y actas.',
      icon: ClipboardList,
      permission: P.SECRETARY_VIEW
    }
  ].filter((link) => hasPermission(link.permission))
  return (
    <main className="church-module-workspace pastoral-workspace">
      <ChurchModuleHeader
        eyebrow="Acompañar con fe y propósito"
        title="Área pastoral"
        description="El cuidado de nuestra comunidad comienza con la cercanía."
      />
      <section className="pastoral-layout">
        <div className="pastoral-feature">
          <span>UNIDOS PARA SERVIR</span>
          <h2>
            Cuidar a las personas.
            <br />
            Fortalecer su camino.
          </h2>
          <p>
            Un punto de encuentro para el trabajo pastoral y las herramientas de
            nuestra iglesia.
          </p>
        </div>
        <nav
          className="pastoral-links"
          aria-label="Herramientas pastorales disponibles"
        >
          {links.map((link) => (
            <Link to={link.to} key={link.to}>
              <link.icon />
              <div>
                <strong>{link.title}</strong>
                <p>{link.copy}</p>
              </div>
              <ArrowUpRight size={18} />
            </Link>
          ))}
          {!links.length && (
            <p className="text-sm text-slate-500 p-6">
              Los accesos se muestran según los permisos de tu cuenta.
            </p>
          )}
        </nav>
      </section>
      <section>
        <div className="flex flex-wrap justify-between gap-3 mb-5">
          <div>
            <h2 className="font-semibold text-lg">
              El siguiente paso del acompañamiento
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Herramientas previstas para ampliar este espacio.
            </p>
          </div>
          <span className="pastoral-planned">Aún no disponibles</span>
        </div>
        <div className="pastoral-roadmap">
          {[
            {
              icon: Heart,
              title: 'Visitas pastorales',
              copy: 'Agenda de encuentros y seguimiento de compromisos.'
            },
            {
              icon: Users,
              title: 'Consejería',
              copy: 'Un espacio de seguimiento con acceso restringido por permisos.'
            },
            {
              icon: BookOpen,
              title: 'Acompañamiento espiritual',
              copy: 'Organización del discipulado y sus próximos pasos.'
            },
            {
              icon: Star,
              title: 'Informes pastorales',
              copy: 'Una visión clara del trabajo de acompañamiento.'
            }
          ].map((item) => (
            <article key={item.title}>
              <item.icon size={23} />
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
              <span className="pastoral-planned">Planificado</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
