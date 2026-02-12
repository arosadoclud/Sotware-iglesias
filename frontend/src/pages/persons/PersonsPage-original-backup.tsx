import { useState, useEffect } from 'react'
import { Plus, Search, User, Edit, Trash2, X, Loader2 } from 'lucide-react'
import { personsApi, rolesApi, ministriesApi } from '../../lib/api'
import { toast } from 'sonner'

const STATUS_MAP: Record<string, { label: string; style: string }> = {
  ACTIVE: { label: 'Activo', style: 'bg-green-100 text-green-700' },
  INACTIVE: { label: 'Inactivo', style: 'bg-gray-100 text-gray-700' },
  NEW: { label: 'Nuevo', style: 'bg-blue-100 text-blue-700' },
  LEADER: { label: 'Líder', style: 'bg-purple-100 text-purple-700' },
}

const PersonsPage = () => {
  const [persons, setPersons] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMinistry, setFilterMinistry] = useState('')
  const [ministries, setMinistries] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingPerson, setEditingPerson] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', ministry: '', status: 'ACTIVE', priority: 5, roleIds: [] as string[] })
  const [rolesError, setRolesError] = useState(false)
  const [newMinistry, setNewMinistry] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (search) params.search = search
      if (filterStatus) params.status = filterStatus
      if (filterMinistry) params.ministry = filterMinistry
      const [pRes, rRes, mRes] = await Promise.all([
        personsApi.getAll(params),
        rolesApi.getAll(),
        ministriesApi.getAll()
      ])
      setPersons(pRes.data.data)
      setRoles(rRes.data.data)
      setMinistries(mRes.data.data.map((m: any) => m.name))
    } catch { toast.error('Error cargando datos') }
    setLoading(false)
  }

  useEffect(() => { load() }, [search, filterStatus, filterMinistry])

  const openNew = () => {
    setEditingPerson(null)
    setForm({ fullName: '', phone: '', email: '', ministry: '', status: 'ACTIVE', priority: 5, roleIds: [] })
    setShowModal(true)
  }

  const openEdit = (p: any) => {
    setEditingPerson(p)
    setForm({ fullName: p.fullName, phone: p.phone || '', email: p.email || '', ministry: p.ministry || '', status: p.status, priority: p.priority, roleIds: p.roles.map((r: any) => r.roleId) })
    setShowModal(true)
  }

  const handleSave = async () => {
    setRolesError(false)
    if (!form.fullName.trim()) return toast.error('El nombre es requerido')
    if (!form.ministry.trim()) return toast.error('El ministerio es obligatorio')
    if (!form.roleIds.length) {
      setRolesError(true)
      return
    }
    setSaving(true)
    try {
      // Solo roles válidos (con roleId y roleName no vacíos)
      const validRoles = form.roleIds
        .map((rid) => {
          const r = roles.find((rl: any) => rl._id === rid);
          return r && r._id && r.name ? { roleId: r._id, roleName: r.name } : null;
        })
        .filter(Boolean);
      const body = { ...form, roles: validRoles };
      if (editingPerson) {
        await personsApi.update(editingPerson._id, body)
        toast.success('Persona actualizada', { duration: 2000, closeButton: true })
      }
      else {
        await personsApi.create(body)
        toast.success('Persona creada', { duration: 2000, closeButton: true })
      }
      setShowModal(false); load()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Error al guardar') }
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar a ${name}?`)) return
    try { await personsApi.delete(id); toast.success('Eliminada'); load() } catch { toast.error('Error') }
  }

  const toggleRole = (roleId: string) => setForm(f => ({ ...f, roleIds: f.roleIds.includes(roleId) ? f.roleIds.filter(r => r !== roleId) : [...f.roleIds, roleId] }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personas</h1>
          <p className="text-gray-600 mt-1">Gestiona los participantes y sus roles ({persons.length})</p>
        </div>
        <button onClick={openNew} className="btn btn-primary flex items-center gap-2"><Plus className="w-5 h-5" /> Nueva Persona</button>
      </div>

      <div className="card mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar por nombre..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-10" />
          </div>
          <select value={filterMinistry} onChange={e => setFilterMinistry(e.target.value)} className="input w-48">
            <option value="">Todos los ministerios</option>
            {ministries.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input w-48">
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div> : persons.length === 0 ? (
          <div className="text-center py-12 text-gray-500"><User className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No se encontraron personas</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Nombre</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Teléfono</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Ministerio</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Roles</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Estado</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Acciones</th>
              </tr></thead>
              <tbody>
                {persons.map(p => (
                  <tr key={p._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-sm font-bold text-primary-700">{p.fullName.charAt(0)}</div><span className="font-medium text-gray-900">{p.fullName}</span></div></td>
                    <td className="py-3 px-4 text-gray-600 text-sm">{p.phone || '—'}</td>
                    <td className="py-3 px-4 text-gray-600 text-sm">{p.ministry || '—'}</td>
                    <td className="py-3 px-4"><div className="flex flex-wrap gap-1">{p.roles.slice(0, 3).map((r: any, i: number) => <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">{r.roleName}</span>)}{p.roles.length > 3 && <span className="text-xs text-gray-400">+{p.roles.length - 3}</span>}</div></td>
                    <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_MAP[p.status]?.style}`}>{STATUS_MAP[p.status]?.label}</span></td>
                    <td className="py-3 px-4 text-right"><div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-gray-100 rounded"><Edit className="w-4 h-4 text-gray-500" /></button>
                      <button onClick={() => handleDelete(p._id, p.fullName)} className="p-1.5 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-400" /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b"><h2 className="text-xl font-bold">{editingPerson ? 'Editar' : 'Nueva'} Persona</h2><button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label><input type="text" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="input" placeholder="María González" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label><input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ministerio *</label>
                  <div className="flex flex-col gap-2">
                    <select
                      value={form.ministry}
                      onChange={e => setForm({ ...form, ministry: e.target.value })}
                      className="input"
                    >
                      <option value="">Selecciona ministerio</option>
                      {ministries.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={newMinistry}
                        onChange={e => setNewMinistry(e.target.value)}
                        className="input flex-1"
                        placeholder="Agregar nuevo ministerio"
                      />
                      <button
                        type="button"
                        className="btn btn-secondary px-3"
                        onClick={async () => {
                          const name = newMinistry.trim()
                          if (!name) return
                          if (ministries.includes(name)) return toast.error('Ese ministerio ya existe')
                          try {
                            await ministriesApi.create({ name })
                            setNewMinistry('')
                            setForm({ ...form, ministry: name })
                            // recargar ministerios
                            const mRes = await ministriesApi.getAll()
                            setMinistries(mRes.data.data.map((m: any) => m.name))
                            toast.success('Ministerio agregado', { duration: 2000 })
                          } catch (e: any) {
                            toast.error(e.response?.data?.message || 'Error al agregar ministerio')
                          }
                        }}
                      >Agregar</button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Puedes seleccionar o agregar un ministerio.</p>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Estado</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input">{Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Prioridad: {form.priority}</label><input type="range" min="1" max="10" value={form.priority} onChange={e => setForm({ ...form, priority: Number(e.target.value) })} className="w-full" /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Roles Habilitados *</label>
                {roles.length === 0 ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-300 rounded text-yellow-700 text-sm">
                    No hay roles configurados. Ve a la sección de <b>Roles</b> para crear al menos uno antes de agregar personas.
                  </div>
                ) : (
                  <>
                    <div className={`flex flex-wrap gap-2 p-2 rounded-lg border transition-colors ${rolesError ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                      {roles.map(r => (
                        <button key={r._id} type="button" onClick={() => toggleRole(r._id)}
                          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${form.roleIds.includes(r._id) ? 'bg-primary-100 border-primary-300 text-primary-700 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                          title={r.description || ''}
                        >
                          {r.name}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Selecciona al menos un rol. Los roles definen las funciones o tareas que puede desempeñar la persona.</p>
                    {rolesError && <p className="text-xs text-red-500 mt-1">Debe seleccionar al menos un rol.</p>}
                  </>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{editingPerson ? 'Actualizar' : 'Crear'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default PersonsPage
