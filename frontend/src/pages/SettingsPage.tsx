import { useState, useEffect } from 'react'
import { churchesApi, rolesApi } from '../lib/api'
import { toast } from 'sonner'
import { Loader2, Save, Plus, Trash2, X } from 'lucide-react'

const SettingsPage = () => {
  const [church, setChurch] = useState<any>(null)
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [roleForm, setRoleForm] = useState({ name: '', description: '', color: '#3B82F6', requiresSkill: false })
  const [savingRole, setSavingRole] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [cRes, rRes] = await Promise.all([churchesApi.getMine(), rolesApi.getAll()])
      setChurch(cRes.data.data)
      setRoles(rRes.data.data)
    } catch {}
    setLoading(false)
  }

  const saveChurch = async () => {
    setSaving(true)
    try { await churchesApi.updateMine(church); toast.success('Iglesia actualizada') } catch { toast.error('Error') }
    setSaving(false)
  }

  const addRole = async () => {
    if (!roleForm.name.trim()) return toast.error('Nombre requerido')
    setSavingRole(true)
    try { await rolesApi.create(roleForm); toast.success('Rol creado'); setShowRoleModal(false); load() } catch (e: any) { toast.error(e.response?.data?.message || 'Error') }
    setSavingRole(false)
  }

  const deleteRole = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar rol "${name}"?`)) return
    try { await rolesApi.delete(id); toast.success('Eliminado'); load() } catch { toast.error('Error') }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>

      {church && (
        <div className="card">
          <h3 className="font-semibold mb-4 text-gray-900">Información de la Iglesia</h3>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label><input type="text" value={church.name} onChange={e => setChurch({ ...church, name: e.target.value })} className="input" /></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo de la Iglesia</label>
              <div className="flex items-center gap-4">
                {church.logoUrl && (
                  <img
                    src={church.logoUrl.startsWith('/uploads/')
                      ? church.logoUrl
                      : church.logoUrl}
                    alt="Logo"
                    className="w-16 h-16 object-contain border rounded"
                  />
                )}
                <input type="file" accept="image/*" onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const res = await churchesApi.uploadLogo(file);
                    setChurch(res.data.data);
                    toast.success('Logo actualizado');
                  } catch { toast.error('Error al subir logo'); }
                }} />
              </div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label><input type="text" value={church.address?.street || ''} onChange={e => setChurch({ ...church, address: { ...church.address, street: e.target.value } })} className="input" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label><input type="text" value={church.address?.city || ''} onChange={e => setChurch({ ...church, address: { ...church.address, city: e.target.value } })} className="input" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label><input type="text" value={church.phone || ''} onChange={e => setChurch({ ...church, phone: e.target.value })} className="input" /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Semanas de Rotación</label><input type="number" min="2" max="12" value={church.settings?.rotationWeeks || 4} onChange={e => setChurch({ ...church, settings: { ...church.settings, rotationWeeks: Number(e.target.value) } })} className="input w-32" /></div>
            <button onClick={saveChurch} disabled={saving} className="btn btn-primary flex items-center gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">Roles Disponibles</h3>
          <button onClick={() => { setRoleForm({ name: '', description: '', color: '#3B82F6', requiresSkill: false }); setShowRoleModal(true) }} className="text-sm text-primary-600 font-medium flex items-center gap-1"><Plus className="w-4 h-4" /> Nuevo Rol</button>
        </div>
        <div className="space-y-2">
          {roles.map(r => (
            <div key={r._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: r.color }} />
                <div><p className="font-medium text-sm text-gray-900">{r.name}</p>{r.description && <p className="text-xs text-gray-500">{r.description}</p>}</div>
              </div>
              <div className="flex items-center gap-2">
                {r.requiresSkill && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Requiere habilidad</span>}
                <button onClick={() => deleteRole(r._id, r.name)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-400" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b"><h2 className="text-lg font-bold">Nuevo Rol</h2><button onClick={() => setShowRoleModal(false)}><X className="w-5 h-5" /></button></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label><input type="text" value={roleForm.name} onChange={e => setRoleForm({ ...roleForm, name: e.target.value })} className="input" placeholder="Ej: Adoración" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label><input type="text" value={roleForm.description} onChange={e => setRoleForm({ ...roleForm, description: e.target.value })} className="input" /></div>
              <div className="flex items-center gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Color</label><input type="color" value={roleForm.color} onChange={e => setRoleForm({ ...roleForm, color: e.target.value })} className="w-12 h-10 rounded" /></div>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={roleForm.requiresSkill} onChange={e => setRoleForm({ ...roleForm, requiresSkill: e.target.checked })} /><span className="text-sm text-gray-700">Requiere habilidad especial</span></label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button onClick={() => setShowRoleModal(false)} className="btn btn-secondary">Cancelar</button>
              <button onClick={addRole} disabled={savingRole} className="btn btn-primary">{savingRole ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default SettingsPage
