function App() {
  return (
    <div className="p-10 flex flex-col items-center gap-4 bg-base-200 min-h-screen">
      <h1 className="text-4xl font-bold text-primary">Comerzia Frontend</h1>
      <p className="text-lg">Arquitectura inicializada correctamente.</p>
      
      {/* Botón de prueba DaisyUI */}
      <button className="btn btn-primary">Hola Mundo</button>
      
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Estado del Sistema</h2>
          <p>Todo listo para empezar a programar.</p>
          <div className="card-actions justify-end">
            <button className="btn btn-secondary">Aceptar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App