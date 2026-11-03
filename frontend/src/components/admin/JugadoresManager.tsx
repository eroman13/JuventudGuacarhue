import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useClubData } from '../../hooks/useClubData'
import type { JugadorItem } from '../../data/seedData'
import {
  Badge,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  SectionHeading,
  dangerLinkClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  selectClass,
  subtleButtonClass,
  type ManagerProps,
} from './ui'

const POSICIONES = ['Portero', 'Defensa', 'Mediocampista', 'Delantero']

interface JugadorForm {
  numero: string
  nombre: string
  apellido: string
  posicion: string
  pais: string
  plantel: string
}

type FormErrors = Partial<Record<keyof JugadorForm, string>>

type PendingDelete =
  | { kind: 'plantel'; nombre: string }
  | { kind: 'jugador'; plantel: string; id: string; nombre: string }

function createEmptyForm(plantel: string): JugadorForm {
  return {
    numero: '',
    nombre: '',
    apellido: '',
    posicion: POSICIONES[1],
    pais: 'Chile',
    plantel,
  }
}

export default function JugadoresManager({ canManage, notify }: ManagerProps) {
  const {
    planteles,
    addPlantel,
    renamePlantel,
    deletePlantel,
    addJugador,
    updateJugador,
    deleteJugador,
  } = useClubData()

  const [plantelActivo, setPlantelActivo] = useState(planteles[0]?.nombre ?? '')
  const [nuevoPlantel, setNuevoPlantel] = useState('')
  const [renombrado, setRenombrado] = useState('')
  const [renombrando, setRenombrando] = useState(false)
  const [form, setForm] = useState<JugadorForm>(() => createEmptyForm(planteles[0]?.nombre ?? ''))
  const [errors, setErrors] = useState<FormErrors>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (planteles.length === 0) {
      setPlantelActivo('')
      return
    }

    const exists = planteles.some((plantel) => plantel.nombre === plantelActivo)
    if (!exists) {
      setPlantelActivo(planteles[0].nombre)
    }
  }, [planteles, plantelActivo])

  const plantelActual = useMemo(
    () => planteles.find((plantel) => plantel.nombre === plantelActivo) ?? null,
    [planteles, plantelActivo],
  )

  const jugadoresFiltrados = useMemo(() => {
    const lista = plantelActual?.jugadores ?? []
    const term = search.trim().toLowerCase()
    if (!term) {
      return [...lista].sort((a, b) => a.numero - b.numero)
    }

    return lista
      .filter((jugador) =>
        [jugador.nombre, jugador.apellido, jugador.posicion, jugador.pais, `${jugador.numero}`]
          .join(' ')
          .toLowerCase()
          .includes(term),
      )
      .sort((a, b) => a.numero - b.numero)
  }, [plantelActual, search])

  const totalJugadores = planteles.reduce((total, plantel) => total + plantel.jugadores.length, 0)

  const setField = (field: keyof JugadorForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const resetForm = () => {
    setForm(createEmptyForm(plantelActivo))
    setEditingId(null)
    setErrors({})
  }

  const handleCreatePlantel = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canManage) {
      notify('Tu rol es de solo lectura.', 'error')
      return
    }
    const nombre = nuevoPlantel.trim()
    if (!nombre) {
      notify('Escribe el nombre del plantel.', 'error')
      return
    }

    if (!addPlantel(nombre)) {
      notify('Ya existe un plantel con ese nombre.', 'error')
      return
    }

    setNuevoPlantel('')
    setPlantelActivo(nombre)
    setForm((prev) => ({ ...prev, plantel: nombre }))
    notify(`Plantel "${nombre}" creado.`)
  }

  const handleRename = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canManage) {
      notify('Tu rol es de solo lectura.', 'error')
      return
    }
    const nombre = renombrado.trim()
    if (!nombre) {
      notify('Escribe el nuevo nombre del plantel.', 'error')
      return
    }

    if (!renamePlantel(plantelActivo, nombre)) {
      notify('No pudimos renombrar el plantel. Revisa que el nombre no este repetido.', 'error')
      return
    }

    const anterior = plantelActivo
    setPlantelActivo(nombre)
    setForm((prev) => ({
      ...prev,
      plantel: prev.plantel === anterior ? nombre : prev.plantel,
    }))
    setRenombrado('')
    setRenombrando(false)
    notify('Plantel renombrado correctamente.')
  }

  const validate = (): boolean => {
    const next: FormErrors = {}
    const numero = Number(form.numero)

    if (!Number.isInteger(numero) || numero < 1 || numero > 99) {
      next.numero = 'El numero debe ser un entero entre 1 y 99.'
    }
    if (form.nombre.trim().length < 2) {
      next.nombre = 'Ingresa el nombre del jugador.'
    }
    if (form.apellido.trim().length < 2) {
      next.apellido = 'Ingresa el apellido del jugador.'
    }
    if (form.pais.trim().length < 2) {
      next.pais = 'Ingresa el pais del jugador.'
    }
    if (!form.plantel.trim()) {
      next.plantel = 'Selecciona un plantel.'
    }

    const duplicado = (plantelActual?.jugadores ?? []).some(
      (jugador) => jugador.numero === numero && jugador.id !== editingId,
    )
    if (!next.numero && duplicado && form.plantel === plantelActivo) {
      next.numero = 'Ese numero ya esta en uso en este plantel.'
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

    const payload: Omit<JugadorItem, 'id'> = {
      numero: Number(form.numero),
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      posicion: form.posicion,
      pais: form.pais.trim(),
    }

    if (editingId !== null) {
      if (!updateJugador(editingId, payload, form.plantel)) {
        notify('No pudimos actualizar el jugador.', 'error')
        return
      }
      notify('Jugador actualizado correctamente.')
    } else {
      addJugador(form.plantel, payload)
      notify('Jugador agregado al plantel.')
    }

    setPlantelActivo(form.plantel)
    resetForm()
  }

  const startEdit = (jugador: JugadorItem) => {
    setEditingId(jugador.id)
    setForm({
      numero: `${jugador.numero}`,
      nombre: jugador.nombre,
      apellido: jugador.apellido,
      posicion: jugador.posicion,
      pais: jugador.pais,
      plantel: plantelActivo,
    })
    setErrors({})
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const confirmDelete = () => {
    if (!pendingDelete) {
      return
    }

    if (pendingDelete.kind === 'plantel') {
      if (!deletePlantel(pendingDelete.nombre)) {
        notify('No puedes eliminar un plantel que aun tiene jugadores.', 'error')
        setPendingDelete(null)
        return
      }
      notify('Plantel eliminado.')
    } else {
      deleteJugador(pendingDelete.plantel, pendingDelete.id)
      if (editingId === pendingDelete.id) {
        resetForm()
      }
      notify('Jugador eliminado del plantel.')
    }

    setPendingDelete(null)
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Planteles y jugadores"
        description="Administra las nominas de cada categoria del club."
        action={<Badge tone="green">{totalJugadores} jugadores</Badge>}
      />

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-950">Planteles</h3>
            <p className="text-sm text-slate-500">
              Selecciona un plantel para revisar y editar su nomina.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {planteles.map((plantel) => {
            const activo = plantel.nombre === plantelActivo
            return (
              <button
                key={plantel.nombre}
                type="button"
                onClick={() => {
                  setPlantelActivo(plantel.nombre)
                  setForm(createEmptyForm(plantel.nombre))
                  setEditingId(null)
                  setErrors({})
                }}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] transition ${
                  activo
                    ? 'border-blue-700 bg-blue-700 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                }`}
              >
                {plantel.nombre}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    activo ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {plantel.jugadores.length}
                </span>
              </button>
            )
          })}
          {planteles.length === 0 && (
            <p className="text-sm text-slate-500">Aun no hay planteles creados.</p>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-5">
          <form onSubmit={handleCreatePlantel} className="flex items-end gap-2">
            <Field label="Nuevo plantel">
              <input
                value={nuevoPlantel}
                onChange={(event) => setNuevoPlantel(event.target.value)}
                className={`${inputClass} w-52`}
                placeholder="Ej: Sub 17"
                disabled={!canManage}
              />
            </Field>
            <button type="submit" className={secondaryButtonClass} disabled={!canManage}>
              Crear plantel
            </button>
          </form>
        </div>

        {plantelActivo && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            {renombrando ? (
              <form onSubmit={handleRename} className="flex flex-wrap items-end gap-2">
                <Field label={`Renombrar "${plantelActivo}"`}>
                  <input
                    value={renombrado}
                    onChange={(event) => setRenombrado(event.target.value)}
                    className={`${inputClass} w-52`}
                    autoFocus
                  />
                </Field>
                <button type="submit" className={secondaryButtonClass}>
                  Guardar
                </button>
                <button
                  type="button"
                  className={subtleButtonClass}
                  onClick={() => {
                    setRenombrando(false)
                    setRenombrado('')
                  }}
                >
                  Cancelar
                </button>
              </form>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => {
                    setRenombrado(plantelActivo)
                    setRenombrando(true)
                  }}
                  disabled={!canManage}
                >
                  Renombrar plantel
                </button>
                <button
                  type="button"
                  className={dangerLinkClass}
                  onClick={() => setPendingDelete({ kind: 'plantel', nombre: plantelActivo })}
                  disabled={!canManage}
                >
                  Eliminar plantel
                </button>
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div ref={formRef} className="xl:sticky xl:top-24 xl:self-start">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-950">
                {editingId !== null ? 'Editar jugador' : 'Nuevo jugador'}
              </h3>
              {editingId !== null && (
                <button type="button" onClick={resetForm} className={subtleButtonClass}>
                  Cancelar
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Numero" error={errors.numero}>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={form.numero}
                    onChange={(event) => setField('numero', event.target.value)}
                    className={inputClass}
                    placeholder="10"
                    disabled={!canManage}
                  />
                </Field>
                <Field label="Posicion">
                  <select
                    value={form.posicion}
                    onChange={(event) => setField('posicion', event.target.value)}
                    className={selectClass}
                    disabled={!canManage}
                  >
                    {POSICIONES.map((posicion) => (
                      <option key={posicion} value={posicion}>
                        {posicion}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Nombre" error={errors.nombre}>
                <input
                  value={form.nombre}
                  onChange={(event) => setField('nombre', event.target.value)}
                  className={inputClass}
                  placeholder="Diego"
                  disabled={!canManage}
                />
              </Field>

              <Field label="Apellido" error={errors.apellido}>
                <input
                  value={form.apellido}
                  onChange={(event) => setField('apellido', event.target.value)}
                  className={inputClass}
                  placeholder="Vargas"
                  disabled={!canManage}
                />
              </Field>

              <Field label="Pais" error={errors.pais}>
                <input
                  value={form.pais}
                  onChange={(event) => setField('pais', event.target.value)}
                  className={inputClass}
                  placeholder="Chile"
                  disabled={!canManage}
                />
              </Field>

              <Field label="Plantel" error={errors.plantel}>
                <select
                  value={form.plantel}
                  onChange={(event) => setField('plantel', event.target.value)}
                  className={selectClass}
                  disabled={!canManage || planteles.length === 0}
                >
                  {planteles.length === 0 && <option value="">Crea un plantel primero</option>}
                  {planteles.map((plantel) => (
                    <option key={plantel.nombre} value={plantel.nombre}>
                      {plantel.nombre}
                    </option>
                  ))}
                </select>
              </Field>

              <button
                type="submit"
                className={`${primaryButtonClass} w-full`}
                disabled={!canManage || planteles.length === 0}
              >
                {editingId !== null ? 'Guardar cambios' : 'Agregar jugador'}
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
              placeholder="Buscar jugador por nombre, numero o posicion..."
              aria-label="Buscar jugadores"
            />
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              {jugadoresFiltrados.length} de {plantelActual?.jugadores.length ?? 0}
            </span>
          </div>

          {!plantelActual ? (
            <EmptyState
              title="Selecciona un plantel"
              description="Crea un plantel para comenzar a registrar jugadores."
            />
          ) : jugadoresFiltrados.length === 0 ? (
            <EmptyState
              title={plantelActual.jugadores.length === 0 ? 'Plantel sin jugadores' : 'Sin resultados'}
              description={
                plantelActual.jugadores.length === 0
                  ? 'Usa el formulario de la izquierda para agregar al primer jugador.'
                  : 'Prueba con otro termino de busqueda.'
              }
            />
          ) : (
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-slate-700">
                  {plantelActual.nombre}
                </h3>
                <Badge tone="slate">{plantelActual.jugadores.length} jugadores</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.1em] text-slate-500">
                    <tr>
                      <th className="px-4 py-2 font-bold">#</th>
                      <th className="px-4 py-2 font-bold">Jugador</th>
                      <th className="px-4 py-2 font-bold">Posicion</th>
                      <th className="px-4 py-2 font-bold">Pais</th>
                      <th className="px-4 py-2 text-right font-bold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jugadoresFiltrados.map((jugador) => (
                      <tr key={jugador.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                            {jugador.numero}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">
                            {jugador.nombre} {jugador.apellido}
                          </p>
                          <p className="text-[11px] text-slate-400">{jugador.pais}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone="green">{jugador.posicion}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{jugador.pais}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(jugador)}
                              className={subtleButtonClass}
                              disabled={!canManage}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPendingDelete({
                                  kind: 'jugador',
                                  plantel: plantelActivo,
                                  id: jugador.id,
                                  nombre: `${jugador.nombre} ${jugador.apellido}`,
                                })
                              }
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
        title={pendingDelete?.kind === 'plantel' ? 'Eliminar plantel' : 'Eliminar jugador'}
        message={
          pendingDelete?.kind === 'plantel'
            ? `Se eliminara el plantel "${pendingDelete.nombre}". Solo es posible si no tiene jugadores registrados.`
            : `Se eliminara a ${pendingDelete?.kind === 'jugador' ? pendingDelete.nombre : ''} del plantel. Esta accion no se puede deshacer.`
        }
        confirmLabel="Eliminar"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
