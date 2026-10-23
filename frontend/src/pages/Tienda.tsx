import { useState } from 'react'

interface Producto {
  id: number
  nombre: string
  precio: number
  categoria: string
  stock: number
  url: string
}

export default function Tienda() {
  const [filtro, setFiltro] = useState('Todos')

  const productos: Producto[] = [
    { id: 1, nombre: 'Camiseta Titular 2026', precio: 45990, categoria: 'Camisetas', stock: 15, url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80' },
    { id: 2, nombre: 'Camiseta Alternativa', precio: 45990, categoria: 'Camisetas', stock: 12, url: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=600&q=80' },
    { id: 3, nombre: 'Pantalón Oficial', precio: 34990, categoria: 'Equipamiento', stock: 20, url: 'https://images.unsplash.com/photo-1542272604-787c62d465d1?auto=format&fit=crop&w=600&q=80' },
    { id: 4, nombre: 'Medias Oficiales', precio: 12990, categoria: 'Accesorios', stock: 50, url: 'https://images.unsplash.com/photo-1556811552-5f0d1da8e06b?auto=format&fit=crop&w=600&q=80' },
    { id: 5, nombre: 'Gorro del Club', precio: 16990, categoria: 'Accesorios', stock: 25, url: 'https://images.unsplash.com/photo-1452860606245-08d9d1a312e5?auto=format&fit=crop&w=600&q=80' },
    { id: 6, nombre: 'Bufanda Oficial', precio: 19990, categoria: 'Accesorios', stock: 18, url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80' },
    { id: 7, nombre: 'Botella Térmica', precio: 24990, categoria: 'Accesorios', stock: 30, url: 'https://images.unsplash.com/photo-1602527336146-e1c57b0375a4?auto=format&fit=crop&w=600&q=80' },
    { id: 8, nombre: 'Mochila Oficial', precio: 59990, categoria: 'Equipamiento', stock: 10, url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80' },
  ]

  const categorias = ['Todos', 'Camisetas', 'Equipamiento', 'Accesorios']
  const productosFiltrados = filtro === 'Todos' ? productos : productos.filter(p => p.categoria === filtro)

  return (
    <div className="space-y-10 pb-10">
      <section className="bg-gradient-to-r from-neutral-900 to-neutral-800 py-12 text-white">
        <div className="container-max-width space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Tienda oficial</p>
          <h1 className="text-5xl font-bold uppercase tracking-[0.04em]">Indumentaria</h1>
          <p className="text-lg text-white/75">Productos oficiales del club Juventud Guacarhue</p>
        </div>
      </section>

      <div className="container-max-width">
        <div className="mb-8 flex flex-wrap gap-2">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setFiltro(cat)}
              className={`rounded px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] transition-colors ${
                filtro === cat
                  ? 'bg-neutral-900 text-white'
                  : 'border border-neutral-300 text-neutral-800 hover:border-neutral-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {productosFiltrados.map((producto) => (
            <div key={producto.id} className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-md hover:shadow-lg transition-shadow">
              <div className="relative h-56 overflow-hidden bg-neutral-100">
                <img src={producto.url} alt={producto.nombre} className="h-full w-full object-cover hover:scale-110 transition-transform duration-300" />
                {producto.stock < 5 && (
                  <div className="absolute top-3 right-3 bg-rose-600 text-white px-2 py-1 rounded text-[11px] font-bold uppercase">
                    Pocas unidades
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-500">{producto.categoria}</p>
                  <h3 className="mt-1 text-lg font-bold text-neutral-900">{producto.nombre}</h3>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-neutral-600">
                    <span>Stock: {producto.stock}</span>
                    <span>{Math.round((producto.stock / 50) * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-200">
                    <div className="h-full bg-neutral-900 rounded-full" style={{ width: `${(producto.stock / 50) * 100}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                  <span className="text-xl font-bold text-neutral-900">${producto.precio.toLocaleString('es-CL')}</span>
                  <button className="bg-neutral-900 text-white px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] hover:bg-neutral-800 transition-colors">
                    Comprar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
