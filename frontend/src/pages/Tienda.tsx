export default function Tienda() {
  return (
    <div className="container-max-width py-16">
      <h1 className="text-4xl font-bold mb-8">Tienda Oficial</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-48 bg-gray-300"></div>
            <div className="p-4">
              <h3 className="font-bold text-lg">Producto {i}</h3>
              <p className="text-gray-600 mb-4">Descripción corta</p>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-blue-600">$0</span>
                <button className="btn-primary bg-blue-600 text-white">
                  Agregar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
