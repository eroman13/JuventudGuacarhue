import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useClubData } from '../../hooks/useClubData'
import { getSyncSnapshot } from '../../data/clubStore'
import type { NoticiaItem } from '../../data/seedData'
import {
  Badge,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  ImagePreview,
  SectionHeading,
  formatFecha,
  inputClass,
  isImageSource,
  labelClass,
  primaryButtonClass,
  readImageFile,
  secondaryButtonClass,
  selectClass,
  subtleButtonClass,
  dangerLinkClass,
  textareaClass,
  todayInputValue,
  type ManagerProps,
  uploadImageFile,
} from './ui'
import RichTextEditor from './RichTextEditor'

const CATEGORIAS = [
  'Resultados',
  'Fichajes',
  'Fixtures',
  'Instalaciones',
  'Lesiones',
  'Institucional',
]

interface NoticiaForm {
  titulo: string
  categoria: string
  fecha: string
  imagen: string
  extracto: string
  contenido: string
  destacada: boolean
}

type FormErrors = Partial<Record<keyof NoticiaForm, string>>

function createEmptyForm(): NoticiaForm {
  return {
    titulo: '',
    categoria: CATEGORIAS[0],
    fecha: todayInputValue(),
    imagen: '',
    extracto: '',
    contenido: '',
    destacada: false,
  }
}

export default function NoticiasManager({ canManage, notify }: ManagerProps) {
  const { noticias, addNoticia, updateNoticia, deleteNoticia, guardarEnServidor } = useClubData()
  const [form, setForm] = useState<NoticiaForm>(createEmptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [pendingDelete, setPendingDelete] = useState<NoticiaItem | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const noticiasFiltradas = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) {
      return noticias
    }

    return noticias.filter((noticia) =>
      [noticia.titulo, noticia.categoria, noticia.extracto]
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [noticias, search])

  const setField = (field: keyof NoticiaForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = (): boolean => {
    const next: FormErrors = {}
    if (form.titulo.trim().length < 5) {
      next.titulo = 'Escribe un titulo de al menos 5 caracteres.'
    }
    if (!form.fecha) {
      next.fecha = 'Selecciona la fecha de publicacion.'
    }
    if (!isImageSource(form.imagen.trim())) {
      next.imagen = 'Ingresa una URL valida o sube una imagen desde tu equipo.'
    }
    if (form.extracto.trim().length < 10) {
      next.extracto = 'El extracto debe tener al menos 10 caracteres.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const imageUrl = await uploadImageFile(file)
      setField('imagen', imageUrl)
    } catch {
      try {
        const fallbackUrl = await readImageFile(file)
        setField('imagen', fallbackUrl)
      } catch {
        notify('No pudimos subir ni leer la imagen seleccionada.', 'error')
      }
    } finally {
      event.target.value = ''
    }
  }

  const resetForm = () => {
    setForm(createEmptyForm())
    setEditingId(null)
    setErrors({})
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
      imagen: form.imagen.trim(),
      extracto: form.extracto.trim(),
      contenido: form.contenido.trim(),
      destacada: form.destacada,
    }

    const accion = editingId !== null ? 'Noticia actualizada' : 'Noticia publicada'

    if (editingId !== null) {
      if (!updateNoticia(editingId, payload)) {
        notify('No pudimos actualizar la noticia seleccionada.', 'error')
        return
      }
    } else {
      addNoticia(payload)
    }

    resetForm()

    // Confirmamos con el servidor antes de dar la noticia por publicada.
    const guardado = await guardarEnServidor()

    if (guardado) {
      notify(`${accion} y guardada en el servidor.`)
      return
    }

    const sincronizacion = getSyncSnapshot()

    if (sincronizacion.estado === 'guardando') {
      notify(`${accion}. Guardando en el servidor...`)
      return
    }

    notify(`${accion} solo en este navegador. ${sincronizacion.mensaje}`, 'error')
  }

  const startEdit = (noticia: NoticiaItem) => {
    setEditingId(noticia.id)
    setForm({
      titulo: noticia.titulo,
      categoria: noticia.categoria,
      fecha: noticia.fecha,
      imagen: noticia.imagen,
      extracto: noticia.extracto,
      contenido: noticia.contenido ?? '',
      destacada: noticia.destacada ?? false,
    })
    setErrors({})
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const confirmDelete = async () => {
    if (!pendingDelete) {
      return
    }

    deleteNoticia(pendingDelete.id)
    if (editingId === pendingDelete.id) {
      resetForm()
    }
    setPendingDelete(null)

    const guardado = await guardarEnServidor()

    if (guardado) {
      notify('Noticia eliminada y guardada en el servidor.')
      return
    }

    const sincronizacion = getSyncSnapshot()

    if (sincronizacion.estado === 'guardando') {
      notify('Noticia eliminada. Guardando en el servidor...')
      return
    }

    notify(`Noticia eliminada solo en este navegador. ${sincronizacion.mensaje}`, 'error')
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Noticias"
        description="Publica, edita y elimina las noticias que aparecen en el sitio."
        action={<Badge tone="blue">{noticias.length} publicadas</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
        <div ref={formRef}>
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-950">
                {editingId !== null ? 'Editar noticia' : 'Nueva noticia'}
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
                  placeholder="Gran victoria en el clasico"
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

              <Field
                label="URL o imagen"
                error={errors.imagen}
                hint="Se muestra en portada y listados. Puedes pegar una URL o subir una imagen."
              >
                <input
                  value={form.imagen}
                  onChange={(event) => setField('imagen', event.target.value)}
                  className={inputClass}
                  placeholder="https://..."
                  disabled={!canManage}
                />
              </Field>

              <div className="flex flex-wrap items-center gap-2">
                <label className={`${secondaryButtonClass} cursor-pointer`}>
                  Subir imagen
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={!canManage}
                  />
                </label>
                {form.imagen && (
                  <button
                    type="button"
                    onClick={() => setField('imagen', '')}
                    className={subtleButtonClass}
                    disabled={!canManage}
                  >
                    Quitar
                  </button>
                )}
              </div>

              <ImagePreview
                url={form.imagen}
                alt="Vista previa de la noticia"
                className="h-36 w-full rounded-lg object-cover"
              />

              <Field
                label="Extracto"
                error={errors.extracto}
                hint="Resumen corto: se muestra solo en la portada y en las tarjetas, no dentro de la noticia."
              >
                <textarea
                  value={form.extracto}
                  onChange={(event) => setField('extracto', event.target.value)}
                  className={textareaClass}
                  placeholder="Resumen breve de la noticia..."
                  disabled={!canManage}
                />
              </Field>

              <div>
                <span className={labelClass}>Cuerpo de la noticia</span>
                <RichTextEditor
                  value={form.contenido}
                  onChange={(html) => setField('contenido', html)}
                  disabled={!canManage}
                  notify={notify}
                  previewTitulo={form.titulo || 'Titulo de la noticia'}
                  previewCategoria={form.categoria}
                  previewFecha={formatFecha(form.fecha)}
                  previewImagen={form.imagen}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Es el texto que se ve al abrir la noticia. Si lo dejas vacío, la noticia se muestra
                  solo con su titulo, fecha e imagen.
                </p>
              </div>

              <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.destacada}
                  onChange={(event) => setField('destacada', event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  disabled={!canManage}
                />
                Destacar en el carrusel principal
              </label>

              <button type="submit" className={`${primaryButtonClass} w-full`} disabled={!canManage}>
                {editingId !== null ? 'Guardar cambios' : 'Publicar noticia'}
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
              placeholder="Buscar por titulo, categoria o extracto..."
              aria-label="Buscar noticias"
            />
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              {noticiasFiltradas.length} resultado(s)
            </span>
          </div>

          {noticiasFiltradas.length === 0 ? (
            <EmptyState
              title={noticias.length === 0 ? 'Aun no hay noticias' : 'Sin resultados'}
              description={
                noticias.length === 0
                  ? 'Usa el formulario para publicar la primera noticia del club.'
                  : 'Prueba con otro termino de busqueda.'
              }
            />
          ) : (
            <div className="space-y-3">
              {noticiasFiltradas.map((noticia) => (
                <Card key={noticia.id} className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <ImagePreview
                      url={noticia.imagen}
                      alt={noticia.titulo}
                      className="h-32 w-full shrink-0 rounded-lg object-cover sm:h-28 sm:w-44"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="blue">{noticia.categoria}</Badge>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                          {formatFecha(noticia.fecha)}
                        </span>
                        {noticia.contenido && <Badge tone="green">Con articulo completo</Badge>}
                      </div>
                      <h3 className="mt-2 text-lg font-bold leading-snug text-slate-950">
                        {noticia.titulo}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{noticia.extracto}</p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(noticia)}
                          className={subtleButtonClass}
                          disabled={!canManage}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(noticia)}
                          className={dangerLinkClass}
                          disabled={!canManage}
                        >
                          Eliminar
                        </button>
                      </div>
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
        title="Eliminar noticia"
        message={`Se eliminara "${pendingDelete?.titulo ?? ''}" del sitio. Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
