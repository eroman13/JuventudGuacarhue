import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useClubData } from '../hooks/useClubData'
import { ImagePreview, formatFecha } from '../components/admin/ui'
import { resolveMediaUrl } from '../lib/api'

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const { noticias, partidos, galeria, config } = useClubData()

  const defaultSlides = [
    {
      title: 'Juventud Guacarhue en competencia nacional',
      description: 'Cobertura oficial del primer equipo y divisiones formativas',
      image:
        'https://scontent-scl3-1.xx.fbcdn.net/v/t39.30808-6/504256464_4212822292375757_2863909741882965330_n.jpg?stp=dst-jpg_tt6&cstp=mx1600x1066&ctp=s1600x1066&_nc_cat=101&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=EriwVdJyqEAQ7kNvwFpdPbw&_nc_oc=Ado2imdqW91-iVWGXiw9aZOVo9X9IwqDPa7CDXRtyr3OSwUKn9LQpgfhyyPfTcrydYMPbcIjX5R9cdzVx-qsDoV-&_nc_zt=23&_nc_ht=scontent-scl3-1.xx&_nc_gid=S0LzpK5khMq9F5tZoxF4vA&_nc_ss=792a8&oh=00_AQOsjMYxabeYHLuXQjodG1sMY6Pd9peVhDgyubuI4xt_bg&oe=6AE14558',
    },
    {
      title: 'Preparacion total para el proximo clasico',
      description: 'Entrenamientos, conferencia y concentracion en un solo lugar',
      image:
        'https://scontent-scl3-1.xx.fbcdn.net/v/t39.30808-6/502568642_10233302015585647_3878340113690538090_n.jpg?stp=c256.0.1536.1536a_cp6_dst-jpg_tt6&cstp=mx1536x1536&ctp=s552x414&_nc_cat=109&ccb=1-7&_nc_sid=50ad20&_nc_ohc=ajsc7vj4mYMQ7kNvwH4BtnR&_nc_oc=AdpUm7T9wiVXeZKxN0Ex_C1Wu8byiVKR1WDJf4WFzIvVuEL3COcQh8ko0ptFQURkUcF6EcRSHb9CRSvFzU4Bz9Yw&_nc_zt=23&_nc_ht=scontent-scl3-1.xx&_nc_gid=IWqQJxCnp-qcDy3xQnCstw&_nc_ss=7b2a8&oh=00_AQPS1xu_zkQN8BriXI383byOAvhiQ8fENhbetFq-0XF5LQ&oe=6AE15102',
    },
    {
      title: 'Plantel 2026 presentado oficialmente',
      description: 'Revision de jugadores, estadisticas y ficha tecnica por posicion',
      image:
        'https://scontent-scl3-1.xx.fbcdn.net/v/t39.30808-6/502757737_10233302013705600_6849197361037078782_n.jpg?stp=c256.0.1536.1536a_cp6_dst-jpg_tt6&cstp=mx1536x1536&ctp=s552x414&_nc_cat=106&ccb=1-7&_nc_sid=50ad20&_nc_ohc=DMz4ocWFaMQQ7kNvwGBPv8x&_nc_oc=AdrAUr6-g9g1uDWBsJ8bcZrJM6HBudutty3NdhtXNBiLNQPYEblmeapOHOpg-4aFuKs8Qbrho86TXooyqiqgRVPF&_nc_zt=23&_nc_ht=scontent-scl3-1.xx&_nc_gid=IWqQJxCnp-qcDy3xQnCstw&_nc_ss=7b2a8&oh=00_AQPgUGCWUvYuyXz-IERLhmUBSz6SddHtSN31I_Q2Yf5ciA&oe=6AE12A22',
    },
    {
      title: 'Tienda oficial y nuevos lanzamientos',
      description: 'Indumentaria, accesorios y coleccion de temporada',
      image:
        'https://scontent-scl3-1.xx.fbcdn.net/v/t39.30808-6/503164103_10233302015745651_3540257250924494735_n.jpg?stp=c256.0.1536.1536a_cp6_dst-jpg_tt6&cstp=mx1536x1536&ctp=s552x414&_nc_cat=104&ccb=1-7&_nc_sid=50ad20&_nc_ohc=0AKVIioxcocQ7kNvwFKJ2ux&_nc_oc=Adouj5HtyDLf8gGj5hWUzzO8rkY_cNz-6GzCFF8UCrq1dFRij6JL9UUBNVJSwrE-GngC6XzDkfV0kOrKDCmDQ36v&_nc_zt=23&_nc_ht=scontent-scl3-1.xx&_nc_gid=IWqQJxCnp-qcDy3xQnCstw&_nc_ss=7b2a8&oh=00_AQMCk1xaqN5uRSHI5fVKrTL28HF1_iU_vqnv166LMA_KQw&oe=6AE129AF',
    },
  ]

  const slides =
    noticias.filter((noticia) => noticia.destacada).slice(0, config.carouselItems).length > 0
      ? noticias
          .filter((noticia) => noticia.destacada)
          .slice(0, config.carouselItems)
          .map((noticia) => ({
            title: noticia.titulo,
            description: noticia.extracto,
            image: noticia.imagen,
          }))
      : defaultSlides

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  const noticiaPrincipal = noticias[0]
  const noticiasRecientes = noticias.slice(0, 3)
  const proximosPartidos = partidos
    .filter((partido) => partido.estado === 'PROXIMO')
    .sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`))
    .slice(0, 3)
  const galeriaReciente = galeria.slice(0, 6)

  return (
    <div className="space-y-10 pb-10">
      <section className="relative overflow-hidden bg-blue-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.28),transparent_35%),radial-gradient(circle_at_80%_90%,rgba(147,197,253,0.18),transparent_40%)]" />
        <div className="relative h-[560px]">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute h-full w-full transition-opacity duration-700 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img src={resolveMediaUrl(slide.image)} alt={slide.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
            <div className="container-max-width absolute inset-0 flex items-end pb-20">
              <div className="max-w-3xl text-white">
                <p className="mb-4 inline-block border-l-4 border-blue-400 pl-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
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
                    className="border border-blue-300 bg-blue-500 px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-blue-400"
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
                index === currentSlide ? 'w-10 bg-blue-400' : 'bg-white/55 hover:bg-white'
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
            <ImagePreview
              url={noticiaPrincipal?.imagen ?? ''}
              alt={noticiaPrincipal?.titulo ?? 'Noticia destacada'}
              className="h-72 w-full object-cover"
            />
            <div className="space-y-4 p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                Noticia principal · {noticiaPrincipal ? formatFecha(noticiaPrincipal.fecha) : 'Club'}
              </p>
              <h2 className="text-3xl font-bold text-neutral-950">{noticiaPrincipal?.titulo ?? 'Juventud Guacarhue: actualidad del club'}</h2>
              <p className="text-neutral-600">
                {noticiaPrincipal?.extracto ?? 'Sigue las novedades deportivas, institucionales y comunitarias del club.'}
              </p>
              <Link to={noticiaPrincipal ? `/noticias/${noticiaPrincipal.id}` : '/noticias'} className="inline-block border border-neutral-900 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-neutral-900 hover:bg-neutral-900 hover:text-white">
                Leer noticia completa
              </Link>
            </div>
          </article>

          <aside className="space-y-4 rounded-xl bg-blue-950 p-5 text-white shadow-[0_12px_35px_rgba(0,0,0,0.28)]">
            <h3 className="border-b border-white/15 pb-3 text-sm font-bold uppercase tracking-[0.14em] text-blue-300">Proximos partidos</h3>
            <div className="space-y-3 text-sm">
              {proximosPartidos.length === 0 && (
                <p className="rounded border border-white/15 p-4 text-xs text-white/65">
                  No hay partidos programados por ahora.
                </p>
              )}
              {proximosPartidos.map((partido) => (
                <div key={partido.id} className="rounded border border-white/15 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-white/60">{partido.torneo}</p>
                  <p className="mt-1 font-semibold">{partido.local} vs {partido.visitante}</p>
                  <p className="mt-1 text-xs text-white/65">{formatFecha(partido.fecha)} · {partido.hora} · {partido.lugar}</p>
                </div>
              ))}
            </div>
            <Link to="/partidos" className="block border border-blue-300 bg-blue-500 px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-blue-400">
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
            {noticiasRecientes.length === 0 && (
              <p className="text-sm text-neutral-500 md:col-span-3">
                Todavia no hay noticias publicadas.
              </p>
            )}
            {noticiasRecientes.map((item) => (
              <Link
                key={item.id}
                to={`/noticias/${item.id}`}
                className="block overflow-hidden rounded-lg border border-neutral-200 transition-shadow hover:shadow-lg"
              >
                <ImagePreview
                  url={item.imagen}
                  alt={item.titulo}
                  className="h-44 w-full object-cover"
                />
                <div className="p-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                    {formatFecha(item.fecha)} · {item.categoria}
                  </p>
                  <h4 className="text-lg font-bold text-neutral-900">{item.titulo}</h4>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-max-width">
        <div className="grid gap-7 md:grid-cols-2">
          <div className="rounded-xl bg-gradient-to-br from-blue-950 to-blue-900 p-7 text-white shadow-[0_12px_35px_rgba(0,0,0,0.2)]">
            <h3 className="mb-5 text-xl font-bold uppercase tracking-[0.12em] text-blue-300">Estadisticas</h3>
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
              {galeriaReciente.length === 0 && (
                <p className="col-span-3 text-sm text-neutral-500">
                  Todavia no hay fotos publicadas.
                </p>
              )}
              {galeriaReciente.map((item) => (
                <ImagePreview
                  key={item.id}
                  url={item.url}
                  alt={item.categoria}
                  className="aspect-square w-full rounded object-cover"
                />
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
              src="https://scontent-scl3-1.xx.fbcdn.net/v/t39.30808-6/504256464_4212822292375757_2863909741882965330_n.jpg?stp=dst-jpg_tt6&cstp=mx1600x1066&ctp=s1600x1066&_nc_cat=101&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=EriwVdJyqEAQ7kNvwFpdPbw&_nc_oc=Ado2imdqW91-iVWGXiw9aZOVo9X9IwqDPa7CDXRtyr3OSwUKn9LQpgfhyyPfTcrydYMPbcIjX5R9cdzVx-qsDoV-&_nc_zt=23&_nc_ht=scontent-scl3-1.xx&_nc_gid=S0LzpK5khMq9F5tZoxF4vA&_nc_ss=792a8&oh=00_AQOsjMYxabeYHLuXQjodG1sMY6Pd9peVhDgyubuI4xt_bg&oe=6AE14558"
              alt="Tienda oficial"
              className="h-80 w-full object-cover"
            />
            <div className="flex flex-col justify-center p-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Tienda oficial</p>
              <h3 className="mb-4 text-3xl font-bold text-neutral-950">Nueva camiseta titular 2026 ya disponible</h3>
              <p className="mb-6 text-neutral-600">Compra indumentaria oficial con despacho a todo Chile y retiro en sede del club.</p>
              <Link to="/tienda" className="w-fit border border-blue-300 bg-blue-500 px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-blue-400">
                Ir a tienda
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
