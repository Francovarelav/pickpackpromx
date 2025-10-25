import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, Building2, Edit, Trash2, MapPin } from 'lucide-react';
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
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';

interface Provider {
  id: string;
  marca: string;
  dueno_proveedor_principal: string;
  pais_grupo_corporativo: string;
  createdAt: any;
}

export default function Providers() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProvider, setNewProvider] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    country: '',
    category: ''
  });

  // Cargar proveedores desde Firebase
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const providersRef = collection(db, 'suppliers');
        const querySnapshot = await getDocs(providersRef);
        
        if (querySnapshot.empty) {
          setProviders([]);
          setFilteredProviders([]);
          return;
        }
        
        const providersData: Provider[] = [];
        querySnapshot.docs.forEach((doc) => {
          const data = doc.data();
          providersData.push({
            id: doc.id,
            marca: data.marca || data.name || '',
            dueno_proveedor_principal: data.dueno_proveedor_principal || data.contactPerson || '',
            pais_grupo_corporativo: data.pais_grupo_corporativo || data.country || '',
            createdAt: data.created_at || data.createdAt || new Date()
          });
        });
        
        setProviders(providersData);
        setFilteredProviders(providersData);
      } catch (error) {
        console.error('Error loading suppliers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProviders();
  }, []);

  // Filtrar proveedores por término de búsqueda
  useEffect(() => {
    const filtered = providers.filter(provider =>
      (provider.marca || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (provider.dueno_proveedor_principal || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (provider.pais_grupo_corporativo || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProviders(filtered);
  }, [searchTerm, providers]);

  // Crear nuevo proveedor
  const handleCreateProvider = async () => {
    try {
      const providersRef = collection(db, 'suppliers');
      
      // Crear el proveedor con el formato correcto
      const providerData = {
        marca: newProvider.name,
        dueno_proveedor_principal: newProvider.contactPerson,
        pais_grupo_corporativo: newProvider.country,
        // Mantener campos adicionales si existen
        email: newProvider.email || '',
        phone: newProvider.phone || '',
        address: newProvider.address || '',
        category: newProvider.category || '',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await addDoc(providersRef, providerData);
      
      // Recargar proveedores
      const querySnapshot = await getDocs(providersRef);
      const providersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Provider[];
      setProviders(providersData);
      setFilteredProviders(providersData);
      
      // Limpiar formulario
      setNewProvider({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        country: '',
        category: ''
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating provider:', error);
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
                  <div className="text-lg">Loading suppliers from Firebase...</div>
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
          <h1 className="text-3xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground">
            Manage your suppliers and contacts
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Proveedor</DialogTitle>
              <DialogDescription>
                Agrega un nuevo proveedor a tu lista
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="name"
                  value={newProvider.name}
                  onChange={(e) => setNewProvider({...newProvider, name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contactPerson" className="text-right">
                  Contacto
                </Label>
                <Input
                  id="contactPerson"
                  value={newProvider.contactPerson}
                  onChange={(e) => setNewProvider({...newProvider, contactPerson: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newProvider.email}
                  onChange={(e) => setNewProvider({...newProvider, email: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  value={newProvider.phone}
                  onChange={(e) => setNewProvider({...newProvider, phone: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Dirección
                </Label>
                <Textarea
                  id="address"
                  value={newProvider.address}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewProvider({...newProvider, address: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="country" className="text-right">
                  País
                </Label>
                <Input
                  id="country"
                  value={newProvider.country}
                  onChange={(e) => setNewProvider({...newProvider, country: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Categoría
                </Label>
                <Input
                  id="category"
                  value={newProvider.category}
                  onChange={(e) => setNewProvider({...newProvider, category: e.target.value})}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateProvider}>Crear Proveedor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search suppliers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{providers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(providers.map(p => p.pais_grupo_corporativo).filter(Boolean)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brands</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(providers.map(p => p.marca).filter(Boolean)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Corporate Groups</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(providers.map(p => p.dueno_proveedor_principal).filter(Boolean)).size}
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Lista de Proveedores */}
      <div className="space-y-4">
        {filteredProviders.length === 0 && !isLoading ? (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No suppliers found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Try adjusting your search terms' : 'No suppliers in the database'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border">
            <div className="px-6 py-3 border-b bg-gray-50">
              <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-500">
                <div>Brand</div>
                <div>Corporate Group</div>
                <div>Country</div>
                <div>Actions</div>
              </div>
            </div>
            <div className="divide-y">
              {filteredProviders.map((provider) => (
                <div key={provider.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-4 gap-4 items-center">
                    <div className="font-medium">{provider.marca || 'No brand'}</div>
                    <div className="text-sm text-gray-600">{provider.dueno_proveedor_principal || 'No corporate group'}</div>
                    <div className="text-sm text-gray-600">{provider.pais_grupo_corporativo || 'No country'}</div>
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
