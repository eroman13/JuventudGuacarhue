import { useState, useMemo } from 'react'
import { useClubData } from '../../hooks/useClubData'
import { updateConfig } from '../../data/clubStore'
import { SectionHeading, Badge } from './ui'

export default function ConfigPanel() {
  const { config, noticias } = useClubData()
  const [carouselItems, setCarouselItems] = useState(config.carouselItems)

  const noticiasDestacadas = useMemo(
    () => noticias.filter((n) => n.destacada).length,
    [noticias],
  )

  const noticiasDisponibles = Math.min(noticiasDestacadas, carouselItems)

  const handleSave = () => {
    const validValue = Math.max(1, Math.min(10, carouselItems))
    updateConfig({ carouselItems: validValue })
  }

  const getStatusColor = () => {
    if (noticiasDestacadas === 0) return 'amber'
    if (noticiasDestacadas < carouselItems) return 'amber'
    return 'green'
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Configuración del Sitio"
        description="Ajusta los parámetros principales del carrusel de noticias."
      />

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
          <h3 className="mb-4 text-lg font-bold text-gray-900">Ajustes</h3>

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
                  onClick={handleSave}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  Guardar Cambios
                </button>
                <button
                  onClick={() => setCarouselItems(config.carouselItems)}
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
