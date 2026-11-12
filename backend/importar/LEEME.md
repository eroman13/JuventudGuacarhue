# Importar fotos y noticias al sitio

Esta carpeta es la bandeja de entrada: dejas aquí las fotos y un archivo
`noticias.json`, y el script las sube al almacenamiento del sitio (Cloudflare R2
en producción) y crea las noticias y las fotos de galería.

Las fotos **tienen que estar en este equipo**. No se pueden enlazar desde
Facebook: los enlaces del CDN (`scontent-*.fbcdn.net`) caducan y responden
`403`, así que en el sitio se verían rotas — es justo el problema que tienen hoy
las noticias y la galería antiguas.

## 1. Bajar las fotos de la página del club

Desde tu sesión de Facebook (la página es del club, el material es suyo):

1. Abre `https://www.facebook.com/Guacarhue`.
2. Pestaña **Fotos** → álbum que te interese.
3. En cada foto: clic para abrirla → menú **⋯** → *Descargar*.
   - Para bajar varias de una vez, abre el álbum y usa *Descargar álbum* si
     aparece; si no, descárgalas una a una (son pocas).
4. Guarda los archivos en esta carpeta (`backend/importar/`).

Notas:
- Vale **JPG, PNG, WebP, GIF o AVIF**, hasta **5 MB** por foto (límite del
  backend). Si una pesa más, redúcela antes (Vista Previa → *Herramientas* →
  *Ajustar tamaño*).
- El texto de cada publicación se copia del post y se pega en el manifiesto.

## 2. Escribir `noticias.json`

Copia `noticias.ejemplo.json` a `noticias.json` y edítalo. Cada noticia:

| Campo       | Obligatorio | Qué es                                                    |
| ----------- | ----------- | --------------------------------------------------------- |
| `titulo`    | sí          | Título de la noticia                                      |
| `imagen`    | sí          | Nombre del archivo en esta carpeta, o una URL ya publicada |
| `fecha`     | sí          | `AAAA-MM-DD`                                              |
| `categoria` | no          | `Resultados`, `Noticias`, `Eventos`… (por defecto `Noticias`) |
| `extracto`  | no          | Frase corta de la portada (si falta, se saca del contenido) |
| `contenido` | no          | Cuerpo completo, admite HTML (`<p>`, `<b>`, `<img>`)      |
| `destacada` | no          | `true` para que salga en el carrusel de la portada        |

Y las fotos sueltas de la galería van en `galeria`, con `archivo`, `fecha` y
`categoria` (`Partidos`, `Entrenamientos`, `Eventos`…).

## 3. Ejecutar

```bash
cd backend

# 1) Simulación: revisa qué se crearía. No sube ni guarda nada.
npm run importar

# 2) Si el resumen está bien, publica de verdad.
ADMIN_EMAIL='admin@example.com' ADMIN_PASSWORD='...' npm run importar -- --publicar
```

Al publicar, el script:

- sube cada foto con `POST /api/uploads` (el mismo camino que el panel, así que
  las URLs quedan en R2);
- añade las noticias **al principio** del listado y las fotos a la galería;
- guarda todo con `PUT /api/contenido` usando la cuenta del panel.

Es seguro repetirlo: omite las noticias cuyo título ya existe (sin importar
tildes ni mayúsculas), omite fotos que ya están en la galería, y recuerda en
`.importado.json` las fotos que ya subió para no duplicarlas en el bucket.

Otros flags: `--api=<url>`, `--carpeta=<ruta>`, `--manifiesto=<archivo>`,
`--token=<jwt>`. `npm run importar -- --ayuda` muestra la ayuda.

## 4. Revisar el resultado

- Panel: `https://juventud-guacarhue.vercel.app/admin` → **Noticias** / **Galería**.
- API: `curl https://juventudguacarhue-production.up.railway.app/api/contenido`

## Si algo falla

| Mensaje                                          | Qué hacer                                                        |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| `No existe el archivo "x.jpg"`                    | El nombre del manifiesto no coincide con el archivo de la carpeta |
| `pesa N MB y el limite es 5 MB`                   | Reducir la foto antes de importar                                 |
| `No se pudo subir … HTTP 500`                     | R2 mal configurado: `cd backend && npm run r2:probar`             |
| `No se pudo iniciar sesion`                       | Revisar `--email` / `--password` (o `ADMIN_EMAIL` / `ADMIN_PASSWORD`) |
| `Corrige el manifiesto antes de continuar`        | El detalle de cada entrada está listado justo debajo              |
