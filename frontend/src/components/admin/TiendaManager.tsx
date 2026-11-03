import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useClubData } from '../../hooks/useClubData'
import type { ProductoItem } from '../../data/seedData'
import {
  Badge,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  ImagePreview,
  SectionHeading,
  dangerLinkClass,
  formatPrecio,
  inputClass,
  isImageSource,
  primaryButtonClass,
  readImageFile,
  secondaryButtonClass,
  selectClass,
  subtleButtonClass,
  type ManagerProps,
  uploadImageFile,
} from './ui'

const CATEGORIAS = ['Camisetas', 'Equipamiento', 'Accesorios', 'Coleccion']

interface ProductoForm {
  nombre: string
  precio: string
  categoria: string
  stock: string
  url: string
}

type FormErrors = Partial<Record<keyof ProductoForm, string>>

function createEmptyForm(): ProductoForm {
  return { nombre: '', precio: '', categoria: CATEGORIAS[0], stock: '0', url: '' }
}

export default function TiendaManager({ canManage, notify }: ManagerProps) {
  const { productos, addProducto, updateProducto, deleteProducto } = useClubData()
  const [form, setForm] = useState<ProductoForm>(createEmptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [pendingDelete, setPendingDelete] = useState<ProductoItem | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const productosFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) {
      return productos
    }

    return productos.filter((producto) =>
      [producto.nombre, producto.categoria].join(' ').toLowerCase().includes(term),
    )
  }, [productos, search])

  const valorInventario = productos.reduce(
    (total, producto) => total + producto.precio * producto.stock,
    0,
  )

  const setField = (field: keyof ProductoForm, value: string) => {
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
    const precio = Number(form.precio)
    const stock = Number(form.stock)

    if (form.nombre.trim().length < 3) {
      next.nombre = 'El nombre debe tener al menos 3 caracteres.'
    }
    if (!Number.isFinite(precio) || precio <= 0) {
      next.precio = 'Ingresa un precio mayor a cero.'
    }
    if (!Number.isInteger(stock) || stock < 0) {
      next.stock = 'El stock debe ser un entero igual o mayor a cero.'
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
      nombre: form.nombre.trim(),
      precio: Math.round(Number(form.precio)),
      categoria: form.categoria.trim(),
      stock: Number(form.stock),
      url: form.url.trim(),
    }

    if (editingId !== null) {
      if (!updateProducto(editingId, payload)) {
        notify('No pudimos actualizar el producto seleccionado.', 'error')
        return
      }
      notify('Producto actualizado correctamente.')
    } else {
      addProducto(payload)
      notify('Producto agregado a la tienda.')
    }

    resetForm()
  }

  const startEdit = (producto: ProductoItem) => {
    setEditingId(producto.id)
    setForm({
      nombre: producto.nombre,
      precio: `${producto.precio}`,
      categoria: producto.categoria,
      stock: `${producto.stock}`,
      url: producto.url,
    })
    setErrors({})
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const confirmDelete = () => {
    if (!pendingDelete) {
      return
    }

    deleteProducto(pendingDelete.id)
    if (editingId === pendingDelete.id) {
      resetForm()
    }
    notify('Producto eliminado de la tienda.')
    setPendingDelete(null)
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Tienda"
        description={`Inventario valorizado en ${formatPrecio(valorInventario)}.`}
        action={<Badge tone="green">{productos.length} productos</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div ref={formRef} className="xl:sticky xl:top-24 xl:self-start">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-950">
                {editingId !== null ? 'Editar producto' : 'Nuevo producto'}
              </h3>
              {editingId !== null && (
                <button type="button" onClick={resetForm} className={subtleButtonClass}>
                  Cancelar
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Field label="Nombre" error={errors.nombre}>
                <input
                  value={form.nombre}
                  onChange={(event) => setField('nombre', event.target.value)}
                  className={inputClass}
                  placeholder="Camiseta Titular 2026"
                  disabled={!canManage}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Precio (CLP)" error={errors.precio}>
                  <input
                    type="number"
                    min={1}
                    step={100}
                    value={form.precio}
                    onChange={(event) => setField('precio', event.target.value)}
                    className={inputClass}
                    placeholder="45990"
                    disabled={!canManage}
                  />
                </Field>
                <Field label="Stock" error={errors.stock}>
                  <input
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(event) => setField('stock', event.target.value)}
                    className={inputClass}
                    placeholder="10"
                    disabled={!canManage}
                  />
                </Field>
              </div>

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
                alt="Vista previa del producto"
                className="h-40 w-full rounded-lg object-cover"
              />

              <button type="submit" className={`${primaryButtonClass} w-full`} disabled={!canManage}>
                {editingId !== null ? 'Guardar cambios' : 'Agregar producto'}
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
              placeholder="Buscar producto por nombre o categoria..."
              aria-label="Buscar productos"
            />
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              {productosFiltrados.length} resultado(s)
            </span>
          </div>

          {productosFiltrados.length === 0 ? (
            <EmptyState
              title={productos.length === 0 ? 'Tienda sin productos' : 'Sin resultados'}
              description={
                productos.length === 0
                  ? 'Agrega el primer producto para mostrarlo en la tienda publica.'
                  : 'Prueba con otro termino de busqueda.'
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {productosFiltrados.map((producto) => (
                <Card key={producto.id} className="overflow-hidden">
                  <ImagePreview
                    url={producto.url}
                    alt={producto.nombre}
                    className="h-44 w-full object-cover"
                  />
                  <div className="space-y-2 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge tone="blue">{producto.categoria}</Badge>
                      <Badge tone={producto.stock > 0 ? 'green' : 'rose'}>
                        {producto.stock > 0 ? `${producto.stock} en stock` : 'Sin stock'}
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold leading-snug text-slate-950">
                      {producto.nombre}
                    </h3>
                    <p className="text-lg font-bold text-blue-800">{formatPrecio(producto.precio)}</p>
                    <div className="flex gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => startEdit(producto)}
                        className={subtleButtonClass}
                        disabled={!canManage}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(producto)}
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
        title="Eliminar producto"
        message={`Se eliminara "${pendingDelete?.nombre ?? ''}" de la tienda. Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
