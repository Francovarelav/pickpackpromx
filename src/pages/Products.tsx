import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Package, Edit, Trash2, Grid3X3, List } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';

interface Product {
  id: string;
  producto: string;
  marca: string;
  presentacion: string;
  precio_unitario: number;
  stock_actual: number;
  restock_quantity: number;
  supplier_id: string;
  leadtime_days: number;
  createdAt: any;
}

interface Provider {
  id: string;
  marca: string;
  dueno_proveedor_principal: string;
  pais_grupo_corporativo: string;
  createdAt: any;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Provider[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    supplier_id: '',
    stock: 0
  });

  // Cargar productos desde Firebase
  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log('🔥 Loading products...');
        const productsRef = collection(db, 'products');
        const querySnapshot = await getDocs(productsRef);
        
        console.log('📊 Query snapshot size:', querySnapshot.size);
        console.log('📊 Query snapshot empty:', querySnapshot.empty);
        
        if (querySnapshot.empty) {
          console.log('⚠️ No products found');
          setProducts([]);
          setFilteredProducts([]);
          return;
        }
        
        const productsData: Product[] = [];
        querySnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`📄 Product ${index + 1}:`, { id: doc.id, data });
          productsData.push({
            id: doc.id,
            producto: data.producto || '',
            marca: data.marca || '',
            presentacion: data.presentacion || '',
            precio_unitario: data.precio_unitario || 0,
            stock_actual: data.stock_actual || 0,
            restock_quantity: data.restock_quantity || 0,
            supplier_id: data.supplier_id || '',
            leadtime_days: data.leadtime_days || 0,
            createdAt: data.created_at || new Date()
          });
        });
        
        console.log('✅ Products loaded:', productsData.length);
        setProducts(productsData);
        setFilteredProducts(productsData);
      } catch (error) {
        console.error('❌ Error loading products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Cargar proveedores desde Firebase
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const suppliersRef = collection(db, 'suppliers');
        const querySnapshot = await getDocs(suppliersRef);
        
        const suppliersData: Provider[] = [];
        querySnapshot.docs.forEach((doc) => {
          const data = doc.data();
          suppliersData.push({
            id: doc.id,
            marca: data.marca || data.name || '',
            dueno_proveedor_principal: data.dueno_proveedor_principal || data.contactPerson || '',
            pais_grupo_corporativo: data.pais_grupo_corporativo || data.country || '',
            createdAt: data.created_at || data.createdAt || new Date()
          });
        });
        
        setSuppliers(suppliersData);
      } catch (error) {
        console.error('Error loading suppliers:', error);
      }
    };

    loadSuppliers();
  }, []);

  // Filtrar productos por término de búsqueda, proveedor y stock
  useEffect(() => {
    let filtered = products.filter(product => {
      // Filtro por búsqueda de texto
      const matchesSearch = (product.producto || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (product.marca || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (product.presentacion || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro por proveedor
      const matchesSupplier = selectedSupplier === 'all' || product.supplier_id === selectedSupplier;
      
      // Filtro por stock
      let matchesStock = true;
      if (stockFilter === 'in-stock') {
        matchesStock = (product.stock_actual || 0) > 0;
      } else if (stockFilter === 'out-of-stock') {
        matchesStock = (product.stock_actual || 0) === 0;
      }
      
      return matchesSearch && matchesSupplier && matchesStock;
    });
    
    setFilteredProducts(filtered);
  }, [searchTerm, selectedSupplier, stockFilter, products]);

  // Crear nuevo producto
  const handleCreateProduct = async () => {
    try {
      const productsRef = collection(db, 'products');
      const productData = {
        producto: newProduct.name,
        marca: newProduct.category,
        presentacion: newProduct.description,
        precio_unitario: newProduct.price,
        stock_actual: newProduct.stock,
        restock_quantity: 0,
        supplier_id: newProduct.supplier_id,
        leadtime_days: 0,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await addDoc(productsRef, productData);
      
      // Recargar productos
      const querySnapshot = await getDocs(productsRef);
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      setProducts(productsData);
      setFilteredProducts(productsData);
      
      // Limpiar formulario
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        category: '',
        supplier_id: '',
        stock: 0
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="flex items-center justify-center h-64">
                  <div className="text-lg">Loading products from Firebase...</div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="space-y-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Manage your product inventory
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
              <DialogDescription>
                Add a new product to your inventory
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProduct({...newProduct, name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newProduct.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewProduct({...newProduct, description: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  Precio
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Categoría
                </Label>
                <Input
                  id="category"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supplier" className="text-right">
                  Proveedor
                </Label>
                <Select
                  value={newProduct.supplier_id}
                  onValueChange={(value) => setNewProduct({...newProduct, supplier_id: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona un proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.marca} - {supplier.dueno_proveedor_principal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stock" className="text-right">
                  Stock
                </Label>
                <Input
                  id="stock"
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({...newProduct, stock: Number(e.target.value)})}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateProduct}>Create Product</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="supplier-filter" className="text-sm font-medium mb-2 block">
              Filter by Supplier
            </Label>
            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger>
                <SelectValue placeholder="All suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All suppliers</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.marca}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 min-w-[150px]">
            <Label htmlFor="stock-filter" className="text-sm font-medium mb-2 block">
              Filter by Stock
            </Label>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stock</SelectItem>
                <SelectItem value="in-stock">In stock</SelectItem>
                <SelectItem value="out-of-stock">Out of stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Label className="text-sm font-medium mb-2 block">View</Label>
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter(p => (p.stock_actual || 0) > 0).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter(p => (p.stock_actual || 0) === 0).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brands</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(products.map(p => p.marca).filter(Boolean)).size}
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Lista de Productos */}
      {filteredProducts.length === 0 && !isLoading ? (
        <div className="text-center py-8">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms' : 'No products in the database'}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{product.producto || 'No name'}</CardTitle>
                  <Badge variant={(product.stock_actual || 0) > 0 ? "default" : "destructive"}>
                    {(product.stock_actual || 0) > 0 ? "In Stock" : "Out of Stock"}
                  </Badge>
                </div>
                <CardDescription>{product.presentacion || 'No description'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Price:</span>
                    <span className="font-medium">${product.precio_unitario || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Stock:</span>
                    <span className="font-medium">{product.stock_actual || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Brand:</span>
                    <Badge variant="outline">{product.marca || 'No brand'}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Lead Time:</span>
                    <span className="text-sm">{product.leadtime_days || 0} days</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <div className="px-6 py-3 border-b bg-gray-50">
            <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-500">
              <div>Product</div>
              <div>Brand</div>
              <div>Price</div>
              <div>Stock</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
          </div>
          <div className="divide-y">
            {filteredProducts.map((product) => (
              <div key={product.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-6 gap-4 items-center">
                  <div>
                    <div className="font-medium">{product.producto || 'No name'}</div>
                    <div className="text-sm text-gray-500">{product.presentacion || 'No description'}</div>
                  </div>
                  <div className="text-sm">{product.marca || 'No brand'}</div>
                  <div className="font-medium">${product.precio_unitario || 0}</div>
                  <div className="text-sm">{product.stock_actual || 0}</div>
                  <div>
                    <Badge variant={(product.stock_actual || 0) > 0 ? "default" : "destructive"}>
                      {(product.stock_actual || 0) > 0 ? "In Stock" : "Out of Stock"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
