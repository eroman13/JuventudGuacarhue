import { useMemo, useRef, useState, type FormEvent } from 'react'
import { useClubData } from '../../hooks/useClubData'
import type { VideoItem } from '../../data/seedData'
import {
  Badge,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  ImagePreview,
  SectionHeading,
  dangerLinkClass,
  formatFecha,
  inputClass,
  isHttpUrl,
  primaryButtonClass,
  selectClass,
  subtleButtonClass,
  todayInputValue,
  type ManagerProps,
} from './ui'

const CATEGORIAS = ['Partidos', 'Entrenamientos', 'Entrevistas', 'Institucional']

interface VideoForm {
  titulo: string
  categoria: string
  fecha: string
  url: string
  miniatura: string
}

type FormErrors = Partial<Record<keyof VideoForm, string>>

function createEmptyForm(): VideoForm {
  return {
    titulo: '',
    categoria: CATEGORIAS[0],
    fecha: todayInputValue(),
    url: '',
    miniatura: '',
  }
}

export default function VideosManager({ canManage, notify }: ManagerProps) {
  const { videos, addVideo, updateVideo, deleteVideo } = useClubData()
  const [form, setForm] = useState<VideoForm>(createEmptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [pendingDelete, setPendingDelete] = useState<VideoItem | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const videosFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) {
      return [...videos].sort((a, b) => b.fecha.localeCompare(a.fecha))
    }

    return videos
      .filter((video) => [video.titulo, video.categoria, video.url].join(' ').toLowerCase().includes(term))
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [videos, search])

  const setField = (field: keyof VideoForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const resetForm = () => {
    setForm(createEmptyForm())
    setEditingId(null)
    setErrors({})
  }

  const validate = (): boolean => {
    const next: FormErrors = {}
    if (form.titulo.trim().length < 5) {
      next.titulo = 'El titulo debe tener al menos 5 caracteres.'
    }
    if (!form.fecha) {
      next.fecha = 'Selecciona la fecha del video.'
    }
    if (!isHttpUrl(form.url.trim())) {
      next.url = 'Ingresa una URL valida para el video.'
    }
    if (!isHttpUrl(form.miniatura.trim())) {
      next.miniatura = 'Ingresa una URL valida para la miniatura.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canManage) {
      notify('Tu rol es de solo lectura.', 'error')
      return
    }
    if (!validate()) {
      notify('Revisa los campos marcados en rojo.', 'error')
      return
    }

    const payload = {
      titulo: form.titulo.trim(),
      categoria: form.categoria.trim(),
      fecha: form.fecha,
      url: form.url.trim(),
      miniatura: form.miniatura.trim(),
    }

    if (editingId !== null) {
      if (!updateVideo(editingId, payload)) {
        notify('No pudimos actualizar el video.', 'error')
        return
      }
      notify('Video actualizado correctamente.')
    } else {
      addVideo(payload)
      notify('Video agregado correctamente.')
    }

    resetForm()
  }

  const startEdit = (video: VideoItem) => {
    setEditingId(video.id)
    setForm({
      titulo: video.titulo,
      categoria: video.categoria,
      fecha: video.fecha,
      url: video.url,
      miniatura: video.miniatura,
    })
    setErrors({})
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const confirmDelete = () => {
    if (!pendingDelete) {
      return
    }

    deleteVideo(pendingDelete.id)
    if (editingId === pendingDelete.id) {
      resetForm()
    }
    notify('Video eliminado.')
    setPendingDelete(null)
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Videos"
        description="Gestiona videos destacados, entrevistas y resumenes."
        action={<Badge tone="blue">{videos.length} videos</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div ref={formRef} className="xl:sticky xl:top-24 xl:self-start">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-950">
                {editingId !== null ? 'Editar video' : 'Nuevo video'}
              </h3>
              {editingId !== null && (
                <button type="button" onClick={resetForm} className={subtleButtonClass}>
                  Cancelar
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Field label="Titulo" error={errors.titulo}>
                <input
                  value={form.titulo}
                  onChange={(event) => setField('titulo', event.target.value)}
                  className={inputClass}
                  placeholder="Resumen jornada 12"
                  disabled={!canManage}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Categoria">
                  <select
                    value={form.categoria}
                    onChange={(event) => setField('categoria', event.target.value)}
                    className={selectClass}
                    disabled={!canManage}
                  >
                    {CATEGORIAS.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {categoria}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Fecha" error={errors.fecha}>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(event) => setField('fecha', event.target.value)}
                    className={inputClass}
                    disabled={!canManage}
                  />
                </Field>
              </div>

              <Field label="URL del video" error={errors.url}>
                <input
                  value={form.url}
                  onChange={(event) => setField('url', event.target.value)}
                  className={inputClass}
                  placeholder="https://..."
                  disabled={!canManage}
                />
              </Field>

              <Field label="URL de miniatura" error={errors.miniatura}>
                <input
                  value={form.miniatura}
                  onChange={(event) => setField('miniatura', event.target.value)}
                  className={inputClass}
                  placeholder="https://..."
                  disabled={!canManage}
                />
              </Field>

              <ImagePreview
                url={form.miniatura}
                alt="Vista previa de miniatura"
                className="h-40 w-full rounded-lg object-cover"
              />

              <button type="submit" className={`${primaryButtonClass} w-full`} disabled={!canManage}>
                {editingId !== null ? 'Guardar cambios' : 'Agregar video'}
              </button>
            </form>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={`${inputClass} max-w-sm`}
              placeholder="Buscar por titulo, categoria o URL..."
              aria-label="Buscar videos"
            />
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              {videosFiltrados.length} resultado(s)
            </span>
          </div>

          {videosFiltrados.length === 0 ? (
            <EmptyState
              title={videos.length === 0 ? 'Aun no hay videos' : 'Sin resultados'}
              description={
                videos.length === 0
                  ? 'Agrega el primer video para publicarlo en el sitio.'
                  : 'Prueba con otro termino de busqueda.'
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {videosFiltrados.map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  <ImagePreview
                    url={video.miniatura}
                    alt={video.titulo}
                    className="h-44 w-full object-cover"
                  />
                  <div className="space-y-2 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge tone="blue">{video.categoria}</Badge>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        {formatFecha(video.fecha)}
                      </span>
                    </div>
                    <h3 className="text-base font-bold leading-snug text-slate-950">{video.titulo}</h3>
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                    >
                      Ver enlace
                    </a>
                    <div className="flex gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => startEdit(video)}
                        className={subtleButtonClass}
                        disabled={!canManage}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(video)}
                        className={dangerLinkClass}
                        disabled={!canManage}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminar video"
        message={`Se eliminara "${pendingDelete?.titulo ?? ''}" del listado.`}
        confirmLabel="Eliminar"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
