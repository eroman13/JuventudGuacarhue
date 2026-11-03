import { useClubData } from '../../hooks/useClubData'
import { Badge, Card, EmptyState, SectionHeading, formatFecha } from './ui'
import type { AdminTab } from './tabs'

interface DashboardProps {
  canManage: boolean
  onNavigate: (tab: AdminTab) => void
}

interface StatCardProps {
  label: string
  value: string | number
  hint: string
  onClick: () => void
}

function StatCard({ label, value, hint, onClick }: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </button>
  )
}

export default function Dashboard({ canManage, onNavigate }: DashboardProps) {
  const { noticias, planteles, partidos, galeria, productos } = useClubData()

  const totalJugadores = planteles.reduce((total, plantel) => total + plantel.jugadores.length, 0)
  const proximoPartido = [...partidos]
    .filter((partido) => partido.estado === 'PROXIMO')
    .sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`))[0]
  const ultimasNoticias = [...noticias]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 3)
  const sinStock = productos.filter((producto) => producto.stock === 0).length

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Panel de administracion"
        description="Resumen del contenido publicado y accesos rapidos a cada seccion."
        action={
          <Badge tone={canManage ? 'green' : 'amber'}>
            {canManage ? 'Acceso de edicion' : 'Modo lectura'}
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Noticias"
          value={noticias.length}
          hint="Publicadas en el sitio"
          onClick={() => onNavigate('noticias')}
        />
        <StatCard
          label="Jugadores"
          value={totalJugadores}
          hint={`${planteles.length} plantel(es)`}
          onClick={() => onNavigate('jugadores')}
        />
        <StatCard
          label="Partidos"
          value={partidos.length}
          hint={proximoPartido ? `Proximo: ${formatFecha(proximoPartido.fecha)}` : 'Sin proximos'}
          onClick={() => onNavigate('partidos')}
        />
        <StatCard
          label="Galeria"
          value={galeria.length}
          hint="Imagenes publicadas"
          onClick={() => onNavigate('galeria')}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold uppercase tracking-[0.06em] text-slate-900">
              Ultimas noticias
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('noticias')}
              className="text-[11px] font-bold uppercase tracking-[0.08em] text-blue-700 hover:text-blue-900"
            >
              Ver todas
            </button>
          </div>

          {ultimasNoticias.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Todavia no hay noticias publicadas.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {ultimasNoticias.map((noticia) => (
                <li key={noticia.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue-700">
                    {noticia.categoria} · {formatFecha(noticia.fecha)}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold leading-snug text-slate-900">
                    {noticia.titulo}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold uppercase tracking-[0.06em] text-slate-900">
              Proximo partido
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('partidos')}
              className="text-[11px] font-bold uppercase tracking-[0.08em] text-blue-700 hover:text-blue-900"
            >
              Calendario
            </button>
          </div>

          {proximoPartido ? (
            <div className="mt-4 space-y-2">
              <p className="text-lg font-bold text-slate-950">
                {proximoPartido.local} <span className="text-slate-400">vs</span>{' '}
                {proximoPartido.visitante}
              </p>
              <p className="text-sm text-slate-600">
                {formatFecha(proximoPartido.fecha)} · {proximoPartido.hora}
              </p>
              <p className="text-sm text-slate-500">{proximoPartido.lugar}</p>
              <Badge tone="amber">{proximoPartido.torneo}</Badge>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              No hay partidos proximos. Agrega uno desde la seccion Partidos.
            </p>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold uppercase tracking-[0.06em] text-slate-900">
            Estado de la tienda
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('productos')}
            className="text-[11px] font-bold uppercase tracking-[0.08em] text-blue-700 hover:text-blue-900"
          >
            Administrar
          </button>
        </div>
        {productos.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Tienda sin productos"
              description="Agrega productos para que aparezcan en la tienda publica."
            />
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
            <span>
              <strong className="text-slate-900">{productos.length}</strong> productos
            </span>
            <span>
              <strong className="text-slate-900">{sinStock}</strong> sin stock
            </span>
            <span>
              <strong className="text-slate-900">
                {productos.reduce((total, producto) => total + producto.stock, 0)}
              </strong>{' '}
              unidades disponibles
            </span>
          </div>
        )}
      </Card>
    </div>
  )
}
