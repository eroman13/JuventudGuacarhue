import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useClubData } from '../../hooks/useClubData'
import { getSyncSnapshot, updateConfig } from '../../data/clubStore'
import { Badge, ImagePreview, SectionHeading, inputClass, labelClass, uploadImageFile, type Notify } from './ui'

interface ConfigPanelProps {
  notify: Notify
}

export default function ConfigPanel({ notify }: ConfigPanelProps) {
  const { config, noticias, sincronizacion, guardarEnServidor } = useClubData()

  const [nombreClub, setNombreClub] = useState(config.nombreClub)
  const [desde, setDesde] = useState(config.desde)
  const [logoUrl, setLogoUrl] = useState(config.logoUrl)
  const [carouselItems, setCarouselItems] = useState(config.carouselItems)
  const [subiendoLogo, setSubiendoLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement | null>(null)

  const noticiasDestacadas = useMemo(
    () => noticias.filter((n) => n.destacada).length,
    [noticias],
  )

  const noticiasDisponibles = Math.min(noticiasDestacadas, carouselItems)

  const restablecer = () => {
    setNombreClub(config.nombreClub)
    setDesde(config.desde)
    setLogoUrl(config.logoUrl)
    setCarouselItems(config.carouselItems)
  }

  const handleLogoFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    setSubiendoLogo(true)
    try {
      const url = await uploadImageFile(file)
      setLogoUrl(url)
      notify('Logo cargado. Recuerda guardar los cambios.')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'No se pudo subir el logo.', 'error')
    } finally {
      setSubiendoLogo(false)
    }
  }

  const handleSave = async () => {
    const cantidadValida = Math.max(1, Math.min(10, carouselItems))

    updateConfig({
      carouselItems: cantidadValida,
      nombreClub: nombreClub.trim() || config.nombreClub,
      desde: desde.trim(),
      logoUrl: logoUrl.trim(),
    })
    setCarouselItems(cantidadValida)

    const guardado = await guardarEnServidor()

    if (guardado) {
      notify('Configuración guardada: ya la ven todos los visitantes.')
    } else {
      notify(getSyncSnapshot().mensaje, 'error')
    }
  }

  const syncTone =
    sincronizacion.estado === 'sincronizado'
      ? 'green'
      : sincronizacion.estado === 'error' || sincronizacion.estado === 'sin-sesion'
        ? 'amber'
        : 'blue'

  const syncLabel =
    sincronizacion.estado === 'sincronizado'
      ? 'En el servidor'
      : sincronizacion.estado === 'guardando'
        ? 'Guardando'
        : sincronizacion.estado === 'sin-sesion'
          ? 'Solo este navegador'
          : sincronizacion.estado === 'error'
            ? 'Sin conexión'
            : 'Cargando'

  const getStatusColor = () => {
    if (noticiasDestacadas === 0) return 'amber'
    if (noticiasDestacadas < carouselItems) return 'amber'
    return 'green'
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Configuración del Sitio"
        description="Logo, nombre del club, año de fundación y carrusel de noticias."
      />

      {/* Identidad del club */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-gray-900">Identidad del club</h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="config-nombre" className={labelClass}>
                Nombre del club
              </label>
              <input
                id="config-nombre"
                type="text"
                value={nombreClub}
                onChange={(event) => setNombreClub(event.target.value)}
                className={inputClass}
                placeholder="Juventud Guacarhue"
              />
              <p className="mt-1 text-xs text-slate-500">
                Aparece en el encabezado y en el pie de todas las páginas.
              </p>
            </div>

            <div>
              <label htmlFor="config-desde" className={labelClass}>
                Año de fundación (Desde)
              </label>
              <input
                id="config-desde"
                type="text"
                inputMode="numeric"
                maxLength={12}
                value={desde}
                onChange={(event) => setDesde(event.target.value)}
                className={inputClass}
                placeholder="1990"
              />
              <p className="mt-1 text-xs text-slate-500">
                Se muestra como &quot;Desde {desde.trim() || '1990'}&quot; bajo el nombre del
                club. Déjalo vacío para ocultarlo.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-gray-900">Logo y vista previa</h3>

          <label htmlFor="config-logo" className={labelClass}>
            Logo o escudo (URL)
          </label>
          <input
            id="config-logo"
            type="text"
            value={logoUrl}
            onChange={(event) => setLogoUrl(event.target.value)}
            className={inputClass}
            placeholder="https://... o sube una imagen"
          />

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={subiendoLogo}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
            >
              {subiendoLogo ? 'Subiendo...' : 'Subir imagen'}
            </button>

            {logoUrl.trim() !== '' && (
              <button
                type="button"
                onClick={() => setLogoUrl('')}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Quitar logo
              </button>
            )}

            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoFile}
            />
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Si lo dejas vacío se sigue usando el escudo actual del club.
          </p>

          <div className="mt-4 flex items-center gap-3 rounded-lg bg-blue-950 p-4 text-white">
            <ImagePreview
              url={logoUrl}
              alt="Escudo del club"
              className="h-12 w-12 shrink-0 rounded-full border-2 border-blue-300 object-cover"
            />
            <div className="leading-tight">
              <div className="text-sm font-bold uppercase tracking-[0.18em]">
                {nombreClub.trim() || 'Juventud Guacarhue'}
              </div>
              {desde.trim() !== '' && (
                <div className="text-[11px] uppercase tracking-[0.16em] text-white/60">
                  Desde {desde.trim()}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                Guardado
              </p>
              <Badge tone={syncTone}>{syncLabel}</Badge>
            </div>
            <p className="mt-2 text-xs text-slate-600">{sincronizacion.mensaje}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Panel de Información */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Estado del Carrusel</h3>

            <div className="space-y-3">
              {/* Noticias destacadas */}
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Noticias Destacadas
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">{noticiasDestacadas}</p>
                </div>
                <Badge tone={noticiasDestacadas > 0 ? 'green' : 'amber'}>
                  {noticiasDestacadas > 0 ? 'Disponibles' : 'Sin noticias'}
                </Badge>
              </div>

              {/* Se mostrarán */}
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Se Mostrarán en el Carrusel
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">{noticiasDisponibles}</p>
                </div>
                <Badge tone={getStatusColor()}>
                  {noticiasDisponibles === carouselItems && noticiasDestacadas >= carouselItems
                    ? 'Óptimo'
                    : noticiasDestacadas > 0
                      ? 'Parcial'
                      : 'Incompleto'}
                </Badge>
              </div>

              {/* Mensaje de estado */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm text-slate-600">
                  {noticiasDestacadas === 0 && (
                    <>
                      <span className="font-semibold">⚠️ Sin noticias destacadas.</span> Ve a la
                      sección Noticias y marca algunas como "Destacar en el carrusel".
                    </>
                  )}
                  {noticiasDestacadas > 0 && noticiasDestacadas < carouselItems && (
                    <>
                      <span className="font-semibold">⚠️ Solo hay {noticiasDestacadas} destacada(s).</span> El
                      carrusel mostrará {noticiasDestacadas} en lugar de {carouselItems}.
                    </>
                  )}
                  {noticiasDestacadas >= carouselItems && (
                    <>
                      <span className="font-semibold">✅ Todo listo.</span> Hay suficientes
                      noticias para mostrar {carouselItems} en el carrusel.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Configuración */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-gray-900">Carrusel de la portada</h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="carousel-items" className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad de noticias a mostrar
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="carousel-items"
                  type="number"
                  min="1"
                  max="10"
                  value={carouselItems}
                  onChange={(e) => setCarouselItems(parseInt(e.target.value) || 1)}
                  className="w-24 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold text-center"
                />
                <span className="text-sm text-slate-600">/ 10 máximo</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Define cuántas noticias marcadas como "Destacada" se mostrarán en la página de inicio.
              </p>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-[0.08em]">
                Acciones
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  Guardar Cambios
                </button>
                <button
                  type="button"
                  onClick={restablecer}
                  className="flex-1 px-4 py-2.5 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors font-medium text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recomendación */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">💡 Recomendación:</span> Asegúrate de tener al menos
          la cantidad de noticias destacadas que deseas mostrar. Ve a la sección "Noticias" y marca
          las que quieres que aparezcan en el carrusel principal.
        </p>
      </div>
    </div>
  )
}
