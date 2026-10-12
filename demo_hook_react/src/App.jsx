import { useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import './App.css'

function App() {
  const [carrito, setCarrito] = useState([])
  const [producto, setProducto] = useState('')
  const [precio, setPrecio] = useState('')
  const [cantidad, setCantidad] = useState('')

  // funcion para agregar productos al carrito
  const agregarProducto = () => {
    const nombre = producto.trim()
    const precioNumero = Number(precio)
    const cantidadNumero = Number(cantidad)

    if (!nombre || Number.isNaN(precioNumero) || precioNumero <= 0) {
      return
    }

    if (Number.isNaN(cantidadNumero) || cantidadNumero <= 0) {
      return
    }

    const existente = carrito.findIndex(
      (item) => item.producto.toLowerCase() === nombre.toLowerCase(),
    )

    if (existente !== -1) {
      const actualizado = carrito.map((item, index) =>
        index === existente
          ? { ...item, cantidad: item.cantidad + cantidadNumero }
          : item,
      )
      setCarrito(actualizado)
    } else {
      setCarrito([
        ...carrito,
        { producto: nombre, precio: precioNumero, cantidad: cantidadNumero },
      ])
    }

    setProducto('')
    setPrecio('')
    setCantidad('')
  }

  // funcion para eliminar productos del carrito
  const eliminarProducto = (index) => {
    setCarrito(carrito.filter((_, i) => i !== index))
  }

  const total = carrito.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0,
  )

 // funcion para vaciar el carrito
  const vaciarCarrito = () => {
    setCarrito([])
  }

  return (
    <>
      <Header />
      <main className="carrito">
        <h1>demo de practica de react</h1>

        <form
          className="carrito-form"
          onSubmit={(event) => {
            event.preventDefault()
            agregarProducto()
          }}
        >
          <input
            type="text"
            placeholder="Producto"
            value={producto}
            onChange={(event) => setProducto(event.target.value)}
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Precio"
            value={precio}
            onChange={(event) => setPrecio(event.target.value)}
          />
          <input
            type="number"
            min="1"
            step="1"
            placeholder="Cantidad"
            value={cantidad}
            onChange={(event) => setCantidad(event.target.value)}
          />
        </form>

        <div className="carrito-botones">
          <button className="Button_Agregar" type="button" onClick={agregarProducto}>
            Agregar Producto
          </button>
          <button
            className="Button_Vaciar"
            type="button"
            onClick={vaciarCarrito}
            disabled={carrito.length === 0}
          >
            Vaciar Carrito
          </button>
        </div>

        {carrito.length === 0 ? (
          <p>El carrito esta vacio</p>
        ) : (
          <ul className="carrito-lista">
            {carrito.map((item, index) => (
              <li key={`${item.producto}-${index}`}>
                <span>
                  {item.producto} — ${item.precio} x {item.cantidad}
                </span>
                <button
                  className="Button_Eliminar"
                  type="button"
                  onClick={() => eliminarProducto(index)}
                >
                  Eliminar Producto
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="carrito-total">Total: ${total.toFixed(2)}</p>
      </main>
      <Footer />
    </>
  )
}

export default App
