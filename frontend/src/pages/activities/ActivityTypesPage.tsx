import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, X, Loader2, Calendar } from 'lucide-react'
import { activitiesApi, rolesApi } from '../../lib/api'
import { toast } from 'sonner'

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DAY_COLORS = ['bg-red-50 border-red-200', 'bg-gray-50 border-gray-200', 'bg-blue-50 border-blue-200', 'bg-green-50 border-green-200', 'bg-yellow-50 border-yellow-200', 'bg-pink-50 border-pink-200', 'bg-purple-50 border-purple-200']

const ActivityTypesPage = () => {
  const [activities, setActivities] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', dayOfWeek: 0, defaultTime: '10:00', roleConfig: [] as any[] })

  const load = async () => {
    setLoading(true)
    try {
      const [aRes, rRes] = await Promise.all([activitiesApi.getAll(), rolesApi.getAll()])
      setActivities(aRes.data.data)
      setRoles(rRes.data.data)
    } catch { toast.error('Error cargando datos') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', description: '', dayOfWeek: 0, defaultTime: '10:00', roleConfig: [] })
    setShowModal(true)
  }

  const openEdit = (a: any) => {
    setEditing(a)
    setForm({ name: a.name, description: a.description || '', dayOfWeek: a.dayOfWeek, defaultTime: a.defaultTime, roleConfig: a.roleConfig.map((rc: any) => ({ ...rc })) })
    setShowModal(true)
  }

  const addRoleConfig = () => {
    if (roles.length === 0) return toast.error('Primero crea roles')
    setForm(f => ({ ...f, roleConfig: [...f.roleConfig, { sectionName: '', sectionOrder: f.roleConfig.length + 1, role: { id: roles[0]._id, name: roles[0].name }, peopleNeeded: 1, isRequired: true }] }))
  }

  const removeRoleConfig = (idx: number) => setForm(f => ({ ...f, roleConfig: f.roleConfig.filter((_, i) => i !== idx).map((rc, i) => ({ ...rc, sectionOrder: i + 1 })) }))

  const updateRoleConfig = (idx: number, field: string, value: any) => {
    setForm(f => {
      const updated = [...f.roleConfig]
      if (field === 'roleId') {
        const r = roles.find((rl: any) => rl._id === value)
        updated[idx] = { ...updated[idx], role: { id: value, name: r?.name || '' } }
      } else {
        updated[idx] = { ...updated[idx], [field]: value }
      }
      return { ...f, roleConfig: updated }
    })
  }

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('El nombre es requerido')
    if (form.roleConfig.length === 0) return toast.error('Agrega al menos un rol')
    if (form.roleConfig.some(rc => !rc.sectionName.trim())) return toast.error('Cada sección necesita un nombre')
    setSaving(true)
    try {
      if (editing) { await activitiesApi.update(editing._id, form); toast.success('Actividad actualizada') }
      else { await activitiesApi.create(form); toast.success('Actividad creada') }
      setShowModal(false); load()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error al guardar') }
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return
    try { await activitiesApi.delete(id); toast.success('Eliminada'); load() } catch { toast.error('Error') }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tipos de Actividades</h1>
          <p className="text-gray-600 mt-1">Configura los servicios semanales y sus roles de oportunidades</p>
        </div>
        <button onClick={openNew} className="btn btn-primary flex items-center gap-2"><Plus className="w-5 h-5" /> Nueva Actividad</button>
      </div>

      {activities.length === 0 ? (
        <div className="card text-center py-12 text-gray-500"><Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No hay actividades configuradas</p><button onClick={openNew} className="text-primary-600 text-sm mt-2">Crear primera actividad →</button></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activities.map(a => (
            <div key={a._id} className={`card border-2 ${DAY_COLORS[a.dayOfWeek]}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{a.name}</h3>
                  <p className="text-sm text-gray-600">{DAYS[a.dayOfWeek]} a las {a.defaultTime}</p>
                  {a.description && <p className="text-sm text-gray-500 mt-1">{a.description}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(a)} className="p-1.5 hover:bg-white/50 rounded"><Edit className="w-4 h-4 text-gray-500" /></button>
                  <button onClick={() => handleDelete(a._id, a.name)} className="p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-400" /></button>
                </div>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs text-gray-500 mb-2 font-medium">FORMATO DEL PROGRAMA:</p>
                <div className="space-y-1">
                  {a.roleConfig.map((rc: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{rc.sectionOrder}. {rc.sectionName}</span>
                      <span className="text-xs text-gray-400">{rc.role.name} ({rc.peopleNeeded}p)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b"><h2 className="text-xl font-bold">{editing ? 'Editar' : 'Nueva'} Actividad</h2><button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="Culto Dominical, Estudio Bíblico..." /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label><input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Día de la Semana *</label><select value={form.dayOfWeek} onChange={e => setForm({ ...form, dayOfWeek: Number(e.target.value) })} className="input">{DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Hora</label><input type="time" value={form.defaultTime} onChange={e => setForm({ ...form, defaultTime: e.target.value })} className="input" /></div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-gray-700">Secciones del Programa (Roles)</label>
                  <button type="button" onClick={addRoleConfig} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"><Plus className="w-4 h-4" /> Agregar Sección</button>
                </div>
                {form.roleConfig.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Agrega las secciones del programa (Dirección, Adoración, Devocional, etc.)</p>}
                <div className="space-y-3">
                  {form.roleConfig.map((rc, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-bold text-gray-400 w-6">{idx + 1}.</span>
                      <input type="text" placeholder="Nombre de sección (ej: Adoración)" value={rc.sectionName} onChange={e => updateRoleConfig(idx, 'sectionName', e.target.value)} className="input flex-1" />
                      <select value={rc.role.id} onChange={e => updateRoleConfig(idx, 'roleId', e.target.value)} className="input w-40">
                        {roles.map((r: any) => <option key={r._id} value={r._id}>{r.name}</option>)}
                      </select>
                      <input type="number" min="1" max="5" value={rc.peopleNeeded} onChange={e => updateRoleConfig(idx, 'peopleNeeded', Number(e.target.value))} className="input w-16 text-center" />
                      <button onClick={() => removeRoleConfig(idx)} className="p-1 hover:bg-red-50 rounded"><X className="w-4 h-4 text-red-400" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{editing ? 'Actualizar' : 'Crear'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default ActivityTypesPage
