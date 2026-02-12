import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { personsApi } from '../../lib/api'
import { ArrowLeft, Loader2, Phone, Mail, Shield } from 'lucide-react'

const PersonDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [person, setPerson] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    personsApi.get(id).then(r => setPerson(r.data.data)).catch(() => navigate('/persons')).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
  if (!person) return <div>No encontrado</div>

  return (
    <div>
      <button onClick={() => navigate('/persons')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"><ArrowLeft className="w-4 h-4" /> Volver</button>
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-2xl font-bold text-primary-700">{person.fullName.charAt(0)}</div>
          <div><h1 className="text-2xl font-bold">{person.fullName}</h1><p className="text-gray-500">{person.ministry || 'Sin ministerio'} · Prioridad: {person.priority}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {person.phone && <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4" />{person.phone}</div>}
          {person.email && <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4" />{person.email}</div>}
        </div>
        <div><h3 className="font-semibold mb-2 flex items-center gap-2"><Shield className="w-4 h-4" /> Roles</h3>
          <div className="flex flex-wrap gap-2">{person.roles.map((r: any, i: number) => <span key={i} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-sm">{r.roleName}</span>)}</div>
        </div>
      </div>
    </div>
  )
}
export default PersonDetailPage
