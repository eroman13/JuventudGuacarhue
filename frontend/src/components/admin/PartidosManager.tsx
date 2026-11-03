import { useMemo, useRef, useState, type FormEvent } from 'react'
import { useClubData } from '../../hooks/useClubData'
import type { PartidoItem } from '../../data/seedData'
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

type Estado = PartidoItem['estado']

interface PartidoForm {
  local: string
  visitante: string
  fecha: string
  hora: string
  lugar: string
  torneo: string
  estado: Estado
  resultado: string
}

type FormErrors = Partial<Record<keyof PartidoForm, string>>

function createEmptyForm(): PartidoForm {
  return {
    local: 'Juventud Guacarhue',
    visitante: '',
    fecha: todayInputValue(),
    hora: '16:00',
    lugar: 'Estadio Municipal de Guacarhue',
    torneo: 'Liga Nacional',
    estado: 'PROXIMO',
    resultado: '',
  }
}

export default function PartidosManager({ canManage, notify }: ManagerProps) {
  const { partidos, addPartido, updatePartido, deletePartido } = useClubData()
  const [form, setForm] = useState<PartidoForm>(createEmptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [editingId, setEditingId] = useState<number | null>(null)
  const [filtro, setFiltro] = useState<'TODOS' | Estado>('TODOS')
  const [pendingDelete, setPendingDelete] = useState<PartidoItem | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const partidosFiltrados = useMemo(() => {
    const lista = filtro === 'TODOS' ? partidos : partidos.filter((p) => p.estado === filtro)
    return [...lista].sort((a, b) => `${b.fecha}${b.hora}`.localeCompare(`${a.fecha}${a.hora}`))
  }, [partidos, filtro])

  const proximos = partidos.filter((partido) => partido.estado === 'PROXIMO').length
  const finalizados = partidos.filter((partido) => partido.estado === 'FINALIZADO').length

  const setField = <K extends keyof PartidoForm>(field: K, value: PartidoForm[K]) => {
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

    if (form.local.trim().length < 2) {
      next.local = 'Ingresa el nombre del equipo local.'
    }
    if (form.visitante.trim().length < 2) {
      next.visitante = 'Ingresa el nombre del equipo visitante.'
    }
    if (
      form.local.trim().length >= 2 &&
      form.local.trim().toLowerCase() === form.visitante.trim().toLowerCase()
    ) {
      next.visitante = 'El local y el visitante no pueden ser el mismo equipo.'
    }
    if (!form.fecha) {
      next.fecha = 'Selecciona la fecha del partido.'
    }
    if (!/^\d{2}:\d{2}$/.test(form.hora)) {
      next.hora = 'Usa el formato HH:MM.'
    }
    if (form.lugar.trim().length < 2) {
      next.lugar = 'Ingresa el recinto del partido.'
    }
    if (form.torneo.trim().length < 2) {
      next.torneo = 'Ingresa el torneo o competencia.'
    }
    if (form.estado === 'FINALIZADO' && !/^\d{1,2}\s*-\s*\d{1,2}$/.test(form.resultado.trim())) {
      next.resultado = 'Para un partido finalizado usa un resultado tipo 3-1.'
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

    const payload: Omit<PartidoItem, 'id'> = {
      local: form.local.trim(),
      visitante: form.visitante.trim(),
      fecha: form.fecha,
      hora: form.hora,
      lugar: form.lugar.trim(),
      torneo: form.torneo.trim(),
      estado: form.estado,
      resultado: form.estado === 'FINALIZADO' ? form.resultado.trim() : undefined,
    }

    if (editingId !== null) {
      if (!updatePartido(editingId, payload)) {
        notify('No pudimos actualizar el partido seleccionado.', 'error')
        return
      }
      notify('Partido actualizado correctamente.')
    } else {
      addPartido(payload)
      notify('Partido agregado al calendario.')
    }

    resetForm()
  }

  const startEdit = (partido: PartidoItem) => {
    setEditingId(partido.id)
    setForm({
      local: partido.local,
      visitante: partido.visitante,
      fecha: partido.fecha,
      hora: partido.hora,
      lugar: partido.lugar,
      torneo: partido.torneo,
      estado: partido.estado,
      resultado: partido.resultado ?? '',
    })
    setErrors({})
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const confirmDelete = () => {
    if (!pendingDelete) {
      return
    }

    deletePartido(pendingDelete.id)
    if (editingId === pendingDelete.id) {
      resetForm()
    }
    notify('Partido eliminado del calendario.')
    setPendingDelete(null)
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Partidos"
        description="Programa encuentros y actualiza resultados del club."
        action={
          <div className="flex flex-wrap gap-2">
            <Badge tone="amber">{proximos} proximos</Badge>
            <Badge tone="green">{finalizados} finalizados</Badge>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div ref={formRef} className="xl:sticky xl:top-24 xl:self-start">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-950">
                {editingId !== null ? 'Editar partido' : 'Nuevo partido'}
              </h3>
              {editingId !== null && (
                <button type="button" onClick={resetForm} className={subtleButtonClass}>
                  Cancelar
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Field label="Local" error={errors.local}>
                <input
                  value={form.local}
                  onChange={(event) => setField('local', event.target.value)}
                  className={inputClass}
                  placeholder="Juventud Guacarhue"
                  disabled={!canManage}
                />
              </Field>

              <Field label="Visitante" error={errors.visitante}>
                <input
                  value={form.visitante}
                  onChange={(event) => setField('visitante', event.target.value)}
                  className={inputClass}
                  placeholder="Deportivo Municipal"
                  disabled={!canManage}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha" error={errors.fecha}>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(event) => setField('fecha', event.target.value)}
                    className={inputClass}
                    disabled={!canManage}
                  />
                </Field>
                <Field label="Hora" error={errors.hora}>
                  <input
                    type="time"
                    value={form.hora}
                    onChange={(event) => setField('hora', event.target.value)}
                    className={inputClass}
                    disabled={!canManage}
                  />
                </Field>
              </div>

              <Field label="Lugar" error={errors.lugar}>
                <input
                  value={form.lugar}
                  onChange={(event) => setField('lugar', event.target.value)}
                  className={inputClass}
                  placeholder="Estadio Municipal de Guacarhue"
                  disabled={!canManage}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Torneo" error={errors.torneo}>
                  <input
                    value={form.torneo}
                    onChange={(event) => setField('torneo', event.target.value)}
                    className={inputClass}
                    placeholder="Liga Nacional"
                    disabled={!canManage}
                  />
                </Field>
                <Field label="Estado">
                  <select
                    value={form.estado}
                    onChange={(event) => setField('estado', event.target.value as Estado)}
                    className={selectClass}
                    disabled={!canManage}
                  >
                    <option value="PROXIMO">Proximo</option>
                    <option value="FINALIZADO">Finalizado</option>
                  </select>
                </Field>
              </div>

              {form.estado === 'FINALIZADO' && (
                <Field label="Resultado" error={errors.resultado} hint="Formato: 3-1">
                  <input
                    value={form.resultado}
                    onChange={(event) => setField('resultado', event.target.value)}
                    className={inputClass}
                    placeholder="3-1"
                    disabled={!canManage}
                  />
                </Field>
              )}

              <button type="submit" className={`${primaryButtonClass} w-full`} disabled={!canManage}>
                {editingId !== null ? 'Guardar cambios' : 'Agregar partido'}
              </button>
            </form>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(['TODOS', 'PROXIMO', 'FINALIZADO'] as const).map((opcion) => (
              <button
                key={opcion}
                type="button"
                onClick={() => setFiltro(opcion)}
                className={`rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] transition ${
                  filtro === opcion
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                }`}
              >
                {opcion === 'TODOS' ? 'Todos' : opcion === 'PROXIMO' ? 'Proximos' : 'Finalizados'}
              </button>
            ))}
            <span className="self-center text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              {partidosFiltrados.length} partido(s)
            </span>
          </div>

          {partidosFiltrados.length === 0 ? (
            <EmptyState
              title={partidos.length === 0 ? 'Sin partidos programados' : 'Sin resultados'}
              description={
                partidos.length === 0
                  ? 'Agrega el primer partido para que aparezca en el calendario publico.'
                  : 'Cambia el filtro para ver otros partidos.'
              }
            />
          ) : (
            <div className="space-y-3">
              {partidosFiltrados.map((partido) => (
                <Card key={partido.id} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={partido.estado === 'PROXIMO' ? 'amber' : 'green'}>
                        {partido.estado === 'PROXIMO' ? 'Proximo' : 'Finalizado'}
                      </Badge>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        {partido.torneo}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      {formatFecha(partido.fecha)} · {partido.hora}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <p className="flex-1 text-base font-bold text-slate-950">
                      {partido.local} <span className="text-slate-400">vs</span> {partido.visitante}
                    </p>
                    {partido.estado === 'FINALIZADO' && (
                      <span className="rounded-lg bg-slate-900 px-3 py-1 text-sm font-bold text-white">
                        {partido.resultado ?? '—'}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-slate-500">{partido.lugar}</p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(partido)}
                      className={subtleButtonClass}
                      disabled={!canManage}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(partido)}
                      className={dangerLinkClass}
                      disabled={!canManage}
                    >
                      Eliminar
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminar partido"
        message={`Se eliminara el partido ${pendingDelete?.local ?? ''} vs ${pendingDelete?.visitante ?? ''} del calendario.`}
        confirmLabel="Eliminar"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
