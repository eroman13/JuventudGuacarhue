import { useRef, useState, type ChangeEvent } from 'react'
import { useClubData } from '../../hooks/useClubData'
import {
  Badge,
  Card,
  ConfirmDialog,
  SectionHeading,
  dangerButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
  type Notify,
} from './ui'

interface RespaldoPanelProps {
  canManage: boolean
  notify: Notify
}

function fechaArchivo(): string {
  const ahora = new Date()
  const mes = String(ahora.getMonth() + 1).padStart(2, '0')
  const dia = String(ahora.getDate()).padStart(2, '0')
  return `${ahora.getFullYear()}-${mes}-${dia}`
}

export default function RespaldoPanel({ canManage, notify }: RespaldoPanelProps) {
  const {
    noticias,
    planteles,
    partidos,
    galeria,
    productos,
    videos,
    pedidos,
    abonados,
    exportClubData,
    importClubData,
    resetClubData,
  } = useClubData()

  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmarReset, setConfirmarReset] = useState(false)
  const [importando, setImportando] = useState(false)

  const totalJugadores = planteles.reduce((total, plantel) => total + plantel.jugadores.length, 0)

  const handleExport = () => {
    if (!canManage) {
      notify('No tienes permisos para exportar respaldos.', 'error')
      return
    }

    try {
      const contenido = exportClubData()
      const blob = new Blob([contenido], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const enlace = document.createElement('a')
      enlace.href = url
      enlace.download = `juventud-guacarhue-${fechaArchivo()}.json`
      document.body.appendChild(enlace)
      enlace.click()
      enlace.remove()
      URL.revokeObjectURL(url)
      notify('Respaldo descargado correctamente.')
    } catch {
      notify('No pudimos generar el archivo de respaldo.', 'error')
    }
  }

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0]
    if (!archivo) {
      return
    }

    if (!canManage) {
      notify('No tienes permisos para importar respaldos.', 'error')
      event.target.value = ''
      return
    }

    setImportando(true)
    try {
      const contenido = await archivo.text()
      const resultado = importClubData(contenido)
      if (resultado.ok) {
        notify('Datos restaurados. Todo el sitio se actualizo con el respaldo.')
      } else {
        notify(resultado.error, 'error')
      }
    } catch {
      notify('No pudimos leer el archivo seleccionado.', 'error')
    } finally {
      setImportando(false)
      if (fileRef.current) {
        fileRef.current.value = ''
      }
    }
  }

  const handleReset = () => {
    if (!canManage) {
      setConfirmarReset(false)
      notify('Tu rol es de solo lectura.', 'error')
      return
    }

    resetClubData()
    setConfirmarReset(false)
    notify('Contenido restaurado a los datos originales del club.')
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Respaldo de contenidos"
        description="Descarga, restaura o reinicia el contenido del sitio. Los cambios se guardan en este navegador."
        action={
          <Badge tone={canManage ? 'green' : 'amber'}>
            {canManage ? 'Disponible' : 'Solo lectura'}
          </Badge>
        }
      />

      <Card className="p-5">
        <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-slate-900">
          Contenido actual
        </h3>
        <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
          <p>
            Noticias: <strong className="text-slate-900">{noticias.length}</strong>
          </p>
          <p>
            Planteles: <strong className="text-slate-900">{planteles.length}</strong>
          </p>
          <p>
            Jugadores: <strong className="text-slate-900">{totalJugadores}</strong>
          </p>
          <p>
            Partidos: <strong className="text-slate-900">{partidos.length}</strong>
          </p>
          <p>
            Fotos: <strong className="text-slate-900">{galeria.length}</strong>
          </p>
          <p>
            Productos: <strong className="text-slate-900">{productos.length}</strong>
          </p>
          <p>
            Videos: <strong className="text-slate-900">{videos.length}</strong>
          </p>
          <p>
            Pedidos: <strong className="text-slate-900">{pedidos.length}</strong>
          </p>
          <p>
            Abonados: <strong className="text-slate-900">{abonados.length}</strong>
          </p>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="flex flex-col gap-3 p-5">
          <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-slate-900">Exportar</h3>
          <p className="flex-1 text-sm text-slate-500">
            Genera un archivo JSON con todos los mantenedores del panel administrativo.
          </p>
          <button
            type="button"
            onClick={handleExport}
            disabled={!canManage}
            className={primaryButtonClass}
          >
            Descargar respaldo
          </button>
        </Card>

        <Card className="flex flex-col gap-3 p-5">
          <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-slate-900">Importar</h3>
          <p className="flex-1 text-sm text-slate-500">
            Reemplaza todo el contenido con un respaldo previo en formato JSON.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={importando || !canManage}
            className={secondaryButtonClass}
          >
            {importando ? 'Importando...' : 'Seleccionar archivo'}
          </button>
        </Card>

        <Card className="flex flex-col gap-3 p-5">
          <h3 className="text-sm font-bold uppercase tracking-[0.08em] text-slate-900">Reiniciar</h3>
          <p className="flex-1 text-sm text-slate-500">
            Elimina los cambios locales y vuelve al contenido original del club.
          </p>
          <button
            type="button"
            onClick={() => setConfirmarReset(true)}
            disabled={!canManage}
            className={dangerButtonClass}
          >
            Restaurar originales
          </button>
        </Card>
      </div>

      <p className="text-xs text-slate-400">
        Los datos de este panel se guardan en el almacenamiento local del navegador. Exporta un
        respaldo antes de cambiar de equipo o limpiar el navegador.
      </p>

      <ConfirmDialog
        open={confirmarReset}
        title="Restaurar contenido original"
        message="Se eliminaran todos los cambios en noticias, jugadores, partidos, fotos, productos, videos, pedidos y abonados. Esta accion no se puede deshacer."
        confirmLabel="Si, restaurar"
        onConfirm={handleReset}
        onCancel={() => setConfirmarReset(false)}
      />
    </div>
  )
}
