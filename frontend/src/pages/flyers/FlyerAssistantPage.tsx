import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  Download,
  ImagePlus,
  Sparkles,
  Save
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ChurchModuleHeader } from '../../components/layout/ChurchModuleHeader'
import { churchesApi, eventsApi, BACKEND_URL } from '../../lib/api'
import { downloadBlob } from '../../lib/downloadHelper'
import { useAuthStore } from '../../store/authStore'
import { P } from '../../constants/permissions'
import {
  buildFlyerPrompt,
  initialBrief,
  type FlyerBrief,
  type FlyerSpeaker
} from './flyerPrompt'
import './flyer-assistant.css'
type Speaker = FlyerSpeaker & { photo?: File; url?: string }
export default function FlyerAssistantPage() {
  const { user, hasPermission } = useAuthStore()
  const [brief, setBrief] = useState<FlyerBrief>(initialBrief)
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [result, setResult] = useState<{ file: File; url: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState('')
  const uploadedUrl = useRef('')
  const objectUrls = useRef(new Set<string>())
  const form = useRef<HTMLFormElement>(null)
  const promptArea = useRef<HTMLTextAreaElement>(null)
  const draftKey = 'flyer-assistant:' + user?.churchId + ':' + user?.id
  useEffect(() => {
    let cancelled = false
    churchesApi
      .getMine()
      .then((r) => {
        if (!cancelled)
          setBrief((b) => ({
            ...b,
            church: b.church || r.data.data?.name || ''
          }))
      })
      .catch(() => {})
    return () => {
      cancelled = true
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])
  const prompt = useMemo(
    () => buildFlyerPrompt(brief, speakers),
    [brief, speakers]
  )
  const update = (key: keyof FlyerBrief, value: string) =>
    setBrief((b) => ({ ...b, [key]: value }))
  const valid = () => {
    if (!form.current?.reportValidity()) return false
    if (
      [
        brief.church,
        brief.theme,
        brief.location,
        ...speakers.map((s) => s.name)
      ].some((value) => !value.trim())
    ) {
      toast.error('Completa los campos obligatorios con un texto válido.')
      return false
    }
    return true
  }
  const release = (url?: string) => {
    if (url) {
      URL.revokeObjectURL(url)
      objectUrls.current.delete(url)
    }
  }
  async function imageFile(file?: File) {
    if (!file) return null
    if (
      !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
      file.size > 8 * 1024 * 1024
    ) {
      toast.error('Selecciona una imagen PNG, JPG o WebP de hasta 8 MB.')
      return null
    }
    const url = URL.createObjectURL(file)
    try {
      await new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = reject
        img.src = url
      })
      objectUrls.current.add(url)
      return { file, url }
    } catch {
      URL.revokeObjectURL(url)
      toast.error('No se pudo leer esta imagen.')
      return null
    }
  }
  async function copyPrompt() {
    if (!valid()) return false
    try {
      await navigator.clipboard.writeText(prompt)
      toast.success('Prompt copiado. Pégalo en ChatGPT y adjunta tus archivos.')
      return true
    } catch {
      promptArea.current?.focus()
      promptArea.current?.select()
      toast.error('Copia el texto seleccionado para pegarlo en ChatGPT.')
      return false
    }
  }
  function openChatGPT() {
    if (!valid()) return
    // Open synchronously from the click so mobile browsers do not block it after clipboard awaits.
    const copied = copyPrompt()
    window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer')
    void copied
  }
  function saveDraft() {
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          brief,
          speakers: speakers.map(({ id, name, role }) => ({ id, name, role }))
        })
      )
      toast.success(
        'Datos guardados en este navegador. Las fotos no se conservan.'
      )
    } catch {
      toast.error('No se pudo guardar el borrador en este navegador.')
    }
  }
  function loadDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(draftKey) || 'null')
      if (!draft || !draft.brief || !Array.isArray(draft.speakers))
        throw Error()
      const next = { ...initialBrief }
      for (const key of Object.keys(next) as (keyof FlyerBrief)[])
        if (typeof draft.brief[key] === 'string') next[key] = draft.brief[key]
      speakers.forEach((s) => release(s.url))
      setBrief(next)
      setSpeakers(
        draft.speakers
          .slice(0, 10)
          .filter(
            (s: Speaker) =>
              typeof s.name === 'string' && typeof s.role === 'string'
          )
          .map((s: Speaker) => ({
            id: crypto.randomUUID(),
            name: s.name,
            role: s.role
          }))
      )
      toast.success(
        'Borrador cargado. Adjunta de nuevo las fotos si las necesitas.'
      )
    } catch {
      toast.error('No hay un borrador válido guardado.')
    }
  }
  async function saveResult() {
    if (!result || !valid() || saving || savedId) return
    setSaving(true)
    try {
      if (!uploadedUrl.current) {
        const r = await eventsApi.uploadImage(result.file)
        uploadedUrl.current = r.data.data.filename
          ? `${BACKEND_URL}/uploads/events/${encodeURIComponent(r.data.data.filename)}`
          : r.data.data.url
      }
      const r = await eventsApi.create({
        title: brief.theme,
        description: 'Flyer de ' + brief.church,
        type: 'flyer',
        imageUrl: uploadedUrl.current,
        date: brief.date,
        time: brief.time,
        location: brief.location,
        isActive: false
      })
      setSavedId(r.data.data._id)
      toast.success(
        'Flyer guardado en Eventos como inactivo. Puedes publicarlo desde allí.'
      )
    } catch {
      toast.error('No se pudo guardar el flyer. Puedes volver a intentarlo.')
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="church-module-workspace flyer-assistant">
      <ChurchModuleHeader
        eyebrow="COMUNICAMOS CON PROPÓSITO"
        title="Asistente de flyers"
        description="Prepara tu idea, créala en ChatGPT y vuelve con tu diseño terminado."
      />
      <div className="fa-steps">
        <span>
          <b>01</b> Prepara los datos
        </span>
        <span>
          <b>02</b> Crea en ChatGPT
        </span>
        <span>
          <b>03</b> Guarda tu flyer
        </span>
      </div>
      <div className="fa-workspace">
        <form
          ref={form}
          className="fa-panel"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="fa-section-heading">
            <span>EL ENCUENTRO</span>
            <h2>Los detalles de tu flyer</h2>
            <p>Completa la información tal como debe aparecer en la imagen.</p>
          </div>
          <div className="fa-fields">
            <label>
              Nombre de la iglesia *
              <input
                required
                maxLength={200}
                value={brief.church}
                onChange={(e) => update('church', e.target.value)}
              />
            </label>
            <label>
              Tema *
              <input
                required
                maxLength={200}
                value={brief.theme}
                onChange={(e) => update('theme', e.target.value)}
                placeholder="Una noche de fe y esperanza"
              />
            </label>
            <div className="fa-two">
              <label>
                Fecha *
                <input
                  required
                  type="date"
                  value={brief.date}
                  onChange={(e) => update('date', e.target.value)}
                />
              </label>
              <label>
                Hora *
                <input
                  required
                  type="time"
                  value={brief.time}
                  onChange={(e) => update('time', e.target.value)}
                />
              </label>
            </div>
            <label>
              Lugar o dirección *
              <input
                required
                maxLength={200}
                value={brief.location}
                onChange={(e) => update('location', e.target.value)}
                placeholder="Templo principal · Dirección del encuentro"
              />
            </label>
            <div className="fa-two">
              <label>
                Estilo
                <select
                  value={brief.style}
                  onChange={(e) => update('style', e.target.value)}
                >
                  {[
                    'Elegante: azul marino, marfil y dorado',
                    'Adoración: luz cálida y composición serena',
                    'Juvenil: colores vivos y composición dinámica'
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Formato
                <select
                  value={brief.size}
                  onChange={(e) => update('size', e.target.value)}
                >
                  {[
                    'Vertical 1080 × 1350 px',
                    'Cuadrado 1080 × 1080 px',
                    'Historia 1080 × 1920 px'
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="fa-section-heading fa-divider">
            <span>QUIENES COMPARTEN LA PALABRA</span>
            <h2>Predicadores y expositores</h2>
            <p>
              Añade uno o varios. Cada foto es opcional; si no la incluyes, el
              diseño llevará solo el nombre y cargo.
            </p>
          </div>
          {speakers.map((speaker, i) => (
            <section
              className="fa-speaker"
              key={speaker.id}
              aria-label={'Participante ' + (i + 1)}
            >
              <div className="fa-speaker-heading">
                <b>Participante {i + 1}</b>
                <button
                  type="button"
                  aria-label={'Quitar participante ' + (i + 1)}
                  onClick={() => {
                    release(speaker.url)
                    setSpeakers((s) => s.filter((p) => p.id !== speaker.id))
                  }}
                >
                  <Trash2 size={17} />
                </button>
              </div>
              <div className="fa-two">
                <label>
                  Nombre del participante *
                  <input
                    required
                    maxLength={100}
                    value={speaker.name}
                    onChange={(e) =>
                      setSpeakers((s) =>
                        s.map((p) =>
                          p.id === speaker.id
                            ? { ...p, name: e.target.value }
                            : p
                        )
                      )
                    }
                  />
                </label>
                <label>
                  Cargo
                  <input
                    maxLength={80}
                    value={speaker.role}
                    placeholder="Pastor, pastora, expositor…"
                    onChange={(e) =>
                      setSpeakers((s) =>
                        s.map((p) =>
                          p.id === speaker.id
                            ? { ...p, role: e.target.value }
                            : p
                        )
                      )
                    }
                  />
                </label>
              </div>
              <label className="fa-upload">
                Foto opcional · JPG, PNG o WebP, hasta 8 MB
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={async (e) => {
                    const image = await imageFile(e.target.files?.[0])
                    if (image) {
                      release(speaker.url)
                      setSpeakers((s) =>
                        s.map((p) =>
                          p.id === speaker.id
                            ? {
                                ...p,
                                photo: image.file,
                                photoName: image.file.name,
                                url: image.url
                              }
                            : p
                        )
                      )
                    }
                    e.target.value = ''
                  }}
                />
              </label>
              {speaker.url && (
                <div className="fa-photo">
                  <img
                    src={speaker.url}
                    alt={
                      'Foto de ' + (speaker.name || 'participante ' + (i + 1))
                    }
                  />
                  <span>
                    {speaker.photoName}
                    <button
                      type="button"
                      onClick={() => {
                        release(speaker.url)
                        setSpeakers((s) =>
                          s.map((p) =>
                            p.id === speaker.id
                              ? {
                                  ...p,
                                  photo: undefined,
                                  photoName: undefined,
                                  url: undefined
                                }
                              : p
                          )
                        )
                      }}
                    >
                      Quitar foto
                    </button>
                  </span>
                </div>
              )}
            </section>
          ))}
          <button
            type="button"
            className="fa-outline"
            disabled={speakers.length >= 10}
            onClick={() =>
              setSpeakers((s) => [
                ...s,
                { id: crypto.randomUUID(), name: '', role: '' }
              ])
            }
          >
            <Plus size={16} /> Añadir predicador o expositor
          </button>
          <label className="fa-notes">
            Indicaciones adicionales
            <textarea
              maxLength={1500}
              rows={3}
              value={brief.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Colores, ambiente, orden de los participantes…"
            />
          </label>
          <div className="fa-actions">
            <button type="button" className="fa-outline" onClick={saveDraft}>
              <Save size={16} /> Guardar borrador
            </button>
            <button type="button" className="fa-outline" onClick={loadDraft}>
              Cargar borrador
            </button>
          </div>
          <small>
            El borrador guarda los textos solo en este navegador y para tu
            usuario. Las fotos deben seleccionarse de nuevo.
          </small>
        </form>
        <aside className="fa-panel fa-prompt">
          <div className="fa-section-heading">
            <span>LISTO PARA CREAR</span>
            <h2>
              <Sparkles size={20} /> Tu prompt profesional
            </h2>
            <p>
              Este asistente prepara las instrucciones. La imagen se genera en
              tu propia cuenta de ChatGPT, según su disponibilidad y límites.
            </p>
          </div>
          <label>
            Prompt para ChatGPT
            <textarea ref={promptArea} readOnly rows={15} value={prompt} />
          </label>
          <div className="fa-actions">
            <button className="fa-primary" onClick={openChatGPT}>
              <ExternalLink size={16} /> Copiar prompt y abrir ChatGPT
            </button>
            <button className="fa-outline" onClick={() => void copyPrompt()}>
              <Copy size={16} /> Copiar prompt
            </button>
          </div>
          <div className="fa-attachments">
            <h3>Adjunta estos archivos en ChatGPT</h3>
            <a href="/arca-logo.png" download="arca-logo.png">
              <Download size={16} /> Descargar logo de la iglesia
            </a>
            <ul>
              {speakers
                .filter((s) => s.photoName)
                .map((s) => (
                  <li key={s.id}>
                    {s.photoName} — {s.name || 'Participante sin nombre'}
                  </li>
                ))}
            </ul>
            <p>
              Las fotos y el logo no se envían automáticamente. Pega el prompt y
              adjunta los archivos en la nueva pestaña. Si no se abre, usa{' '}
              <a
                href="https://chatgpt.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir ChatGPT
              </a>
              .
            </p>
          </div>
        </aside>
      </div>
      <section className="fa-panel">
        <div className="fa-section-heading">
          <span>EL RESULTADO</span>
          <h2>Tu flyer terminado</h2>
          <p>
            Descarga la imagen desde ChatGPT y selecciónala aquí. Solo se subirá
            a la iglesia cuando pulses Guardar en Eventos.
          </p>
        </div>
        <label className="fa-upload">
          <ImagePlus size={20} /> Seleccionar flyer terminado · hasta 8 MB
          <input
            disabled={saving}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={async (e) => {
              const image = await imageFile(e.target.files?.[0])
              if (image) {
                release(result?.url)
                setResult(image)
                uploadedUrl.current = ''
                setSavedId('')
              }
              e.target.value = ''
            }}
          />
        </label>
        {result && (
          <div className="fa-result">
            <img src={result.url} alt="Flyer terminado seleccionado" />
            <div>
              <p>{result.file.name}</p>
              <button
                className="fa-outline"
                onClick={() => downloadBlob(result.file, result.file.name)}
              >
                <Download size={16} /> Descargar imagen
              </button>
              {hasPermission(P.ACTIVITIES_CREATE) && (
                <button
                  className="fa-primary"
                  disabled={saving || Boolean(savedId)}
                  onClick={saveResult}
                >
                  {saving
                    ? 'Guardando…'
                    : savedId
                      ? 'Guardado en Eventos'
                      : 'Guardar en Eventos'}
                </button>
              )}
              {savedId && <Link to="/events">Ver Eventos</Link>}
              <p>
                Se guarda como inactivo para que puedas revisarlo antes de
                publicarlo.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
