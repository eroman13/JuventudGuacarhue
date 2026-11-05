import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { RichTextContent } from '../RichTextContent'
import { ImagePreview, readImageFile, uploadImageFile, type Notify } from './ui'

interface RichTextEditorProps {
  /** HTML actual del contenido. */
  value: string
  /** Se llama con el HTML cada vez que cambia el contenido. */
  onChange: (html: string) => void
  disabled?: boolean
  placeholder?: string
  /** Se usa para avisar de errores al subir imagenes. */
  notify?: Notify
  /** Datos opcionales para mostrar la vista previa como la pagina publica. */
  previewTitulo?: string
  previewCategoria?: string
  previewFecha?: string
  previewImagen?: string
}

type Modo = 'editar' | 'vista-previa'

const BOTONES_FORMATO: {
  etiqueta: string
  titulo: string
  comando: string
  valor?: string
  clase?: string
}[] = [
  { etiqueta: 'B', titulo: 'Negrita', comando: 'bold', clase: 'font-extrabold' },
  { etiqueta: 'I', titulo: 'Cursiva', comando: 'italic', clase: 'italic' },
  { etiqueta: 'U', titulo: 'Subrayado', comando: 'underline', clase: 'underline' },
  { etiqueta: 'S', titulo: 'Tachado', comando: 'strikeThrough', clase: 'line-through' },
  { etiqueta: 'H2', titulo: 'Titulo de seccion', comando: 'formatBlock', valor: '<h2>' },
  { etiqueta: 'H3', titulo: 'Subtitulo', comando: 'formatBlock', valor: '<h3>' },
  { etiqueta: 'P', titulo: 'Parrafo normal', comando: 'formatBlock', valor: '<p>' },
  { etiqueta: '•', titulo: 'Lista con vinetas', comando: 'insertUnorderedList' },
  { etiqueta: '1.', titulo: 'Lista numerada', comando: 'insertOrderedList' },
  { etiqueta: '❝', titulo: 'Cita', comando: 'formatBlock', valor: '<blockquote>' },
  { etiqueta: '⨯', titulo: 'Quitar formato', comando: 'removeFormat' },
]

function BotonBarra({
  title,
  onClick,
  children,
  disabled,
  activo,
}: {
  title: string
  onClick: () => void
  children: ReactNode
  disabled?: boolean
  activo?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      // Evita que el boton quite el foco del editor (y con el, la seleccion).
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        activo ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  )
}


export default function RichTextEditor({
  value,
  onChange,
  disabled = false,
  placeholder = 'Escribe aqui el cuerpo completo de la noticia...',
  notify,
  previewTitulo,
  previewCategoria,
  previewFecha,
  previewImagen,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const inputImagenRef = useRef<HTMLInputElement | null>(null)
  const rangoGuardado = useRef<Range | null>(null)
  const [modo, setModo] = useState<Modo>('editar')
  const [subiendoImagen, setSubiendoImagen] = useState(false)

  // Mantiene el HTML del editor sincronizado cuando `value` cambia desde fuera
  // (por ejemplo, al abrir una noticia existente para editarla).
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) {
      return
    }
    if (editor.innerHTML !== (value ?? '')) {
      editor.innerHTML = value ?? ''
    }
  }, [value, modo])

  const emitirCambio = () => onChange(editorRef.current?.innerHTML ?? '')

  const recordarSeleccion = () => {
    const editor = editorRef.current
    const seleccion = window.getSelection()
    if (!editor || !seleccion || seleccion.rangeCount === 0) {
      return
    }
    const rango = seleccion.getRangeAt(0)
    if (editor.contains(rango.commonAncestorContainer)) {
      rangoGuardado.current = rango.cloneRange()
    }
  }

  const restaurarSeleccion = () => {
    const editor = editorRef.current
    if (!editor) {
      return
    }
    editor.focus()
    const rango = rangoGuardado.current
    const seleccion = window.getSelection()
    if (rango && seleccion) {
      seleccion.removeAllRanges()
      seleccion.addRange(rango)
    }
  }

  const ejecutar = (comando: string, valor?: string) => {
    if (disabled) {
      return
    }
    editorRef.current?.focus()
    document.execCommand(comando, false, valor)
    emitirCambio()
  }

  const insertarEnlace = () => {
    if (disabled) {
      return
    }
    recordarSeleccion()
    const url = window.prompt('URL del enlace (https://...):', 'https://')
    if (url === null) {
      return
    }
    const limpio = url.trim()
    if (!limpio) {
      return
    }
    if (!/^(?:https?:\/\/|\/|mailto:|tel:)/i.test(limpio)) {
      notify?.('El enlace debe empezar con http://, https:// o /.', 'error')
      return
    }
    restaurarSeleccion()
    document.execCommand('createLink', false, limpio)
    emitirCambio()
  }

  const insertarImagen = (src: string, alt: string) => {
    if (!src) {
      return
    }
    restaurarSeleccion()
    const altSeguro = alt.replace(/["<>]/g, '')
    document.execCommand('insertHTML', false, `<img src="${src}" alt="${altSeguro}" />`)
    emitirCambio()
  }

  const insertarImagenPorUrl = () => {
    if (disabled) {
      return
    }
    recordarSeleccion()
    const url = window.prompt('URL de la imagen (https://...):', 'https://')
    if (url === null) {
      return
    }
    const limpio = url.trim()
    if (!/^(?:https?:\/\/|\/|data:image\/)/i.test(limpio)) {
      notify?.('La URL de la imagen no es valida.', 'error')
      return
    }
    insertarImagen(limpio, 'Imagen de la noticia')
  }

  const handleImagenArchivo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }

    recordarSeleccion()
    setSubiendoImagen(true)
    try {
      const url = await uploadImageFile(file)
      insertarImagen(url, file.name)
    } catch {
      try {
        const dataUrl = await readImageFile(file)
        insertarImagen(dataUrl, file.name)
      } catch {
        notify?.('No pudimos subir ni leer la imagen seleccionada.', 'error')
      }
    } finally {
      setSubiendoImagen(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          <button
            type="button"
            onClick={() => setModo('editar')}
            className={`rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] transition ${
              modo === 'editar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => setModo('vista-previa')}
            className={`rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] transition ${
              modo === 'vista-previa'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Vista previa
          </button>
        </div>
        {modo === 'editar' && subiendoImagen && (
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-700">
            Subiendo imagen...
          </span>
        )}
      </div>

      <div className={modo === 'editar' ? 'block' : 'hidden'}>
        <div className="rounded-lg border border-slate-300 bg-white shadow-sm focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
          <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50/70 p-2">
            {BOTONES_FORMATO.map((boton) => (
              <BotonBarra
                key={boton.titulo}
                title={boton.titulo}
                disabled={disabled}
                onClick={() => ejecutar(boton.comando, boton.valor)}
              >
                <span className={boton.clase}>{boton.etiqueta}</span>
              </BotonBarra>
            ))}
            <span className="mx-1 w-px self-stretch bg-slate-200" aria-hidden />
            <BotonBarra title="Insertar enlace" disabled={disabled} onClick={insertarEnlace}>
              🔗
            </BotonBarra>
            <BotonBarra
              title="Insertar imagen desde mi equipo"
              disabled={disabled || subiendoImagen}
              onClick={() => inputImagenRef.current?.click()}
            >
              🖼
            </BotonBarra>
            <BotonBarra title="Insertar imagen por URL" disabled={disabled} onClick={insertarImagenPorUrl}>
              URL
            </BotonBarra>
            <BotonBarra
              title="Linea separadora"
              disabled={disabled}
              onClick={() => ejecutar('insertHorizontalRule')}
            >
              ―
            </BotonBarra>
          </div>

          <input
            ref={inputImagenRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImagenArchivo}
            disabled={disabled}
          />


          <div
            ref={editorRef}
            contentEditable={!disabled}
            role="textbox"
            aria-multiline="true"
            aria-label="Cuerpo de la noticia"
            data-placeholder={placeholder}
            onInput={emitirCambio}
            onKeyUp={recordarSeleccion}
            onMouseUp={recordarSeleccion}
            onBlur={recordarSeleccion}
            className={`rich-editor news-content min-h-[240px] max-h-[560px] overflow-y-auto px-4 py-3 outline-none ${
              disabled ? 'cursor-not-allowed bg-slate-100' : ''
            }`}
            suppressContentEditableWarning
          />
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          Selecciona el texto y usa la barra para darle formato. Puedes insertar imagenes con el boton
          de imagen (desde tu equipo) o por URL.
        </p>
      </div>

      {modo === 'vista-previa' && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          {(previewCategoria || previewFecha) && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
              {[previewCategoria, previewFecha].filter(Boolean).join(' · ')}
            </p>
          )}
          {previewTitulo && (
            <h1 className="mt-2 text-2xl font-bold leading-tight text-slate-950">{previewTitulo}</h1>
          )}
          {previewImagen && (
            <ImagePreview
              url={previewImagen}
              alt={previewTitulo ?? 'Vista previa de la noticia'}
              className="mt-4 h-48 w-full rounded-lg object-cover"
            />
          )}
          <div className="mt-4">
            {value && value.trim() ? (
              <RichTextContent html={value} />
            ) : (
              <p className="text-sm italic text-slate-400">
                Aun no has escrito el cuerpo de la noticia. Cambia a "Editar" para agregarlo.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

