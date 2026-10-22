export default function Galeria() {
  return (
    <div className="container-max-width py-16">
      <h1 className="text-4xl font-bold mb-8">Galería</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
          ></div>
        ))}
      </div>
    </div>
  )
}
