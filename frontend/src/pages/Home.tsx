import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      title: 'Juventud Guacarhue en competencia nacional',
      description: 'Cobertura oficial del primer equipo y divisiones formativas',
      image:
        'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1600&q=80',
    },
    {
      title: 'Preparacion total para el proximo clasico',
      description: 'Entrenamientos, conferencia y concentracion en un solo lugar',
      image:
        'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1600&q=80',
    },
    {
      title: 'Plantel 2026 presentado oficialmente',
      description: 'Revision de jugadores, estadisticas y ficha tecnica por posicion',
      image:
        'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1600&q=80',
    },
    {
      title: 'Tienda oficial y nuevos lanzamientos',
      description: 'Indumentaria, accesorios y coleccion de temporada',
      image:
        'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1600&q=80',
    },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)

  return (
    <div className="space-y-10 pb-10">
      <section className="relative overflow-hidden bg-neutral-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(245,158,11,0.2),transparent_35%),radial-gradient(circle_at_80%_90%,rgba(59,130,246,0.15),transparent_40%)]" />
        <div className="relative h-[560px]">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute h-full w-full transition-opacity duration-700 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
            <div className="container-max-width absolute inset-0 flex items-end pb-20">
              <div className="max-w-3xl text-white">
                <p className="mb-4 inline-block border-l-4 border-amber-400 pl-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                  Portada oficial
                </p>
                <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                  {slide.title}
                </h1>
                <p className="mb-8 max-w-2xl text-base text-white/80 sm:text-lg">{slide.description}</p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/noticias"
                    className="border border-white/30 bg-white/10 px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] backdrop-blur hover:bg-white/20"
                  >
                    Ver cobertura
                  </Link>
                  <Link
                    to="/partidos"
                    className="border border-amber-300 bg-amber-400 px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-neutral-900 hover:bg-amber-300"
                  >
                    Calendario
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>

        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 border border-white/50 bg-black/40 px-4 py-2 text-white hover:bg-black/65"
        >
          PREV
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 border border-white/50 bg-black/40 px-4 py-2 text-white hover:bg-black/65"
        >
          NEXT
        </button>

        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide ? 'w-10 bg-amber-400' : 'bg-white/55 hover:bg-white'
              }`}
            />
          ))}
        </div>
      </section>

      <section className="border-y border-neutral-300 bg-white">
        <div className="container-max-width">
          <div className="grid grid-cols-2 gap-2 py-3 text-[11px] font-bold uppercase tracking-[0.12em] sm:grid-cols-4 sm:gap-6 sm:py-5">
            <Link to="/partidos" className="rounded border border-neutral-300 px-3 py-3 text-center text-neutral-800 hover:border-neutral-900 hover:text-neutral-950">
              Centro de partidos
            </Link>
            <Link to="/noticias" className="rounded border border-neutral-300 px-3 py-3 text-center text-neutral-800 hover:border-neutral-900 hover:text-neutral-950">
              Sala de prensa
            </Link>
            <Link to="/jugadores" className="rounded border border-neutral-300 px-3 py-3 text-center text-neutral-800 hover:border-neutral-900 hover:text-neutral-950">
              Plantel profesional
            </Link>
            <Link to="/tienda" className="rounded border border-neutral-300 px-3 py-3 text-center text-neutral-800 hover:border-neutral-900 hover:text-neutral-950">
              Tienda oficial
            </Link>
          </div>
        </div>
      </section>

      <section className="container-max-width">
        <div className="grid gap-7 lg:grid-cols-[2fr_1fr]">
          <article className="overflow-hidden rounded-xl bg-white shadow-[0_20px_45px_rgba(0,0,0,0.13)]">
            <img
              src="https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?auto=format&fit=crop&w=1300&q=80"
              alt="Noticia destacada"
              className="h-72 w-full object-cover"
            />
            <div className="space-y-4 p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Noticia principal · 23 OCT 2026</p>
              <h2 className="text-3xl font-bold text-neutral-950">Juventud anuncia plan deportivo 2027 con foco en cantera y alto rendimiento</h2>
              <p className="text-neutral-600">
                El club oficializa una hoja de ruta institucional con refuerzos, infraestructura y seguimiento avanzado del primer equipo.
              </p>
              <Link to="/noticias" className="inline-block border border-neutral-900 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-neutral-900 hover:bg-neutral-900 hover:text-white">
                Leer noticia completa
              </Link>
            </div>
          </article>

          <aside className="space-y-4 rounded-xl bg-neutral-950 p-5 text-white shadow-[0_12px_35px_rgba(0,0,0,0.28)]">
            <h3 className="border-b border-white/15 pb-3 text-sm font-bold uppercase tracking-[0.14em] text-amber-300">Proximos partidos</h3>
            <div className="space-y-3 text-sm">
              <div className="rounded border border-white/15 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-white/60">Torneo Regional</p>
                <p className="mt-1 font-semibold">Juventud Guacarhue vs Club Union Norte</p>
                <p className="mt-1 text-xs text-white/65">Sab 26 · 19:00 · Estadio Municipal</p>
              </div>
              <div className="rounded border border-white/15 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-white/60">Copa Provincia</p>
                <p className="mt-1 font-semibold">Deportivo Sur vs Juventud Guacarhue</p>
                <p className="mt-1 text-xs text-white/65">Mié 30 · 21:00 · Arena Sur</p>
              </div>
            </div>
            <Link to="/partidos" className="block border border-amber-300 bg-amber-400 px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.12em] text-neutral-900 hover:bg-amber-300">
              Ver calendario completo
            </Link>
          </aside>
        </div>
      </section>

      <section className="container-max-width">
        <div className="rounded-xl border border-neutral-200 bg-white px-5 py-7 shadow-[0_12px_35px_rgba(0,0,0,0.08)] sm:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-bold uppercase tracking-[0.1em] text-neutral-950">Ultimas noticias</h3>
            <Link to="/noticias" className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-600 hover:text-neutral-900">Ver todo</Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'Conferencia post partido: analisis del cuerpo tecnico',
                image:
                  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=900&q=80',
              },
              {
                title: 'Juveniles sub-17 avanzan a semifinales regionales',
                image:
                  'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=900&q=80',
              },
              {
                title: 'Nueva alianza para potenciar rendimiento fisico del plantel',
                image:
                  'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=80',
              },
            ].map((item) => (
              <article key={item.title} className="overflow-hidden rounded-lg border border-neutral-200">
                <img src={item.image} alt={item.title} className="h-44 w-full object-cover" />
                <div className="p-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">23 OCT · Club</p>
                  <h4 className="text-lg font-bold text-neutral-900">{item.title}</h4>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-max-width">
        <div className="grid gap-7 md:grid-cols-2">
          <div className="rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 p-7 text-white shadow-[0_12px_35px_rgba(0,0,0,0.2)]">
            <h3 className="mb-5 text-xl font-bold uppercase tracking-[0.12em] text-amber-300">Estadisticas</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['24', 'Partidos'],
                ['15', 'Triunfos'],
                ['41', 'Goles'],
                ['4', 'Valla invicta'],
              ].map(([value, label]) => (
                <div key={label} className="rounded border border-white/15 bg-white/5 p-4">
                  <p className="text-3xl font-bold text-white">{value}</p>
                  <p className="text-xs uppercase tracking-[0.1em] text-white/65">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-7 shadow-[0_12px_35px_rgba(0,0,0,0.08)]">
            <h3 className="mb-5 text-xl font-bold uppercase tracking-[0.12em] text-neutral-900">Galeria reciente</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1489945052260-4f21c52268b9?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1494173853739-c21f58b16055?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&w=600&q=80',
              ].map((url, idx) => (
                <img key={idx} src={url} alt={`Galeria ${idx + 1}`} className="aspect-square w-full rounded object-cover" />
              ))}
            </div>
            <Link to="/galeria" className="mt-5 inline-block border border-neutral-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-neutral-900 hover:bg-neutral-900 hover:text-white">
              Ver galeria completa
            </Link>
          </div>
        </div>
      </section>

      <section className="container-max-width">
        <div className="overflow-hidden rounded-xl bg-white shadow-[0_12px_35px_rgba(0,0,0,0.08)]">
          <div className="grid gap-0 lg:grid-cols-2">
            <img
              src="https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=1200&q=80"
              alt="Tienda oficial"
              className="h-80 w-full object-cover"
            />
            <div className="flex flex-col justify-center p-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Tienda oficial</p>
              <h3 className="mb-4 text-3xl font-bold text-neutral-950">Nueva camiseta titular 2026 ya disponible</h3>
              <p className="mb-6 text-neutral-600">Compra indumentaria oficial con despacho a todo Chile y retiro en sede del club.</p>
              <Link to="/tienda" className="w-fit border border-amber-300 bg-amber-400 px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-neutral-900 hover:bg-amber-300">
                Ir a tienda
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
