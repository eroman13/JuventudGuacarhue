export default function Noticias() {
  return (
    <div className="container-max-width py-16">
      <h1 className="text-4xl font-bold mb-8">Noticias</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-lg shadow">
          <div className="h-48 bg-gray-300"></div>
          <div className="p-6">
            <h2 className="font-bold text-lg mb-2">Noticia 1</h2>
            <p className="text-gray-600 text-sm mb-4">Contenido de la noticia...</p>
            <a href="#" className="text-blue-600 hover:underline">Leer más →</a>
          </div>
        </div>
      </div>
    </div>
  )
}
