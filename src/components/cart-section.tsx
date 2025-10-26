import { useEffect, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/../firebase"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { IconShoppingCart, IconPackage } from "@tabler/icons-react"

interface CartProductItem {
  product_id: string;
  producto: string;
  marca: string;
  cantidad_default: number;
  presentacion: string;
}

interface FirebaseCartData {
  id: string;
  nombre: string;
  descripcion: string;
  productos: CartProductItem[];
  created_at: Date;
  updated_at: Date;
}

export function CartSection() {
  const [carts, setCarts] = useState<FirebaseCartData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCarts()
  }, [])

  const loadCarts = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔥 Loading carts from Firebase...')
      
      const cartsRef = collection(db, 'carts')
      const querySnapshot = await getDocs(cartsRef)
      
      if (querySnapshot.empty) {
        console.log('⚠️ No carts found in database')
        setCarts([])
        setLoading(false)
        return
      }
      
      const cartsData: FirebaseCartData[] = []
      querySnapshot.docs.forEach((doc) => {
        const data = doc.data()
        cartsData.push({
          id: doc.id,
          nombre: data.nombre || '',
          descripcion: data.descripcion || '',
          productos: data.productos || [],
          created_at: data.created_at?.toDate() || new Date(),
          updated_at: data.updated_at?.toDate() || new Date(),
        })
      })
      
      console.log('✅ Carts loaded:', cartsData.length)
      setCarts(cartsData)
    } catch (err) {
      console.error('❌ Error loading carts:', err)
      setError('Error al cargar los carritos. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconShoppingCart className="size-5" />
              Carrito de Catering
            </CardTitle>
            <CardDescription>
              Productos por defecto del carrito de catering
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Cargando carritos...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconShoppingCart className="size-5" />
              Carrito de Catering
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (carts.length === 0) {
    return (
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconShoppingCart className="size-5" />
              Carrito de Catering
            </CardTitle>
            <CardDescription>
              Productos por defecto del carrito de catering
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <IconPackage className="size-12 text-muted-foreground" />
              <p className="text-muted-foreground">No hay carritos configurados</p>
              <p className="text-sm text-muted-foreground">
                Agrega productos al carrito por defecto en Firebase
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconShoppingCart className="size-5" />
            Carrito de Catering por Defecto
          </CardTitle>
          <CardDescription>
            Productos que el carrito de catering debe contener obligatoriamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {carts.map((cart) => (
            <div key={cart.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{cart.nombre}</h3>
                  {cart.descripcion && (
                    <p className="text-sm text-muted-foreground">{cart.descripcion}</p>
                  )}
                </div>
                <Badge variant="outline" className="ml-2">
                  {cart.productos.length} productos
                </Badge>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Presentación</TableHead>
                      <TableHead className="text-right">Cantidad Default</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.productos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No hay productos en este carrito
                        </TableCell>
                      </TableRow>
                    ) : (
                      cart.productos.map((product, index) => (
                        <TableRow key={`${cart.id}-${product.product_id}-${index}`}>
                          <TableCell className="font-medium">{product.producto}</TableCell>
                          <TableCell>{product.marca}</TableCell>
                          <TableCell>{product.presentacion}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{product.cantidad_default}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

