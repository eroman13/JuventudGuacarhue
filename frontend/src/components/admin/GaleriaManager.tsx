import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useClubData } from '../../hooks/useClubData'
import type { GaleriaItem } from '../../data/seedData'
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
  isImageSource,
  primaryButtonClass,
  readImageFile,
  secondaryButtonClass,
  selectClass,
  subtleButtonClass,
  todayInputValue,
  type ManagerProps,
  uploadImageFile,
} from './ui'

const CATEGORIAS = ['Partidos', 'Entrenamientos', 'Eventos', 'Institucional']

interface FotoForm {
  categoria: string
  fecha: string
  url: string
}

type FormErrors = Partial<Record<keyof FotoForm, string>>

function createEmptyForm(): FotoForm {
  return { categoria: CATEGORIAS[0], fecha: todayInputValue(), url: '' }
}

export default function GaleriaManager({ canManage, notify }: ManagerProps) {
  const { galeria, addFoto, updateFoto, deleteFoto } = useClubData()
  const [form, setForm] = useState<FotoForm>(createEmptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [editingId, setEditingId] = useState<number | null>(null)
  const [filtro, setFiltro] = useState('Todas')
  const [pendingDelete, setPendingDelete] = useState<GaleriaItem | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const categorias = useMemo(() => {
    const set = new Set<string>(CATEGORIAS)
    galeria.forEach((foto) => set.add(foto.categoria))
    return ['Todas', ...Array.from(set)]
  }, [galeria])

  const fotosFiltradas = useMemo(() => {
    if (filtro === 'Todas') {
      return galeria
    }
    return galeria.filter((foto) => foto.categoria === filtro)
  }, [galeria, filtro])

  const setField = (field: keyof FotoForm, value: string) => {
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
    if (!form.categoria.trim()) {
      next.categoria = 'Selecciona una categoria.'
    }
    if (!form.fecha) {
      next.fecha = 'Selecciona la fecha de la foto.'
    }
    if (!isImageSource(form.url.trim())) {
      next.url = 'Ingresa una URL valida o sube una imagen desde tu equipo.'
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
      setField('url', imageUrl)
    } catch {
      try {
        const fallbackUrl = await readImageFile(file)
        setField('url', fallbackUrl)
      } catch {
        notify('No pudimos subir ni leer la imagen seleccionada.', 'error')
      }
    } finally {
      event.target.value = ''
    }
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
      categoria: form.categoria.trim(),
      fecha: form.fecha,
      url: form.url.trim(),
    }

    if (editingId !== null) {
      if (!updateFoto(editingId, payload)) {
        notify('No pudimos actualizar la foto seleccionada.', 'error')
        return
      }
      notify('Foto actualizada correctamente.')
    } else {
      addFoto(payload)
      notify('Foto agregada a la galeria.')
    }

    resetForm()
  }

  const startEdit = (foto: GaleriaItem) => {
    setEditingId(foto.id)
    setForm({ categoria: foto.categoria, fecha: foto.fecha, url: foto.url })
    setErrors({})
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const confirmDelete = () => {
    if (!pendingDelete) {
      return
    }

    deleteFoto(pendingDelete.id)
    if (editingId === pendingDelete.id) {
      resetForm()
    }
    notify('Foto eliminada de la galeria.')
    setPendingDelete(null)
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Galeria"
        description="Sube y organiza las imagenes de partidos, entrenamientos y eventos."
        action={<Badge tone="blue">{galeria.length} fotos</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div ref={formRef} className="xl:sticky xl:top-24 xl:self-start">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-950">
                {editingId !== null ? 'Editar foto' : 'Nueva foto'}
              </h3>
              {editingId !== null && (
                <button type="button" onClick={resetForm} className={subtleButtonClass}>
                  Cancelar
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Field label="Categoria" error={errors.categoria}>
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

              <Field
                label="URL o imagen"
                error={errors.url}
                hint="Pega una URL o sube una imagen desde tu equipo."
              >
                <input
                  value={form.url}
                  onChange={(event) => setField('url', event.target.value)}
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
                {form.url && (
                  <button
                    type="button"
                    onClick={() => setField('url', '')}
                    className={subtleButtonClass}
                    disabled={!canManage}
                  >
                    Quitar
                  </button>
                )}
              </div>

              <ImagePreview
                url={form.url}
                alt="Vista previa"
                className="h-40 w-full rounded-lg object-cover"
              />

              <button type="submit" className={`${primaryButtonClass} w-full`} disabled={!canManage}>
                {editingId !== null ? 'Guardar cambios' : 'Agregar foto'}
              </button>
            </form>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {categorias.map((categoria) => (
              <button
                key={categoria}
                type="button"
                onClick={() => setFiltro(categoria)}
                className={`rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] transition ${
                  filtro === categoria
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                }`}
              >
                {categoria}
              </button>
            ))}
          </div>

          {fotosFiltradas.length === 0 ? (
            <EmptyState
              title={galeria.length === 0 ? 'Galeria vacia' : 'Sin fotos en esta categoria'}
              description={
                galeria.length === 0
                  ? 'Agrega la primera imagen con el formulario de la izquierda.'
                  : 'Selecciona otra categoria para ver mas imagenes.'
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {fotosFiltradas.map((foto) => (
                <Card key={foto.id} className="overflow-hidden">
                  <div className="relative">
                    <ImagePreview
                      url={foto.url}
                      alt={`${foto.categoria} - ${formatFecha(foto.fecha)}`}
                      className="h-44 w-full object-cover"
                    />
                    <div className="absolute left-2 top-2">
                      <Badge tone="blue">{foto.categoria}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      {formatFecha(foto.fecha)}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(foto)}
                        className={subtleButtonClass}
                        disabled={!canManage}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(foto)}
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
        title="Eliminar foto"
        message="La imagen se quitara de la galeria publica. Esta accion no se puede deshacer."
        confirmLabel="Eliminar"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
