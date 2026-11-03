import { useMemo, useRef, useState, type FormEvent } from 'react'
import { useClubData } from '../../hooks/useClubData'
import type { PedidoEstado, PedidoItem } from '../../data/seedData'
import {
  Badge,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  SectionHeading,
  dangerLinkClass,
  formatFecha,
  formatPrecio,
  inputClass,
  primaryButtonClass,
  selectClass,
  subtleButtonClass,
  todayInputValue,
  type ManagerProps,
} from './ui'

const ESTADOS: PedidoEstado[] = ['PENDIENTE', 'CONFIRMADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO']

interface PedidoForm {
  numeroOrden: string
  cliente: string
  email: string
  telefono: string
  producto: string
  cantidad: string
  total: string
  estado: PedidoEstado
  fecha: string
}

type FormErrors = Partial<Record<keyof PedidoForm, string>>

function createEmptyForm(): PedidoForm {
  return {
    numeroOrden: '',
    cliente: '',
    email: '',
    telefono: '',
    producto: '',
    cantidad: '1',
    total: '',
    estado: 'PENDIENTE',
    fecha: todayInputValue(),
  }
}

export default function PedidosManager({ canManage, notify }: ManagerProps) {
  const { pedidos, addPedido, updatePedido, deletePedido } = useClubData()
  const [form, setForm] = useState<PedidoForm>(createEmptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState<'TODOS' | PedidoEstado>('TODOS')
  const [pendingDelete, setPendingDelete] = useState<PedidoItem | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const pedidosFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filteredByEstado = filtro === 'TODOS' ? pedidos : pedidos.filter((pedido) => pedido.estado === filtro)
    if (!term) {
      return [...filteredByEstado].sort((a, b) => b.fecha.localeCompare(a.fecha))
    }

    return filteredByEstado
      .filter((pedido) =>
        [pedido.numeroOrden, pedido.cliente, pedido.email, pedido.producto].join(' ').toLowerCase().includes(term),
      )
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [pedidos, search, filtro])

  const setField = (field: keyof PedidoForm, value: string) => {
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
    const cantidad = Number(form.cantidad)
    const total = Number(form.total)

    if (form.numeroOrden.trim().length < 4) {
      next.numeroOrden = 'El numero de orden debe tener al menos 4 caracteres.'
    }
    if (form.cliente.trim().length < 3) {
      next.cliente = 'Ingresa el nombre del cliente.'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Ingresa un correo valido.'
    }
    if (form.telefono.trim().length < 8) {
      next.telefono = 'Ingresa un telefono valido.'
    }
    if (form.producto.trim().length < 3) {
      next.producto = 'Indica el producto principal del pedido.'
    }
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      next.cantidad = 'La cantidad debe ser un entero mayor o igual a 1.'
    }
    if (!Number.isFinite(total) || total <= 0) {
      next.total = 'Ingresa un total mayor a cero.'
    }
    if (!form.fecha) {
      next.fecha = 'Selecciona la fecha del pedido.'
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
      numeroOrden: form.numeroOrden.trim(),
      cliente: form.cliente.trim(),
      email: form.email.trim().toLowerCase(),
      telefono: form.telefono.trim(),
      producto: form.producto.trim(),
      cantidad: Number(form.cantidad),
      total: Math.round(Number(form.total)),
      estado: form.estado,
      fecha: form.fecha,
    }

    if (editingId !== null) {
      if (!updatePedido(editingId, payload)) {
        notify('No pudimos actualizar el pedido.', 'error')
        return
      }
      notify('Pedido actualizado correctamente.')
    } else {
      addPedido(payload)
      notify('Pedido registrado correctamente.')
    }

    resetForm()
  }

  const startEdit = (pedido: PedidoItem) => {
    setEditingId(pedido.id)
    setForm({
      numeroOrden: pedido.numeroOrden,
      cliente: pedido.cliente,
      email: pedido.email,
      telefono: pedido.telefono,
      producto: pedido.producto,
      cantidad: `${pedido.cantidad}`,
      total: `${pedido.total}`,
      estado: pedido.estado,
      fecha: pedido.fecha,
    })
    setErrors({})
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const confirmDelete = () => {
    if (!pendingDelete) {
      return
    }

    deletePedido(pendingDelete.id)
    if (editingId === pendingDelete.id) {
      resetForm()
    }
    notify('Pedido eliminado.')
    setPendingDelete(null)
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Pedidos"
        description="Administra el flujo de ventas y despacho de la tienda."
        action={<Badge tone="amber">{pedidos.length} pedidos</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div ref={formRef} className="xl:sticky xl:top-24 xl:self-start">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-950">
                {editingId !== null ? 'Editar pedido' : 'Nuevo pedido'}
              </h3>
              {editingId !== null && (
                <button type="button" onClick={resetForm} className={subtleButtonClass}>
                  Cancelar
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Field label="Numero de orden" error={errors.numeroOrden}>
                <input
                  value={form.numeroOrden}
                  onChange={(event) => setField('numeroOrden', event.target.value)}
                  className={inputClass}
                  placeholder="JG-1003"
                  disabled={!canManage}
                />
              </Field>

              <Field label="Cliente" error={errors.cliente}>
                <input
                  value={form.cliente}
                  onChange={(event) => setField('cliente', event.target.value)}
                  className={inputClass}
                  placeholder="Nombre cliente"
                  disabled={!canManage}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Email" error={errors.email}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setField('email', event.target.value)}
                    className={inputClass}
                    placeholder="cliente@email.com"
                    disabled={!canManage}
                  />
                </Field>
                <Field label="Telefono" error={errors.telefono}>
                  <input
                    value={form.telefono}
                    onChange={(event) => setField('telefono', event.target.value)}
                    className={inputClass}
                    placeholder="+56 9 ..."
                    disabled={!canManage}
                  />
                </Field>
              </div>

              <Field label="Producto" error={errors.producto}>
                <input
                  value={form.producto}
                  onChange={(event) => setField('producto', event.target.value)}
                  className={inputClass}
                  placeholder="Camiseta Titular 2026"
                  disabled={!canManage}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Cantidad" error={errors.cantidad}>
                  <input
                    type="number"
                    min={1}
                    value={form.cantidad}
                    onChange={(event) => setField('cantidad', event.target.value)}
                    className={inputClass}
                    disabled={!canManage}
                  />
                </Field>
                <Field label="Total (CLP)" error={errors.total}>
                  <input
                    type="number"
                    min={1}
                    value={form.total}
                    onChange={(event) => setField('total', event.target.value)}
                    className={inputClass}
                    disabled={!canManage}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Estado">
                  <select
                    value={form.estado}
                    onChange={(event) => setField('estado', event.target.value)}
                    className={selectClass}
                    disabled={!canManage}
                  >
                    {ESTADOS.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
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

              <button type="submit" className={`${primaryButtonClass} w-full`} disabled={!canManage}>
                {editingId !== null ? 'Guardar cambios' : 'Agregar pedido'}
              </button>
            </form>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={`${inputClass} max-w-sm`}
              placeholder="Buscar por orden, cliente, email o producto..."
              aria-label="Buscar pedidos"
            />
            {(['TODOS', ...ESTADOS] as const).map((estado) => (
              <button
                key={estado}
                type="button"
                onClick={() => setFiltro(estado)}
                className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${
                  filtro === estado
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                }`}
              >
                {estado === 'TODOS' ? 'Todos' : estado}
              </button>
            ))}
          </div>

          {pedidosFiltrados.length === 0 ? (
            <EmptyState
              title={pedidos.length === 0 ? 'Sin pedidos registrados' : 'Sin resultados'}
              description={
                pedidos.length === 0
                  ? 'Registra pedidos para llevar el control de ventas.'
                  : 'Prueba con otro filtro o termino de busqueda.'
              }
            />
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.1em] text-slate-500">
                    <tr>
                      <th className="px-4 py-2 font-bold">Orden</th>
                      <th className="px-4 py-2 font-bold">Cliente</th>
                      <th className="px-4 py-2 font-bold">Producto</th>
                      <th className="px-4 py-2 font-bold">Total</th>
                      <th className="px-4 py-2 font-bold">Estado</th>
                      <th className="px-4 py-2 font-bold">Fecha</th>
                      <th className="px-4 py-2 text-right font-bold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pedidosFiltrados.map((pedido) => (
                      <tr key={pedido.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-semibold text-slate-900">{pedido.numeroOrden}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{pedido.cliente}</p>
                          <p className="text-[11px] text-slate-500">{pedido.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          {pedido.producto}
                          <span className="ml-2 text-xs text-slate-500">x{pedido.cantidad}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{formatPrecio(pedido.total)}</td>
                        <td className="px-4 py-3">
                          <Badge
                            tone={
                              pedido.estado === 'ENTREGADO'
                                ? 'green'
                                : pedido.estado === 'CANCELADO'
                                  ? 'rose'
                                  : 'amber'
                            }
                          >
                            {pedido.estado}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatFecha(pedido.fecha)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(pedido)}
                              className={subtleButtonClass}
                              disabled={!canManage}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDelete(pedido)}
                              className={dangerLinkClass}
                              disabled={!canManage}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminar pedido"
        message={`Se eliminara el pedido ${pendingDelete?.numeroOrden ?? ''}.`}
        confirmLabel="Eliminar"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
