import { useMemo, useState } from 'react'
import { useClubData } from '../hooks/useClubData'
import { ImagePreview, formatPrecio } from '../components/admin/ui'
import type { ProductoItem } from '../data/seedData'

const TODOS = 'Todos'
const CONTACTO_EMAIL = 'info@juventudguacarhue.cl'
const WHATSAPP_TIENDA = (import.meta.env.VITE_TIENDA_WHATSAPP ?? '').replace(/\D/g, '')

function construirMensajePedido(params: {
  producto: ProductoItem
  cantidad: number
  nombre: string
  telefono: string
}): string {
  const { producto, cantidad, nombre, telefono } = params
  const total = formatPrecio(producto.precio * cantidad)

  return [
    'Hola, quiero hacer un pedido rapido:',
    '',
    `Producto: ${producto.nombre}`,
    `Categoria: ${producto.categoria}`,
    `Cantidad: ${cantidad}`,
    `Total estimado: ${total}`,
    '',
    `Nombre: ${nombre}`,
    `Telefono/WhatsApp: ${telefono}`,
  ].join('\n')
}

export default function Tienda() {
  const [categoria, setCategoria] = useState(TODOS)
  const [productoPedido, setProductoPedido] = useState<ProductoItem | null>(null)
  const [nombrePedido, setNombrePedido] = useState('')
  const [telefonoPedido, setTelefonoPedido] = useState('')
  const [cantidadPedido, setCantidadPedido] = useState('1')
  const [errorPedido, setErrorPedido] = useState('')
  const [pedidoEnviado, setPedidoEnviado] = useState(false)
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

  const abrirPedido = (producto: ProductoItem) => {
    setProductoPedido(producto)
    setNombrePedido('')
    setTelefonoPedido('')
    setCantidadPedido('1')
    setErrorPedido('')
    setPedidoEnviado(false)
  }

  const cerrarPedido = () => {
    setProductoPedido(null)
    setErrorPedido('')
    setPedidoEnviado(false)
  }

  const enviarPedido = (canal: 'correo' | 'whatsapp') => {
    if (!productoPedido) {
      return
    }

    const nombre = nombrePedido.trim()
    const telefono = telefonoPedido.trim()
    const cantidad = Number.parseInt(cantidadPedido, 10)

    if (nombre.length < 3) {
      setErrorPedido('Ingresa tu nombre para poder contactarte.')
      return
    }

    if (telefono.length < 8) {
      setErrorPedido('Ingresa un telefono o WhatsApp valido.')
      return
    }

    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > productoPedido.stock) {
      setErrorPedido('Selecciona una cantidad valida segun el stock disponible.')
      return
    }

    const mensaje = construirMensajePedido({
      producto: productoPedido,
      cantidad,
      nombre,
      telefono,
    })

    setErrorPedido('')
    setPedidoEnviado(true)

    if (canal === 'whatsapp' && WHATSAPP_TIENDA) {
      window.open(`https://wa.me/${WHATSAPP_TIENDA}?text=${encodeURIComponent(mensaje)}`, '_blank')
      return
    }

    window.location.href = `mailto:${CONTACTO_EMAIL}?subject=${encodeURIComponent(
      `Pedido rapido: ${productoPedido.nombre}`,
    )}&body=${encodeURIComponent(mensaje)}`
  }

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
        <section className="mb-8 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-900">Compra facil</p>
          <h2 className="mt-1 text-2xl font-bold text-blue-950">Pedido en menos de 1 minuto</h2>
          <div className="mt-4 grid gap-3 text-sm text-blue-900 md:grid-cols-3">
            <div className="rounded-lg border border-blue-200 bg-white p-3">1. Elige tu producto</div>
            <div className="rounded-lg border border-blue-200 bg-white p-3">2. Completa nombre y WhatsApp</div>
            <div className="rounded-lg border border-blue-200 bg-white p-3">3. Envia tu pedido rapido</div>
          </div>
        </section>

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

                        <div className="rounded bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                          Stock disponible: <strong>{producto.stock}</strong>
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
                            <button
                              type="button"
                              onClick={() => abrirPedido(producto)}
                              className="bg-blue-900 px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-blue-800"
                            >
                              Pedir ahora
                            </button>
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

      {productoPedido && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4"
          onClick={cerrarPedido}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pedido-rapido-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="pedido-rapido-title" className="text-2xl font-bold text-slate-950">
              Pedido rapido
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Completa estos datos y envia tu solicitud al instante.
            </p>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-bold text-slate-900">{productoPedido.nombre}</p>
              <p className="text-xs text-slate-600">{productoPedido.categoria}</p>
              <p className="mt-1 text-sm font-semibold text-blue-900">{formatPrecio(productoPedido.precio)}</p>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                  Nombre
                </span>
                <input
                  value={nombrePedido}
                  onChange={(event) => setNombrePedido(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  placeholder="Tu nombre"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                  Telefono o WhatsApp
                </span>
                <input
                  value={telefonoPedido}
                  onChange={(event) => setTelefonoPedido(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  placeholder="+56..."
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                  Cantidad
                </span>
                <input
                  type="number"
                  min={1}
                  max={productoPedido.stock}
                  value={cantidadPedido}
                  onChange={(event) => setCantidadPedido(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            {errorPedido && (
              <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                {errorPedido}
              </p>
            )}

            {pedidoEnviado && (
              <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                Pedido preparado. Si no se abrio ninguna app, intenta con el otro boton.
              </p>
            )}

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => enviarPedido('correo')}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-slate-700 hover:bg-slate-50"
              >
                Enviar por correo
              </button>
              <button
                type="button"
                onClick={() => enviarPedido('whatsapp')}
                className="rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] text-white hover:bg-blue-800"
              >
                {WHATSAPP_TIENDA ? 'Enviar por WhatsApp' : 'Enviar por correo rapido'}
              </button>
            </div>

            <button
              type="button"
              onClick={cerrarPedido}
              className="mt-3 w-full text-center text-xs font-bold uppercase tracking-[0.1em] text-slate-500 hover:text-slate-800"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
