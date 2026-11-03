import { useMemo, useRef, useState, type FormEvent } from 'react'
import { useClubData } from '../../hooks/useClubData'
import type { AbonadoEstado, AbonadoItem } from '../../data/seedData'
import {
  Badge,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  SectionHeading,
  dangerLinkClass,
  formatFecha,
  inputClass,
  primaryButtonClass,
  selectClass,
  subtleButtonClass,
  todayInputValue,
  type ManagerProps,
} from './ui'

const ESTADOS: AbonadoEstado[] = ['ACTIVO', 'VENCIDO', 'PAUSADO']
const PLANES = ['Mensual', 'Semestral', 'Anual']

interface AbonadoForm {
  nombre: string
  email: string
  telefono: string
  plan: string
  estado: AbonadoEstado
  inicio: string
  fin: string
}

type FormErrors = Partial<Record<keyof AbonadoForm, string>>

function addMonths(baseDate: string, months: number): string {
  if (!baseDate) {
    return todayInputValue()
  }

  const date = new Date(`${baseDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return todayInputValue()
  }

  date.setMonth(date.getMonth() + months)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function createEmptyForm(): AbonadoForm {
  const inicio = todayInputValue()
  return {
    nombre: '',
    email: '',
    telefono: '',
    plan: PLANES[2],
    estado: 'ACTIVO',
    inicio,
    fin: addMonths(inicio, 12),
  }
}

function suggestedEndDate(plan: string, inicio: string): string {
  if (plan === 'Mensual') {
    return addMonths(inicio, 1)
  }
  if (plan === 'Semestral') {
    return addMonths(inicio, 6)
  }
  return addMonths(inicio, 12)
}

export default function AbonadosManager({ canManage, notify }: ManagerProps) {
  const { abonados, addAbonado, updateAbonado, deleteAbonado } = useClubData()
  const [form, setForm] = useState<AbonadoForm>(createEmptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState<'TODOS' | AbonadoEstado>('TODOS')
  const [pendingDelete, setPendingDelete] = useState<AbonadoItem | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const abonadosFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filteredByEstado =
      filtro === 'TODOS' ? abonados : abonados.filter((abonado) => abonado.estado === filtro)

    if (!term) {
      return [...filteredByEstado].sort((a, b) => b.inicio.localeCompare(a.inicio))
    }

    return filteredByEstado
      .filter((abonado) =>
        [abonado.nombre, abonado.email, abonado.telefono, abonado.plan]
          .join(' ')
          .toLowerCase()
          .includes(term),
      )
      .sort((a, b) => b.inicio.localeCompare(a.inicio))
  }, [abonados, search, filtro])

  const setField = (field: keyof AbonadoForm, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'plan' || field === 'inicio') {
        next.fin = suggestedEndDate(next.plan, next.inicio)
      }
      return next
    })
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const resetForm = () => {
    setForm(createEmptyForm())
    setEditingId(null)
    setErrors({})
  }

  const validate = (): boolean => {
    const next: FormErrors = {}

    if (form.nombre.trim().length < 3) {
      next.nombre = 'Ingresa el nombre completo del abonado.'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Ingresa un correo valido.'
    }
    if (form.telefono.trim().length < 8) {
      next.telefono = 'Ingresa un telefono valido.'
    }
    if (!form.inicio) {
      next.inicio = 'Selecciona la fecha de inicio.'
    }
    if (!form.fin) {
      next.fin = 'Selecciona la fecha de termino.'
    }
    if (form.inicio && form.fin && form.fin < form.inicio) {
      next.fin = 'La fecha de termino debe ser igual o posterior al inicio.'
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
      nombre: form.nombre.trim(),
      email: form.email.trim().toLowerCase(),
      telefono: form.telefono.trim(),
      plan: form.plan,
      estado: form.estado,
      inicio: form.inicio,
      fin: form.fin,
    }

    if (editingId !== null) {
      if (!updateAbonado(editingId, payload)) {
        notify('No pudimos actualizar el abonado.', 'error')
        return
      }
      notify('Abonado actualizado correctamente.')
    } else {
      addAbonado(payload)
      notify('Abonado agregado correctamente.')
    }

    resetForm()
  }

  const startEdit = (abonado: AbonadoItem) => {
    setEditingId(abonado.id)
    setForm({
      nombre: abonado.nombre,
      email: abonado.email,
      telefono: abonado.telefono,
      plan: abonado.plan,
      estado: abonado.estado,
      inicio: abonado.inicio,
      fin: abonado.fin,
    })
    setErrors({})
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const confirmDelete = () => {
    if (!pendingDelete) {
      return
    }

    deleteAbonado(pendingDelete.id)
    if (editingId === pendingDelete.id) {
      resetForm()
    }
    notify('Abonado eliminado.')
    setPendingDelete(null)
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Abonados"
        description="Controla socios con membresia activa y renovaciones."
        action={<Badge tone="green">{abonados.length} abonados</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div ref={formRef} className="xl:sticky xl:top-24 xl:self-start">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-950">
                {editingId !== null ? 'Editar abonado' : 'Nuevo abonado'}
              </h3>
              {editingId !== null && (
                <button type="button" onClick={resetForm} className={subtleButtonClass}>
                  Cancelar
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Field label="Nombre completo" error={errors.nombre}>
                <input
                  value={form.nombre}
                  onChange={(event) => setField('nombre', event.target.value)}
                  className={inputClass}
                  placeholder="Nombre y apellido"
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
                    placeholder="abonado@email.com"
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

              <div className="grid grid-cols-2 gap-3">
                <Field label="Plan">
                  <select
                    value={form.plan}
                    onChange={(event) => setField('plan', event.target.value)}
                    className={selectClass}
                    disabled={!canManage}
                  >
                    {PLANES.map((plan) => (
                      <option key={plan} value={plan}>
                        {plan}
                      </option>
                    ))}
                  </select>
                </Field>
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Inicio" error={errors.inicio}>
                  <input
                    type="date"
                    value={form.inicio}
                    onChange={(event) => setField('inicio', event.target.value)}
                    className={inputClass}
                    disabled={!canManage}
                  />
                </Field>
                <Field label="Termino" error={errors.fin}>
                  <input
                    type="date"
                    value={form.fin}
                    onChange={(event) => setField('fin', event.target.value)}
                    className={inputClass}
                    disabled={!canManage}
                  />
                </Field>
              </div>

              <button type="submit" className={`${primaryButtonClass} w-full`} disabled={!canManage}>
                {editingId !== null ? 'Guardar cambios' : 'Agregar abonado'}
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
              placeholder="Buscar por nombre, email, telefono o plan..."
              aria-label="Buscar abonados"
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

          {abonadosFiltrados.length === 0 ? (
            <EmptyState
              title={abonados.length === 0 ? 'Sin abonados registrados' : 'Sin resultados'}
              description={
                abonados.length === 0
                  ? 'Agrega socios para gestionar membresias.'
                  : 'Prueba con otro filtro o termino de busqueda.'
              }
            />
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.1em] text-slate-500">
                    <tr>
                      <th className="px-4 py-2 font-bold">Abonado</th>
                      <th className="px-4 py-2 font-bold">Plan</th>
                      <th className="px-4 py-2 font-bold">Estado</th>
                      <th className="px-4 py-2 font-bold">Inicio</th>
                      <th className="px-4 py-2 font-bold">Termino</th>
                      <th className="px-4 py-2 text-right font-bold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {abonadosFiltrados.map((abonado) => (
                      <tr key={abonado.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{abonado.nombre}</p>
                          <p className="text-[11px] text-slate-500">{abonado.email}</p>
                        </td>
                        <td className="px-4 py-3">{abonado.plan}</td>
                        <td className="px-4 py-3">
                          <Badge
                            tone={
                              abonado.estado === 'ACTIVO'
                                ? 'green'
                                : abonado.estado === 'VENCIDO'
                                  ? 'rose'
                                  : 'amber'
                            }
                          >
                            {abonado.estado}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatFecha(abonado.inicio)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatFecha(abonado.fin)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(abonado)}
                              className={subtleButtonClass}
                              disabled={!canManage}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDelete(abonado)}
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
        title="Eliminar abonado"
        message={`Se eliminara el abonado ${pendingDelete?.nombre ?? ''}.`}
        confirmLabel="Eliminar"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
