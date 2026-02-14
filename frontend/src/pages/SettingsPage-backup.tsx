import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { churchesApi, rolesApi } from '../lib/api'
import { toast } from 'sonner'
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  Church,
  Palette,
  Shield,
  Upload,
  Settings2,
  ImageIcon,
  Phone,
  MapPin,
  Globe,
  Mail,
  Hash,
  Pencil,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

type TabId = 'general' | 'branding' | 'roles' | 'advanced'

interface TabItem {
  id: TabId
  label: string
  icon: any
  description: string
}

const TABS: TabItem[] = [
  { id: 'general', label: 'General', icon: Church, description: 'Información de la iglesia' },
  { id: 'branding', label: 'Marca', icon: Palette, description: 'Logo y apariencia' },
  { id: 'roles', label: 'Roles', icon: Shield, description: 'Gestión de roles' },
  { id: 'advanced', label: 'Avanzado', icon: Settings2, description: 'Configuración avanzada' },
]

const SettingsPage = () => {
  const [church, setChurch] = useState<any>(null)
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('general')
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    requiresSkill: false,
  })
  const [savingRole, setSavingRole] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingSignature, setUploadingSignature] = useState(false)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [cRes, rRes] = await Promise.all([churchesApi.getMine(), rolesApi.getAll()])
      setChurch(cRes.data.data)
      setRoles(rRes.data.data)
    } catch {
      toast.error('Error al cargar configuración')
    }
    setLoading(false)
  }

  const saveChurch = async () => {
    setSaving(true)
    try {
      await churchesApi.updateMine(church)
      toast.success('Configuración guardada')
    } catch {
      toast.error('Error al guardar')
    }
    setSaving(false)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const res = await churchesApi.uploadLogo(file)
      setChurch(res.data.data)
      toast.success('Logo actualizado')
    } catch {
      toast.error('Error al subir logo')
    }
    setUploadingLogo(false)
  }

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingSignature(true)
    try {
      const res = await churchesApi.uploadSignature(file)
      setChurch(res.data.data)
      toast.success('Firma actualizada')
    } catch {
      toast.error('Error al subir firma')
    }
    setUploadingSignature(false)
  }

  const openRoleModal = (role?: any) => {
    if (role) {
      setEditingRole(role)
      setRoleForm({
        name: role.name,
        description: role.description || '',
        color: role.color || '#3B82F6',
        requiresSkill: role.requiresSkill || false,
      })
    } else {
      setEditingRole(null)
      setRoleForm({ name: '', description: '', color: '#3B82F6', requiresSkill: false })
    }
    setShowRoleModal(true)
  }

  const saveRole = async () => {
    if (!roleForm.name.trim()) return toast.error('Nombre requerido')
    setSavingRole(true)
    try {
      if (editingRole) {
        await rolesApi.update(editingRole._id, roleForm)
        toast.success('Rol actualizado')
      } else {
        await rolesApi.create(roleForm)
        toast.success('Rol creado')
      }
      setShowRoleModal(false)
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error')
    }
    setSavingRole(false)
  }

  const deleteRole = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar rol "${name}"? Esta acción no se puede deshacer.`)) return
    try {
      await rolesApi.delete(id)
      toast.success('Rol eliminado')
      load()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <p className="text-sm text-neutral-500">Cargando configuración...</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Configuración</h1>
        <p className="text-neutral-500 mt-1">Administra la información y preferencias de tu iglesia</p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-1 p-1 bg-neutral-100 rounded-xl overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700 hover:bg-white/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* General Tab */}
          {activeTab === 'general' && church && (
            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Información de la Iglesia</CardTitle>
                  <CardDescription>Datos principales de tu organización</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-1.5">
                      <Church className="w-3.5 h-3.5 text-neutral-400" />
                      Nombre de la Iglesia
                    </Label>
                    <Input
                      id="name"
                      value={church.name || ''}
                      onChange={(e) => setChurch({ ...church, name: e.target.value })}
                      placeholder="Nombre de la iglesia"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                      Dirección
                    </Label>
                    <Input
                      value={church.address?.street || ''}
                      onChange={(e) =>
                        setChurch({ ...church, address: { ...church.address, street: e.target.value } })
                      }
                      placeholder="Dirección completa"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-neutral-400" />
                        Ciudad
                      </Label>
                      <Input
                        value={church.address?.city || ''}
                        onChange={(e) =>
                          setChurch({ ...church, address: { ...church.address, city: e.target.value } })
                        }
                        placeholder="Ciudad"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                        Estado/Provincia
                      </Label>
                      <Input
                        value={church.address?.state || ''}
                        onChange={(e) =>
                          setChurch({ ...church, address: { ...church.address, state: e.target.value } })
                        }
                        placeholder="Estado o provincia"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-neutral-400" />
                        Teléfono
                      </Label>
                      <Input
                        value={church.phone || ''}
                        onChange={(e) => setChurch({ ...church, phone: e.target.value })}
                        placeholder="(000) 000-0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-neutral-400" />
                        Email
                      </Label>
                      <Input
                        value={church.email || ''}
                        onChange={(e) => setChurch({ ...church, email: e.target.value })}
                        placeholder="iglesia@ejemplo.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-neutral-400" />
                      Sitio Web
                    </Label>
                    <Input
                      value={church.website || ''}
                      onChange={(e) => setChurch({ ...church, website: e.target.value })}
                      placeholder="https://www.iglesia.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Nombre del Pastor</Label>
                    <Input
                      value={church.pastorName || ''}
                      onChange={(e) => setChurch({ ...church, pastorName: e.target.value })}
                      placeholder="Nombre del pastor principal"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={saveChurch} disabled={saving} size="lg">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar Cambios
                </Button>
              </div>
            </div>
          )}

          {/* Branding Tab */}
          {activeTab === 'branding' && church && (
            <div className="space-y-6">
              {/* Logo */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Logo de la Iglesia</CardTitle>
                  <CardDescription>Se usa en programas, cartas y documentos PDF</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-neutral-200 flex items-center justify-center bg-neutral-50 overflow-hidden">
                      {church.logoUrl ? (
                        <img
                          src={church.logoUrl}
                          alt="Logo"
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-neutral-300" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="cursor-pointer">
                        <Button variant="outline" size="sm" asChild disabled={uploadingLogo}>
                          <span>
                            {uploadingLogo ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Upload className="w-4 h-4 mr-2" />
                            )}
                            {church.logoUrl ? 'Cambiar Logo' : 'Subir Logo'}
                          </span>
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />
                      </label>
                      <p className="text-xs text-neutral-400">PNG, JPG o SVG. Max 2MB.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Firma */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Firma del Pastor</CardTitle>
                  <CardDescription>Se usa en cartas y documentos oficiales</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-16 rounded-lg border-2 border-dashed border-neutral-200 flex items-center justify-center bg-neutral-50 overflow-hidden">
                      {church.signatureUrl ? (
                        <img
                          src={church.signatureUrl}
                          alt="Firma"
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <Pencil className="w-6 h-6 text-neutral-300" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="cursor-pointer">
                        <Button variant="outline" size="sm" asChild disabled={uploadingSignature}>
                          <span>
                            {uploadingSignature ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Upload className="w-4 h-4 mr-2" />
                            )}
                            {church.signatureUrl ? 'Cambiar Firma' : 'Subir Firma'}
                          </span>
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleSignatureUpload}
                        />
                      </label>
                      <p className="text-xs text-neutral-400">Imagen de firma transparente (PNG recomendado)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Color de Marca */}
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Color de Marca</CardTitle>
                  <CardDescription>Color principal usado en documentos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl border shadow-sm cursor-pointer"
                      style={{ backgroundColor: church.brandColor || '#1e3a5f' }}
                    />
                    <div className="space-y-1">
                      <input
                        type="color"
                        value={church.brandColor || '#1e3a5f'}
                        onChange={(e) => setChurch({ ...church, brandColor: e.target.value })}
                        className="w-12 h-8 rounded cursor-pointer"
                      />
                      <p className="text-xs text-neutral-400 font-mono">
                        {church.brandColor || '#1e3a5f'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={saveChurch} disabled={saving} size="lg">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar Cambios
                </Button>
              </div>
            </div>
          )}

          {/* Roles Tab */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Roles Disponibles</CardTitle>
                      <CardDescription>
                        Roles que se asignan a las personas para los programas
                      </CardDescription>
                    </div>
                    <Button onClick={() => openRoleModal()} size="sm">
                      <Plus className="w-4 h-4 mr-1.5" />
                      Nuevo Rol
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {roles.length === 0 ? (
                    <div className="text-center py-12">
                      <Shield className="w-12 h-12 mx-auto mb-3 text-neutral-200" />
                      <p className="text-neutral-500">No hay roles creados</p>
                      <p className="text-sm text-neutral-400 mt-1">
                        Crea roles para organizar las asignaciones en los programas
                      </p>
                      <Button onClick={() => openRoleModal()} variant="outline" className="mt-4">
                        <Plus className="w-4 h-4 mr-1.5" />
                        Crear primer rol
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {roles.map((r) => (
                        <motion.div
                          key={r._id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-neutral-200 transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ backgroundColor: r.color || '#3B82F6' }}
                            >
                              {r.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-neutral-900 truncate">
                                {r.name}
                              </p>
                              {r.description && (
                                <p className="text-xs text-neutral-500 truncate">{r.description}</p>
                              )}
                              {r.requiresSkill && (
                                <Badge variant="secondary" className="text-[10px] mt-1 px-1.5 py-0">
                                  Requiere habilidad
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openRoleModal(r)}
                            >
                              <Pencil className="w-3.5 h-3.5 text-neutral-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-danger-50"
                              onClick={() => deleteRole(r._id, r.name)}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-danger-400" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && church && (
            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Configuración de Programas</CardTitle>
                  <CardDescription>Opciones para la generación automática de programas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-neutral-400" />
                      Semanas de Rotación
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min="2"
                        max="12"
                        value={church.settings?.rotationWeeks || 4}
                        onChange={(e) =>
                          setChurch({
                            ...church,
                            settings: { ...church.settings, rotationWeeks: Number(e.target.value) },
                          })
                        }
                        className="w-24"
                      />
                      <p className="text-sm text-neutral-500">
                        Cantidad de semanas antes de que una persona pueda repetir un mismo rol
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Zona Horaria</Label>
                    <Input
                      value={church.settings?.timezone || 'America/Santo_Domingo'}
                      onChange={(e) =>
                        setChurch({
                          ...church,
                          settings: { ...church.settings, timezone: e.target.value },
                        })
                      }
                      placeholder="America/Santo_Domingo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Formato de Fecha</Label>
                    <div className="flex gap-3">
                      {(['DD/MM/YYYY', 'MM/DD/YYYY'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() =>
                            setChurch({
                              ...church,
                              settings: { ...church.settings, dateFormat: fmt },
                            })
                          }
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            (church.settings?.dateFormat || 'DD/MM/YYYY') === fmt
                              ? 'border-primary-600 bg-primary-50 text-primary-700'
                              : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Hora Predeterminada</Label>
                    <Input
                      type="time"
                      value={church.settings?.defaultTime || '09:00'}
                      onChange={(e) =>
                        setChurch({
                          ...church,
                          settings: { ...church.settings, defaultTime: e.target.value },
                        })
                      }
                      className="w-40"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Plan Actual</CardTitle>
                  <CardDescription>Tu plan de suscripción actual</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        church.plan === 'ENTERPRISE'
                          ? 'default'
                          : church.plan === 'PRO'
                          ? 'success'
                          : 'secondary'
                      }
                      className="text-sm px-3 py-1"
                    >
                      {church.plan || 'FREE'}
                    </Badge>
                    <span className="text-sm text-neutral-500">
                      {church.plan === 'FREE' && 'Plan gratuito con funcionalidades básicas'}
                      {church.plan === 'PRO' && 'Plan profesional con todas las funcionalidades'}
                      {church.plan === 'ENTERPRISE' && 'Plan empresarial con soporte prioritario'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={saveChurch} disabled={saving} size="lg">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar Cambios
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Role Modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Editar Rol' : 'Nuevo Rol'}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? 'Modifica los datos del rol seleccionado'
                : 'Los roles definen las funciones que las personas pueden ejercer en los programas'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                placeholder="Ej: Adoración, Predicador, Ujier"
              />
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                placeholder="Descripción breve del rol"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={roleForm.color}
                    onChange={(e) => setRoleForm({ ...roleForm, color: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0"
                  />
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: roleForm.color }}
                  >
                    {roleForm.name?.charAt(0)?.toUpperCase() || 'R'}
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={roleForm.requiresSkill}
                    onChange={(e) => setRoleForm({ ...roleForm, requiresSkill: e.target.checked })}
                    className="rounded border-neutral-300"
                  />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">Requiere habilidad especial</p>
                    <p className="text-xs text-neutral-500">Solo personas con esta habilidad serán asignadas</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleModal(false)}>
              Cancelar
            </Button>
            <Button onClick={saveRole} disabled={savingRole}>
              {savingRole ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {editingRole ? 'Guardar' : 'Crear Rol'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export default SettingsPage
