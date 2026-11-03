import { useMemo, useState } from 'react'
import { useClubData } from '../hooks/useClubData'
import { ImagePreview, formatPrecio } from '../components/admin/ui'

const TODOS = 'Todos'
const STOCK_REFERENCIA = 20

export default function Tienda() {
  const [categoria, setCategoria] = useState(TODOS)
  const { productos } = useClubData()

  const categorias = useMemo(
    () => [TODOS, ...Array.from(new Set(productos.map((producto) => producto.categoria)))],
    [productos],
  )

  const filtrados = useMemo(
    () =>
      categoria === TODOS
        ? productos
        : productos.filter((producto) => producto.categoria === categoria),
    [productos, categoria],
  )

  return (
    <div className="space-y-10 pb-10">
      <section className="bg-gradient-to-r from-blue-950 to-blue-800 py-12 text-white">
        <div className="container-max-width space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">Tienda oficial</p>
          <h1 className="text-5xl font-bold uppercase tracking-[0.04em]">Indumentaria</h1>
          <p className="text-lg text-white/75">Productos oficiales del club Juventud Guacarhue</p>
        </div>
      </section>

      <div className="container-max-width">
        {productos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.1em] text-neutral-700">
              Tienda en preparacion
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              Muy pronto podras comprar la indumentaria oficial del club.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-wrap gap-2">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoria(cat)}
                  className={`rounded px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] transition-colors ${
                    categoria === cat
                      ? 'bg-blue-900 text-white'
                      : 'border border-neutral-300 text-neutral-800 hover:border-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {filtrados.length === 0 ? (
              <div className="rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-12 text-center text-sm text-neutral-500">
                No hay productos en la categoria {categoria}.
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {filtrados.map((producto) => {
                  const agotado = producto.stock <= 0
                  const porcentaje = Math.min(
                    100,
                    Math.round((producto.stock / STOCK_REFERENCIA) * 100),
                  )

                  return (
                    <div
                      key={producto.id}
                      className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-md transition-shadow hover:shadow-lg"
                    >
                      <div className="relative h-56 overflow-hidden bg-neutral-100">
                        <ImagePreview
                          url={producto.url}
                          alt={producto.nombre}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                        />
                        {agotado ? (
                          <div className="absolute right-3 top-3 rounded bg-neutral-900 px-2 py-1 text-[11px] font-bold uppercase text-white">
                            Agotado
                          </div>
                        ) : (
                          producto.stock < 5 && (
                            <div className="absolute right-3 top-3 rounded bg-rose-600 px-2 py-1 text-[11px] font-bold uppercase text-white">
                              Pocas unidades
                            </div>
                          )
                        )}
                      </div>

                      <div className="space-y-3 p-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                            {producto.categoria}
                          </p>
                          <h3 className="mt-1 text-lg font-bold text-neutral-900">
                            {producto.nombre}
                          </h3>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-neutral-600">
                            <span>Stock: {producto.stock}</span>
                            <span>{porcentaje}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-neutral-200">
                            <div
                              className={`h-full rounded-full ${
                                agotado ? 'bg-neutral-400' : 'bg-blue-900'
                              }`}
                              style={{ width: `${porcentaje}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-neutral-200 pt-2">
                          <span className="text-xl font-bold text-neutral-900">
                            {formatPrecio(producto.precio)}
                          </span>
                          {agotado ? (
                            <span className="cursor-not-allowed bg-neutral-300 px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-neutral-600">
                              Sin stock
                            </span>
                          ) : (
                            <a
                              href={`mailto:info@juventudguacarhue.cl?subject=${encodeURIComponent(
                                `Pedido: ${producto.nombre}`,
                              )}&body=${encodeURIComponent(
                                `Hola, quiero comprar "${producto.nombre}" (${producto.categoria}) por ${formatPrecio(producto.precio)}.`,
                              )}`}
                              className="bg-blue-900 px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-blue-800"
                            >
                              Comprar
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
