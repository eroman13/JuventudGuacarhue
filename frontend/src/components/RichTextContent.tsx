import { sanitizeHtml } from '../lib/sanitizeHtml'

interface RichTextContentProps {
  /** HTML del cuerpo de la noticia. */
  html: string
  className?: string
}

/**
 * Muestra el cuerpo de una noticia escrito con el editor enriquecido.
 *
 * El HTML se sanea antes de pintarse y se le aplica el estilo `.news-content`
 * (definido en `index.css`) para que se vea igual en la vista previa del panel
 * y en la pagina publica.
 */
export function RichTextContent({ html, className = '' }: RichTextContentProps) {
  const limpio = sanitizeHtml(html)

  if (!limpio.trim()) {
    return null
  }

  return (
    <div
      className={`news-content ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: limpio }}
    />
  )
}
