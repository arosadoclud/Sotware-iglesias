import { useState } from 'react'
import { Camera, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { authApi, BACKEND_URL } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [name, setName] = useState(user?.fullName || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const uploadPhoto = async (file?: File) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return toast.error('Selecciona una imagen JPG, PNG o WebP')
    if (file.size > 2 * 1024 * 1024) return toast.error('La imagen debe pesar menos de 2 MB')
    setUploading(true)
    try {
      const response = await authApi.uploadAvatar(file)
      updateUser({ avatarUrl: response.data.data.avatarUrl })
      toast.success('Foto de perfil actualizada')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'No se pudo subir la foto')
    } finally { setUploading(false) }
  }

  const saveName = async () => {
    if (!name.trim()) return toast.error('Ingresa tu nombre')
    setSaving(true)
    try {
      const response = await authApi.updateProfile({ fullName: name.trim() })
      updateUser({ fullName: response.data.data.fullName })
      toast.success('Perfil actualizado')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'No se pudo guardar el perfil')
    } finally { setSaving(false) }
  }

  return <div className="mx-auto max-w-2xl space-y-6">
    <div><span className="text-xs font-bold tracking-[.16em] text-amber-700">MI CUENTA</span><h1 className="mt-2 text-3xl font-bold text-slate-900">Mi perfil</h1><p className="mt-1 text-sm text-slate-500">Tu información y la foto que aparece junto a tu nombre.</p></div>
    <Card className="border-slate-200 shadow-sm"><CardContent className="space-y-6 p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-2xl font-semibold text-slate-700">
          {user?.avatarUrl ? <img src={`${BACKEND_URL}${user.avatarUrl}`} alt="Tu foto de perfil" className="h-full w-full object-cover" /> : <UserRound size={32} />}
        </div>
        <div><h2 className="font-semibold text-slate-900">Foto de perfil</h2><p className="mb-3 text-xs text-slate-500">JPG, PNG o WebP · máximo 2 MB</p>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Camera size={16} />{uploading ? 'Subiendo…' : 'Subir foto'}
            <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={event => { uploadPhoto(event.target.files?.[0]); event.target.value = '' }} />
          </label>
        </div>
      </div>
      <div className="border-t border-slate-100 pt-6 space-y-5">
        <div className="space-y-2"><Label htmlFor="profile-name">Nombre completo</Label><Input id="profile-name" value={name} onChange={event => setName(event.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="profile-email">Correo electrónico</Label><Input id="profile-email" value={user?.email || ''} disabled /><p className="text-xs text-slate-500">El correo de acceso no se cambia desde este perfil.</p></div>
        <Button onClick={saveName} disabled={saving}>{saving ? 'Guardando…' : 'Guardar nombre'}</Button>
      </div>
    </CardContent></Card>
  </div>
}
